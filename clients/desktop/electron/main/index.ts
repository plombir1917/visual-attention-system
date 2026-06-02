import { app, BrowserWindow, ipcMain, net, shell } from 'electron'
import { join } from 'path'

type ApiKeyCheck = 'valid' | 'invalid' | 'unreachable'

/**
 * Проверяет API-ключ заранее, на этапе ввода, тем же сервером, что и сессия.
 * Делается в main-процессе (минуя CORS): GET на ws-эндпоинт, приведённый к http.
 * Сервер авторизует ключ до WebSocket-апгрейда, поэтому статус однозначен:
 *   401            — ключ отвергнут;
 *   5xx / нет сети — сервер недоступен;
 *   иначе          — ключ принят (не-WS GET после авторизации завершится 400).
 */
async function validateApiKey(wsUrl: string, apiKey: string): Promise<ApiKeyCheck> {
  const httpUrl = wsUrl.replace(/^ws/, 'http')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const resp = await net.fetch(httpUrl, {
      method: 'GET',
      headers: { 'X-Api-Key': apiKey },
      signal: controller.signal,
    })
    if (resp.status === 401) return 'invalid'
    if (resp.status >= 500) return 'unreachable'
    return 'valid'
  } catch {
    return 'unreachable'
  } finally {
    clearTimeout(timeout)
  }
}

ipcMain.handle(
  'validate-api-key',
  (_event, payload: { wsUrl: string; apiKey: string }): Promise<ApiKeyCheck> =>
    validateApiKey(payload.wsUrl, payload.apiKey),
)

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    resizable: false,
    show: false,
    autoHideMenuBar: true,
    icon: join(
      __dirname,
      process.platform === 'linux'
        ? '../../resources/icon.png'
        : '../../resources/icon.ico',
    ),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
