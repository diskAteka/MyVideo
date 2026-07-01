import { login, getCurrentUser } from '../api/auth.js';
import { saveToken, saveUser, getToken, clearAuth } from '../lib/auth-storage.js';
import { validateEmail } from '../lib/validators.js';
import { showAlert, hideAlert } from '../ui/alert.js';
import { setupPasswordToggle } from '../ui/password-toggle.js';
import { redirectIfAuthenticated } from '../lib/auth-guard.js';
redirectIfAuthenticated();


// ---------- DOM ----------
const form = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const messageEl = document.getElementById('message');
const passwordInput = document.getElementById('password');

// ---------- Init ----------
setupPasswordToggle(document.getElementById('togglePassword'), passwordInput);

form.addEventListener('submit', onSubmit);

form.querySelectorAll('input').forEach((input) => {
  input.addEventListener('input', () => hideFieldError(input.id));
});


// ---------- Handlers ----------
async function onSubmit(event) {
  event.preventDefault();
  hideAlert(messageEl);

  const formData = new FormData(form);
  const loginValue = (formData.get('login') ?? '').trim();
  const password = formData.get('password') ?? '';

  if (!validateForm(loginValue, password)) return;

  setSubmitting(true);
  try {
    const payload = buildLoginPayload(loginValue, password);
    const result = await login(payload);

    if (result?.token) saveToken(result.token);
    if (result?.user) saveUser(result.user);

    showAlert(messageEl, 'Вход выполнен успешно! Перенаправление...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 600);
  } catch (err) {
    handleLoginError(err);
  } finally {
    setSubmitting(false);
  }
}

// ---------- Payload ----------
function buildLoginPayload(loginValue, password) {
  const isEmail = loginValue.includes('@');
  return isEmail
    ? { email: loginValue, password }
    : { username: loginValue, password };
}

// ---------- Validation ----------
function validateForm(loginValue, password) {
  let isValid = true;

  if (!loginValue) {
    showFieldError('login', 'Введите логин или email');
    isValid = false;
  } else if (loginValue.includes('@')) {
    const err = validateEmail(loginValue);
    if (err) {
      showFieldError('login', err);
      isValid = false;
    } else {
      hideFieldError('login');
    }
  } else if (loginValue.length < 3) {
    showFieldError('login', 'Логин должен быть не менее 3 символов');
    isValid = false;
  } else {
    hideFieldError('login');
  }

  if (!password) {
    showFieldError('password', 'Введите пароль');
    isValid = false;
  } else if (password.length < 6) {
    showFieldError('password', 'Пароль должен быть не менее 6 символов');
    isValid = false;
  } else {
    hideFieldError('password');
  }

  return isValid;
}

function showFieldError(fieldId, message) {
  const errorEl = document.getElementById(fieldId + 'Error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('is-visible');
  }
  const inputEl = document.getElementById(fieldId);
  if (inputEl) {
    inputEl.classList.add('is-error', 'is-shake');
    setTimeout(() => inputEl.classList.remove('is-shake'), 300);
  }
}

function hideFieldError(fieldId) {
  const errorEl = document.getElementById(fieldId + 'Error');
  if (errorEl) errorEl.classList.remove('is-visible');
  const inputEl = document.getElementById(fieldId);
  if (inputEl) inputEl.classList.remove('is-error');
}


// ---------- Errors ----------
function handleLoginError(err) {
  let message;
  switch (err.status) {
    case 401:
      // ApiError из client.js на 401 уже редиректит на /login.html,
      // но мы и так на /login.html — редиректа не будет, попадём сюда.
      message = 'Неверный логин или пароль.';
      break;
    case 403:
      message = 'Аккаунт заблокирован или не активирован.';
      break;
    case 404:
      message = 'Пользователь не найден.';
      break;
    case 0:
      message = err.message; // "Ошибка соединения..."
      break;
    default:
      message = err.message || 'Произошла ошибка при входе.';
  }
  showAlert(messageEl, message, 'error', { autoHide: false });
}

// ---------- UI state ----------
function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  if (isSubmitting) {
    btnText.innerHTML = '<span class="spinner spinner--sm"></span> Вход...';
  } else {
    btnText.textContent = 'Войти';
  }
}