export type CameraErrorCode =
  | 'not_found'
  | 'permission_denied'
  | 'in_use'
  | 'unknown'

/** Ошибка доступа к веб-камере с человекочитаемым сообщением. */
export class CameraError extends Error {
  constructor(
    readonly code: CameraErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'CameraError'
  }
}

/** Приводит ошибку getUserMedia к доменной CameraError с понятным текстом. */
function toCameraError(err: unknown): CameraError {
  const name = err instanceof DOMException ? err.name : ''
  switch (name) {
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return new CameraError('not_found', 'Веб-камера не обнаружена')
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return new CameraError(
        'permission_denied',
        'Нет доступа к камере. Разрешите использование камеры в настройках системы.',
      )
    case 'NotReadableError':
    case 'TrackStartError':
      return new CameraError(
        'in_use',
        'Камера занята другим приложением. Закройте его и попробуйте снова.',
      )
    default:
      return new CameraError('unknown', 'Не удалось получить доступ к камере.')
  }
}

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
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
        audio: false,
      })
    } catch (err) {
      throw toCameraError(err)
    }
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
