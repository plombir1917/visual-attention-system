export const HowItWorks = {
  data: () => ({
    steps: [
      { title: 'Захват',      desc: 'JPEG со встроенной камеры, 1 кадр/с по WebSocket.' },
      { title: 'Сетка лица',  desc: 'MediaPipe: 468 ориентиров, 14 ключевых для глаз.' },
      { title: 'Нейросеть',   desc: 'ResNet, кроп 55×35 пк. Выход — вектор взгляда (x, y, z).' },
      { title: 'Поза головы', desc: 'cv2.solvePnP по 6 точкам → матрица R, углы наклона.' },
      { title: 'Решение',     desc: 'Угол взгляда < 25° + запас 10° → внимание = ФОКУС.' },
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
