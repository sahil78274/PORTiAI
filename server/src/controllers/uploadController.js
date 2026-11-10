import { Upload, UPLOAD_PURPOSES } from '../models/Upload.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Image uploads.
 *
 * The browser downscales the image and sends a base64 data URL; the API checks
 * the real magic bytes, size and declared purpose before storing it. Bytes live
 * in the existing Upload collection (the configured media store for this
 * deployment) and the portfolio stores only the URL plus metadata.
 *
 * Portrait images (profile photos) are capped at 500 KB; project screenshots
 * are allowed up to 1.5 MB because they are wider previews.
 */
const LIMITS = {
  portrait: 500 * 1024,
  project: 1.5 * 1024 * 1024,
};
const MAX_PER_ACCOUNT = 80;

const SIGNATURES = {
  'image/png': (buffer) => buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47,
  'image/jpeg': (buffer) => buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/webp': (buffer) =>
    buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP',
};

const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/;

/** Path the image is served from; kept relative so it works behind either origin. */
export const uploadPath = (id) => `/api/uploads/${id}`;

/**
 * Accepts a data URL (the client downscales the image before sending it),
 * verifies the bytes really are the declared image type, and stores it.
 */
export const createUpload = asyncHandler(async (req, res) => {
  const { dataUrl, purpose: rawPurpose, width, height, originalName } = req.body || {};
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    throw ApiError.badRequest('Send the image as a base64 data URL in `dataUrl`.');
  }

  const purpose = UPLOAD_PURPOSES.includes(rawPurpose) ? rawPurpose : 'portrait';
  const maxBytes = LIMITS[purpose] || LIMITS.portrait;

  const match = DATA_URL.exec(dataUrl.trim());
  if (!match) {
    throw ApiError.badRequest('Only PNG, JPEG and WebP images are accepted.');
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64.replace(/\s/g, ''), 'base64');

  if (!buffer.length) throw ApiError.badRequest('The image could not be read. Try a different file.');
  if (buffer.length > maxBytes) {
    throw ApiError.badRequest(
      `That image is larger than ${Math.round(maxBytes / 1024)} KB. Choose a smaller file — screenshots are resized automatically in the editor.`
    );
  }
  if (!SIGNATURES[mimeType](buffer)) {
    throw ApiError.badRequest('The file content does not match its image type.');
  }

  const existing = await Upload.countDocuments({ userId: req.user._id });
  if (existing >= MAX_PER_ACCOUNT) {
    throw ApiError.badRequest(
      `You have reached the limit of ${MAX_PER_ACCOUNT} stored images. Reuse an existing URL or contact support to clean up old uploads.`
    );
  }

  const safeWidth = Math.min(10000, Math.max(0, Number(width) || 0));
  const safeHeight = Math.min(10000, Math.max(0, Number(height) || 0));

  const upload = await Upload.create({
    userId: req.user._id,
    purpose,
    mimeType,
    size: buffer.length,
    width: safeWidth,
    height: safeHeight,
    originalName: typeof originalName === 'string' ? originalName.slice(0, 200) : '',
    data: buffer,
  });

  const path = uploadPath(upload._id.toString());
  // Absolute URL so it can be stored in profile.photoUrl / project.imageUrl,
  // which only accept http(s) URLs and are rendered from the public origin.
  const url = `${req.protocol}://${req.get('host')}${path}`;

  res.status(201).json({
    success: true,
    data: { upload: upload.toPublicJSON(), path, url },
  });
});

/** Public read: the id is random, and these images appear on public portfolios. */
export const getUpload = asyncHandler(async (req, res) => {
  const upload = await Upload.findById(req.params.id);
  if (!upload) throw ApiError.notFound('That image is no longer available.');

  res.set('Content-Type', upload.mimeType);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('Content-Disposition', 'inline');
  res.send(upload.data);
});

/**
 * DELETE /api/uploads/:id — owner only.
 * Used to clean up an image that was replaced. Portfolios that still reference
 * the URL fall back to the template placeholder.
 */
export const deleteUpload = asyncHandler(async (req, res) => {
  const upload = await Upload.findOne({ _id: req.params.id, userId: req.user._id });
  if (!upload) throw ApiError.notFound('That image is not in your account.');
  await upload.deleteOne();
  res.json({ success: true, data: { message: 'Image deleted.' } });
});
