import { api } from './api.js';

export const authService = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateAccount: (payload) => api.patch('/auth/account', payload),
  deleteAccount: (password) => api.delete('/auth/account', { password }),
};
