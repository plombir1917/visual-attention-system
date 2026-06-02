export const HowItWorks = {
  data: () => ({
    steps: [
      { title: 'Захват кадра',  desc: 'Камера ноутбука раз в секунду делает снимок и отправляет его на сервер по защищённому каналу.' },
      { title: 'Разметка лица', desc: 'Алгоритм находит лицо и расставляет 468 опорных точек — особенно вокруг глаз.' },
      { title: 'Анализ взгляда', desc: 'Нейросеть по изображению глаз вычисляет, в какую сторону направлен взгляд.' },
      { title: 'Поза головы',   desc: 'Параллельно определяются наклон и поворот головы в пространстве.' },
      { title: 'Решение',       desc: 'Взгляд в экран — статус ФОКУС, в сторону — ОТВЛЕЧЕНИЕ. Результат обновляется каждую секунду.' },
    ],
  }),
  template: `
    <section id="how">
      <div class="section-wrap">
        <div class="how-header">
          <div>
            <div class="section-eyebrow reveal">Как это работает</div>
            <h2 class="section-h2 reveal">5 шагов от кадра<br>до решения.</h2>
          </div>
          <p class="reveal" style="font-size:14px;color:#94a3b8;max-width:280px;line-height:1.7">1 кадр/с · каждый кадр — полный цикл · результат за &lt;35 мс</p>
        </div>
        <div class="steps-grid">
          <div v-for="(s,i) in steps" :key="i" class="step-card reveal" :class="'reveal-d'+(i%4+1)">
            <div class="step-num">{{ String(i+1).padStart(2,'0') }}</div>
            <div class="step-title">{{ s.title }}</div>
            <div class="step-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>
    </section>
  `
};
