export const IntegrationSection = {
  data: () => ({
    copied: false,
    installCmd: 'npm i vas-widget',
  }),
  methods: {
    async copy() {
      try {
        await navigator.clipboard.writeText(this.installCmd);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
      } catch {}
    },
  },
  template: `
    <section id="integration" style="background:#f8f9ff">
      <div class="section-wrap">

        <div class="section-header-center reveal">
          <div class="section-eyebrow">Способы подключения</div>
          <h2 class="section-h2">Встройте ФОКУС<br>в свой процесс.</h2>
          <p style="margin-top:16px;font-size:17px;color:#64748b;line-height:1.7">
            Два способа начать — выберите подходящий для вашего стека.
          </p>
        </div>

        <div class="integration-grid">

          <!-- ── Desktop App ── -->
          <div class="intg-card reveal reveal-d1">
            <div class="intg-card-top">
              <div class="intg-icon-wrap intg-icon-blue">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8M12 17v4"/>
                </svg>
              </div>
              <div class="intg-badge">Standalone</div>
            </div>

            <h3 class="intg-title">Десктопное приложение</h3>
            <p class="intg-desc">
              Готовый клиент для Windows.
              Запускается без браузера — камера анализируется в&nbsp;фоновом режиме,
              данные о внимании сразу поступают на сервер через защищённый канал.
            </p>

            <div class="intg-features">
              <div class="intg-feat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Не требует установки браузерных расширений
              </div>
              <div class="intg-feat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Системный трей — работает в фоне
              </div>
              <div class="intg-feat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Видео не покидает устройство
              </div>
            </div>

            <div class="intg-platforms">
              <span class="platform-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
                Windows
              </span>
            </div>

            <div class="intg-actions">
              <a href="/ФОКУС.exe" class="intg-btn intg-btn-primary" download>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Скачать
                <span class="intg-btn-sub">v1.0.0 · ~80 МБ</span>
              </a>
              <a href="#how" class="intg-btn intg-btn-ghost">
                Инструкция
              </a>
            </div>
          </div>

          <!-- ── npm library ── -->
          <div class="intg-card reveal reveal-d2">
            <div class="intg-card-top">
              <div class="intg-icon-wrap intg-icon-red">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0H1.763zm4.579 4.5h11.916L18 19.5H12V9h-1.5v10.5H6L4.342 4.5h2z"/>
                </svg>
              </div>
              <div class="intg-badge intg-badge-red">npm</div>
            </div>

            <h3 class="intg-title">npm-пакет</h3>
            <p class="intg-desc">
              Встройте трекер внимания прямо в веб-приложение.
              Виджет захватывает кадры с камеры и отправляет их в&nbsp;ФОКУС-сервер по WebSocket.
              Совместим с React, Vue, Svelte и чистым JavaScript.
            </p>

            <div class="intg-features">
              <div class="intg-feat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Фреймворк-агностик — любой стек
              </div>
              <div class="intg-feat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Авторизация через API-ключ
              </div>
              <div class="intg-feat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                События в реальном времени (onFocus, onDistracted)
              </div>
            </div>

            <div class="intg-code-wrap">
              <div class="intg-code-label">Установка</div>
              <div class="intg-code-block">
                <span class="intg-code-prompt">$</span>
                <code class="intg-code-text">{{ installCmd }}</code>
                <button class="intg-copy-btn" @click="copy" :class="{ copied }" :title="copied ? 'Скопировано' : 'Скопировать'">
                  <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </div>

            <div class="intg-snippet-wrap">
              <div class="intg-code-label">Пример использования</div>
              <pre class="intg-snippet"><span class="tok-blue">import</span> <span class="tok-white">{ mountVasWidget }</span> <span class="tok-blue">from</span> <span class="tok-green">'vas-widget'</span>

<span class="tok-dim">const</span> widget <span class="tok-dim">=</span> mountVasWidget<span class="tok-dim">({</span>
  wsUrl<span class="tok-dim">:</span> <span class="tok-green">'ws://your-server.com/ws'</span><span class="tok-dim">,</span>
  apiKey<span class="tok-dim">:</span> <span class="tok-green">'vas_live_xxx.xxx'</span><span class="tok-dim">,</span>   <span class="tok-dim">// optional — widget shows input form if omitted</span>
  position<span class="tok-dim">:</span> <span class="tok-green">'bottom-right'</span><span class="tok-dim">,</span>     <span class="tok-dim">// bottom-right | bottom-left | top-right | top-left</span>
  theme<span class="tok-dim">:</span> <span class="tok-green">'auto'</span><span class="tok-dim">,</span>                <span class="tok-dim">// auto | light | dark</span>
<span class="tok-dim">})</span>

<span class="tok-dim">// later</span>
widget<span class="tok-dim">.</span>destroy<span class="tok-dim">()</span></pre>
            </div>

            <div class="intg-actions">
              <a href="https://www.npmjs.com/package/vas-widget" target="_blank" rel="noopener" class="intg-btn intg-btn-primary intg-btn-npm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0H1.763zm4.579 4.5h11.916L18 19.5H12V9h-1.5v10.5H6L4.342 4.5h2z"/></svg>
                Открыть на npm
              </a>
              <a href="#how" class="intg-btn intg-btn-ghost">
                Документация
              </a>
            </div>
          </div>

        </div>

        <!-- ── API note ── -->
        <div class="intg-api-note reveal">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="width:32px;height:32px;border-radius:8px;background:rgba(37,99,235,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
            <span style="font-size:13px;font-weight:700;color:#0b0e1a">Нужен API-ключ</span>
          </div>
          <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0">
            Оба способа требуют API-ключ для аутентификации.
            Зарегистрируйтесь и сгенерируйте ключ в личном кабинете — это займёт меньше минуты.
            Ключ выдаётся раз и хранится только у вас.
          </p>
        </div>

      </div>
    </section>
  `,
};
