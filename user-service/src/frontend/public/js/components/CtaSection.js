import { RegisterForm } from './RegisterForm.js';

export const CtaSection = {
  components: { RegisterForm },
  template: `
    <section class="cta-dark" id="cta">
      <div class="cta-glow"></div>
      <div class="section-wrap cta-body">
        <div class="reveal">
          <div style="display:flex;justify-content:center">
            <img src="logo.png" alt="ФОКУС" class="cta-logo" />
          </div>
          <h2 class="cta-heading">
            Начни контролировать<br><span style="color:#60a5fa">своё внимание.</span>
          </h2>
          <p class="cta-para">
            Зарегистрируйся и уже сегодня увидишь, сколько времени ты реально работаешь.
          </p>
          <div style="max-width:360px;margin:0 auto">
            <register-form></register-form>
          </div>
        </div>
      </div>
    </section>
  `
};
