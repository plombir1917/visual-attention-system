<template>
  <div class="welcome">
    <div class="orb orb-1" />
    <div class="orb orb-2" />
    <div class="orb orb-3" />

    <div class="content">
      <div class="logo">
        <img src="../assets/logo.png" alt="VAS" class="logo-img" />
      </div>

      <h1 class="title">Visual Attention</h1>
      <p class="subtitle">
        Отслеживайте концентрацию в реальном времени.<br />
        Оставайтесь в фокусе — без усилий.
      </p>

      <button class="btn-primary" @click="router.push('/auth')">Начать</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped>
.welcome {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  pointer-events: none;
}
.orb-1 {
  width: 420px; height: 420px;
  background: #2563eb;
  top: -120px; left: -100px;
  animation: orbFloat 7s ease-in-out infinite;
}
.orb-2 {
  width: 300px; height: 300px;
  background: #7c3aed;
  bottom: -80px; right: -60px;
  animation: orbFloat 9s ease-in-out infinite reverse;
}
.orb-3 {
  width: 200px; height: 200px;
  background: #06b6d4;
  top: 60%; left: 55%;
  animation: orbFloat 11s ease-in-out infinite;
}

.content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.logo {
  margin-bottom: 8px;
}

.logo-img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  border-radius: 20px;
}

.title {
  font-size: 42px;
  font-weight: 700;
  color: var(--text-inv);
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.7;
  max-width: 320px;
}

.btn-primary {
  margin-top: 12px;
  padding: 14px 40px;
  background: var(--blue);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-pill);
  transition: background 0.2s, transform 0.15s;
}
.btn-primary:hover {
  background: var(--blue-dark);
  transform: translateY(-1px);
}
.btn-primary:active {
  transform: translateY(0);
}
</style>
