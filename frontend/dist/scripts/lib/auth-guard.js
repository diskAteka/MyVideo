// lib/auth-guard.js
import { getCurrentUser } from '../api/auth.js';
import { getToken, clearAuth } from './auth-storage.js';

export async function redirectIfAuthenticated(targetUrl = 'index.html') {
  if (!getToken()) return;
  try {
    const user = await getCurrentUser();
    if (user && user.success === true) {
      window.location.href = targetUrl;
    } else {
      clearAuth();
    }
  } catch {
    clearAuth();
  }
}