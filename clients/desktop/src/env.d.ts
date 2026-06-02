/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  vasApi: {
    platform: string
    validateApiKey: (
      wsUrl: string,
      apiKey: string,
    ) => Promise<'valid' | 'invalid' | 'unreachable'>
  }
}
