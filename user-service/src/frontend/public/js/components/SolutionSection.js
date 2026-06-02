export const SolutionSection = {
  data: () => ({
    cards: [
      {
        icon: `<svg viewBox="0 0 44 44" fill="none" width="44" height="44"><ellipse cx="22" cy="22" rx="18" ry="10" stroke="currentColor" stroke-width="1.5"/><circle cx="22" cy="22" r="6" stroke="currentColor" stroke-width="1.5" opacity=".6"/><circle cx="22" cy="22" r="2.5" fill="currentColor"/></svg>`,
        title: 'Направление взгляда',
        desc:  'Нейросеть определяет, куда именно вы смотрите, — с точностью до 2.5°. Модель обучена на 80 000+ примеров, поэтому уверенно работает с разными лицами и при разном освещении.',
      },
      {
        icon: `<svg viewBox="0 0 44 44" fill="none" width="44" height="44"><rect x="10" y="6" width="24" height="28" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M16 18l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        title: 'Положение головы',
        desc:  'Система видит не только глаза, но и наклон и поворот головы. Даже если вы отвернулись или откинулись на спинку — это учитывается при оценке внимания.',
      },
      {
        icon: `<svg viewBox="0 0 44 44" fill="none" width="44" height="44"><path d="M8 32L16 20l8 6 8-14 8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="36" cy="14" r="3" fill="currentColor"/></svg>`,
        title: 'Оценка внимания',
        desc:  'Из взгляда и позы головы система делает понятный вывод: вы сосредоточены или отвлеклись. Показывает статус ФОКУС / ОТВЛЕЧЕНИЕ, числовые метрики и собирает статистику за сессию.',
      },
    ],
  }),
  template: `
    <section id="solution">
      <div class="section-wrap">
        <div class="section-header-center">
          <div class="section-eyebrow reveal">Решение</div>
          <h2 class="section-h2 reveal" style="margin-bottom:18px">Мы сделали внимание<br><span style="color:#2563eb">измеримым.</span></h2>
          <p class="reveal" style="font-size:16px;color:#64748b;line-height:1.75">
            ФОКУС анализирует взгляд и положение головы в реальном времени. Никаких браслетов — только камера ноутбука и честный ответ:
            <em style="color:#0b0e1a;font-style:normal;font-weight:600">ты сейчас здесь?</em>
          </p>
        </div>
        <div class="solution-grid">
          <div v-for="(c,i) in cards" :key="i" class="solution-cell reveal" :class="'reveal-d'+i">
            <div style="width:44px;height:44px;margin-bottom:22px;color:#2563eb" v-html="c.icon"></div>
            <div style="font-size:17px;font-weight:700;margin-bottom:10px">{{ c.title }}</div>
            <div style="font-size:14px;color:#64748b;line-height:1.65">{{ c.desc }}</div>
          </div>
        </div>
      </div>
    </section>
  `
};
