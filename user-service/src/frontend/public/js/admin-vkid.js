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

    // Карточка логина AdminJS имеет фиксированную height:440px — из-за доп. кнопки
    // контент вылезает за нижнюю кромку. Разрешаем карточке расти (родитель формы),
    // синяя панель — flex-сосед со stretch — подтянется по высоте.
    var card = form.parentElement;
    if (card) {
      card.style.height = 'auto';
      card.style.minHeight = '440px';
    }

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

    // Виджет VK лежит внутри формы AdminJS. Если OneTap рендерит обычную
    // <button> (без type), её клик сабмитит форму с пустыми email/паролем →
    // «Неверный email/пароль». Блокируем сабмит, исходящий из контейнера VK
    // (реальная кнопка «Войти» и наш программный submit на /admin/login —
    // отдельная форма на body — не затрагиваются).
    form.addEventListener(
      'submit',
      function (e) {
        if (e.submitter && container.contains(e.submitter)) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );

    // Дополнительно: любую <button> внутри виджета помечаем type="button",
    // чтобы она не была submit-кнопкой формы (VK может дорисовать её асинхронно).
    function neutralizeButtons() {
      container.querySelectorAll('button:not([type])').forEach(function (b) {
        b.type = 'button';
      });
    }
    neutralizeButtons();
    var mo = new MutationObserver(neutralizeButtons);
    mo.observe(container, { childList: true, subtree: true });

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
