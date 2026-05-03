export function showToast() {
  const el = document.getElementById('toast');
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}
