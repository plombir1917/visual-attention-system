export const ProblemSection = {
  data: () => ({
    stats: [
      { n: '5',  u: 'мин', l: 'до первого\nотвлечения' },
      { n: '23', u: 'мин', l: 'чтобы снова\nвойти в поток' },
      { n: '40', u: '%',   l: 'рабочего дня\nуходит впустую' },
    ],
    scenarios: [
      { time: '10:02',  text: 'Открываешь задачу. Настраиваешься.' },
      { time: '10:03',  text: '<span class="strike">Начинаешь работать</span> → Отвлекаешься на уведомление' },
      { time: '10:24',  text: 'Возвращаешься. Забыл, с чего начал.' },
      { time: 'повтор', text: '<span style="color:#94a3b8">×12 в день. Каждый день.</span>', danger: true },
    ],
  }),
  template: `
    <section id="problem">
      <div class="section-wrap">
        <div class="layout-2col layout-2col-problem">
          <div>
            <div class="section-eyebrow reveal">Звучит знакомо?</div>
            <h2 class="section-h2 reveal" style="margin-bottom:16px">Ты думаешь,<br>что работаешь.</h2>
            <p class="problem-para reveal">
              Каждый день ты садишься за задачу — и теряешь её. Не потому что ленив. Потому что нет инструмента.
            </p>
            <div class="stats-grid">
              <div v-for="(s,i) in stats" :key="i" class="reveal" :class="'reveal-d'+(i+1)">
                <div class="stat-number">{{ s.n }}<span class="stat-unit">{{ s.u }}</span></div>
                <div class="stat-label">{{ s.l }}</div>
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div v-for="(sc,i) in scenarios" :key="i"
              class="problem-scenario reveal" :class="'reveal-d'+(i+1)"
              :style="sc.danger ? 'border-color:rgba(220,38,38,0.15)' : ''">
              <div class="problem-time" :style="sc.danger ? 'color:#dc2626' : ''">{{ sc.time }}</div>
              <div class="problem-text" v-html="sc.text"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
};
