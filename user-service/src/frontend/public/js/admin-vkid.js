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

    var form = passwordInput.closest('form');
    if (!form) return false;

    // Вставляем ВНУТРЬ формы последним элементом (после кнопки «Войти»), иначе
    // блок становится соседним flex-элементом панели AdminJS и улетает в угол.
    var wrap = document.createElement('div');
    wrap.style.cssText =
      'margin-top:20px;width:100%;display:flex;flex-direction:column;align-items:center';

    var divider = document.createElement('div');
    divider.textContent = 'или';
    divider.style.cssText =
      'text-align:center;color:#94a3b8;font-size:12px;margin-bottom:12px';

    var container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.cssText = 'width:100%;display:flex;justify-content:center';

    wrap.appendChild(divider);
    wrap.appendChild(container);
    form.appendChild(wrap);

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
