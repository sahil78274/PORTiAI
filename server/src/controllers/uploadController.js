import { Upload } from '../models/Upload.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const MAX_BYTES = 500 * 1024;
const MAX_PER_ACCOUNT = 30;

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
  const { dataUrl } = req.body || {};
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    throw ApiError.badRequest('Send the image as a base64 data URL in `dataUrl`.');
  }

  const match = DATA_URL.exec(dataUrl.trim());
  if (!match) {
    throw ApiError.badRequest('Only PNG, JPEG and WebP images are accepted.');
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64.replace(/\s/g, ''), 'base64');

  if (!buffer.length) throw ApiError.badRequest('The image could not be read. Try a different file.');
  if (buffer.length > MAX_BYTES) throw ApiError.badRequest('That image is larger than 500 KB. Choose a smaller file.');
  if (!SIGNATURES[mimeType](buffer)) {
    throw ApiError.badRequest('The file content does not match its image type.');
  }

  const existing = await Upload.countDocuments({ userId: req.user._id });
  if (existing >= MAX_PER_ACCOUNT) {
    throw ApiError.badRequest(
      'You have reached the limit of 30 stored images. Reuse an existing URL or remove old uploads first.'
    );
  }

  const upload = await Upload.create({ userId: req.user._id, mimeType, size: buffer.length, data: buffer });

  const path = uploadPath(upload._id.toString());
  // Absolute URL so it can be stored in profile.photoUrl, which only accepts
  // http(s) URLs and is rendered from the public portfolio origin.
  const url = `${req.protocol}://${req.get('host')}${path}`;

  res.status(201).json({
    success: true,
    data: { upload: upload.toPublicJSON(), path, url },
  });
});

/** Public read: the id is random, and these images appear on public portfolios. */
export const getUpload = asyncHandler(async (req, res) => {
  const upload = await Upload.findById(req.params.id).select('+data');
  if (!upload) throw ApiError.notFound('That image is no longer available.');

  res.set('Content-Type', upload.mimeType);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('Content-Disposition', 'inline');
  res.send(upload.data);
});
