import { getCurrentUser } from '../api/auth.js';
import { apiClient } from '../api/client.js';
import { API_CONFIG, UPLOAD_CONFIG } from '../config.js';
import { getToken, saveUser, clearAuth, isAuthenticated } from '../lib/auth-storage.js';
import { escapeHtml } from '../lib/html.js';
import { formatUploadDate } from '../lib/formatters.js';
import { renderAuthArea } from '../ui/header.js';
import { showAlert, hideAlert } from '../ui/alert.js';
import { showToast } from '../ui/toast.js';

// ---------- Constants ----------
const POSTER_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9IiMyMTIxMjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+UG9zdGVyPC90ZXh0Pjwvc3ZnPg==';

// ---------- DOM ----------
const authArea = document.querySelector('.header__auth');

const videosList = document.getElementById('videosList');
const videosCount = document.getElementById('videosCount');
const listLoading = document.getElementById('listLoading');

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const tooltipContent = document.getElementById('tooltipContent');

const uploadForm = document.getElementById('uploadForm');
const messageEl = document.getElementById('message');

const dropzone = document.getElementById('fileUploadArea');
const dropzoneContent = dropzone.querySelector('.dropzone__content');
const fileInput = document.getElementById('videoFile');
const fileSelected = document.getElementById('fileSelected');
const selectedFileName = document.getElementById('selectedFileName');
const removeFileBtn = dropzone.querySelector('.dropzone__remove');

const titleInput = document.getElementById('videoTitle');
const descriptionInput = document.getElementById('videoDescription');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');

const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const progressSpeed = document.getElementById('progressSpeed');

// ---------- State ----------
let currentUser = null;
let canUpload = false;
let selectedFile = null;
let isUploading = false;

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', async () => {
  // Если нет токена — сразу на логин (страница только для авторизованных)
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  await initAuth();
  if (!currentUser) return; // initAuth уже сделал редирект при ошибке

  setupEventListeners();
  applyUploadPermission();
  await loadUserVideos();
});

// ---------- Auth ----------
async function initAuth() {
  try {
    const data = await getCurrentUser();
    if (data?.success === true) {
      currentUser = {
        name: data.name,
        email: data.email,
        canUpload: data.canUpload,
        isActive: data.isActive,
      };
      canUpload = currentUser.canUpload === true;
      saveUser(currentUser);
      renderAuthArea(authArea, currentUser);
    } else {
      throw new Error('Invalid auth');
    }
  } catch (err) {
    clearAuth();
    window.location.href = 'login.html';
  }
}

// ---------- Upload permission ----------
function applyUploadPermission() {
  const variant = canUpload ? 'allowed' : 'blocked';
  statusDot.className = `status-dot ${canUpload ? 'allowed' : 'not-allowed'}`;
  statusText.className = `status-text ${canUpload ? 'allowed' : 'not-allowed'}`;
  statusText.textContent = canUpload ? 'Загрузка разрешена' : 'Загрузка запрещена';

  // Переключаем варианты тултипа через атрибут hidden
  tooltipContent.querySelectorAll('.tooltip-content__variant').forEach((el) => {
    el.hidden = el.dataset.variant !== variant;
  });

  if (!canUpload) {
    uploadForm.classList.add('is-disabled');
    submitBtn.disabled = true;
  } else {
    uploadForm.classList.remove('is-disabled');
    updateSubmitState();
  }
}

// ---------- Load user videos ----------
async function loadUserVideos() {
  listLoading.classList.add('is-visible');
  videosList.innerHTML = '';

  try {
    const videos = await apiClient.get('USER_VIDEOS');
    renderUserVideos(videos || []);
  } catch (err) {
    console.error('Ошибка загрузки списка видео:', err);
    videosList.innerHTML = `
      <div class="empty-videos">
        <span class="icon icon--lg"></span>
        <p>Не удалось загрузить список</p>
        <p class="empty-videos__hint">Попробуйте обновить страницу</p>
      </div>`;
    videosCount.textContent = '0';
  } finally {
    listLoading.classList.remove('is-visible');
  }
}

function renderUserVideos(videos) {
  videosCount.textContent = String(videos.length);

  if (videos.length === 0) {
    videosList.innerHTML = `
      <div class="empty-videos">
        <span class="icon icon--lg"></span>
        <p>У вас пока нет загруженных видео</p>
        <p class="empty-videos__hint">Загрузите своё первое видео справа</p>
      </div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  videos.forEach((v) => fragment.appendChild(buildVideoCard(v)));
  videosList.innerHTML = '';
  videosList.appendChild(fragment);
}

function buildVideoCard(video) {
  const isVerified = video.isVerified === true;
  const statusClass = isVerified ? 'is-verified' : 'is-pending';
  const statusLabel = isVerified ? 'Верифицировано' : 'На проверке';
  const posterUrl = video.poster || POSTER_PLACEHOLDER;
  const title = video.name || 'Без названия';

  const card = document.createElement('article');
  card.className = 'video-card video-card--compact';
  card.dataset.videoId = video.id;
  card.innerHTML = `
    <div class="video-card__thumbnail">
      <img class="video-card__poster"
           src="${escapeHtml(posterUrl)}"
           alt="${escapeHtml(title)}"
           loading="lazy">
      <span class="video-card__status ${statusClass}">${statusLabel}</span>
    </div>
    <div class="video-card__body">
      <h4 class="video-card__title">${escapeHtml(title)}</h4>
      <div class="video-card__meta">
        <span>${formatUploadDate(video.dateUpload)}</span>
      </div>
    </div>
  `;

  // Fallback для битого постера
  const img = card.querySelector('.video-card__poster');
  img.addEventListener('error', () => {
    img.onerror = null;
    img.src = POSTER_PLACEHOLDER;
  }, { once: true });

  card.addEventListener('click', () => {
    window.location.href = `video.html?id=${video.id}`;
  });

  return card;
}

// ---------- File handling ----------
function handleFileSelect(file) {
  if (!file) return;

  // Валидация типа
  const fileName = file.name.toLowerCase();
  const isMp4Ext = UPLOAD_CONFIG.ACCEPTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const isMp4Mime = UPLOAD_CONFIG.ACCEPTED_MIME.includes(file.type);

  if (!isMp4Ext || !isMp4Mime) {
    showAlert(messageEl, 'Поддерживается только формат MP4', 'error');
    resetFile();
    return;
  }

  // Валидация размера
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    showAlert(
      messageEl,
      `Файл превышает ${UPLOAD_CONFIG.MAX_FILE_SIZE_LABEL}. Размер вашего файла: ${formatFileSize(file.size)}`,
      'error'
    );
    resetFile();
    return;
  }

  hideAlert(messageEl);
  selectedFile = file;
  selectedFileName.textContent = `${file.name} (${formatFileSize(file.size)})`;

  // Переключаем UI: скрываем приглашение, показываем выбранный файл
  dropzoneContent.hidden = true;
  fileSelected.hidden = false;

  updateSubmitState();
}

function resetFile() {
  selectedFile = null;
  fileInput.value = '';

  // Возвращаем UI в исходное состояние
  fileSelected.hidden = true;
  dropzoneContent.hidden = false;

  selectedFileName.textContent = '';
  updateSubmitState();
}

function updateSubmitState() {
  if (!canUpload || isUploading) {
    submitBtn.disabled = true;
    return;
  }
  const hasTitle = titleInput.value.trim().length > 0;
  const hasFile = selectedFile !== null;
  submitBtn.disabled = !(hasTitle && hasFile);
}

// ---------- Upload via XHR (для прогресса) ----------
async function uploadVideo() {
  if (!selectedFile) return;
  if (!canUpload || isUploading) return;

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!title) {
    showAlert(messageEl, 'Введите название видео', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('videoFile', selectedFile);
  formData.append('name', title);
  formData.append('description', description);

  setUploadingState(true);
  hideAlert(messageEl);
  showProgress(0, 0);

  try {
    await xhrUpload(formData);
    showAlert(messageEl, 'Видео успешно загружено! Оно появится в списке после проверки модератором.', 'success');
    showToast('Видео загружено', 'success', 3000);
    resetForm();
    await loadUserVideos();
    highlightFirstVideo();
  } catch (err) {
    console.error('Ошибка загрузки видео:', err);
    handleUploadError(err);
  } finally {
    setUploadingState(false);
    hideProgress();
  }
}

function xhrUpload(formData) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.UPLOAD_VIDEO;

    let lastTime = Date.now();
    let lastLoaded = 0;

    xhr.upload.addEventListener('progress', (e) => {
      if (!e.lengthComputable) return;

      const now = Date.now();
      const dtSec = (now - lastTime) / 1000;

      // Обновляем скорость не чаще раза в 500 мс — иначе цифры скачут
      if (dtSec >= 0.5) {
        const dBytes = e.loaded - lastLoaded;
        const speedMBs = (dBytes / dtSec) / (1024 * 1024);
        const percent = (e.loaded / e.total) * 100;
        showProgress(percent, speedMBs);
        lastTime = now;
        lastLoaded = e.loaded;
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        showProgress(100, 0);
        resolve(safeParseJson(xhr.responseText));
      } else {
        reject({ status: xhr.status, response: xhr.responseText });
      }
    });

    xhr.addEventListener('error', () => {
      reject({ status: 0, message: 'Ошибка соединения с сервером' });
    });

    xhr.addEventListener('abort', () => {
      reject({ status: 0, message: 'Загрузка отменена' });
    });

    xhr.open('POST', url);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

function handleUploadError(err) {
  let message;
  switch (err.status) {
    case 401:
      clearAuth();
      window.location.href = 'login.html';
      return;
    case 403:
      message = 'У вас нет прав на загрузку видео.';
      break;
    case 413:
      message = `Файл слишком большой. Максимум — ${UPLOAD_CONFIG.MAX_FILE_SIZE_LABEL}.`;
      break;
    case 415:
      message = 'Неподдерживаемый формат файла. Загрузите MP4.';
      break;
    case 0:
      message = err.message;
      break;
    default:
      message = err.message || 'Произошла ошибка при загрузке видео.';
  }
  showAlert(messageEl, message, 'error', { autoHide: false });
}

// ---------- Progress UI ----------
function showProgress(percent, speedMBs) {
  uploadProgress.hidden = false;
  const p = Math.min(100, Math.max(0, percent));
  progressFill.style.width = `${p}%`;
  progressPercent.textContent = `${Math.round(p)}%`;
  progressSpeed.textContent = speedMBs > 0 ? `${speedMBs.toFixed(2)} MB/s` : '—';
}

function hideProgress() {
  // Небольшая задержка, чтобы пользователь увидел 100%
  setTimeout(() => {
    uploadProgress.hidden = true;
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressSpeed.textContent = '0 MB/s';
  }, 800);
}

// ---------- Form state ----------
function setUploadingState(uploading) {
  isUploading = uploading;
  if (uploading) {
    submitBtn.disabled = true;
    btnText.innerHTML = '<span class="spinner spinner--sm"></span> Загрузка...';
    titleInput.disabled = true;
    descriptionInput.disabled = true;
    fileInput.disabled = true;
  } else {
    btnText.textContent = 'Загрузить видео';
    titleInput.disabled = false;
    descriptionInput.disabled = false;
    fileInput.disabled = false;
    updateSubmitState();
  }
}

function resetForm() {
  uploadForm.reset();
  resetFile();
}

function highlightFirstVideo() {
  const firstCard = videosList.querySelector('.video-card');
  if (!firstCard) return;
  firstCard.classList.add('is-highlighted');
  setTimeout(() => firstCard.classList.remove('is-highlighted'), 2000);
}

// ---------- Event listeners ----------
function setupEventListeners() {
  // Dropzone клик/drag-drop
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!canUpload || isUploading) return;
    dropzone.classList.add('is-dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('is-dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
    if (!canUpload || isUploading) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  removeFileBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    resetFile();
    hideAlert(messageEl);
  });

  // Активация submit-кнопки по мере заполнения
  titleInput.addEventListener('input', updateSubmitState);

  // Submit формы
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    uploadVideo();
  });

  // Предупреждение при закрытии вкладки во время загрузки
  window.addEventListener('beforeunload', (e) => {
    if (isUploading) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ---------- Utils ----------
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function safeParseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}