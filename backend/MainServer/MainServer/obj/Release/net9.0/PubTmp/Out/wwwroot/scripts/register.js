// Элементы формы
const registerForm = document.getElementById('registerForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const messageDiv = document.getElementById('message');

// Элементы для показа/скрытия пароля
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

// Показать/скрыть пароль
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
});

toggleConfirmPassword.addEventListener('click', function() {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
});

// Показать сообщение
function showMessage(text, type = 'success') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
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
    }
    const inputElement = document.getElementById(fieldId);
    if (inputElement) {
        inputElement.style.borderColor = '#e74c3c';
    }
}

// Скрыть ошибку поля
function hideError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    const inputElement = document.getElementById(fieldId);
    if (inputElement) {
        inputElement.style.borderColor = '#e1e5ee';
    }
}

// Валидация формы
function validateForm(formData) {
    let isValid = true;
    
    // Валидация имени пользователя
    const username = formData.get('username');
    if (username && username.length < 3) {
        showError('username', 'Имя пользователя должно быть не менее 3 символов');
        isValid = false;
    } else if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
        showError('username', 'Можно использовать только буквы, цифры и нижнее подчеркивание');
        isValid = false;
    } else {
        hideError('username');
    }
    
    // Валидация email
    const email = formData.get('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        showError('email', 'Введите корректный email адрес');
        isValid = false;
    } else {
        hideError('email');
    }
    
    // Валидация пароля
    const password = formData.get('password');
    if (password && password.length < 6) {
        showError('password', 'Пароль должен быть не менее 6 символов');
        isValid = false;
    } else {
        hideError('password');
    }
    
    // Проверка совпадения паролей
    const confirmPassword = formData.get('confirmPassword');
    if (password !== confirmPassword) {
        showError('confirmPassword', 'Пароли не совпадают');
        isValid = false;
    } else {
        hideError('confirmPassword');
    }
    
    return isValid;
}

// Отправка данных на сервер
async function sendRegistrationData(formData) {
    // Преобразуем FormData в объект
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        // Используем конфиг из ТЗ (должен быть подключен config.js)
        const url = API_CONFIG.getUrl('REGISTER');
        
        const response = await fetch(url, {
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
        
        // Парсим JSON ответ
        const result = await response.json();
        
        // Обработка успешного ответа
        if (response.status === 201 || response.status === 200) {
            showMessage('Регистрация успешна!', 'success');
            registerForm.reset();
            
            // Перенаправление на страницу входа через 2 секунды
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
            return { success: true, data: result };
        }
        
    } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        
        // Обработка различных ошибок
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showMessage('Ошибка соединения. Проверьте интернет-соединение.', 'error');
        } else if (error.message.includes('409')) {
            showMessage('Пользователь с таким email или именем уже существует.', 'error');
        } else if (error.message.includes('400')) {
            showMessage('Неверные данные. Проверьте введенную информацию.', 'error');
        } else {
            showMessage(`Ошибка: ${error.message}`, 'error');
        }
        
        return { success: false, error: error.message };
    }
}

// Обработчик отправки формы
registerForm.addEventListener('submit', async function(event) {
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
    btnText.innerHTML = '<span class="loading"></span>Отправка...';
    
    // Отправляем данные
    const result = await sendRegistrationData(formData);
    
    // Разблокируем кнопку
    submitBtn.disabled = false;
    btnText.textContent = 'Зарегистрироваться';
});

// Дополнительная валидация при вводе
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
        const fieldId = this.id;
        hideError(fieldId);
    });
});
