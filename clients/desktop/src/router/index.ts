import { createRouter, createWebHashHistory } from 'vue-router'
import WelcomeView from '../views/WelcomeView.vue'
import AuthView from '../views/AuthView.vue'
import SessionView from '../views/SessionView.vue'
import { useAppStore } from '../stores/app'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: WelcomeView },
    { path: '/auth', component: AuthView },
    {
      path: '/session',
      component: SessionView,
      beforeEnter: () => {
        const store = useAppStore()
        if (!store.apiKey) return '/auth'
      },
    },
  ],
})
