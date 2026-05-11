import type { AttentionResult } from '../stores/app'
import { CameraService } from './camera'

type ResultCallback = (result: AttentionResult) => void
type ErrorCallback = (reason: string) => void

export class SessionService {
  private ws: WebSocket | null = null
  private frameInterval: ReturnType<typeof setInterval> | null = null
  readonly camera = new CameraService()
  private videoEl: HTMLVideoElement | null = null

  async connect(
    wsUrl: string,
    apiKey: string,
    onResult: ResultCallback,
    onError: ErrorCallback,
  ): Promise<void> {
    await this.camera.start()

    return new Promise((resolve, reject) => {
      const url = `${wsUrl}?api_key=${encodeURIComponent(apiKey)}`
      this.ws = new WebSocket(url)
      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = () => {
        this.startFrameLoop(onError)
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data as string)
          // "focus: false" is omitted due to proto omitempty — default to false
          const result: AttentionResult = { focus: false, ...raw }
          onResult(result)
        } catch {
          // malformed frame — ignore
        }
      }

      this.ws.onerror = () => {
        this.cleanup()
        reject(new Error('WebSocket connection failed'))
        onError('connection_error')
      }

      this.ws.onclose = (ev) => {
        this.cleanup()
        if (ev.code !== 1000) onError('connection_closed')
      }
    })
  }

  attachPreview(videoEl: HTMLVideoElement): void {
    this.videoEl = videoEl
    this.camera.attachPreview(videoEl)
  }

  private startFrameLoop(onError: ErrorCallback): void {
    this.frameInterval = setInterval(async () => {
      if (!this.videoEl || !this.ws || this.ws.readyState !== WebSocket.OPEN) return

      const buffer = await this.camera.captureJpeg(this.videoEl)
      if (!buffer) return

      try {
        this.ws.send(buffer)
      } catch {
        onError('send_error')
      }
    }, 1000)
  }

  disconnect(): void {
    this.cleanup()
    this.ws?.close(1000)
    this.ws = null
  }

  private cleanup(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval)
      this.frameInterval = null
    }
    this.camera.stop()
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}
