import { Upload } from '../models/Upload.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Project image metadata + ownership.
 *
 * The editor stores only a URL on a project. This helper resolves that URL to
 * the Upload document that backs it and copies the authoritative mime type,
 * dimensions and size onto the project. It also proves ownership: a user can
 * never attach another account's upload to their portfolio by pasting its URL.
 *
 * External https images are allowed (some users host screenshots on their own
 * CDN); they simply carry no upload metadata.
 */

const UPLOAD_URL = /\/api\/uploads\/([a-f0-9]{24})(?:[?#].*)?$/i;

export const uploadIdFromUrl = (url) => {
  if (typeof url !== 'string' || !url) return null;
  const match = UPLOAD_URL.exec(url.trim());
  return match ? match[1] : null;
};

const emptyMeta = () => ({ uploadId: '', mimeType: '', width: 0, height: 0, size: 0 });

/**
 * @param {Array<object>} projects  normalised project objects (not Mongoose docs)
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Array<object>>} projects with `imageMeta` set
 */
export const attachProjectImageMeta = async (projects, userId) => {
  if (!Array.isArray(projects)) return projects;

  const withMeta = [];
  for (const project of projects) {
    const meta = emptyMeta();
    const uploadId = uploadIdFromUrl(project.imageUrl);

    if (uploadId) {
      const upload = await Upload.findOne({ _id: uploadId, userId });
      if (!upload) {
        throw ApiError.forbidden(
          'That project image does not belong to your account. Upload the screenshot from this editor instead.'
        );
      }
      meta.uploadId = upload._id.toString();
      meta.mimeType = upload.mimeType;
      meta.width = upload.width || 0;
      meta.height = upload.height || 0;
      meta.size = upload.size || 0;
    }

    withMeta.push({ ...project, imageMeta: meta });
  }

  return withMeta;
};

/**
 * Same ownership rule for the profile photograph. Existing accounts keep
 * working: only upload URLs that belong to another user are rejected.
 */
export const assertPhotoOwnership = async (photoUrl, userId) => {
  const uploadId = uploadIdFromUrl(photoUrl);
  if (!uploadId) return;
  const upload = await Upload.findOne({ _id: uploadId, userId });
  if (!upload) {
    throw ApiError.forbidden('That profile photo does not belong to your account.');
  }
};
