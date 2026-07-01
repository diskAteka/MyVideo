// Валидаторы для форм. Возвращают строку с ошибкой или null (если ок).

export function validateUsername(value) {
  if (!value) return 'Имя пользователя обязательно';
  if (value.length < 3) return 'Имя пользователя должно быть не менее 3 символов';
  if (value.length > 50) return 'Имя пользователя должно быть не более 50 символов';
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return 'Можно использовать только буквы, цифры и нижнее подчеркивание';
  }
  return null;
}

export function validateEmail(value) {
  if (!value) return 'Email обязателен';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Введите корректный email адрес';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Пароль обязателен';
  if (password.length < 6) return 'Пароль должен быть не менее 6 символов';
  if (password.length > 16) return 'Пароль должен быть не более 16 символов';
  return null;
}

export function validatePasswordMatch(password, confirm) {
  if (password !== confirm) return 'Пароли не совпадают';
  return null;
}