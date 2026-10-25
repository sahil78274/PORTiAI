import { api } from './api.js';

export const portfolioService = {
  list: (params) => api.get('/portfolios', { query: params }),
  create: (payload = {}) => api.post('/portfolios', payload),
  get: (id) => api.get(`/portfolios/${id}`),
  update: (id, payload) => api.put(`/portfolios/${id}`, payload),
  remove: (id) => api.delete(`/portfolios/${id}`),
  duplicate: (id) => api.post(`/portfolios/${id}/duplicate`),
  setPublished: (id, published) => api.patch(`/portfolios/${id}/publish`, { published }),
  analyze: (id, options = {}) => api.post(`/portfolios/${id}/analyze`, options),
  getPublic: (slug) => api.get(`/public/${encodeURIComponent(slug)}`),
};

export const aiService = {
  status: () => api.get('/ai/status'),
  generate: (payload) => api.post('/ai/generate', payload),
  improve: (payload) => api.post('/ai/improve', payload),
  analyze: (payload) => api.post('/ai/analyze', payload),
};
