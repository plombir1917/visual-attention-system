export class CameraService {
  private stream: MediaStream | null = null
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 640
    this.canvas.height = 360
    this.ctx = this.canvas.getContext('2d')!
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
      audio: false,
    })
  }

  attachPreview(videoEl: HTMLVideoElement): void {
    if (!this.stream) return
    videoEl.srcObject = this.stream
  }

  async captureJpeg(videoEl: HTMLVideoElement): Promise<ArrayBuffer | null> {
    if (!this.stream || videoEl.readyState < 2) return null

    this.ctx.drawImage(videoEl, 0, 0, 640, 360)

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
  }

  get active(): boolean {
    return this.stream !== null
  }
}
