import { register } from '../api/auth.js';
import { saveToken, saveUser } from '../lib/auth-storage.js';
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from '../lib/validators.js';
import { showAlert, hideAlert } from '../ui/alert.js';
import { setupPasswordToggle } from '../ui/password-toggle.js';
import { redirectIfAuthenticated } from '../lib/auth-guard.js';
redirectIfAuthenticated();

// ---------- DOM ----------
const form = document.getElementById('registerForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const messageEl = document.getElementById('message');

const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

// ---------- Init ----------
setupPasswordToggle(document.getElementById('togglePassword'), passwordInput);
setupPasswordToggle(document.getElementById('toggleConfirmPassword'), confirmPasswordInput);

form.addEventListener('submit', onSubmit);

// Скрытие ошибки при вводе
form.querySelectorAll('input').forEach((input) => {
  input.addEventListener('input', () => hideFieldError(input.id));
});

// ---------- Handlers ----------
async function onSubmit(event) {
  event.preventDefault();
  hideAlert(messageEl);

  const formData = new FormData(form);
  const payload = {
    username: formData.get('username')?.trim() ?? '',
    email: formData.get('email')?.trim() ?? '',
    password: formData.get('password') ?? '',
    confirmPassword: formData.get('confirmPassword') ?? '',
  };

  if (!validateAll(payload)) return;

  setSubmitting(true);
  try {
    const result = await register({
      userName: payload.username,
      email: payload.email,
      password: payload.password,
    });

    if (result?.token) saveToken(result.token);
    if (result?.user) saveUser(result.user);

    showAlert(messageEl, 'Регистрация успешна! Перенаправление...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 600);
  } catch (err) {
    handleRegisterError(err);
  } finally {
    setSubmitting(false);
  }
}


// ---------- Validation ----------
function validateAll({ username, email, password, confirmPassword }) {
  const errors = {
    username: validateUsername(username),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: validatePasswordMatch(password, confirmPassword),
  };

  let isValid = true;
  for (const [field, error] of Object.entries(errors)) {
    if (error) {
      showFieldError(field, error);
      isValid = false;
    } else {
      hideFieldError(field);
    }
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
  if (inputEl) inputEl.classList.add('is-error', 'is-shake');
  if (inputEl) setTimeout(() => inputEl.classList.remove('is-shake'), 300);
}

function hideFieldError(fieldId) {
  const errorEl = document.getElementById(fieldId + 'Error');
  if (errorEl) errorEl.classList.remove('is-visible');
  const inputEl = document.getElementById(fieldId);
  if (inputEl) inputEl.classList.remove('is-error');
}

// ---------- Errors ----------
function handleRegisterError(err) {
  let message;
  switch (err.status) {
    case 409:
      message = 'Пользователь с таким email или именем уже существует.';
      break;
    case 400:
      message = 'Неверные данные. Проверьте введённую информацию.';
      break;
    case 0:
      message = err.message; // "Ошибка соединения..."
      break;
    default:
      message = err.message || 'Произошла ошибка при регистрации.';
  }
  showAlert(messageEl, message, 'error', { autoHide: false });
}

// ---------- UI state ----------
function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  if (isSubmitting) {
    btnText.innerHTML = '<span class="spinner spinner--sm"></span> Отправка...';
  } else {
    btnText.textContent = 'Зарегистрироваться';
  }
}