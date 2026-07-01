// Переключение видимости пароля в полях <input type="password">

/**
 * @param {HTMLButtonElement} button
 * @param {HTMLInputElement} input
 */
export function setupPasswordToggle(button, input) {
  if (!button || !input) return;

  button.addEventListener('click', () => {
    const isHidden = input.getAttribute('type') === 'password';
    input.setAttribute('type', isHidden ? 'text' : 'password');
    // Иконка управляется CSS-классом, чтобы JS не вставлял разметку иконок
    button.classList.toggle('is-visible', isHidden);
  });
}