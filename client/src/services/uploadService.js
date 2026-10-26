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

export const uploadService = {
  /**
   * Downscales the chosen file in the browser, then posts it as a data URL.
   * Returns { url, upload } where `url` can be stored in profile.photoUrl.
   */
  uploadImage: async (file) => {
    if (!file) throw new Error('Choose an image file first.');
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      throw new Error('Use a PNG, JPEG or WebP image.');
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new Error('That file is over 8 MB. Choose a smaller image.');
    }

    const dataUrl = await downscaleToDataUrl(file);
    const data = await api.post('/uploads', { dataUrl });
    return { url: data.url || resolveUploadUrl(data.path), upload: data.upload };
  },

  /** Absolute URL for a value already stored on a portfolio. */
  resolveUrl: resolveUploadUrl,
};

/** Draws the image on a canvas at <=512px and returns a compressed data URL. */
const downscaleToDataUrl = (file, maxSize = 512) =>
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
      resolve(canvas.toDataURL(mimeType, 0.85));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('That file could not be read as an image.'));
    };

    image.src = objectUrl;
  });
