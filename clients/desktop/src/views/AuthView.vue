<template>
  <div class="auth-page">
    <div class="card">
      <div class="card-header">
        <svg width="36" height="36" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="18" stroke="#2563eb" stroke-width="2" fill="none" />
          <circle cx="28" cy="28" r="7" fill="#2563eb" />
        </svg>
        <h2>Подключение аккаунта</h2>
        <p>Введите API-ключ для начала мониторинга концентрации.</p>
      </div>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="apikey">API-ключ</label>
          <div class="input-wrap" :class="{ error: errorMsg, success: isValid }">
            <input
              id="apikey"
              v-model="key"
              :type="showKey ? 'text' : 'password'"
              placeholder="vas_live_xxxxxxxx.xxxxxxxx"
              autocomplete="off"
              spellcheck="false"
              @input="errorMsg = ''"
            />
            <button type="button" class="toggle-vis" @click="showKey = !showKey">
              <svg v-if="!showKey" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
          <span v-if="errorMsg" class="error-msg">{{ errorMsg }}</span>
        </div>

        <button type="submit" class="btn-submit" :disabled="!key.trim()">
          Подключиться
        </button>
      </form>

      <button class="btn-back" @click="router.push('/')">← Назад</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const store = useAppStore()

const key = ref(store.apiKey)
const showKey = ref(false)
const errorMsg = ref('')

const KEY_RE = /^vas_live_[A-Za-z0-9]+\..+$/
const isValid = computed(() => KEY_RE.test(key.value.trim()))

function submit() {
  const trimmed = key.value.trim()
  if (!trimmed) return

  if (!KEY_RE.test(trimmed)) {
    errorMsg.value = 'Неверный формат. Ожидается: vas_live_xxxxxx.xxxxxx'
    return
  }

  store.setApiKey(trimmed)
  router.push('/session')
}
</script>

<style scoped>
.auth-page {
  width: 100%;
  height: 100%;
  background: var(--bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow-md);
  padding: 40px 44px;
  width: 420px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}
.card-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}
.card-header p {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.input-wrap {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-light);
  transition: border-color 0.2s;
}
.input-wrap:focus-within {
  border-color: var(--blue);
}
.input-wrap.error {
  border-color: var(--red);
}
.input-wrap.success {
  border-color: var(--green);
}
.input-wrap input {
  flex: 1;
  padding: 10px 12px;
  font-size: 13px;
  background: transparent;
  color: var(--text);
  border: none;
  min-width: 0;
}
.input-wrap input::placeholder {
  color: var(--dim);
}

.toggle-vis {
  padding: 0 12px;
  background: transparent;
  color: var(--muted);
  display: flex;
  align-items: center;
  height: 100%;
  transition: color 0.15s;
}
.toggle-vis:hover {
  color: var(--blue);
}

.error-msg {
  font-size: 12px;
  color: var(--red);
}

.btn-submit {
  padding: 12px;
  background: var(--blue);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  transition: background 0.2s, opacity 0.2s;
}
.btn-submit:hover:not(:disabled) {
  background: var(--blue-dark);
}
.btn-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-back {
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  text-align: center;
  padding: 4px;
  transition: color 0.15s;
}
.btn-back:hover {
  color: var(--blue);
}
</style>
