import { getCurrentUser } from '../api/auth.js';
import { getVideos, searchVideos } from '../api/videos.js';
import { isAuthenticated, saveUser, clearAuth } from '../lib/auth-storage.js';
import { formatUploadDate, getInitial } from '../lib/formatters.js';
import { renderAuthArea } from '../ui/header.js';
import { escapeHtml } from '../lib/html.js';

// ---------- DOM ----------
const videosGrid = document.getElementById('videosGrid');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const pageTitle = document.getElementById('pageTitle');
const noResults = document.getElementById('noResults');
const loadingIndicator = document.getElementById('loadingIndicator');
const authArea = document.querySelector('.header__auth')
const logoLink = document.querySelector('.logo');

const POSTER_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9IiMyMTIxMjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+UG9zdGVyPC90ZXh0Pjwvc3ZnPg==';

// ---------- State ----------
let currentSearchQuery = '';

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  await loadAndRenderVideos();
  setupEventListeners();
});

// ---------- Auth ----------
async function initAuth() {
  if (!isAuthenticated()) {
    renderAuthArea(authArea, null);
    return;
  }

  try {
    const userData = await getCurrentUser();
    if (userData && userData.success === true) {
      const user = {
        name: userData.name,
        email: userData.email,
        canUpload: userData.canUpload,
        isActive: userData.isActive,
      };
      saveUser(user);
      renderAuthArea(authArea, user);
    } else {
      throw new Error('Invalid token');
    }
  } catch (err) {
    clearAuth();
    renderAuthArea(authArea, null);
  }
}

// ---------- Videos ----------
async function loadAndRenderVideos(query = '') {
  showLoading(true);
  showNoResults(false);
  videosGrid.innerHTML = '';

  try {
    const videos = query ? await searchVideos(query) : await getVideos();
    pageTitle.textContent = query
      ? `Результаты поиска: "${query}"`
      : 'Популярные видео';

    if (!videos || videos.length === 0) {
      showNoResults(true);
    } else {
      renderVideos(videos);
    }
  } catch (err) {
    console.error('Ошибка при загрузке видео:', err);
    renderError('Ошибка при загрузке видео', 'Попробуйте обновить страницу');
  } finally {
    showLoading(false);
  }
}

function renderVideos(videos) {
  const fragment = document.createDocumentFragment();
  videos.forEach((v) => fragment.appendChild(buildVideoCard(v)));
  videosGrid.appendChild(fragment);
}

function buildVideoCard(video) {
  const card = document.createElement('article');
  card.className = 'video-card';

  const posterUrl = sanitizePosterUrl(video.poster);
  const placeholder = POSTER_PLACEHOLDER;
  const title = video.name || 'Без названия';
  const author = video.authorName || 'Неизвестный автор';

  card.innerHTML = `
    <div class="video-card__thumb">
      <img src="${posterUrl}" alt="${escapeHtml(title)}"
           onerror="this.onerror=null;this.src='${placeholder}'" loading="lazy">
    </div>
    <div class="video-card__body">
      <h3 class="video-card__title">${escapeHtml(title)}</h3>
      <div class="video-card__channel">
        <div class="video-card__avatar">${getInitial(author)}</div>
        <span>${escapeHtml(author)}</span>
      </div>
      <div class="video-card__meta">
        <span class="upload-date">${formatUploadDate(video.dateUpload)}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => {
    window.location.href = `video.html?id=${video.id}`;
  });
  return card;
}

function sanitizePosterUrl(url) {
  if (!url) return '';
  if (!url.includes(' ')) return url;
  const parts = url.split('/');
  const fileName = parts.pop();
  return parts.join('/') + '/' + encodeURIComponent(fileName);
}



// ---------- UI helpers ----------
function showLoading(show) {
  loadingIndicator.classList.toggle('is-visible', show);
}
function showNoResults(show) {
  noResults.classList.toggle('is-visible', show);
}

function renderError(title, hint) {
  videosGrid.innerHTML = `
    <div class="grid-error">
      <p>${escapeHtml(title)}</p>
      <p class="grid-error__hint">${escapeHtml(hint)}</p>
    </div>`;
}

// ---------- Events ----------
function setupEventListeners() {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    currentSearchQuery = query;
    loadAndRenderVideos(query);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      currentSearchQuery = '';
      loadAndRenderVideos('');
    }
  });

  logoLink.addEventListener('click', (e) => {
    if (currentSearchQuery) {
      e.preventDefault();
      searchInput.value = '';
      currentSearchQuery = '';
      loadAndRenderVideos('');
      history.pushState(null, '', 'index.html');
    }
  });
}