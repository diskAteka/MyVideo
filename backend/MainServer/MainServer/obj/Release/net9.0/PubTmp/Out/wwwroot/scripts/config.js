// config.js - подключается на всех страницах фронтенда
window.API_CONFIG = {
    BASE_URL: 'https://localhost:3001/api',
    ENDPOINTS: {
        // Аутентификация (обрабатывается главным сервером)
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        AUTH_CHECK: '/auth/me',

        VIDEOS: '/videos',
        VIDEOS_SEARCH: '/videos/search',  
        VIDEO: '/videos/{id}',
        VIDEO_STREAM: '/videos/{id}/stream',
        VIDEO_REACTION: '/videos/{id}/reaction',
        COMMENTS: '/videos/{id}/comments',
        UPLOAD_VIDEO: '/videos/upload', //Post
        USER_VIDEOS: '/videos/upload', //Get

        CREATE_COMMENT: '/videos/{id}/comments'
    },

    // Вспомогательные методы
    getUrl: function (endpointKey, params = {}) {
        let url = this.ENDPOINTS[endpointKey];
        if (!url) throw new Error(`Unknown endpoint: ${endpointKey}`);

        // Замена параметров в пути
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`{${key}}`, value);
        }

        return this.BASE_URL + url;
    }
};