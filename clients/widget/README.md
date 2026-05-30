# vas-widget

Embeddable real-time attention monitoring widget for any frontend application.

Connects to your [attention-service](https://github.com/plombir1917/visual-attention-system) via WebSocket, captures webcam frames, and shows a live focus indicator as a floating overlay.

## Install

```bash
npm install vas-widget
```

## Usage

### Programmatic (any framework)

```js
import { mountVasWidget } from 'vas-widget'

const widget = mountVasWidget({
  wsUrl: 'ws://your-server.com/ws',
  apiKey: 'vas_live_xxx.xxx',   // optional — widget shows input form if omitted
  position: 'bottom-right',     // bottom-right | bottom-left | top-right | top-left
  theme: 'auto',                // auto | light | dark
})

// later
widget.destroy()
```

### Web Component (declarative)

```js
import { defineVasWidget } from 'vas-widget'
defineVasWidget() // registers <vas-widget> custom element
```

```html
<vas-widget
  ws-url="ws://your-server.com/ws"
  api-key="vas_live_xxx.xxx"
  position="bottom-right"
  theme="auto"
></vas-widget>
```

### React

```jsx
import { useEffect } from 'react'
import { mountVasWidget } from 'vas-widget'

export function FocusWidget() {
  useEffect(() => {
    const widget = mountVasWidget({ wsUrl: 'ws://your-server.com/ws' })
    return () => widget.destroy()
  }, [])
  return null
}
```

### Vue 3

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue'
import { mountVasWidget } from 'vas-widget'

let widget
onMounted(() => { widget = mountVasWidget({ wsUrl: 'ws://your-server.com/ws' }) })
onUnmounted(() => widget?.destroy())
</script>
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wsUrl` | `string` | — | WebSocket URL of your attention-service |
| `apiKey` | `string` | `''` | API key. If omitted, widget shows an input form |
| `position` | `string` | `'bottom-right'` | Widget position on screen |
| `theme` | `string` | `'auto'` | Color scheme. `auto` follows `prefers-color-scheme` |

## How it works

1. User clicks the **ФОКУС** badge → widget expands
2. User clicks **Начать мониторинг** → webcam permission is requested
3. Widget sends JPEG frames to `wsUrl?api_key=...` every second
4. attention-service returns `{ focus, theta, alpha, distance }` JSON
5. Widget shows live focus status and tracks statistics for the session

Tab visibility is tracked automatically — frames are paused when the browser tab is hidden and resumed on return.

## Requirements

- Browser with `getUserMedia` support (Chrome, Firefox, Edge, Safari 14+)
- Running [attention-service](https://github.com/plombir1917/visual-attention-system) instance
- Valid API key issued by user-service

## License

MIT
