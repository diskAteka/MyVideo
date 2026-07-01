import { apiClient } from './client.js';

export function getVideos() {
  return apiClient.get('VIDEOS', { auth: false });
}

export function searchVideos(query) {
  return apiClient.get('VIDEOS_SEARCH', { auth: false, query: { query } });
}

export function getVideo(id) {
  return apiClient.get('VIDEO', { params: { id } });
  // auth опционален — токен пошлётся если есть, для isLiked/isDisLiked
}

export function reactToVideo(id, isLike) {
  return apiClient.post('VIDEO_REACTION', { isLike }, { params: { id } });
}

export function getUserVideos() {
  return apiClient.get('USER_VIDEOS');
}

/**
 * Загрузка видео через XHR (для отслеживания прогресса).
 * @param {FormData} formData
 * @param {(percent: number) => void} onProgress
 * @returns {Promise<object>} VideoDetailsResponse
 */
export function uploadVideo(formData, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = '/api' + '/videos/upload'; // или через API_CONFIG

    xhr.open('POST', url);

    const token = localStorage.getItem('authToken');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        reject(new Error('Требуется авторизация'));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(null);
        }
      } else {
        let msg = `Ошибка сервера: ${xhr.status}`;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data?.message) msg = data.message;
        } catch {}
        reject(new Error(msg));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Ошибка сети')));
    xhr.addEventListener('abort', () => reject(new Error('Загрузка отменена')));

    xhr.send(formData);
  });
}