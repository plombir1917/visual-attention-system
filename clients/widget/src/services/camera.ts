export class CameraService {
  private stream: MediaStream | null = null
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  // Offscreen video used for capture — lives independently of any DOM preview element.
  // This way collapsing the widget panel (which destroys the visible <video>) never
  // breaks the frame capture loop.
  private readonly captureVideo: HTMLVideoElement

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 640
    this.canvas.height = 360
    this.ctx = this.canvas.getContext('2d')!

    this.captureVideo = document.createElement('video')
    this.captureVideo.muted = true
    this.captureVideo.playsInline = true
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
      audio: false,
    })
    this.captureVideo.srcObject = this.stream
    await this.captureVideo.play()
  }

  attachPreview(videoEl: HTMLVideoElement): void {
    if (!this.stream) return
    videoEl.srcObject = this.stream
  }

  async captureJpeg(): Promise<ArrayBuffer | null> {
    if (!this.stream || this.captureVideo.readyState < 2) return null

    this.ctx.drawImage(this.captureVideo, 0, 0, 640, 360)

    return new Promise((resolve) => {
      this.canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null)
          blob.arrayBuffer().then(resolve)
        },
        'image/jpeg',
        0.7,
      )
    })
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.captureVideo.srcObject = null
  }

  get active(): boolean {
    return this.stream !== null
  }
}
