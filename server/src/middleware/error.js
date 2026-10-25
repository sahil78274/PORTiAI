import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`No API route matches ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, _next) => {
  let status = error.status || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Something went wrong on our side.';
  let details = error.details;

  if (error.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    details = Object.values(error.errors).map((err) => ({ field: err.path, message: err.message }));
    message = details[0]?.message || 'Invalid request data.';
  } else if (error.name === 'CastError') {
    status = 400;
    code = 'INVALID_ID';
    message = 'That identifier is not valid.';
  } else if (error.code === 11000) {
    status = 409;
    code = 'DUPLICATE';
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    message =
      field === 'email'
        ? 'An account with that email address already exists.'
        : `That ${field} is already in use. Please choose another.`;
  } else if (error.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'That request is too large. Reduce the amount of content and try again.';
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body was not valid JSON.';
  }

  if (status >= 500) {
    console.error('[error]', req.method, req.originalUrl, '-', error.stack || error.message);
  }

  const payload = { success: false, error: { code, message } };
  if (details) payload.error.details = details;
  if (!env.isProduction && status >= 500) payload.error.stack = error.stack;

  res.status(status).json(payload);
};

export { ApiError };
