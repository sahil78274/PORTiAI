export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }
  static unauthorized(message = 'You must be signed in to do that.') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'You do not have access to this resource.') {
    return new ApiError(403, 'FORBIDDEN', message);
  }
  static premiumRequired(message = 'This template is part of PortiAI Premium.') {
    return new ApiError(403, 'PREMIUM_REQUIRED', message);
  }
  static notImplemented(message = 'This integration is not configured on this server.') {
    return new ApiError(501, 'NOT_IMPLEMENTED', message);
  }
  /** 503: the feature exists but this deployment is not configured for it. */
  static serviceUnavailable(message = 'This feature is not configured on this server.', code = 'SERVICE_UNAVAILABLE') {
    return new ApiError(503, code, message);
  }
  static notFound(message = 'Resource not found.') {
    return new ApiError(404, 'NOT_FOUND', message);
  }
  static conflict(message, details) {
    return new ApiError(409, 'CONFLICT', message, details);
  }
  static tooMany(message = 'Too many requests. Please slow down.') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }
  static internal(message = 'Something went wrong on our side.') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
