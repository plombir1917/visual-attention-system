<template>
  <div class="session-page">
    <!-- Topbar -->
    <header class="topbar">
      <div class="topbar-brand">
        <svg width="22" height="22" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="18" stroke="#2563eb" stroke-width="2.5" fill="none" />
          <circle cx="28" cy="28" r="7" fill="#2563eb" />
        </svg>
        <span>Настольный клиент</span>
      </div>
      <div class="topbar-actions">
        <span class="api-key-hint">{{ maskedKey }}</span>
        <button class="btn-disconnect" @click="handleDisconnect">Отключиться</button>
      </div>
    </header>

    <!-- Main layout -->
    <div class="main">
      <!-- Left: attention indicator -->
      <section class="indicator-panel">
        <div
          class="indicator-circle"
          :class="indicatorClass"
          :style="{ animationDuration: indicatorPulseDuration }"
        >
          <div class="indicator-inner">
            <span class="indicator-label">{{ indicatorLabel }}</span>
          </div>
        </div>

        <div v-if="store.latestResult" class="stats">
          <div class="stat">
            <span class="stat-label">Угол взгляда θ</span>
            <span class="stat-val">{{ store.latestResult.theta.toFixed(1) }}°</span>
          </div>
          <div class="stat">
            <span class="stat-label">Порог α</span>
            <span class="stat-val">{{ store.latestResult.alpha.toFixed(1) }}°</span>
          </div>
          <div class="stat">
            <span class="stat-label">Расстояние</span>
            <span class="stat-val">{{ store.latestResult.distance.toFixed(2) }} м</span>
          </div>
        </div>
        <div v-else class="stats-placeholder">
          Ожидание данных с камеры…
        </div>
      </section>

      <!-- Right: controls + camera -->
      <section class="controls-panel">
        <!-- Camera preview -->
        <div class="camera-wrap">
          <video ref="videoEl" autoplay muted playsinline class="camera-preview" />
          <div v-if="store.sessionState === 'idle'" class="camera-overlay">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
            <span>Камера запустится вместе с сессией</span>
          </div>
        </div>

        <!-- Duration selector -->
        <div class="duration-section">
          <span class="section-label">Длительность</span>
          <div class="duration-pills">
            <button
              v-for="d in durations"
              :key="d"
              class="pill"
              :class="{ active: store.sessionDuration === d }"
              :disabled="store.sessionState !== 'idle'"
              @click="store.setSessionDuration(d)"
            >
              {{ d }} мин
            </button>
          </div>
        </div>

        <!-- Timer -->
        <div class="timer-section">
          <div class="timer-row">
            <div class="timer-item">
              <span class="timer-label">Прошло</span>
              <span class="timer-val">{{ formatTime(store.elapsedSeconds) }}</span>
            </div>
            <div class="timer-divider" />
            <div class="timer-item">
              <span class="timer-label">Осталось</span>
              <span class="timer-val">{{ formatTime(store.remainingSeconds) }}</span>
            </div>
          </div>

          <div v-if="store.sessionState === 'active'" class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPct + '%' }" />
          </div>
        </div>

        <!-- Session summary (ended) -->
        <div v-if="store.sessionState === 'ended'" class="summary">
          <div class="summary-score" :class="store.focusPercent >= 70 ? 'good' : 'low'">
            {{ store.focusPercent }}%
          </div>
          <span class="summary-label">концентрации за сессию</span>
        </div>

        <!-- Start / Stop button -->
        <div class="action-section">
          <button
            v-if="store.sessionState === 'idle' || store.sessionState === 'ended'"
            class="btn-start"
            @click="startSession"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Начать сессию
          </button>

          <button
            v-else-if="store.sessionState === 'connecting'"
            class="btn-start connecting"
            disabled
          >
            <span class="spinner" />
            Подключение…
          </button>

          <button
            v-else-if="store.sessionState === 'active'"
            class="btn-stop"
            @click="stopSession"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" />
            </svg>
            Завершить сессию
          </button>
        </div>

        <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { SessionService } from '../services/session'

const router = useRouter()
const store = useAppStore()

const videoEl = ref<HTMLVideoElement | null>(null)
const errorMsg = ref('')
const durations = [15, 30, 45, 60]

const session = new SessionService()
let timerInterval: ReturnType<typeof setInterval> | null = null

const maskedKey = computed(() => {
  const k = store.apiKey
  return k.length > 20 ? k.slice(0, 16) + '…' : k
})

const indicatorClass = computed(() => {
  if (store.sessionState !== 'active') return 'idle'
  if (!store.latestResult) return 'idle'
  return store.latestResult.focus ? 'focused' : 'unfocused'
})

const indicatorLabel = computed(() => {
  if (store.sessionState === 'idle') return 'ОЖИДАНИЕ'
  if (store.sessionState === 'connecting') return '…'
  if (store.sessionState === 'ended') return 'ЗАВЕРШЕНО'
  if (!store.latestResult) return '…'
  return store.latestResult.focus ? 'ФОКУС' : 'ОТВЛЕЧЁН'
})

const indicatorPulseDuration = computed(() => {
  if (store.latestResult?.focus) return '1.4s'
  return '2.4s'
})

const progressPct = computed(() => {
  const total = store.sessionDuration * 60
  return Math.min(100, (store.elapsedSeconds / total) * 100)
})

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

async function startSession() {
  errorMsg.value = ''
  store.resetSession()
  store.setSessionState('connecting')

  try {
    await session.connect(
      store.wsUrl,
      store.apiKey,
      (result) => {
        store.updateResult(result)
      },
      (reason) => {
        if (store.sessionState === 'active') {
          errorMsg.value = reason === 'connection_closed' ? 'Соединение потеряно.' : 'Ошибка сессии.'
          stopSession()
        }
      },
    )

    store.setSessionState('active')

    if (videoEl.value) {
      session.attachPreview(videoEl.value)
    }

    timerInterval = setInterval(() => {
      store.tickElapsed()
      if (store.remainingSeconds <= 0) stopSession()
    }, 1000)
  } catch {
    errorMsg.value = 'Не удалось подключиться. Проверьте API-ключ и сервер.'
    store.setSessionState('idle')
  }
}

function stopSession() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  session.disconnect()
  store.setSessionState('ended')
}

function handleDisconnect() {
  stopSession()
  store.clearApiKey()
  router.push('/auth')
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  session.disconnect()
})
</script>

<style scoped>
.session-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-light);
}

/* Topbar */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 52px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.api-key-hint {
  font-size: 12px;
  color: var(--muted);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.btn-disconnect {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  transition: background 0.15s, color 0.15s;
}
.btn-disconnect:hover {
  background: #fee2e2;
  color: var(--red);
}

/* Main layout */
.main {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* Left panel */
.indicator-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 36px;
  padding: 32px;
  border-right: 1px solid var(--border);
}

.indicator-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.5s, box-shadow 0.5s;
  animation: pulse var(--pulse-dur, 2s) ease-in-out infinite;
}
.indicator-circle.idle {
  background: rgba(148, 163, 184, 0.15);
  box-shadow: 0 0 0 0 transparent;
  animation: none;
}
.indicator-circle.focused {
  background: rgba(34, 197, 94, 0.15);
  color: var(--green);
  box-shadow: 0 0 40px rgba(34, 197, 94, 0.25);
}
.indicator-circle.unfocused {
  background: rgba(239, 68, 68, 0.1);
  color: var(--red);
  box-shadow: 0 0 40px rgba(239, 68, 68, 0.2);
}

.indicator-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.indicator-label {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: inherit;
}
.indicator-circle.idle .indicator-label {
  color: var(--dim);
}

.stats {
  display: flex;
  gap: 32px;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.stat-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.stats-placeholder {
  font-size: 13px;
  color: var(--dim);
}

/* Right panel */
.controls-panel {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  overflow-y: auto;
}

.camera-wrap {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  background: #1e293b;
  aspect-ratio: 16/9;
}
.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.camera-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255,255,255,0.4);
  font-size: 12px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.duration-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.duration-pills {
  display: flex;
  gap: 8px;
}
.pill {
  flex: 1;
  padding: 8px 0;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--border);
  background: var(--surface);
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  transition: all 0.15s;
}
.pill.active {
  border-color: var(--blue);
  color: var(--blue);
  background: var(--blue-lt);
}
.pill:hover:not(.active):not(:disabled) {
  border-color: var(--blue);
  color: var(--blue);
}
.pill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timer-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.timer-row {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.timer-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 2px;
}
.timer-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.timer-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.timer-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
}

.progress-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--blue);
  border-radius: 2px;
  transition: width 1s linear;
}

.summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.summary-score {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.summary-score.good { color: var(--green); }
.summary-score.low  { color: var(--red); }
.summary-label {
  font-size: 12px;
  color: var(--muted);
}

.action-section {
  margin-top: auto;
}
.btn-start,
.btn-stop {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s, transform 0.15s;
}
.btn-start {
  background: var(--blue);
  color: #fff;
}
.btn-start:hover:not(:disabled) {
  background: var(--blue-dark);
  transform: translateY(-1px);
}
.btn-start.connecting {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-stop {
  background: #fef2f2;
  color: var(--red);
  border: 1.5px solid #fecaca;
}
.btn-stop:hover {
  background: #fee2e2;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.error-banner {
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--red);
}
</style>
