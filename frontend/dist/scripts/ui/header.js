// Рендер кнопок авторизации в шапке (.header__auth)
import { clearAuth } from '../lib/auth-storage.js';

const USERNAME_MAX_CHARS = 6;

/**
 * @param {HTMLElement} container - .header__auth
 * @param {object|null} user - { name, canUpload, ... } или null
 */
export function renderAuthArea(container, user) {
  if (!container) return;
  container.innerHTML = '';

  if (user && user.name) {
    if (user.canUpload) {
      container.appendChild(buildUploadButton());
    }
    container.appendChild(buildUserBadge(user.name));
    container.appendChild(buildLogoutButton());
  } else {
    container.appendChild(buildLoginButton());
  }
}

function buildLoginButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'authBtn';
  btn.className = 'btn btn--primary btn--pill';
  btn.textContent = 'Войти в аккаунт';
  btn.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
  return btn;
}

function buildUploadButton() {
  const btn = document.createElement('a');
  btn.href = 'upload.html';
  btn.id = 'uploadBtn';
  btn.className = 'btn btn--accent btn--pill';

  const icon = document.createElement('span');
  icon.className = 'icon';
  // TODO: иконка облака загрузки

  const label = document.createElement('span');
  label.textContent = 'Загрузить';

  btn.append(icon, label);
  return btn;
}

function buildUserBadge(fullName) {
  const badge = document.createElement('span');
  badge.className = 'user-badge';
  badge.title = fullName; // полный ник в тултипе
  badge.textContent = truncateName(fullName, USERNAME_MAX_CHARS);
  return badge;
}

function buildLogoutButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'authBtn';
  btn.className = 'btn btn--danger btn--pill';
  btn.setAttribute('aria-label', 'Выйти из аккаунта');

  const icon = document.createElement('span');
  icon.className = 'icon';
  // TODO: иконка выхода

  const label = document.createElement('span');
  label.textContent = 'Выйти';

  btn.append(icon, label);
  btn.addEventListener('click', handleLogout);
  return btn;
}

function truncateName(name, maxChars) {
  if (name.length <= maxChars) return name;
  return name.slice(0, maxChars);
}

function handleLogout() {
  if (!confirm('Выйти из аккаунта?')) return;
  clearAuth();
  window.location.reload();
}