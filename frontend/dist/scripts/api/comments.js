import { apiClient } from './client.js';

export function getComments(videoId) {
  return apiClient.get('COMMENTS', { auth: false, params: { id: videoId } });
}

export function addComment(videoId, text) {
  return apiClient.post('CREATE_COMMENT', { text }, { params: { id: videoId } });
}