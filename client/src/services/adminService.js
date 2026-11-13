import { api, apiBaseUrl } from './api.js';

/**
 * Admin API client. Every endpoint except `login` returns 403 for a
 * non-admin session — the server enforces the role, not this client.
 */
export const adminService = {
  login: (payload) => api.post('/admin/login', payload),
  me: () => api.get('/admin/me'),
  changePassword: (payload) => api.patch('/admin/me/password', payload),

  summary: () => api.get('/admin/summary'),

  users: (params = {}) => api.get('/admin/users', { query: params }),
  user: (id) => api.get(`/admin/users/${id}`),
  suspendUser: (id, reason = '') => api.patch(`/admin/users/${id}/suspend`, { reason }),
  reactivateUser: (id) => api.patch(`/admin/users/${id}/reactivate`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  grantPremium: (id, { months = 1, reason = '' } = {}) => api.post(`/admin/users/${id}/grant-premium`, { months, reason }),
  revokePremium: (id, reason = '') => api.post(`/admin/users/${id}/revoke-premium`, { reason }),

  subscriptions: (params = {}) => api.get('/admin/subscriptions', { query: params }),
  payments: (params = {}) => api.get('/admin/payments', { query: params }),
  payment: (id) => api.get(`/admin/payments/${id}`),

  aiBuilderStats: () => api.get('/admin/ai-builder/stats'),
  generations: (params = {}) => api.get('/admin/ai-generations', { query: params }),
  aiProjects: (params = {}) => api.get('/admin/ai-projects', { query: params }),
  aiUsage: (params = {}) => api.get('/admin/ai-usage', { query: params }),
  analytics: () => api.get('/admin/analytics'),

  portfolios: (params = {}) => api.get('/admin/portfolios', { query: params }),
  portfolio: (id) => api.get(`/admin/portfolios/${id}`),
  unpublishPortfolio: (id) => api.patch(`/admin/portfolios/${id}/unpublish`),
  deletePortfolio: (id) => api.delete(`/admin/portfolios/${id}`),

  blog: (params = {}) => api.get('/admin/blog', { query: params }),
  setBlogPublished: (id, published) => api.patch(`/admin/blog/${id}/publish`, { published }),
  deleteBlogPost: (id) => api.delete(`/admin/blog/${id}`),

  templates: () => api.get('/admin/templates'),
  setTemplateEnabled: (id, enabled) => api.patch(`/admin/templates/${id}`, { enabled }),

  auditLogs: (params = {}) => api.get('/admin/audit-logs', { query: params }),
  webhooks: (params = {}) => api.get('/admin/webhooks', { query: params }),
};

/** Downloads a CSV report. Uses fetch (not the JSON client) for the blob. */
export const downloadReport = async (name) => {
  const response = await fetch(`${apiBaseUrl}/admin/reports/${name}.csv`, {
    credentials: 'include',
    headers: { Accept: 'text/csv' },
  });
  if (!response.ok) {
    let message = `Report download failed (${response.status}).`;
    try {
      const payload = await response.json();
      message = payload?.error?.message || message;
    } catch {
      /* keep the default message */
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `portiai-${name}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
