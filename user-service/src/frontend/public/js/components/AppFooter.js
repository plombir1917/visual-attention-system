export const AppFooter = {
  template: `
    <footer style="background:#0b0e1a;border-top:1px solid rgba(255,255,255,.06)">
      <div class="footer-inner">
        <img src="logo.png" alt="ФОКУС"
          style="height:48px;width:auto;max-width:180px;object-fit:contain" />
        <div class="footer-links" style="display:flex;gap:24px">
          <a href="/privacy-policy.pdf" target="_blank" rel="noopener" class="footer-link">Конфиденциальность</a>
          <a href="/admin/login" class="footer-link">Войти</a>
          <a href="https://github.com/plombir1917/visual-attention-system" target="_blank" rel="noopener" class="footer-link">GitHub</a>
        </div>
        <div style="font-size:14px;color:rgba(255,255,255,.25)">© 2026 ФОКУС</div>
      </div>
    </footer>
  `
};
