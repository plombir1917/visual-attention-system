export interface AttentionResult {
  focus: boolean
  theta: number
  alpha: number
  distance: number
  gaze_vector: [number, number, number]
}

export interface WidgetConfig {
  wsUrl: string
  apiKey?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'light' | 'dark' | 'auto'
}
