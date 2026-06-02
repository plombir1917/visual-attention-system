export const GettingStarted = {
  data: () => ({
    steps: [
      {
        title: 'Создайте аккаунт',
        desc: 'Бесплатная регистрация — карта не нужна.',
        link: { href: '#cta', label: 'Зарегистрироваться' },
      },
      {
        title: 'Сгенерируйте API-ключ',
        desc: 'В личном кабинете создайте персональный ключ доступа.',
        link: { href: '/admin/login', label: 'Открыть кабинет' },
      },
      {
        title: 'Выберите способ подключения',
        desc: 'Десктопное приложение или npm-виджет — варианты ниже.',
        link: { href: '#integration', label: 'К способам' },
      },
      {
        title: 'Подключитесь',
        desc: 'Установите клиент и введите свой API-ключ.',
      },
      {
        title: 'Запустите сессию',
        desc: 'Начните измерять внимание в реальном времени.',
      },
      {
        title: 'Анализируйте результаты',
        desc: 'Смотрите статистику внимания и историю сессий в админ-панели.',
      },
    ],
  }),
  template: `
    <section id="start">
      <div class="section-wrap">
        <div class="start-head">
          <div class="section-eyebrow reveal">С чего начать</div>
          <h2 class="section-h2 reveal" style="margin-bottom:16px">Инструкция —<br>от старта до аналитики.</h2>
          <p class="reveal" style="font-size:16px;color:#64748b;line-height:1.75;max-width:460px">
            От регистрации до первой сессии. Без сложной настройки — подключите ФОКУС удобным способом и начните.
          </p>
        </div>

        <ol class="start-panel reveal">
          <li v-for="(s,i) in steps" :key="i" class="start-row">
            <span class="start-row-index">{{ String(i+1).padStart(2,'0') }}</span>
            <div class="start-row-main">
              <span class="start-row-title">{{ s.title }}</span>
              <span class="start-row-desc">{{ s.desc }}</span>
            </div>
            <a v-if="s.link" :href="s.link.href" class="start-row-link">
              {{ s.link.label }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </li>
        </ol>
      </div>
    </section>
  `
};
