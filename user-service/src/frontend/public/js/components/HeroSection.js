import { RegisterForm } from './RegisterForm.js';
import { GazeViz }      from './GazeViz.js';

export const HeroSection = {
  components: { RegisterForm, GazeViz },
  data: () => ({ hints: ['Бесплатный план', 'Без карты', 'Отмена в любой момент'] }),
  template: `
    <div class="hero-inner">
      <div style="animation:fadeUp .8s ease both">
        <div class="hero-badge"><div class="hero-badge-dot"></div>Новая метрика продуктивности</div>
        <h1 class="hero-h1">Секрет фокуса —<br><span class="accent">контроль внимания.</span></h1>
        <p class="hero-para">
          Вы не знаете, сколько времени реально работаете.<br>Теперь — знаете.
        </p>
        <div style="max-width:360px" id="register">
          <register-form></register-form>
        </div>
        <div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:16px">
          <span v-for="h in hints" :key="h" style="font-size:12px;color:#94a3b8;display:flex;align-items:center;gap:5px">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#94a3b8" stroke-width="1.2"/>
              <path d="M4 6l1.5 1.5L8 4" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ h }}
          </span>
        </div>
      </div>
      <div class="hero-canvas-wrap">
        <gaze-viz></gaze-viz>
      </div>
    </div>
  `
};
