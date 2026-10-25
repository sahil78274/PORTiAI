import { ApiError } from '../utils/ApiError.js';

/** Validates req.body/params/query with a zod schema and replaces with parsed data. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message,
    }));
    return next(ApiError.badRequest(issues[0]?.message || 'Invalid request data.', issues));
  }
  req[source] = result.data;
  next();
};
