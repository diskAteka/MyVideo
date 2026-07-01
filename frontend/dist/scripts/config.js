// Endpoints и базовая конфигурация API
export const API_CONFIG = {
  BASE_URL: '/api',
    ENDPOINTS: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    AUTH_CHECK: '/auth/me',

    VIDEOS: '/videos',
    VIDEOS_SEARCH: '/videos/search',
    VIDEO: '/videos/{id}',
    VIDEO_STREAM: '/videos/{id}/stream',
    VIDEO_REACTION: '/videos/{id}/reaction',

    COMMENTS: '/videos/{id}/comments',
    CREATE_COMMENT: '/videos/{id}/comments',

    USER_VIDEOS: '/videos/upload',
    UPLOAD_VIDEO: '/videos/upload',
  },

  getUrl(endpointKey, params = {}) {
    let url = this.ENDPOINTS[endpointKey];
    if (!url) throw new Error(`Unknown endpoint: ${endpointKey}`);
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`{${key}}`, value);
    }
    return this.BASE_URL + url;
  },
};

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024,   // 2 GB в байтах
  MAX_FILE_SIZE_LABEL: '2 GB',
  ACCEPTED_MIME: ['video/mp4'],
  ACCEPTED_EXTENSIONS: ['.mp4'],
};