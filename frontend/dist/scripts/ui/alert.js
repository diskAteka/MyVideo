// Управление статичным <div class="alert"> на странице.

/**
 * Показать alert в указанном контейнере.
 * @param {HTMLElement} element - элемент с классом .alert
 * @param {string} message - текст
 * @param {'ok'|'success'|'error'} type
 * @param {object} [opts] - { autoHide: ms | false }
 */
export function showAlert(element, message, type = 'success', opts = {}) {
  if (!element) return;
  element.textContent = message;
  element.className = `alert alert--${type} is-visible`;

  const { autoHide = type === 'error' ? false : 5000 } = opts;
  if (autoHide) {
    clearTimeout(element._hideTimer);
    element._hideTimer = setTimeout(() => hideAlert(element), autoHide);
  }
}

export function hideAlert(element) {
  if (!element) return;
  element.className = 'alert';
  element.textContent = '';
  clearTimeout(element._hideTimer);
}