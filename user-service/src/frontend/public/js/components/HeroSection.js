import { GazeViz } from './GazeViz.js';

export const HeroSection = {
  components: { GazeViz },
  methods: {
    scrollToForm() {
      document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
    },
  },
  template: `
    <div class="hero-inner">
      <div style="animation:fadeUp .8s ease both">
        <h1 class="hero-h1">Секрет фокуса —<br><span class="accent">контроль внимания.</span></h1>
        <p class="hero-para">
          Вы не знаете, сколько времени реально работаете.<br>Теперь — знаете.
        </p>
        <div style="max-width:360px">
          <button type="button" class="btn-primary" @click="scrollToForm">Начать бесплатно →</button>
          <p style="font-size:13px;color:#94a3b8;text-align:center;margin-top:10px">
            Уже есть аккаунт? <a href="/admin/login" style="color:#60a5fa;text-decoration:none;font-weight:500">Войти</a>
          </p>
        </div>
      </div>
      <div class="hero-canvas-wrap">
        <gaze-viz></gaze-viz>
      </div>
    </div>
  `
};
