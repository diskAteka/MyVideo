import { getCurrentUser } from '../api/auth.js';
import { getVideo, reactToVideo } from '../api/videos.js';
import { apiClient } from '../api/client.js';
import { getToken, saveUser, clearAuth } from '../lib/auth-storage.js';
import { showAlert, hideAlert } from '../ui/alert.js';
import { showToast } from '../ui/toast.js';
import { getComments, addComment } from '../api/comments.js';
import { escapeHtml } from '../lib/html.js';
import { formatRelativeDate } from '../lib/formatters.js'
import { renderAuthArea } from '../ui/header.js';

// ---------- DOM ----------
const videoElement = document.getElementById('videoPlayer');
const titleEl = document.getElementById('videoTitle');
const viewsEl = document.getElementById('viewsCount');
const likesEl = document.getElementById('likesCount');
const dislikesEl = document.getElementById('dislikesCount');
const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const authArea = document.querySelector('.header__auth');

const commentInput = document.getElementById('commentInput');
const commentSubmitBtn = document.getElementById('commentSubmitBtn');
const commentsList = document.getElementById('commentsList');
const commentsCountEl = document.getElementById('commentsCount');
const commentsLoading = document.getElementById('commentsLoading');
const alertEl = document.getElementById('message');

// ---------- State ----------
let videoPlayer = null;
let videoId = null;
let currentUser = null;
let videoData = null;
let isLiked = false;
let isDisliked = false;
let likesCount = 0;
let dislikesCount = 0;

// ---------- Init ----------
renderAuthArea(authArea, currentUser)

commentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  submitComment();
});

document.addEventListener('DOMContentLoaded', async () => {
  videoId = new URLSearchParams(window.location.search).get('id');
  if (!videoId) {
    showAlert(alertEl, 'Ошибка: ID видео не указан', 'error', { autoHide: false });
    return;
  }

  await initAuth();
  setupEventListeners();
  await loadVideo();
});

// ---------- Auth (опциональная) ----------
async function initAuth() {
  if (!getToken()) {
    currentUser = null;
    return;
  }
  try {
    const data = await getCurrentUser();
    if (data?.success === true) {
      currentUser = {
        name: data.name,
        email: data.email,
        canUpload: data.canUpload,
        isActive: data.isActive,
      };
      saveUser(currentUser);
    } else {
      clearAuth();
      currentUser = null;
    }
  } catch {
    // 401 уже обработан в client.js (но мы не редиректим — это публичная страница)
    currentUser = null;
  }
}

// ---------- Load video ----------
async function loadVideo() {
  try {
    videoData = await getVideo(videoId);

    isLiked = Boolean(currentUser && videoData.isLiked);
    isDisliked = Boolean(currentUser && videoData.isDisLiked);
    likesCount = videoData.likes || 0;
    dislikesCount = videoData.dislikes || 0;

    renderVideoInfo();
    renderReactionButtons();
    renderComments(videoData.comments || []);
    initVideoPlayer();
  } catch (err) {
    console.error('Ошибка загрузки видео:', err);
    showAlert(alertEl, 'Ошибка при загрузке видео', 'error', { autoHide: false });
  }
}

function renderVideoInfo() {
  titleEl.textContent = videoData.name || 'Без названия';
  viewsEl.textContent = videoData.views || 0;
  likesEl.textContent = likesCount;
  dislikesEl.textContent = dislikesCount;
}

// ---------- Video player ----------
function initVideoPlayer() {
  const videoUrl = videoData.videoUrl;
  if (!videoUrl) {
    showAlert(alertEl, 'Источник видео недоступен', 'error', { autoHide: false });
    return;
  }

  // eslint-disable-next-line no-undef
  if (typeof videojs === 'undefined') {
    initFallbackPlayer(videoUrl);
    return;
  }

  try {
    // eslint-disable-next-line no-undef
    videoPlayer = videojs(videoElement, {
      controls: true,
      autoplay: true,
      responsive: true,
      fluid: true,
      playbackRates: [0.5, 1, 1.5, 2],
      sources: [{ src: videoUrl, type: 'video/mp4' }],
    });

    videoPlayer.on('error', () => {
      const err = videoPlayer.error();
      if (err && err.code === 4) initFallbackPlayer(videoUrl);
    });

    videoPlayer.ready(() => {
      const p = videoPlayer.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    });
  } catch (err) {
    console.error('Ошибка инициализации Video.js:', err);
    initFallbackPlayer(videoUrl);
  }
}

function initFallbackPlayer(videoUrl) {
  const container = document.querySelector('.video-player');


  if (videoPlayer) {
    try { videoPlayer.dispose(); } catch {}
    videoPlayer = null;
  }

  container.innerHTML = `
    <video controls autoplay class="video-player__fallback">
      <source src="${escapeHtml(videoUrl)}" type="video/mp4">
      Ваш браузер не поддерживает воспроизведение видео.
    </video>`;
}

// ---------- Reactions ----------
function renderReactionButtons() {
  likeBtn.classList.toggle('is-active', isLiked);
  dislikeBtn.classList.toggle('is-active', isDisliked);
  likesEl.textContent = likesCount;
  dislikesEl.textContent = dislikesCount;
}

async function handleReaction(isLikeAction) {
  // Сохраняем предыдущее состояние для отката
  const prev = { isLiked, isDisliked, likesCount, dislikesCount };

  // Локально пересчитываем счётчики
  if (isLikeAction) {
    if (isLiked) {
      // повторный клик по активному лайку → снимаем
      isLiked = false;
      likesCount = Math.max(0, likesCount - 1);
    } else {
      isLiked = true;
      likesCount += 1;
      if (isDisliked) {
        isDisliked = false;
        dislikesCount = Math.max(0, dislikesCount - 1);
      }
    }
  } else {
    if (isDisliked) {
      isDisliked = false;
      dislikesCount = Math.max(0, dislikesCount - 1);
    } else {
      isDisliked = true;
      dislikesCount += 1;
      if (isLiked) {
        isLiked = false;
        likesCount = Math.max(0, likesCount - 1);
      }
    }
  }

  renderReactionButtons();

  // Анонимные действия не уходят на сервер — только UI
  if (!currentUser) return;

  try {
    await reactToVideo(videoId, isLikeAction);
  } catch (err) {
    console.error('Ошибка реакции:', err);
    // Откат
    ({ isLiked, isDisliked, likesCount, dislikesCount } = prev);
    renderReactionButtons();
    showToast('Не удалось сохранить реакцию', 'error', 3500);
  }
}

// ---------- Comments ----------
function renderComments(comments) {
  commentsList.innerHTML = '';
  commentsCountEl.textContent = `Комментарии (${comments.length})`;

  if (comments.length === 0) {
    commentsList.innerHTML = `
      <div class="state state--empty is-visible">
        <p>Комментариев пока нет. Будьте первым!</p>
      </div>`;
    return;
  }

  const sorted = [...comments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const fragment = document.createDocumentFragment();
  sorted.forEach((c) => fragment.appendChild(buildCommentElement(c)));
  commentsList.appendChild(fragment);
}

function buildCommentElement(comment) {
  const name = comment.authorName || 'Анонимный пользователь';
  const firstLetter = name.charAt(0).toUpperCase() || 'U';
  const dateStr = formatRelativeDate(new Date(comment.createdAt));

  const el = document.createElement('div');
  el.className = 'comment';
  el.innerHTML = `
    <div class="comment__avatar">${escapeHtml(firstLetter)}</div>
    <div class="comment__body">
      <div class="comment__author">${escapeHtml(name)}</div>
      <div class="comment__text">${escapeHtml(comment.text || '')}</div>
      <div class="comment__meta">${dateStr}</div>
    </div>`;
  return el;
}

async function loadComments() {
  commentsLoading.classList.add('is-visible');  
  try {
    const comments = await getComments(videoId);
    renderComments(comments || []);
  } catch (err) {
    console.error('Ошибка загрузки комментариев:', err);
    showToast('Не удалось обновить комментарии', 'error', 3500);
  } finally {
    commentsLoading.classList.remove('is-visible');
  }
}

async function submitComment() {
  const text = commentInput.value.trim();
  if (!text) {
    showToast('Введите текст комментария', 'error', 2500);
    return;
  }
  if (!currentUser) {
    showToast('Для комментирования нужно войти в аккаунт', 'error', 3000);
    return;
  }

  commentSubmitBtn.disabled = true;
  const originalText = commentSubmitBtn.textContent;
  commentSubmitBtn.textContent = 'Отправка...';

  try {
    await addComment(videoId, text);
    commentInput.value = '';
    showToast('Комментарий добавлен', 'success', 2500);
    await loadComments();
  } catch (err) {
    console.error('Ошибка отправки комментария:', err);
    showToast('Ошибка при отправке комментария', 'error', 3500);
  } finally {
    commentSubmitBtn.textContent = originalText;
    commentSubmitBtn.disabled = !commentInput.value.trim();
  }
}

// ---------- Event listeners ----------
function setupEventListeners() {
  likeBtn.addEventListener('click', () => handleReaction(true));
  dislikeBtn.addEventListener('click', () => handleReaction(false));

  commentSubmitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitComment();
  });

  commentInput.addEventListener('input', () => {
    commentSubmitBtn.disabled = !commentInput.value.trim();
  });

  commentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitComment();
    }
  });

  commentSubmitBtn.disabled = true;
}

