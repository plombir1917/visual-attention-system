// Кнопка входа через VK ID для лендинга. Логика входа — в общем window.VkAuth
// (/js/vkid-auth.js, подключён в index.html до app.js).
export const VkLoginButton = {
  mounted() {
    if (window.VkAuth && this.$refs.container) {
      // CTA-секция тёмная — берём яркую фирменную синюю кнопку,
      // светлая тема виджета, чтобы не сливалась с фоном.
      window.VkAuth.render(this.$refs.container, {
        skin: 'primary',
        scheme: 'light',
      });
    }
  },
  template: `
    <div class="vk-login">
      <div class="vk-login-divider"><span>или</span></div>
      <div ref="container" class="vk-login-widget"></div>
    </div>
  `,
};
