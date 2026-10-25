import { Portfolio } from '../models/Portfolio.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Public portfolio endpoint. Only published portfolios are ever returned:
 * drafts answer 404 so unpublished work cannot be reached by guessed slugs.
 */
export const getPublicPortfolio = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase().trim();
  if (!/^[a-z0-9-]{3,72}$/.test(slug)) throw ApiError.notFound('Portfolio not found.');

  const portfolio = await Portfolio.findOne({ slug, published: true });
  if (!portfolio) throw ApiError.notFound('This portfolio does not exist or is not published.');

  res.json({ success: true, data: { portfolio: portfolio.toPublicJSON() } });
});
