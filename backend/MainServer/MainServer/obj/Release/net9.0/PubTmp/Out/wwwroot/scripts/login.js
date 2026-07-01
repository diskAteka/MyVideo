// login.js - ПОЛНОСТЬЮ ЗАМЕНИТЬ ФАЙЛ

// Элементы формы
const loginForm = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const messageDiv = document.getElementById('message');

// Элементы для показа/скрытия пароля
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// Показать/скрыть пароль
togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
});

// Показать сообщение
function showMessage(text, type = 'success') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    // Автоматически скрываем успешные сообщения через 5 секунд
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Скрыть сообщение
function hideMessage() {
    messageDiv.style.display = 'none';
}

// Показать ошибку поля
function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        const inputElement = document.getElementById(fieldId);
        if (inputElement) {
            inputElement.style.borderColor = '#e74c3c';
            inputElement.style.animation = 'shake 0.3s ease-in-out';
            setTimeout(() => {
                inputElement.style.animation = '';
            }, 300);
        }
    }
}

// Скрыть ошибку поля
function hideError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.style.display = 'none';
        const inputElement = document.getElementById(fieldId);
        if (inputElement) {
            inputElement.style.borderColor = '#e1e5ee';
        }
    }
}

// Валидация формы
function validateForm(formData) {
    let isValid = true;

    // Валидация логина/email
    const login = formData.get('login');
    if (!login.trim()) {
        showError('login', 'Введите логин или email');
        isValid = false;
    } else if (login.length < 3) {
        showError('login', 'Логин должен быть не менее 3 символов');
        isValid = false;
    } else {
        hideError('login');
    }

    // Валидация пароля
    const password = formData.get('password');
    if (!password.trim()) {
        showError('password', 'Введите пароль');
        isValid = false;
    } else if (password.length < 6) {
        showError('password', 'Пароль должен быть не менее 6 символов');
        isValid = false;
    } else {
        hideError('password');
    }

    return isValid;
}

async function sendLoginData(formData) {
    const loginValue = formData.get('login');

    // Определяем, является ли ввод email или username
    const isEmail = loginValue.includes('@');

    const data = {
        [isEmail ? 'email' : 'username']: loginValue,
        password: formData.get('password')
    };

    try {
        const response = await fetch(API_CONFIG.getUrl('LOGIN'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Проверяем статус ответа
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();

        // Обработка успешного ответа
        if (response.status === 200 || response.status === 201) {
            if (result.token) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                sessionStorage.setItem('isLoggedIn', 'true');
            }

            showMessage('Вход выполнен успешно! Перенаправление...', 'success');

            // Перенаправление на главную страницу через 2 секунды
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

            return { success: true, data: result };
        }

    } catch (error) {
        console.error('Ошибка при отправке данных:', error);

        // Обработка различных ошибок
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showMessage('Ошибка соединения. Проверьте интернет-соединение.', 'error');
        } else if (error.message.includes('401') || error.message.includes('Неверный логин')) {
            showMessage('Неверный логин или пароль.', 'error');
        } else if (error.message.includes('404')) {
            showMessage('Пользователь не найден.', 'error');
        } else if (error.message.includes('403')) {
            showMessage('Аккаунт заблокирован или не активирован.', 'error');
        } else {
            showMessage(`Ошибка: ${error.message}`, 'error');
        }

        return { success: false, error: error.message };
    }
}

// Обработчик отправки формы
loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    hideMessage();

    // Собираем данные формы
    const formData = new FormData(this);

    // Валидация
    if (!validateForm(formData)) {
        return;
    }

    // Блокируем кнопку отправки
    submitBtn.disabled = true;
    btnText.innerHTML = '<span class="loading"></span>Вход...';

    // Отправляем данные
    const result = await sendLoginData(formData);

    // Разблокируем кнопку
    submitBtn.disabled = false;
    btnText.textContent = 'Войти';
});

// Дополнительная валидация при вводе
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function () {
        const fieldId = this.id;
        hideError(fieldId);
    });
});

// Автозаполнение тестовыми данными при двойном клике на форму
loginForm.addEventListener('dblclick', function () {
    if (!document.getElementById('login').value && !document.getElementById('password').value) {
        document.getElementById('login').value = 'testuser@example.com';
        document.getElementById('password').value = 'test123';
        showMessage('Тестовые данные заполнены', 'success');
    }
});

// Проверяем, не был ли пользователь перенаправлен после регистрации
window.addEventListener('load', function () {
    // Проверяем параметры URL (например, после регистрации)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        showMessage('Регистрация успешна! Теперь вы можете войти.', 'success');
        // Убираем параметр из URL без перезагрузки
        history.replaceState({}, document.title, window.location.pathname);
    }

    // Если пользователь уже авторизован, перенаправляем на главную
    const token = localStorage.getItem('authToken');
    if (token) {
        // Проверяем токен на сервере
        fetch(API_CONFIG.getUrl('AUTH_CHECK'), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (response.ok) {
                    // Токен валиден, перенаправляем
                    window.location.href = 'index.html';
                } else {
                    // Токен невалиден, удаляем
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('isLoggedIn');
                }
            })
            .catch(() => {
                // Ошибка сети, удаляем токен
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                sessionStorage.removeItem('isLoggedIn');
            });
    }
});