export const HowItWorks = {
  data: () => ({
    steps: [
      { title: 'Захват',      desc: 'JPEG со встроенной камеры, 30 кадров/с по WebSocket.' },
      { title: 'Сетка лица',  desc: 'MediaPipe: 468 ориентиров, 14 ключевых для глаз.' },
      { title: 'Нейросеть',   desc: 'ResNet, кроп 55×35 пк. Выход — вектор (x, y, z) взгляда.' },
      { title: 'Поза головы', desc: 'cv2.solvePnP по 6 точкам → матрица R, углы наклона.' },
      { title: 'Решение',     desc: 'Угол взгляда < 25° + запас 10° → внимание = ФОКУС.' },
    ],
    tech: [
      { name: 'Python 3.11', icon: 'https://cdn.simpleicons.org/python/3776ab' },
      { name: 'FastAPI',     icon: 'https://cdn.simpleicons.org/fastapi/009688' },
      { name: 'PyTorch',     icon: 'https://cdn.simpleicons.org/pytorch/ee4c2c' },
      { name: 'MediaPipe',   icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cellipse cx='12' cy='12' rx='10' ry='6' stroke='%230097A7' stroke-width='2'/%3E%3Ccircle cx='12' cy='12' r='3' fill='%230097A7'/%3E%3C/svg%3E" },
      { name: 'OpenCV',      icon: 'https://cdn.simpleicons.org/opencv/5c3ee8' },
      { name: 'WebSocket',   icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M5 8h14M5 8l3-3M5 8l3 3M19 16H5M19 16l-3-3M19 16l-3 3' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" },
      { name: 'Redis',       icon: 'https://cdn.simpleicons.org/redis/dc382d' },
      { name: 'Go relay',    icon: 'https://cdn.simpleicons.org/go/00aed8' },
      { name: 'NestJS',      icon: 'https://cdn.simpleicons.org/nestjs/e0234e' },
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
          <p class="reveal" style="font-size:14px;color:#94a3b8;max-width:280px;line-height:1.7">30 кадров/с · каждый кадр — полный цикл · результат за &lt;35 мс</p>
        </div>
        <div class="steps-grid">
          <div v-for="(s,i) in steps" :key="i" class="step-card reveal" :class="'reveal-d'+(i%4+1)">
            <div class="step-num">{{ String(i+1).padStart(2,'0') }}</div>
            <div class="step-title">{{ s.title }}</div>
            <div class="step-desc">{{ s.desc }}</div>
          </div>
        </div>
        <div class="reveal" style="padding:24px 28px;background:#fff;border:1px solid rgba(37,99,235,.12);border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.05)">
          <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#2563eb;margin-bottom:16px">Стек</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px">
            <div v-for="t in tech" :key="t.name"
              style="display:flex;align-items:center;gap:7px;padding:7px 14px;background:#f8f9ff;border:1px solid rgba(0,0,0,.07);border-radius:8px;transition:box-shadow .2s,transform .15s;cursor:default"
              onmouseover="this.style.boxShadow='0 3px 12px rgba(0,0,0,.09)';this.style.transform='translateY(-1px)'"
              onmouseout="this.style.boxShadow='';this.style.transform=''">
              <img v-if="t.icon" :src="t.icon" :alt="t.name" width="16" height="16"
                style="object-fit:contain;flex-shrink:0" onerror="this.style.display='none'" />
              <span style="font-size:12px;font-weight:600;color:#374151;white-space:nowrap">{{ t.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
};
