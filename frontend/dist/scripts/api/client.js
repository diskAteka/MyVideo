// Обёртка над fetch: токены, JSON, единая обработка ошибок
import { API_CONFIG } from '../config.js';
import { getToken, clearAuth } from '../lib/auth-storage.js';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Базовый запрос.
 * @param {string} endpointKey - ключ из API_CONFIG.ENDPOINTS
 * @param {object} options - { method, body, params, query, auth, headers, signal }
 */
export async function request(endpointKey, options = {}) {
  const {
    method = 'GET',
    body,
    params = {},
    query,
    auth = true,
    headers = {},
    signal,
  } = options;

  let url = API_CONFIG.getUrl(endpointKey, params);
  if (query) {
    const qs = new URLSearchParams(query).toString();
    if (qs) url += `?${qs}`;
  }

  const finalHeaders = { Accept: 'application/json', ...headers };

  // Тело запроса
  let finalBody;
  if (body instanceof FormData) {
    finalBody = body; // FormData сам выставит boundary
  } else if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  // Авторизация
  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal,
    });
  } catch (err) {
    throw new ApiError('Ошибка соединения. Проверьте интернет.', 0, null);
  }

  // 401 — глобальная обработка
  if (response.status === 401) {
    clearAuth();
    if (!window.location.pathname.endsWith('/login.html')) {
      window.location.href = '/login.html';
    }
    throw new ApiError('Требуется авторизация', 401, null);
  }

  // Парсим тело (если есть)
  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else if (response.status !== 204) {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const msg = (data && data.message) || `Ошибка сервера: ${response.status}`;
    throw new ApiError(msg, response.status, data);
  }

  return data;
}

// Сахар для частых методов
export const apiClient = {
  get: (endpointKey, options) => request(endpointKey, { ...options, method: 'GET' }),
  post: (endpointKey, body, options) => request(endpointKey, { ...options, method: 'POST', body }),
  put: (endpointKey, body, options) => request(endpointKey, { ...options, method: 'PUT', body }),
  delete: (endpointKey, options) => request(endpointKey, { ...options, method: 'DELETE' }),
};