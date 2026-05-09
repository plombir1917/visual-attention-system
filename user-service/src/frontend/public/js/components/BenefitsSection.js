export const BenefitsSection = {
  data: () => ({
    benefits: [
      {
        icon:  `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="9" r="2" fill="currentColor"/></svg>`,
        title: 'Только камера',
        desc:  'Никакого специального оборудования. Работает прямо сейчас с любым ноутбуком.',
      },
      {
        icon:  `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 14l4-6 4 3 5-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        title: 'Реальное время',
        desc:  'Латентность < 35 мс. Показатель обновляется на каждый кадр.',
      },
      {
        icon:  `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="7" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        title: 'Приватность',
        desc:  'Видеопоток не покидает устройство. Модель работает локально.',
      },
      {
        icon:  `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v4M9 12v4M2 9h4M12 9h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.5"/></svg>`,
        title: 'Устойчив к шуму',
        desc:  'EMA-сглаживание + запас 10°. Нет ложных срабатываний при моргании.',
      },
    ],
    usecases: [
      { tag: 'Образование',     title: 'Онлайн-обучение',      desc: 'Понять, когда студент реально слушает, а когда нет.' },
      { tag: 'Продуктивность',  title: 'Глубокая работа',       desc: 'Объективные данные о качестве рабочих сессий.' },
      { tag: 'UX-исследования', title: 'Анализ интерфейсов',    desc: 'Куда смотрят пользователи? Что привлекает внимание?' },
      { tag: 'Будущее',         title: 'Адаптивные интерфейсы', desc: 'Система знает, что вы видите — и реагирует на это.' },
    ],
  }),
  template: `
    <section id="benefits">
      <div class="section-wrap">
        <div class="layout-2col layout-2col-benefits">
          <div>
            <div class="section-eyebrow reveal">Преимущества</div>
            <h2 class="section-h2 reveal" style="margin-bottom:44px">Ничего<br>лишнего.</h2>
            <div>
              <div v-for="(b,i) in benefits" :key="i" class="benefit-row reveal" :class="'reveal-d'+(i+1)">
                <div class="benefit-icon" v-html="b.icon"></div>
                <div>
                  <div style="font-size:15px;font-weight:700;margin-bottom:4px">{{ b.title }}</div>
                  <div style="font-size:13px;color:#64748b;line-height:1.6">{{ b.desc }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="usecase-cards">
            <div v-for="(u,i) in usecases" :key="i" class="usecase-card reveal" :class="'reveal-d'+(i+1)">
              <div style="font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#2563eb;margin-bottom:8px">{{ u.tag }}</div>
              <div style="font-size:16px;font-weight:700;margin-bottom:6px">{{ u.title }}</div>
              <div style="font-size:13px;color:#64748b;line-height:1.6">{{ u.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
};
