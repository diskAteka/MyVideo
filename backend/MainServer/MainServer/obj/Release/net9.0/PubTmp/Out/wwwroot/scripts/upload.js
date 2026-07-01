// Элементы DOM
const uploadForm = document.getElementById('uploadForm');
const videoFileInput = document.getElementById('videoFile');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileSelected = document.getElementById('fileSelected');
const selectedFileName = document.getElementById('selectedFileName');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const messageDiv = document.getElementById('message');
const videosList = document.getElementById('videosList');
const listLoading = document.getElementById('listLoading');
const videosCount = document.getElementById('videosCount');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const tooltipContent = document.getElementById('tooltipContent');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const progressSpeed = document.getElementById('progressSpeed');

// Текущее состояние
let currentUser = null;
let selectedFile = null;
let userVideos = [];
let uploadStartTime = 0;
let uploadedBytes = 0;

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    await loadUserVideos();
    updateUploadStatus();
    setupEventListeners();
});

// Проверка авторизации и получение данных пользователя
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = JSON.parse(userData);

        // Дополнительно проверяем токен на сервере
        const response = await fetch(API_CONFIG.getUrl('AUTH_CHECK'), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Сессия истекла');
        }

        const result = await response.json();

        // Обновляем данные пользователя (может измениться статус CanUpload)
        if (result.success === true) {
            currentUser = {
                name: result.name,
                email: result.email,
                canUpload: result.canUpload,
                isActive: result.isActive
            };
            localStorage.setItem('user', JSON.stringify(currentUser));
        }

    } catch (error) {
        console.error('Ошибка авторизации:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Настройка обработчиков
function setupEventListeners() {
    // Drag & drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    });

    // Выбор файла через инпут
    videoFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileSelect(file);
    });

    // Кнопка отмены выбора
    document.querySelector('.remove-file').addEventListener('click', () => {
        selectedFile = null;
        videoFileInput.value = '';
        fileSelected.style.display = 'none';
        document.querySelector('.file-upload-content').style.display = 'block';
        validateForm();
    });

    // Валидация полей формы
    document.getElementById('videoTitle').addEventListener('input', validateForm);

    // Отправка формы
    uploadForm.addEventListener('submit', handleUpload);
}

// Обработка выбора файла
function handleFileSelect(file) {
    // Проверка расширения
    if (!file.name.toLowerCase().endsWith('.mp4')) {
        showMessage('Можно загружать только MP4 файлы', 'error');
        videoFileInput.value = '';
        return;
    }

    // Проверка размера (2GB максимум)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
        showMessage('Файл слишком большой. Максимальный размер: 2GB', 'error');
        videoFileInput.value = '';
        return;
    }

    selectedFile = file;
    selectedFileName.textContent = file.name;
    fileSelected.style.display = 'flex';
    document.querySelector('.file-upload-content').style.display = 'none';

    validateForm();
}

// Валидация формы
function validateForm() {
    const title = document.getElementById('videoTitle').value.trim();

    if (selectedFile && title && currentUser?.canUpload) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

// Обновление статуса загрузки
function updateUploadStatus() {
    if (!currentUser) return;

    if (currentUser.canUpload) {
        statusDot.className = 'status-dot allowed';
        statusText.className = 'status-text allowed';
        statusText.textContent = 'Вы можете загружать видео';
        tooltipContent.className = 'tooltip-content allowed';
        tooltipContent.innerHTML = '✅ <strong>Вы можете загружать видео</strong><br><br>' +
            'Но прежде чем видео появится на платформе, оно должно быть верифицировано модераторами. ' +
            'Обычно это занимает до 24 часов.';
    } else {
        statusDot.className = 'status-dot not-allowed';
        statusText.className = 'status-text not-allowed';
        statusText.textContent = 'Вы не можете загружать видео';
        tooltipContent.className = 'tooltip-content not-allowed';
        tooltipContent.innerHTML = '❌ <strong>Ограничение на загрузку</strong><br><br>' +
            'По какой-то причине для вас ограничена возможность загрузки контента. ' +
            'Пожалуйста, свяжитесь с поддержкой для выяснения причин. Печалька :(';

        // Отключаем форму, если нельзя загружать
        document.querySelectorAll('input, textarea, button').forEach(el => {
            if (el.id !== 'fileUploadArea') {
                el.disabled = true;
            }
        });
        fileUploadArea.style.opacity = '0.5';
        fileUploadArea.style.pointerEvents = 'none';
    }
}

// Загрузка видео пользователя
async function loadUserVideos() {
    try {
        listLoading.style.display = 'block';

        const token = localStorage.getItem('authToken');
        const response = await fetch(API_CONFIG.getUrl('USER_VIDEOS'), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        userVideos = await response.json();
        renderUserVideos();

    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        showMessage('Не удалось загрузить список видео', 'error');
        userVideos = [];
        renderUserVideos();
    } finally {
        listLoading.style.display = 'none';
    }
}

// Отрисовка списка видео
function renderUserVideos() {
    videosCount.textContent = userVideos.length;

    if (userVideos.length === 0) {
        videosList.innerHTML = `
            <div class="empty-videos">
                <i class="fas fa-video-slash"></i>
                <p>У вас пока нет загруженных видео</p>
                <p class="empty-hint">Загрузите свое первое видео справа</p>
            </div>
        `;
        return;
    }

    videosList.innerHTML = userVideos.map(video => {
        // Определяем статус на основе isVerified (может быть true/false или undefined)
        const isVerified = video.isVerified === true;
        const statusClass = isVerified ? 'verified' : 'pending';
        const statusIcon = isVerified ? 'fa-check-circle' : 'fa-clock';
        const statusText = isVerified ? 'Опубликовано' : 'На проверке';

        return `
            <div class="video-item" onclick="window.location.href='video.html?id=${video.id}'">
                <div class="video-thumbnail">
                    <img src="${video.poster || '/content/posters/default.jpg'}" 
                         alt="${video.name}"
                         onerror="this.src='/content/posters/default.jpg'">
                </div>
                <div class="video-item-info">
                    <h4 class="video-item-title">${video.name || 'Без названия'}</h4>
                    <div class="video-item-meta">
                        <span>
                            <i class="fas fa-calendar"></i>
                            ${formatDate(video.dateUpload)}
                        </span>
                        <span>
                            <i class="fas fa-eye"></i>
                            ${video.views || 0}
                        </span>
                    </div>
                    <div class="video-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i>
                        ${statusText}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

async function handleUpload(e) {
    e.preventDefault();

    if (!currentUser?.canUpload) {
        showMessage('У вас нет прав для загрузки видео', 'error');
        return;
    }

    const title = document.getElementById('videoTitle').value.trim();
    const description = document.getElementById('videoDescription').value.trim();

    // Подготавливаем FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description || '');
    formData.append('video', selectedFile);

    // Показываем прогресс
    uploadProgress.style.display = 'block';
    submitBtn.disabled = true;
    btnText.textContent = 'Загрузка...';

    uploadStartTime = Date.now();
    uploadedBytes = 0;

    try {
        const token = localStorage.getItem('authToken');

        // СОЗДАЕМ ПРОМИС ПРАВИЛЬНО
        const result = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    updateProgress(e.loaded, e.total);
                }
            });

            xhr.addEventListener('load', () => {
                console.log('Response status:', xhr.status);
                console.log('Response text:', xhr.responseText);

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result);
                    } catch (e) {
                        reject(new Error('Неверный формат ответа сервера'));
                    }
                } else {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        reject(new Error(errorData.message || `Ошибка сервера: ${xhr.status}`));
                    } catch {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Сетевая ошибка. Проверьте подключение к серверу.'));
            });

            xhr.addEventListener('abort', () => reject(new Error('Загрузка отменена')));

            xhr.open('POST', API_CONFIG.getUrl('UPLOAD_VIDEO'));
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });

        // Завершаем прогресс
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';

        setTimeout(() => {
            uploadComplete(result);
        }, 500);

    } catch (error) {
        console.error('Ошибка загрузки:', error);

        // Скрываем прогресс
        uploadProgress.style.display = 'none';
        progressFill.style.width = '0%';

        // Возвращаем кнопку в исходное состояние
        submitBtn.disabled = false;
        btnText.textContent = 'Загрузить видео';

        showMessage(error.message || 'Ошибка при загрузке видео', 'error');
    }
}

function updateProgress(loaded, total) {
    const percent = (loaded / total) * 100;
    const now = Date.now();
    const elapsedSeconds = (now - uploadStartTime) / 1000;

    // Скорость в MB/s
    const loadedMB = loaded / (1024 * 1024);
    const speed = (loadedMB / elapsedSeconds).toFixed(1);

    // Оставшееся время
    const remainingMB = (total - loaded) / (1024 * 1024);
    const remainingSeconds = remainingMB / parseFloat(speed);
    const remainingText = remainingSeconds > 60
        ? `${Math.round(remainingSeconds / 60)} мин`
        : `${Math.round(remainingSeconds)} сек`;

    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;
    progressSpeed.innerHTML = `${speed} MB/s <span style="color: #999; font-size: 12px;">осталось ${remainingText}</span>`;
}

// Завершение загрузки
async function uploadComplete(result) {
    // Скрываем прогресс
    uploadProgress.style.display = 'none';
    progressFill.style.width = '0%';
    progressSpeed.innerHTML = '';

    // Показываем сообщение
    showMessage(`Видео "${result.name || result.title}" успешно загружено и отправлено на проверку!`, 'success');

    // Сбрасываем форму
    uploadForm.reset();
    selectedFile = null;
    videoFileInput.value = '';
    fileSelected.style.display = 'none';
    document.querySelector('.file-upload-content').style.display = 'block';
    submitBtn.disabled = true;
    btnText.textContent = 'Загрузить видео';

    // Обновляем список видео
    await loadUserVideos();

    // Подсвечиваем новое видео
    setTimeout(() => {
        const firstVideo = document.querySelector('.video-item');
        if (firstVideo) {
            firstVideo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            firstVideo.style.background = 'rgba(138, 43, 226, 0.2)';
            firstVideo.style.transition = 'background 0.5s';
            setTimeout(() => {
                firstVideo.style.background = '';
            }, 2000);
        }
    }, 100);
}

// Показать сообщение
function showMessage(text, type = 'success') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}