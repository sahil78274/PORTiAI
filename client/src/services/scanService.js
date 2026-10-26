import { api } from './api.js';

/** Website and uploaded-HTML analysis (server performs the scan). */
export const scanService = {
  scanUrl: (url, categories) => api.post('/analyze/url', { url, categories }),
  scanHtml: (html, filename, categories) => api.post('/analyze/html', { html, filename, categories }),
};
