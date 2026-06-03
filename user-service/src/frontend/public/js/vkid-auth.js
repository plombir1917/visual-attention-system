/**
 * Общая логика входа через VK ID (используется и лендингом, и страницей логина
 * AdminJS). Подключается как обычный (не module) скрипт и кладёт API в window.VkAuth.
 *
 * Механизм: OneTap → код → VKID.Auth.exchangeCode (PKCE) → access_token, затем
 * скрытая форма POST /admin/login с полем vkAccessToken. Бэкенд (authenticate в
 * admin.service.ts) проверяет токен через VkidService и ставит сессию AdminJS.
 */
(function () {
  var SDK_SRC = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
  var APP_ID = 54620210;
  var REDIRECT_URL = 'https://vas-focus.ru/admin';
  var loadingPromise = null;

  function loadSdk() {
    if (window.VKIDSDK) return Promise.resolve(window.VKIDSDK);
    if (loadingPromise) return loadingPromise;
    loadingPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = SDK_SRC;
      s.async = true;
      s.onload = function () {
        if (window.VKIDSDK) resolve(window.VKIDSDK);
        else reject(new Error('VK ID SDK loaded but VKIDSDK is missing'));
      };
      s.onerror = function () {
        reject(new Error('Failed to load VK ID SDK'));
      };
      document.head.appendChild(s);
    });
    return loadingPromise;
  }

  function submitLogin(accessToken) {
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = '/admin/login';
    form.style.display = 'none';

    function add(name, value) {
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value || '';
      form.appendChild(input);
    }
    // vkAccessToken — VK-ветка; пустые email/password нужны, чтобы AdminJS
    // принял форму штатного логина (наш authenticate их игнорирует при VK-входе).
    add('vkAccessToken', accessToken);
    add('email', '');
    add('password', '');

    document.body.appendChild(form);
    form.submit();
  }

  /**
   * Рендерит виджет OneTap внутрь container.
   * options:
   *   skin   — 'primary' (синяя) | 'secondary' (светлая). По умолчанию 'secondary'.
   *   scheme — 'light' | 'dark' (форсирует тему виджета). По умолчанию авто.
   *   onError — колбэк для отображения ошибки в UI.
   */
  function render(container, options) {
    options = options || {};
    var skin = options.skin || 'secondary';
    var onError =
      options.onError || function (e) { console.error('VK ID error', e); };

    return loadSdk()
      .then(function (VKID) {
        var config = {
          app: APP_ID,
          redirectUrl: REDIRECT_URL,
          responseMode: VKID.ConfigResponseMode.Callback,
          source: VKID.ConfigSource.LOWCODE,
          scope: 'email',
        };
        if (options.scheme) config.scheme = options.scheme;
        VKID.Config.init(config);

        var oneTap = new VKID.OneTap();
        oneTap
          .render({
            container: container,
            fastAuthEnabled: false,
            showAlternativeLogin: true,
            skin: skin,
          })
          .on(VKID.WidgetEvents.ERROR, onError)
          .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, function (payload) {
            VKID.Auth.exchangeCode(payload.code, payload.device_id)
              .then(function (data) {
                submitLogin(data.access_token);
              })
              .catch(onError);
          });
      })
      .catch(onError);
  }

  window.VkAuth = { render: render, loadSdk: loadSdk };
})();
