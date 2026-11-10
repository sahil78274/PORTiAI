import { api, apiBaseUrl } from './api.js';

/**
 * Uploads are stored by the API and referenced by a short path such as
 * `/api/uploads/6f1…`. In development that path is proxied by Vite; in
 * production `VITE_API_BASE_URL` points at the API origin, so the stored value
 * is made absolute before it is saved to the portfolio.
 */
const resolveUploadUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (/^https?:\/\//i.test(apiBaseUrl)) return `${apiBaseUrl.replace(/\/api$/, '')}${path}`;
  return path;
};

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const HARD_LIMIT_BYTES = 12 * 1024 * 1024;

/** Purpose-specific browser-side preprocessing. */
const PRESETS = {
  portrait: { maxSize: 512, quality: 0.86, label: 'profile photo', uploadLimit: 500 * 1024 },
  project: { maxSize: 1440, quality: 0.82, label: 'project screenshot', uploadLimit: 1.5 * 1024 * 1024 },
};

export const uploadService = {
  /**
   * Validates, downscales and uploads an image.
   *
   * @param {File} file
   * @param {{ purpose?: 'portrait'|'project' }} options
   * @returns {Promise<{ url: string, upload: object, path: string }>}
   */
  uploadImage: async (file, { purpose = 'portrait' } = {}) => {
    const preset = PRESETS[purpose] || PRESETS.portrait;
    if (!file) throw new Error('Choose an image file first.');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error('Use a JPG, PNG or WebP image.');
    }
    if (file.size > HARD_LIMIT_BYTES) {
      throw new Error('That file is over 12 MB. Choose a smaller image.');
    }

    const prepared = await downscaleToDataUrl(file, preset.maxSize, preset.quality);

    if (prepared.bytes > preset.uploadLimit) {
      throw new Error(
        `That ${preset.label} is still too large after resizing (${Math.round(prepared.bytes / 1024)} KB). Try a simpler image.`
      );
    }

    const data = await api.post('/uploads', {
      dataUrl: prepared.dataUrl,
      purpose,
      width: prepared.width,
      height: prepared.height,
      originalName: file.name,
    });

    return { url: resolveUploadUrl(data.path || data.url), path: data.path, upload: data.upload };
  },

  /** Absolute URL for a value already stored on a portfolio. */
  resolveUrl: resolveUploadUrl,

  /** True when a URL points at this deployment's media store. */
  isUploadUrl: (url) => Boolean(url) && /\/api\/uploads\/[a-f0-9]{24}/i.test(url),

  /** Owner-only cleanup of an image that is no longer referenced. */
  deleteImage: async (url) => {
    const match = /\/api\/uploads\/([a-f0-9]{24})/i.exec(String(url || ''));
    if (!match) return null;
    return api.delete(`/uploads/${match[1]}`);
  },
};

/**
 * Draws the image on a canvas at its longest edge ≤ `maxSize` and returns a
 * compressed data URL plus the true dimensions that were uploaded.
 */
const downscaleToDataUrl = (file, maxSize = 512, quality = 0.85) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Your browser could not process that image.'));
        return;
      }

      // JPEG has no alpha channel; paint white so transparent PNGs are not black.
      if (file.type !== 'image/png') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(image, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const base64 = dataUrl.split(',')[1] || '';
      const bytes = Math.ceil((base64.length * 3) / 4);
      resolve({ dataUrl, width, height, bytes });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('That file could not be read as an image.'));
    };

    image.src = objectUrl;
  });
