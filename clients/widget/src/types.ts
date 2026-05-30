// Адрес ФОКУС-сервера зашит в библиотеку и не настраивается потребителем.
export const WS_URL = 'ws://37.233.81.42:8080/ws'

export interface AttentionResult {
  focus: boolean
  theta: number
  alpha: number
  distance: number
  gaze_vector: [number, number, number]
}

export interface WidgetConfig {
  apiKey?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'light' | 'dark' | 'auto'
}
