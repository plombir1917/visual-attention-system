const { ref, onMounted, onUnmounted } = Vue;

export const AppNavbar = {
  setup() {
    const scrolled = ref(false);
    const onScroll = () => { scrolled.value = window.scrollY > 40; };
    onMounted(()   => window.addEventListener('scroll', onScroll, { passive: true }));
    onUnmounted(() => window.removeEventListener('scroll', onScroll));
    return { scrolled };
  },
  template: `
    <nav :class="{ scrolled }">
      <div class="nav-inner">
        <a href="#" class="nav-logo-link">
          <img src="logo.png" alt="ФОКУС" class="nav-logo" />
        </a>
        <div class="nav-links-wrap">
          <a href="#problem"     class="nav-link">Проблема</a>
          <a href="#solution"    class="nav-link">Решение</a>
          <a href="#how"         class="nav-link">Как работает</a>
          <a href="#integration" class="nav-link">Подключение</a>
        </div>
        <a href="#cta" class="nav-cta">Попробовать</a>
      </div>
    </nav>
  `
};
