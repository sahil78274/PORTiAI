import { api } from './api.js';

/** Admin reporting. Every endpoint returns 403 for a non-admin session. */
export const adminService = {
  summary: () => api.get('/admin/summary'),
  subscriptions: (params = {}) => api.get('/admin/subscriptions', { query: params }),
  payments: (params = {}) => api.get('/admin/payments', { query: params }),
  aiUsage: (params = {}) => api.get('/admin/ai-usage', { query: params }),
  webhooks: (params = {}) => api.get('/admin/webhooks', { query: params }),
};
