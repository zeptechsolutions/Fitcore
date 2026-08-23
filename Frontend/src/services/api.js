const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('fitcore_token');
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Ocurrió un error');
    error.status = response.status;
    error.data = data;
    if (response.status === 401) {
      localStorage.removeItem('fitcore_token');
      localStorage.removeItem('fitcore_user');
      window.dispatchEvent(new Event('fitcore:unauthorized'));
    }
    throw error;
  }
  return data;
}

export const endpoints = {
  login: (payload) => api('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => api('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => api('/users/me'),
  updateMe: (payload) => api('/users/me', { method: 'PATCH', body: JSON.stringify(payload) }),
  bmi: () => api('/users/me/bmi'),
  dashboard: (date) => api(`/dashboard/daily${date ? `?date=${date}` : ''}`),
  meals: (date) => api(`/meals${date ? `?date=${date}` : ''}`),
  createMeal: (payload) => api('/meals', { method: 'POST', body: JSON.stringify(payload) }),
  deleteMeal: (id) => api(`/meals/${id}`, { method: 'DELETE' }),
  water: (date) => api(`/water${date ? `?date=${date}` : ''}`),
  addWater: (fraction) => api('/water', { method: 'POST', body: JSON.stringify({ bottleFraction: fraction }) }),
  deleteWater: (id) => api(`/water/${id}`, { method: 'DELETE' }),
  weights: () => api('/weights'),
  addWeight: (payload) => api('/weights', { method: 'POST', body: JSON.stringify(payload) }),
  measurements: () => api('/measurements'),
  addMeasurement: (payload) => api('/measurements', { method: 'POST', body: JSON.stringify(payload) }),
  gym: (date) => api(`/gym${date ? `?date=${date}` : ''}`),
  addGym: (payload) => api('/gym', { method: 'POST', body: JSON.stringify(payload) }),
  recipes: () => api('/recipes'),
  createRecipe: (payload) => api('/recipes', { method: 'POST', body: JSON.stringify(payload) }),
  favorites: () => api('/favorites'),
  createFavorite: (payload) => api('/favorites', { method: 'POST', body: JSON.stringify(payload) }),
  logFavorite: (id, payload = {}) => api(`/favorites/${id}/log`, { method: 'POST', body: JSON.stringify(payload) }),
  barcode: (code) => api(`/nutrition/barcode/${encodeURIComponent(code)}`),
  barcodeServing: (code, grams) => api(`/nutrition/barcode/${encodeURIComponent(code)}/calculate`, { method: 'POST', body: JSON.stringify({ grams }) }),
  statsSummary: (period = 'week') => api(`/stats/summary?period=${period}`),
  calendar: (date) => api(`/stats/calendar${date ? `?date=${date}` : ''}`),
  streaks: () => api('/stats/streaks'),
  gamification: () => api('/gamification/me'),
  searchUsers: (q) => api(`/social/search?q=${encodeURIComponent(q)}`),
  friends: () => api('/social/friends'),
  requests: () => api('/social/requests'),
  sendRequest: (username) => api('/social/requests', { method: 'POST', body: JSON.stringify({ username }) }),
  respondRequest: (id, status) => api(`/social/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  ranking: () => api('/social/ranking'),
  friendOverview: (id) => api(`/social/friends/${id}`),
  challenges: () => api('/challenges'),
  createChallenge: (payload) => api('/challenges', { method: 'POST', body: JSON.stringify(payload) }),
  challengeProgress: (id, progress) => api(`/challenges/${id}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) }),
  reminders: () => api('/reminders/due'),
  reminderPrefs: () => api('/reminders/preferences'),
  updateReminderPrefs: (payload) => api('/reminders/preferences', { method: 'PATCH', body: JSON.stringify(payload) }),
  analyzeMeal: (description) => api('/ai/meals/analyze', { method: 'POST', body: JSON.stringify({ description }) }),
  aiWeekly: () => api('/ai/weekly-summary'),
  aiPatterns: (days = 30) => api(`/ai/patterns?days=${days}`),
  askAi: (question) => api('/ai/ask', { method: 'POST', body: JSON.stringify({ question }) })
};
