import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('vasApi', {
  platform: process.platform,
})
