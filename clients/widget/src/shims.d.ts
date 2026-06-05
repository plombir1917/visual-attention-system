// Инлайн-импорт ассета: Vite с суффиксом `?inline` отдаёт base64 data-URL,
// чтобы виджет оставался единым самодостаточным файлом без внешних ресурсов.
declare module '*.mp3?inline' {
  const src: string
  export default src
}
