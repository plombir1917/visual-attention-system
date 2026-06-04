import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AttentionResult {
  focus: boolean
  theta: number
  alpha: number
  distance: number
  gaze_vector: [number, number, number]
}

export type SessionState = 'idle' | 'connecting' | 'active' | 'ended'

// Допустимая длительность сессии: от 1 минуты до 8 часов.
export const MIN_DURATION_MIN = 1
export const MAX_DURATION_MIN = 8 * 60

// Кадры идут раз в секунду, поэтому 60 кадров подряд = 1 минута отвлечения.
export const DISTRACTION_ALARM_FRAMES = 60

export const useAppStore = defineStore('app', () => {
  const apiKey = ref(localStorage.getItem('vas_api_key') ?? '')
  const wsUrl = ref(import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws')
  const sessionDuration = ref(30)
  const sessionState = ref<SessionState>('idle')
  const latestResult = ref<AttentionResult | null>(null)
  const elapsedSeconds = ref(0)
  const focusedCount = ref(0)
  const totalFrames = ref(0)
  // Серия подряд идущих кадров «отвлечён» и флаг звуковой тревоги.
  const distractedStreak = ref(0)
  const alarmActive = ref(false)

  const focusPercent = computed(() =>
    totalFrames.value > 0 ? Math.round((focusedCount.value / totalFrames.value) * 100) : 0,
  )
  const remainingSeconds = computed(() =>
    Math.max(0, sessionDuration.value * 60 - elapsedSeconds.value),
  )

  function setApiKey(key: string) {
    apiKey.value = key
    localStorage.setItem('vas_api_key', key)
  }

  // Единственная точка записи длительности — клампим в допустимый диапазон,
  // чтобы значение оставалось валидным даже при обходе UI-валидации.
  function setSessionDuration(minutes: number) {
    const n = Math.round(minutes)
    sessionDuration.value = Math.min(
      MAX_DURATION_MIN,
      Math.max(MIN_DURATION_MIN, Number.isFinite(n) ? n : MIN_DURATION_MIN),
    )
  }

  function setSessionState(state: SessionState) {
    sessionState.value = state
  }

  function updateResult(result: AttentionResult) {
    latestResult.value = result
    totalFrames.value++
    if (result.focus) focusedCount.value++

    // Тревога: звучит после минуты непрерывного отвлечения и снимается только
    // при восстановлении внимания (первый же кадр focus=true).
    if (result.focus) {
      distractedStreak.value = 0
      alarmActive.value = false
    } else {
      distractedStreak.value++
      if (distractedStreak.value >= DISTRACTION_ALARM_FRAMES) {
        alarmActive.value = true
      }
    }
  }

  function tickElapsed() {
    elapsedSeconds.value++
  }

  function resetSession() {
    sessionState.value = 'idle'
    latestResult.value = null
    elapsedSeconds.value = 0
    focusedCount.value = 0
    totalFrames.value = 0
    distractedStreak.value = 0
    alarmActive.value = false
  }

  function clearApiKey() {
    apiKey.value = ''
    localStorage.removeItem('vas_api_key')
  }

  return {
    apiKey,
    wsUrl,
    sessionDuration,
    sessionState,
    latestResult,
    elapsedSeconds,
    focusedCount,
    totalFrames,
    distractedStreak,
    alarmActive,
    focusPercent,
    remainingSeconds,
    setApiKey,
    setSessionDuration,
    setSessionState,
    updateResult,
    tickElapsed,
    resetSession,
    clearApiKey,
  }
})
