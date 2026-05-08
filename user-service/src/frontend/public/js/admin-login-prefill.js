(function () {
  if (!location.pathname.startsWith('/admin/login')) return;

  var email    = sessionStorage.getItem('prefill_email');
  var password = sessionStorage.getItem('prefill_password');
  if (!email || !password) return;

  sessionStorage.removeItem('prefill_email');
  sessionStorage.removeItem('prefill_password');

  var nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

  function fill(input, value) {
    nativeSetter.call(input, value);
    input.dispatchEvent(new Event('input',  { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function tryFill() {
    var inputs = document.querySelectorAll('input[type="email"], input[name="email"]');
    var emailInput = inputs[0];
    if (!emailInput) return false;

    var passwordInput = document.querySelector('input[type="password"]');
    if (!passwordInput) return false;

    fill(emailInput,    email);
    fill(passwordInput, password);
    return true;
  }

  if (tryFill()) return;

  var attempts = 0;
  var interval = setInterval(function () {
    if (tryFill() || ++attempts > 50) clearInterval(interval);
  }, 100);
})();
