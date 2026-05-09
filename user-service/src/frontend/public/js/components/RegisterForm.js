const { ref } = Vue;

export const RegisterForm = {
  setup() {
    const name        = ref('');
    const email       = ref('');
    const password    = ref('');
    const loading     = ref(false);
    const done        = ref(false);
    const fieldErrors = ref({});
    const globalError = ref('');

    function clearFieldError(field) {
      if (fieldErrors.value[field]) {
        fieldErrors.value = { ...fieldErrors.value, [field]: '' };
      }
    }

    async function submit(e) {
      e.preventDefault();
      fieldErrors.value = {};
      globalError.value = '';
      loading.value = true;

      try {
        const res = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.value,
            email: email.value,
            password: password.value,
          }),
        });

        if (res.ok) {
          done.value = true;
          sessionStorage.setItem('prefill_email',    email.value);
          sessionStorage.setItem('prefill_password', password.value);
          setTimeout(() => { window.location.href = '/admin/login'; }, 800);
          return;
        }

        const body = await res.json().catch(() => ({}));

        if (res.status === 409) {
          fieldErrors.value = { email: 'Этот email уже зарегистрирован.' };
        } else if (res.status === 400 && body.fieldErrors) {
          fieldErrors.value = body.fieldErrors;
        } else {
          globalError.value = 'Ошибка сервера. Попробуйте позже.';
        }
      } catch {
        globalError.value = 'Нет соединения с сервером.';
      } finally {
        loading.value = false;
      }
    }

    return { name, email, password, loading, done, fieldErrors, globalError, submit, clearFieldError };
  },
  template: `
    <form @submit="submit" style="display:flex;flex-direction:column;gap:10px">
      <div class="field-wrap">
        <input
          v-model="name"
          type="text"
          placeholder="Имя (от 4 символов)"
          :class="['form-field', fieldErrors.name ? 'form-field--error' : '']"
          :disabled="done||loading"
          autocomplete="name"
          @input="clearFieldError('name')"
        />
        <p v-if="fieldErrors.name" class="field-error-msg">{{ fieldErrors.name }}</p>
      </div>
      <div class="field-wrap">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          :class="['form-field', fieldErrors.email ? 'form-field--error' : '']"
          :disabled="done||loading"
          autocomplete="email"
          @input="clearFieldError('email')"
        />
        <p v-if="fieldErrors.email" class="field-error-msg">{{ fieldErrors.email }}</p>
      </div>
      <div class="field-wrap">
        <input
          v-model="password"
          type="password"
          placeholder="Надёжный пароль"
          :class="['form-field', fieldErrors.password ? 'form-field--error' : '']"
          :disabled="done||loading"
          autocomplete="new-password"
          @input="clearFieldError('password')"
        />
        <p v-if="fieldErrors.password" class="field-error-msg">{{ fieldErrors.password }}</p>
      </div>
      <p v-if="globalError" class="register-error">{{ globalError }}</p>
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
