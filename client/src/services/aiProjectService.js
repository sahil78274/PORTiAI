import { api, apiBaseUrl } from './api.js';

/** AI Project Builder endpoints. All are premium-gated on the server. */
export const aiProjectService = {
  meta: () => api.get('/ai-projects/meta'),
  credits: () => api.get('/ai-projects/credits'),
  list: () => api.get('/ai-projects'),
  get: (id) => api.get(`/ai-projects/${id}`),
  generate: ({ idea, stack, complexity, designPreferences, requestId }) =>
    api.post('/ai-projects/generate', { idea, stack, complexity, designPreferences, requestId }),
  regenerate: (id) => api.post(`/ai-projects/${id}/regenerate`),
  regenerateFile: (id, { path, instruction, mode = 'regenerate' }) =>
    api.post(`/ai-projects/${id}/files/regenerate`, { path, instruction, mode }),
  saveFile: (id, { path, content }) => api.patch(`/ai-projects/${id}/files`, { path, content }),
  addToPortfolio: (id, portfolioId) => api.post(`/ai-projects/${id}/add-to-portfolio`, { portfolioId }),
  remove: (id) => api.delete(`/ai-projects/${id}`),
  /** Authenticated binary download (the session cookie is sent). */
  download: async (id) => {
    const response = await fetch(`${apiBaseUrl}/ai-projects/${id}/download`, { credentials: 'include' });
    if (!response.ok) {
      let message = 'The project could not be downloaded.';
      try {
        const payload = await response.json();
        message = payload?.error?.message || message;
      } catch {
        /* binary or empty */
      }
      throw new Error(message);
    }
    return response.blob();
  },
};

/** Triggers a browser download for a blob. */
export const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
