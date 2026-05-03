import { showToast } from '../utils.js';

const { ref } = Vue;

export const RegisterForm = {
  setup() {
    const email = ref(''), password = ref(''), loading = ref(false), done = ref(false);

    async function submit(e) {
      e.preventDefault();
      if (!email.value.includes('@') || password.value.length < 6) return;
      loading.value = true;
      await new Promise(r => setTimeout(r, 900));
      loading.value = false;
      done.value = true;
      showToast();
      setTimeout(() => { done.value = false; email.value = ''; password.value = ''; }, 4000);
    }

    return { email, password, loading, done, submit };
  },
  template: `
    <form @submit="submit" style="display:flex;flex-direction:column;gap:10px">
      <input v-model="email"    type="email"    placeholder="Email"                  class="form-field" :disabled="done||loading" autocomplete="email" />
      <input v-model="password" type="password" placeholder="Пароль (от 6 символов)" class="form-field" :disabled="done||loading" autocomplete="new-password" />
      <button type="submit" class="btn-primary" :disabled="done||loading" :style="done?'background:#16a34a':''">
        <span v-if="loading" style="display:flex;align-items:center;justify-content:center;gap:8px">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style="animation:spin .8s linear infinite">
            <circle cx="7.5" cy="7.5" r="5.5" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
            <path d="M7.5 2a5.5 5.5 0 015.5 5.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Создаём аккаунт…
        </span>
        <span v-else-if="done">✓ Готово!</span>
        <span v-else>Начать бесплатно →</span>
      </button>
      <p style="font-size:13px;color:#94a3b8;text-align:center;margin-top:2px">
        Уже есть аккаунт? <a href="/admin/login" style="color:#2563eb;text-decoration:none;font-weight:500">Войти</a>
      </p>
    </form>
  `
};
