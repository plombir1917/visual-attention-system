import { defineCustomElement } from 'vue'
import VasWidgetCE from './widget.ce.vue'

export type { AttentionResult, WidgetConfig } from './types'

const VasAttentionElement = defineCustomElement(VasWidgetCE)

export function defineVasWidget(tagName = 'vas-widget'): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, VasAttentionElement)
  }
}

export interface WidgetInstance {
  destroy(): void
}

export function mountVasWidget(config: {
  wsUrl: string
  apiKey?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'light' | 'dark' | 'auto'
}): WidgetInstance {
  defineVasWidget()
  const el = document.createElement('vas-widget')
  el.setAttribute('ws-url', config.wsUrl)
  if (config.apiKey) el.setAttribute('api-key', config.apiKey)
  if (config.position) el.setAttribute('position', config.position)
  if (config.theme) el.setAttribute('theme', config.theme)
  document.body.appendChild(el)
  return {
    destroy() {
      document.body.removeChild(el)
    },
  }
}
