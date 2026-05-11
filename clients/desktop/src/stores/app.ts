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

export const useAppStore = defineStore('app', () => {
  const apiKey = ref(localStorage.getItem('vas_api_key') ?? '')
  const wsUrl = ref(import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws')
  const sessionDuration = ref(30)
  const sessionState = ref<SessionState>('idle')
  const latestResult = ref<AttentionResult | null>(null)
  const elapsedSeconds = ref(0)
  const focusedCount = ref(0)
  const totalFrames = ref(0)

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

  function setSessionDuration(minutes: number) {
    sessionDuration.value = minutes
  }

  function setSessionState(state: SessionState) {
    sessionState.value = state
  }

  function updateResult(result: AttentionResult) {
    latestResult.value = result
    totalFrames.value++
    if (result.focus) focusedCount.value++
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
