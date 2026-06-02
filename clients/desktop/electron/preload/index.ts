import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('vasApi', {
  platform: process.platform,
  validateApiKey: (wsUrl: string, apiKey: string) =>
    ipcRenderer.invoke('validate-api-key', { wsUrl, apiKey }),
})
