import { AppNavbar }          from './components/AppNavbar.js';
import { HeroSection }        from './components/HeroSection.js';
import { ProblemSection }     from './components/ProblemSection.js';
import { SolutionSection }    from './components/SolutionSection.js';
import { HowItWorks }         from './components/HowItWorks.js';
import { BenefitsSection }    from './components/BenefitsSection.js';
import { IntegrationSection } from './components/IntegrationSection.js';
import { CtaSection }         from './components/CtaSection.js';
import { AppFooter }          from './components/AppFooter.js';

const { createApp, onMounted } = Vue;

createApp({
  components: { AppNavbar, HeroSection, ProblemSection, SolutionSection, HowItWorks, BenefitsSection, IntegrationSection, CtaSection, AppFooter },
  setup() {
    onMounted(() => {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
        });
      }, { threshold: .08 });
      setTimeout(() => document.querySelectorAll('.reveal').forEach(el => obs.observe(el)), 150);
    });
  },
}).mount('#app');
