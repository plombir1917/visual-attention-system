/**
 * Встраивает кнопку входа через VK ID на страницу логина AdminJS (/admin/login).
 * AdminJS рендерит форму логина через React, поэтому ждём появления формы и
 * вставляем контейнер виджета под ней. Использует общий window.VkAuth
 * (см. /js/vkid-auth.js, подключается раньше в assets.scripts).
 */
(function () {
  if (!location.pathname.startsWith('/admin/login')) return;

  var CONTAINER_ID = 'vk-onetap-admin';

  function mount() {
    if (document.getElementById(CONTAINER_ID)) return true;

    var passwordInput = document.querySelector('input[type="password"]');
    if (!passwordInput) return false;

    // Поднимаемся до form (или ближайшего блока), чтобы вставить виджет после неё.
    var form = passwordInput.closest('form') || passwordInput.parentElement;
    if (!form) return false;

    var wrap = document.createElement('div');
    wrap.style.marginTop = '16px';

    var divider = document.createElement('div');
    divider.textContent = 'или';
    divider.style.cssText =
      'text-align:center;color:#94a3b8;font-size:12px;margin:8px 0 12px';

    var container = document.createElement('div');
    container.id = CONTAINER_ID;

    wrap.appendChild(divider);
    wrap.appendChild(container);
    form.insertAdjacentElement('afterend', wrap);

    if (window.VkAuth) {
      window.VkAuth.render(container);
    }
    return true;
  }

  if (mount()) return;

  var attempts = 0;
  var interval = setInterval(function () {
    if (mount() || ++attempts > 50) clearInterval(interval);
  }, 100);
})();
