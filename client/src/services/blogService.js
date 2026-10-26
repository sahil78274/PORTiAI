import { api } from './api.js';

export const blogService = {
  list: (params) => api.get('/blog', { query: params }),
  create: (payload) => api.post('/blog', payload),
  get: (id) => api.get(`/blog/${id}`),
  update: (id, payload) => api.put(`/blog/${id}`, payload),
  remove: (id) => api.delete(`/blog/${id}`),
  setPublished: (id, published) => api.patch(`/blog/${id}/publish`, { published }),
};

export const publicBlogService = {
  list: (slug) => api.get(`/public/${encodeURIComponent(slug)}/blog`),
  post: (slug, postSlug) => api.get(`/public/${encodeURIComponent(slug)}/blog/${encodeURIComponent(postSlug)}`),
};
