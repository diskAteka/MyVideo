// Элементы DOM
const videoPlayerElement = document.getElementById('videoPlayer');
const videoTitleElement = document.getElementById('videoTitle');
const viewsCountElement = document.getElementById('viewsCount');
const likesCountElement = document.getElementById('likesCount');
const dislikesCountElement = document.getElementById('dislikesCount');
const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const commentForm = document.getElementById('commentForm');
const commentInput = document.getElementById('commentInput');
const commentSubmitBtn = document.getElementById('commentSubmitBtn');
const commentsList = document.getElementById('commentsList');
const commentsCountElement = document.getElementById('commentsCount');
const commentsLoading = document.getElementById('commentsLoading');
const messageElement = document.getElementById('message');

// Глобальные переменные
let videoPlayer = null;
let currentVideoId = null;
let currentUser = null;
let currentVideoData = null;
let isLiked = false;
let isDisliked = false;
let localLikes = 0;
let localDislikes = 0;

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    // Получаем ID видео из URL
    const urlParams = new URLSearchParams(window.location.search);
    currentVideoId = urlParams.get('id');

    if (!currentVideoId) {
        showMessage('Ошибка: ID видео не указан', 'error');
        return;
    }

    // Проверяем авторизацию
    await checkAuthStatus();

    // Загружаем данные видео
    await loadVideoData();
});

// Проверка статуса авторизации
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            currentUser = JSON.parse(userData);
            console.log('Пользователь авторизован:', currentUser.name || currentUser.email);
        } else {
            currentUser = null;
        }
    } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        currentUser = null;
    }
}

// Загрузка данных о видео
async function loadVideoData() {
    try {
        showLoading(true);

        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
            API_CONFIG.getUrl('VIDEO', { id: currentVideoId }),
            {
                method: 'GET',
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        currentVideoData = await response.json();

        console.log('Video data loaded:', currentVideoData);

        isLiked = currentVideoData.isLiked || false;
        isDisliked = currentVideoData.isDisLiked || false;

        localLikes = currentVideoData.likes || 0;
        localDislikes = currentVideoData.dislikes || 0;

        // Обновляем UI
        updateVideoInfoUI();
        updateLikeButtonsUI();
        renderComments(currentVideoData.comments || []);

        const commentsCount = currentVideoData.comments ? currentVideoData.comments.length : 0;
        commentsCountElement.textContent = `Комментарии (${commentsCount})`;

        // Инициализируем плеер ПОСЛЕ загрузки данных
        initVideoPlayer();

    } catch (error) {
        console.error('Ошибка при загрузке данных видео:', error);
        showMessage('Ошибка при загрузке видео', 'error');
    } finally {
        showLoading(false);
    }
}

// Обновление информации о видео в UI
function updateVideoInfoUI() {
    if (!currentVideoData) return;

    videoTitleElement.textContent = currentVideoData.name || 'Без названия';
    viewsCountElement.textContent = currentVideoData.views || 0;
    likesCountElement.textContent = localLikes;
    dislikesCountElement.textContent = localDislikes;
}

// Обновление кнопок лайков
function updateLikeButtonsUI() {
    likeBtn.classList.remove('active', 'inactive');
    dislikeBtn.classList.remove('active', 'inactive');

    if (!currentUser) {
        likeBtn.disabled = true;
        dislikeBtn.disabled = true;
        likeBtn.title = 'Войдите, чтобы поставить лайк';
        dislikeBtn.title = 'Войдите, чтобы поставить дизлайк';
    } else {
        likeBtn.disabled = false;
        dislikeBtn.disabled = false;
        likeBtn.title = '';
        dislikeBtn.title = '';
    }

    if (isLiked) {
        likeBtn.classList.add('active');
    } else if (isDisliked) {
        dislikeBtn.classList.add('active');
    }
}

function initVideoPlayer() {
    try {
        // Если плеер уже существует, уничтожаем его
        if (videoPlayer) {
            console.log('Disposing existing player');
            videoPlayer.dispose();
            videoPlayer = null;
        }

        const streamUrl = currentVideoData.videoUrl;
        console.log('Setting video source:', streamUrl);

        // Получаем элемент и очищаем его от старых классов Video.js
        const element = document.getElementById('videoPlayer');
        if (!element) {
            console.error('Video element not found');
            createFallbackPlayer();
            return;
        }

        // Убираем классы, которые могли остаться от предыдущей инициализации
        element.className = 'video-js vjs-theme-forest vjs-big-play-centered';

        // Простая инициализация с минимальными опциями
        videoPlayer = videojs(element, {
            autoplay: true,
            controls: true,
            responsive: true,
            fluid: true,
            playbackRates: [0.5, 1, 1.5, 2],
            sources: [{
                src: streamUrl,
                type: 'video/mp4'
            }],
            controlBar: {
                volumePanel: {
                    inline: false
                }
            }
        });

        // Обработчики событий
        videoPlayer.one('loadedmetadata', () => {
            console.log('Video metadata loaded, duration:', videoPlayer.duration());
        });

        videoPlayer.on('play', () => {
            console.log('Video playing');
            sendViewEvent();
        });

        videoPlayer.on('error', (error) => {
            console.error('Video.js error:', error);
            const playerError = videoPlayer.error();
            if (playerError) {
                console.error('Error code:', playerError.code);
                console.error('Error message:', playerError.message);

                // Если ошибка, пробуем fallback
                if (playerError.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
                    createFallbackPlayer();
                }
            }
        });

        videoPlayer.ready(() => {
            console.log('Player is ready');
            // Пробуем воспроизвести
            const playPromise = videoPlayer.play();
            if (playPromise) {
                playPromise.catch(e => {
                    console.log('Autoplay prevented:', e);
                    // Показываем кнопку play пользователю
                });
            }
        });

    } catch (error) {
        console.error('Error initializing player:', error);
        createFallbackPlayer();
    }
}

// Запасной вариант плеера
function createFallbackPlayer() {
    console.log('Creating fallback player');
    const container = document.querySelector('.video-player-container');
    if (!container) return;

    const streamUrl = currentVideoData.videoUrl;

    container.innerHTML = `
        <video id="fallbackPlayer" 
               controls 
               autoplay 
               width="100%" 
               height="400"
               style="background: #000; width: 100%; height: auto;">
            <source src="${streamUrl}" type="video/mp4">
            <p>Ваш браузер не поддерживает видео.</p>
        </video>
    `;

    // Пробуем воспроизвести
    setTimeout(() => {
        const fallbackVideo = document.getElementById('fallbackPlayer');
        if (fallbackVideo) {
            fallbackVideo.play().catch(e => {
                console.log('Fallback autoplay prevented:', e);
                // Нужно нажатие пользователя - это нормально
            });
        }
    }, 100);
}

// Отправка события просмотра
async function sendViewEvent() {
    try {
        if (currentVideoData) {
            currentVideoData.views = (currentVideoData.views || 0) + 1;
            viewsCountElement.textContent = currentVideoData.views;
        }
    } catch (error) {
        console.error('Ошибка отправки события просмотра:', error);
    }
}

// Отрисовка комментариев
function renderComments(comments) {
    commentsList.innerHTML = '';

    if (!comments || comments.length === 0) {
        commentsList.innerHTML = `
            <div class="no-comments">
                Комментариев пока нет. Будьте первым!
            </div>
        `;
        return;
    }

    const sortedComments = [...comments].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    sortedComments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        commentsList.appendChild(commentElement);
    });
}

// Создание элемента комментария
function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';

    const firstLetter = comment.authorName ? comment.authorName[0].toUpperCase() : 'U';
    const formattedDate = formatCommentDate(new Date(comment.createdAt));

    commentDiv.innerHTML = `
        <div class="comment-avatar">${firstLetter}</div>
        <div class="comment-content">
            <div class="comment-author">${comment.authorName || 'Анонимный пользователь'}</div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-meta">
                <span>${formattedDate}</span>
            </div>
        </div>
    `;

    return commentDiv;
}

// Форматирование даты комментария
function formatCommentDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;

    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Лайк видео
    likeBtn.addEventListener('click', async () => {
        await handleReaction(true);
    });

    // Дизлайк видео
    dislikeBtn.addEventListener('click', async () => {
        await handleReaction(false);
    });

    // Отправка комментария
    commentSubmitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await submitComment();
    });

    // Ctrl+Enter для отправки
    commentInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            await submitComment();
        }
    });

    // Валидация поля комментария
    commentInput.addEventListener('input', function () {
        commentSubmitBtn.disabled = !this.value.trim();
    });

    // Начальное состояние кнопки комментария
    commentSubmitBtn.disabled = true;
}

// Обработка реакции (лайк/дизлайк)
async function handleReaction(isLikeAction) {
    if (!currentUser) {
        showMessage('Войдите, чтобы оценить видео', 'error');
        return;
    }

    // Сохраняем текущие состояния
    const oldIsLiked = isLiked;
    const oldIsDisliked = isDisliked;
    const oldLikes = localLikes;
    const oldDislikes = localDislikes;

    try {
        // Локальное обновление UI
        if (isLikeAction) {
            if (isDisliked) {
                isDisliked = false;
                isLiked = true;
                localDislikes--;
                localLikes++;
            } else if (!isLiked) {
                isLiked = true;
                localLikes++;
            } else {
                isLiked = false;
                localLikes--;
            }
        } else {
            if (isLiked) {
                isLiked = false;
                isDisliked = true;
                localLikes--;
                localDislikes++;
            } else if (!isDisliked) {
                isDisliked = true;
                localDislikes++;
            } else {
                isDisliked = false;
                localDislikes--;
            }
        }

        // Обновляем UI немедленно
        updateLikeButtonsUI();
        likesCountElement.textContent = localLikes;
        dislikesCountElement.textContent = localDislikes;

        // Отправляем на сервер
        await sendReactionToServer(isLikeAction);

    } catch (error) {
        console.error('Ошибка при обработке реакции:', error);

        // Возвращаем предыдущее состояние
        isLiked = oldIsLiked;
        isDisliked = oldIsDisliked;
        localLikes = oldLikes;
        localDislikes = oldDislikes;

        updateLikeButtonsUI();
        likesCountElement.textContent = localLikes;
        dislikesCountElement.textContent = localDislikes;

        showMessage('Ошибка при обработке действия', 'error');
    }
}

// Отправка реакции на сервер
async function sendReactionToServer(isLikeAction) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Токен авторизации не найден');
        }

        const response = await fetch(
            API_CONFIG.getUrl('VIDEO_REACTION', { id: currentVideoId }),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    isLike: isLikeAction
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        console.log('Реакция отправлена успешно');

    } catch (error) {
        console.error('Ошибка отправки реакции:', error);
        throw error;
    }
}

// Загрузка новых комментариев
async function loadNewComments() {
    try {
        commentsLoading.style.display = 'block';

        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
            API_CONFIG.getUrl('COMMENTS', { id: currentVideoId }),
            {
                method: 'GET',
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const comments = await response.json();
        commentsCountElement.textContent = `Комментарии (${comments.length})`;
        renderComments(comments);
        showMessage('Комментарии обновлены', 'success');

    } catch (error) {
        console.error('Ошибка при загрузке комментариев:', error);
        showMessage('Ошибка загрузки комментариев', 'error');
    } finally {
        commentsLoading.style.display = 'none';
    }
}

// Отправка комментария
async function submitComment() {
    const commentText = commentInput.value.trim();

    if (!commentText) {
        showMessage('Введите текст комментария', 'error');
        return;
    }

    if (!currentUser) {
        showMessage('Для комментирования нужно войти в аккаунт', 'error');
        return;
    }

    try {
        commentSubmitBtn.disabled = true;
        const originalText = commentSubmitBtn.textContent;
        commentSubmitBtn.textContent = 'Отправка...';

        const response = await fetch(
            API_CONFIG.getUrl('CREATE_COMMENT', { id: currentVideoId }),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    text: commentText
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        commentInput.value = '';
        commentSubmitBtn.disabled = true;
        showMessage('Комментарий добавлен!', 'success');

        // Автоматически обновляем комментарии через 1 секунду
        setTimeout(() => {
            loadNewComments();
        }, 1000);

    } catch (error) {
        console.error('Ошибка при отправке комментария:', error);
        showMessage('Ошибка при отправке комментария', 'error');
        commentSubmitBtn.disabled = false;
    } finally {
        commentSubmitBtn.textContent = 'Отправить';
    }
}

// Вспомогательные функции
function showMessage(text, type = 'success') {
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';

    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

function showLoading(show) {
    // Можно добавить индикатор загрузки
}

// Вызываем настройку обработчиков после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});