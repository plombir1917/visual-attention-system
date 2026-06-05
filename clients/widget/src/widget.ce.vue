<template>
  <!-- Badge (always visible) -->
  <div class="badge" :class="dotClass" @click="toggle" role="button" aria-label="ФОКУС">
    <span class="dot" />
    <span class="badge-label">ФОКУС</span>
  </div>

  <!-- Expanded panel -->
  <div v-if="expanded" class="panel" :class="themeClass">
    <div class="panel-header">
      <span class="panel-title">ФОКУС</span>
      <button class="close-btn" @click="expanded = false">✕</button>
    </div>

    <div class="panel-body">

      <!-- setup: api-key input -->
      <template v-if="sessionState === 'setup'">
        <p class="label">API-ключ</p>
        <div class="input-row">
          <input
            v-model="inputKey"
            :type="showKey ? 'text' : 'password'"
            class="key-input"
            placeholder="vas_live_xxx.xxx"
            @keydown.enter="submitKey"
          />
          <button class="eye-btn" @click="showKey = !showKey">{{ showKey ? '🙈' : '👁' }}</button>
        </div>
        <p v-if="keyError" class="error-msg">{{ keyError }}</p>
        <button class="btn-primary" @click="submitKey">Подключиться</button>
      </template>

      <!-- idle -->
      <template v-else-if="sessionState === 'idle'">
        <div class="indicator-wrap">
          <div class="indicator idle" />
          <span class="indicator-label">ОЖИДАНИЕ</span>
        </div>
        <button class="btn-primary" @click="startSession">Начать мониторинг</button>
      </template>

      <!-- connecting -->
      <template v-else-if="sessionState === 'connecting'">
        <div class="indicator-wrap">
          <div class="indicator connecting" />
          <span class="indicator-label">ПОДКЛЮЧЕНИЕ…</span>
        </div>
      </template>

      <!-- active -->
      <template v-else-if="sessionState === 'active'">
        <div class="indicator-wrap">
          <div class="indicator" :class="!tabVisible ? 'idle' : latestResult?.focus ? 'focused' : 'unfocused'" />
          <span class="indicator-label">{{ !tabVisible ? 'ВКЛАДКА НЕАКТИВНА' : latestResult?.focus ? 'ФОКУС' : 'ОТВЛЕЧЁН' }}</span>
        </div>

        <div v-if="tabVisible && latestResult" class="metrics">
          <div class="metric">
            <span class="metric-label">Угол взгляда θ</span>
            <span class="metric-value">{{ latestResult.theta?.toFixed(1) }}°</span>
          </div>
          <div class="metric">
            <span class="metric-label">Порог α</span>
            <span class="metric-value">{{ latestResult.alpha?.toFixed(1) }}°</span>
          </div>
          <div class="metric">
            <span class="metric-label">Расстояние</span>
            <span class="metric-value">{{ latestResult.distance?.toFixed(2) }} м</span>
          </div>
        </div>

        <div class="timer">Прошло: {{ formatTime(elapsedSeconds) }}</div>

        <video ref="videoRef" class="camera-preview" autoplay muted playsinline />

        <button class="btn-danger" @click="stopSession">Завершить</button>
      </template>

      <!-- ended -->
      <template v-else-if="sessionState === 'ended'">
        <div class="indicator-wrap">
          <div class="indicator idle" />
          <span class="indicator-label">ЗАВЕРШЕНО</span>
        </div>
        <p class="summary">
          {{ focusPercent }}% концентрации<br />
          <small>{{ formatTime(elapsedSeconds) }} в сессии</small>
        </p>
        <button class="btn-primary" @click="sessionState = 'idle'">Новая сессия</button>
      </template>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { SessionService } from './services/session'
import { WS_URL, type AttentionResult } from './types'
// Инлайн (base64), чтобы виджет остался единым самодостаточным файлом.
import alarmSrc from './assets/attention-sound.mp3?inline'

// Кадры идут раз в секунду, поэтому 60 кадров подряд «отвлечён» = 1 минута.
const DISTRACTION_ALARM_FRAMES = 60
// Скрытое ограничение: сессия не может длиться дольше 8 часов.
const MAX_SESSION_SECONDS = 8 * 60 * 60

const props = withDefaults(defineProps<{
  apiKey?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'light' | 'dark' | 'auto'
}>(), {
  apiKey: '',
  position: 'bottom-right',
  theme: 'auto',
})

// ─── state ───────────────────────────────────────────────────
type State = 'setup' | 'idle' | 'connecting' | 'active' | 'ended'

const expanded = ref(false)
const tabVisible = ref(!document.hidden)
const sessionState = ref<State>('setup')
const inputKey = ref('')
const showKey = ref(false)
const keyError = ref('')
const latestResult = ref<AttentionResult | null>(null)
const elapsedSeconds = ref(0)
const focusCount = ref(0)
const totalFrames = ref(0)
const errorMsg = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)

const focusPercent = computed(() =>
  totalFrames.value > 0 ? Math.round((focusCount.value / totalFrames.value) * 100) : 0,
)

const session = new SessionService()
let timerHandle: ReturnType<typeof setInterval> | null = null

// ─── distraction alarm ───────────────────────────────────────
// Серия подряд идущих кадров «отвлечён». Будильник зациклен и звучит, пока не
// придёт первый кадр focus=true (как в десктоп-клиенте).
let distractedStreak = 0
const alarm = new Audio(alarmSrc)
alarm.loop = true

function stopAlarm() {
  alarm.pause()
  alarm.currentTime = 0
}

function resetAlarm() {
  distractedStreak = 0
  stopAlarm()
}

// ─── theme / position classes ─────────────────────────────────
const themeClass = computed(() => ({
  'theme-light': props.theme === 'light',
  'theme-dark': props.theme === 'dark',
}))

const dotClass = computed(() => {
  if (sessionState.value === 'connecting') return 'dot-yellow'
  if (sessionState.value === 'active') {
    if (!tabVisible.value) return ''
    return latestResult.value?.focus ? 'dot-green' : 'dot-red'
  }
  return ''
})

// ─── visibility ──────────────────────────────────────────────
function onVisibilityChange() {
  tabVisible.value = !document.hidden
  if (sessionState.value !== 'active') return
  if (document.hidden) session.pauseFrames()
  else session.resumeFrames()
}

// ─── lifecycle ───────────────────────────────────────────────
onMounted(() => {
  sessionState.value = props.apiKey ? 'idle' : 'setup'
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  session.disconnect()
  clearTimer()
  stopAlarm()
})

// ─── actions ─────────────────────────────────────────────────
function toggle() {
  expanded.value = !expanded.value
}

const KEY_RE = /^vas_live_[a-zA-Z0-9]+\..+$/

function submitKey() {
  const key = inputKey.value.trim()
  if (!KEY_RE.test(key)) {
    keyError.value = 'Неверный формат. Ожидается: vas_live_xxxxxx.xxxxxx'
    return
  }
  keyError.value = ''
  sessionState.value = 'idle'
}

async function startSession() {
  const key = props.apiKey || inputKey.value.trim()
  if (!key) {
    sessionState.value = 'setup'
    return
  }

  sessionState.value = 'connecting'
  errorMsg.value = ''
  latestResult.value = null
  elapsedSeconds.value = 0
  focusCount.value = 0
  totalFrames.value = 0
  resetAlarm()

  try {
    await session.connect(
      WS_URL,
      key,
      (result) => {
        latestResult.value = result
        totalFrames.value++
        if (result.focus && tabVisible.value) focusCount.value++

        // Тревога: после минуты непрерывного отвлечения включаем зацикленный
        // звук; снимаем его только при восстановлении внимания (focus=true).
        if (result.focus) {
          resetAlarm()
        } else {
          distractedStreak++
          if (distractedStreak >= DISTRACTION_ALARM_FRAMES) {
            alarm.play().catch(() => {}) // на случай отказа автоплея
          }
        }
      },
      (reason) => {
        if (sessionState.value === 'active') {
          errorMsg.value = reason === 'connection_closed' ? 'Соединение потеряно.' : 'Ошибка сессии.'
          stopSession()
        }
      },
    )
  } catch {
    errorMsg.value = 'Не удалось подключиться. Проверьте API-ключ и сервер.'
    sessionState.value = 'idle'
    return
  }

  sessionState.value = 'active'
  startTimer()

  // attach camera preview once videoRef is in DOM
  await nextTick()
  if (videoRef.value) session.attachPreview(videoRef.value)
}

function stopSession() {
  session.disconnect()
  clearTimer()
  resetAlarm()
  sessionState.value = 'ended'
}

function startTimer() {
  timerHandle = setInterval(() => {
    elapsedSeconds.value++
    // Скрытый предел длительности сессии — 8 часов.
    if (elapsedSeconds.value >= MAX_SESSION_SECONDS) stopSession()
  }, 1000)
}

function clearTimer() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null }
}

// re-attach preview if videoRef appears after state change
watch(videoRef, (el) => {
  if (el && sessionState.value === 'active') session.attachPreview(el)
})

// ─── helpers ─────────────────────────────────────────────────
function formatTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}
</script>

<style>
/* ── host positioning ── */
:host {
  position: fixed;
  z-index: 2147483647;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
:host([position="bottom-right"]) { bottom: 24px; right: 24px; }
:host([position="bottom-left"])  { bottom: 24px; left: 24px; }
:host([position="top-right"])    { top: 24px; right: 24px; }
:host([position="top-left"])     { top: 24px; left: 24px; }

/* ── design tokens (auto = dark default, light on light system) ── */
:host {
  --blue: #2563eb;
  --blue-dark: #1d4ed8;
  --green: #22c55e;
  --red: #ef4444;
  --yellow: #eab308;
  --gray: #94a3b8;

  /* dark theme defaults */
  --bg: #1e2232;
  --surface: #252a3d;
  --border: rgba(255,255,255,0.08);
  --text: #f1f5f9;
  --muted: #94a3b8;
  --shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3);
  --radius: 12px;
  --radius-sm: 8px;
  --radius-pill: 999px;
}

@media (prefers-color-scheme: light) {
  :host(:not([theme="dark"])) {
    --bg: #ffffff;
    --surface: #f8fafc;
    --border: rgba(0,0,0,0.08);
    --text: #0b0e1a;
    --muted: #64748b;
    --shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  }
}

:host([theme="light"]) {
  --bg: #ffffff;
  --surface: #f8fafc;
  --border: rgba(0,0,0,0.08);
  --text: #0b0e1a;
  --muted: #64748b;
  --shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
}

:host([theme="dark"]) {
  --bg: #1e2232;
  --surface: #252a3d;
  --border: rgba(255,255,255,0.08);
  --text: #f1f5f9;
  --muted: #94a3b8;
  --shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3);
}

/* ── badge ── */
.badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow);
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s;
}
.badge:hover { transform: translateY(-1px); }
.badge:active { transform: translateY(0); }

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--gray);
  flex-shrink: 0;
  transition: background 0.3s;
}
.dot-green .dot { background: var(--green); animation: pulse 2s infinite; }
.dot-red .dot   { background: var(--red);   animation: pulse 1.4s infinite; }
.dot-yellow .dot { background: var(--yellow); }

.badge-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text);
}

/* ── panel ── */
.panel {
  position: absolute;
  bottom: calc(100% + 10px);
  right: 0;
  width: 280px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

:host([position="bottom-left"]) .panel,
:host([position="top-left"]) .panel {
  right: auto;
  left: 0;
}
:host([position="top-right"]) .panel,
:host([position="top-left"]) .panel {
  bottom: auto;
  top: calc(100% + 10px);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.panel-title { font-weight: 700; color: var(--text); font-size: 13px; }
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--muted);
  padding: 0 2px;
  line-height: 1;
}
.close-btn:hover { color: var(--text); }

.panel-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── indicator ── */
.indicator-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}
.indicator {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  transition: background 0.4s;
}
.indicator.idle       { background: var(--gray); }
.indicator.connecting { background: var(--yellow); animation: spin 1.2s linear infinite; }
.indicator.focused    { background: var(--green); animation: pulse 2s infinite; }
.indicator.unfocused  { background: var(--red);   animation: pulse 1.4s infinite; }

.indicator-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--muted);
}

/* ── metrics ── */
.metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
}
.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.metric-label { color: var(--muted); font-size: 12px; }
.metric-value { color: var(--text); font-weight: 600; font-size: 12px; }

/* ── timer ── */
.timer {
  text-align: center;
  color: var(--muted);
  font-size: 12px;
}

/* ── camera preview ── */
.camera-preview {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: #000;
}

/* ── summary ── */
.summary {
  text-align: center;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
}
.summary small { color: var(--muted); font-weight: 400; font-size: 12px; }

/* ── form ── */
.label { font-size: 12px; color: var(--muted); }

.input-row {
  display: flex;
  gap: 6px;
}
.key-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  font-family: monospace;
  outline: none;
}
.key-input:focus { border-color: var(--blue); }

.eye-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px;
  cursor: pointer;
  font-size: 14px;
}

/* ── buttons ── */
.btn-primary {
  width: 100%;
  padding: 10px;
  background: var(--blue);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover { background: var(--blue-dark); }

.btn-danger {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: var(--red);
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--red);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.btn-danger:hover { background: var(--red); color: #fff; }

/* ── errors ── */
.error-msg {
  color: var(--red);
  font-size: 11px;
  text-align: center;
}

/* ── animations ── */
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; }
  50%       { box-shadow: 0 0 0 10px transparent; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
