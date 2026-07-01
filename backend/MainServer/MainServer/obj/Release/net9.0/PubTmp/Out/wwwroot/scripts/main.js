// Элементы DOM
const authBtn = document.getElementById('authBtn');
const videosGrid = document.getElementById('videosGrid');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const pageTitle = document.getElementById('pageTitle');
const noResults = document.getElementById('noResults');
const loadingIndicator = document.getElementById('loadingIndicator');

// Состояние приложения
let currentUser = null;
let currentSearchQuery = '';

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем авторизацию при загрузке
    await checkAuthStatus();

    // Загружаем видео
    await loadVideos();

    // Настраиваем обработчики событий
    setupEventListeners();
});

async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('authToken');
        console.log('Token found:', token ? 'yes' : 'no');

        if (!token) {
            currentUser = null;
            updateAuthButton(false);
            return;
        }

        const response = await fetch(API_CONFIG.getUrl('AUTH_CHECK'), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            console.log('User data:', userData);

            if (userData.success === true) {
                currentUser = {
                    name: userData.name,
                    email: userData.email,
                    canUpload: userData.canUpload,
                    isActive: userData.isActive
                };

                localStorage.setItem('user', JSON.stringify(currentUser));
                console.log('Updating button with name:', userData.name);
                updateAuthButton(true, currentUser.name);
                return;
            }
        }

        throw new Error('Невалидный токен');

    } catch (error) {
        console.warn('Ошибка проверки токена:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        currentUser = null;
        updateAuthButton(false);
    }
}

// ИЗМЕНЕННАЯ ФУНКЦИЯ: теперь добавляет кнопку загрузки для авторизованных
function updateAuthButton(isLoggedIn, username = null) {
    if (!authBtn) return;

    const authContainer = document.querySelector('.auth-container');

    if (isLoggedIn && username) {
        // Полностью пересобираем контейнер для правильного порядка кнопок
        authContainer.innerHTML = '';

        // 1. Создаем кнопку загрузки (новая)
        const uploadBtn = document.createElement('button');
        uploadBtn.id = 'uploadBtn';
        uploadBtn.className = 'upload-btn';
        uploadBtn.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Загрузить</span>
        `;
        uploadBtn.onclick = (e) => {
            e.stopPropagation();
            window.location.href = 'upload.html';
        };

        // 2. Создаем кнопку аккаунта (бывший authBtn)
        const userBtn = document.createElement('button');
        userBtn.id = 'authBtn';
        userBtn.className = 'auth-btn logged-in';
        userBtn.innerHTML = `
            <span class="username">${username}</span>
            <span class="logout-text">Выйти</span>
        `;

        // Обработчик для кнопки аккаунта (выход при клике на logout-text)
        userBtn.onclick = (e) => {
            const logoutElement = e.target.closest('.logout-text');
            if (logoutElement) {
                logoutUser();
            }
        };

        // Добавляем кнопки в контейнер (сначала загрузка, потом аккаунт)
        authContainer.appendChild(uploadBtn);
        authContainer.appendChild(userBtn);

    } else {
        // Возвращаем исходное состояние для неавторизованных
        authBtn.className = 'auth-btn';
        authBtn.innerHTML = 'Войти в аккаунт';
        authBtn.onclick = () => {
            window.location.href = 'login.html';
        };
    }
}

// Выход из аккаунта
function logoutUser() {
    // Очищаем все данные
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();

    // Обновляем состояние
    currentUser = null;
    updateAuthButton(false);

    // Показываем сообщение
    showMessage('Вы успешно вышли из системы', 'success');

    // Перезагружаем страницу
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// Загрузка видео (ОСТАВЛЕНО БЕЗ ИЗМЕНЕНИЙ - с запросами к серверу)
async function loadVideos(searchQuery = '') {
    try {
        showLoading(true);
        clearVideosGrid();

        let url;
        if (searchQuery) {
            url = API_CONFIG.getUrl('VIDEOS_SEARCH') + `?query=${encodeURIComponent(searchQuery)}`;
            pageTitle.textContent = `Результаты поиска: "${searchQuery}"`;
        } else {
            url = API_CONFIG.getUrl('VIDEOS');
            pageTitle.textContent = 'Популярные видео';
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const videos = await response.json();
        console.log('Получены видео:', videos);

        if (videos.length === 0) {
            showNoResults(true);
        } else {
            showNoResults(false);
            renderVideos(videos);
        }
    } catch (error) {
        console.error('Ошибка при загрузке видео:', error);
        videosGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ff4444;">
                <p>Ошибка при загрузке видео</p>
                <p style="font-size: 14px; margin-top: 10px;">Попробуйте обновить страницу</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// Отрисовка видео (ОСТАВЛЕНО БЕЗ ИЗМЕНЕНИЙ)
function renderVideos(videos) {
    videosGrid.innerHTML = '';
    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        videosGrid.appendChild(videoCard);
    });
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';

    const uploadDate = formatUploadDate(video.dateUpload);

    let posterUrl = video.poster || '';

    if (posterUrl.includes(' ')) {
        const parts = posterUrl.split('/');
        const fileName = parts.pop();
        const encodedFileName = encodeURIComponent(fileName);
        posterUrl = parts.join('/') + '/' + encodedFileName;
    }

    const base64Placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9IiMyMTIxMjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+UG9zdGVyPC90ZXh0Pjwvc3ZnPg==';

    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${posterUrl}" 
                 alt="${video.name || 'Без названия'}"
                 onerror="this.onerror=null; this.src='${base64Placeholder}'"
                 loading="lazy">
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.name || 'Без названия'}</h3>
            <div class="video-channel">
                <div class="channel-avatar">${(video.authorName || 'U')[0].toUpperCase()}</div>
                <span>${video.authorName || 'Неизвестный автор'}</span>
            </div>
            <div class="video-meta">
                <span class="upload-date">${uploadDate}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `video.html?id=${video.id}`;
    });

    return card;
}

function formatUploadDate(dateString) {
    if (!dateString) return 'Неизвестная дата';

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Неизвестная дата';
        }

        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Сегодня';
        } else if (diffDays === 1) {
            return 'Вчера';
        } else if (diffDays < 7) {
            return `${diffDays} дня назад`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? 'неделю' : weeks < 5 ? 'недели' : 'недель'} назад`;
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    } catch (error) {
        console.error('Ошибка форматирования даты:', error);
        return 'Неизвестная дата';
    }
}

function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

function showNoResults(show) {
    noResults.style.display = show ? 'block' : 'none';
}

function clearVideosGrid() {
    videosGrid.innerHTML = '';
}

// Функция для показа сообщений (ОСТАВЛЕНА БЕЗ ИЗМЕНЕНИЙ)
function showMessage(text, type = 'info') {
    let messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(messageContainer);
    }

    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.style.cssText = `
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;

    message.textContent = text;
    messageContainer.appendChild(message);

    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    }, 3000);
}

// Настройка обработчиков событий (ОСТАВЛЕНА БЕЗ ИЗМЕНЕНИЙ)
function setupEventListeners() {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        currentSearchQuery = query;
        loadVideos(query);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            currentSearchQuery = '';
            loadVideos('');
        }
    });

    document.querySelector('.logo').addEventListener('click', (e) => {
        if (currentSearchQuery) {
            e.preventDefault();
            searchInput.value = '';
            currentSearchQuery = '';
            loadVideos('');
            history.pushState(null, '', 'index.html');
        }
    });
}