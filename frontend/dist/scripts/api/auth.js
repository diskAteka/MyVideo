import { apiClient } from './client.js';

export function register({ userName, email, password }) {
  return apiClient.post('REGISTER', { userName, email, password }, { auth: false });
}

export function login(payload) {
  // payload: { email?, username?, password }
  return apiClient.post('LOGIN', payload, { auth: false });
}

export function getCurrentUser() {
  return apiClient.get('AUTH_CHECK');
}