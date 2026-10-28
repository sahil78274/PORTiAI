import { Portfolio } from '../models/Portfolio.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { normalizePortfolioBody } from '../validators/portfolioInput.js';
import { defaultPortfolioContent, TEMPLATE_DEFAULTS, normalizeTemplateId } from '../utils/portfolioDefaults.js';
import { assertTemplateAccess } from '../services/subscriptionService.js';

const ID_PATTERN = /^[a-f0-9]{24}$/i;

const slugTaken = async (slug, ignoreId) => {
  const query = { slug };
  if (ignoreId) query._id = { $ne: ignoreId };
  return Boolean(await Portfolio.exists(query));
};

/** Loads a portfolio and proves the signed-in user owns it. */
const findOwnedPortfolio = async (id, userId) => {
  if (!ID_PATTERN.test(String(id))) throw ApiError.badRequest('That portfolio id is not valid.');
  const portfolio = await Portfolio.findById(id);
  if (!portfolio) throw ApiError.notFound('Portfolio not found.');
  if (portfolio.userId.toString() !== userId.toString()) {
    // 404 rather than 403 so ids of other users' portfolios are not confirmed.
    throw ApiError.notFound('Portfolio not found.');
  }
  return portfolio;
};

export const listPortfolios = asyncHandler(async (req, res) => {
  const { search = '', status = 'all', sort = 'updated' } = req.query;

  const query = { userId: req.user._id };
  if (status === 'published') query.published = true;
  if (status === 'draft') query.published = false;
  if (search && String(search).trim()) {
    const term = String(search).trim().slice(0, 80);
    query.$or = [
      { title: { $regex: term, $options: 'i' } },
      { 'profile.fullName': { $regex: term, $options: 'i' } },
      { 'profile.title': { $regex: term, $options: 'i' } },
    ];
  }

  const sortMap = {
    updated: { updatedAt: -1 },
    created: { createdAt: -1 },
    title: { title: 1 },
    status: { published: -1, updatedAt: -1 },
  };

  const [portfolios, total, published] = await Promise.all([
    Portfolio.find(query).sort(sortMap[sort] || sortMap.updated).limit(100),
    Portfolio.countDocuments({ userId: req.user._id }),
    Portfolio.countDocuments({ userId: req.user._id, published: true }),
  ]);

  res.json({
    success: true,
    data: {
      portfolios: portfolios.map((portfolio) => {
        const json = portfolio.toOwnerJSON();
        // The dashboard list only needs summary fields.
        return {
          id: json.id,
          title: json.title,
          slug: json.slug,
          templateId: json.templateId,
          published: json.published,
          updatedAt: json.updatedAt,
          createdAt: json.createdAt,
          publishedAt: json.publishedAt,
          fullName: json.profile?.fullName || '',
          professionalTitle: json.profile?.title || '',
          projectCount: json.projects?.length || 0,
          hasAnalysis: Boolean(json.analysis?.score !== undefined),
          analysisScore: json.analysis?.score ?? null,
          analysisSource: json.analysis?.source ?? null,
          accent: json.theme?.accent,
        };
      }),
      stats: { total, published, drafts: total - published },
    },
  });
});

export const createPortfolio = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const content = defaultPortfolioContent();

  if (body.title) content.title = body.title;

  const canonicalTemplate = normalizeTemplateId(body.templateId || body.template);
  // Premium designs are gated server-side, not in the browser.
  assertTemplateAccess(req.user, canonicalTemplate);
  if (canonicalTemplate) {
    content.templateId = canonicalTemplate;
    const defaults = TEMPLATE_DEFAULTS[canonicalTemplate];
    if (defaults) {
      content.theme.accent = defaults.accent;
      content.theme.font = defaults.font;
    }
  }

  if (body.theme?.accent && /^#[0-9a-fA-F]{6}$/.test(body.theme.accent)) {
    content.theme.accent = body.theme.accent.toLowerCase();
  }

  content.profile.fullName = req.user.name;
  content.profile.contactEmail = req.user.email;

  const slug = await generateUniqueSlug(
    `${req.user.name}-${Date.now().toString(36).slice(-4)}`,
    (candidate) => slugTaken(candidate)
  );

  const portfolio = await Portfolio.create({
    ...content,
    userId: req.user._id,
    slug,
    published: false,
  });

  res.status(201).json({ success: true, data: { portfolio: portfolio.toOwnerJSON() } });
});

export const getPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await findOwnedPortfolio(req.params.id, req.user._id);
  res.json({ success: true, data: { portfolio: portfolio.toOwnerJSON() } });
});

export const updatePortfolio = asyncHandler(async (req, res) => {
  const portfolio = await findOwnedPortfolio(req.params.id, req.user._id);

  // Only content fields are accepted; userId, slug, published and analysis are
  // controlled by dedicated endpoints.
  const updates = normalizePortfolioBody(req.body || {});
  assertTemplateAccess(req.user, updates.templateId);
  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('No portfolio fields were supplied.');
  }

  // Give new portfolios a meaningful title once a name exists.
  if (!updates.title && (!portfolio.title || portfolio.title === 'Untitled portfolio')) {
    const name = updates.profile?.fullName || portfolio.profile?.fullName;
    if (name) portfolio.title = `${name} — Portfolio`.slice(0, 120);
  }

  Object.assign(portfolio, updates);
  await portfolio.save();

  res.json({ success: true, data: { portfolio: portfolio.toOwnerJSON() } });
});

export const duplicatePortfolio = asyncHandler(async (req, res) => {
  const source = await findOwnedPortfolio(req.params.id, req.user._id);
  const clone = source.toObject({ version: false });

  delete clone._id;
  delete clone.createdAt;
  delete clone.updatedAt;
  delete clone.publishedAt;
  clone.userId = req.user._id;
  clone.title = `${source.title} (copy)`.slice(0, 120);
  clone.published = false;
  clone.analysis = undefined;
  clone.slug = await generateUniqueSlug(`${source.slug || source.title}-copy`, (candidate) => slugTaken(candidate));

  const created = await Portfolio.create(clone);
  res.status(201).json({ success: true, data: { portfolio: created.toOwnerJSON() } });
});

export const setPublishState = asyncHandler(async (req, res) => {
  const portfolio = await findOwnedPortfolio(req.params.id, req.user._id);
  const { published } = req.body || {};

  if (typeof published !== 'boolean') {
    throw ApiError.badRequest('`published` must be true or false.');
  }

  if (published) {
    const missing = [];
    if (!portfolio.profile?.fullName?.trim()) missing.push('your full name');
    if (!portfolio.profile?.bio?.trim() && !portfolio.profile?.summary?.trim()) missing.push('a professional summary or biography');
    const hasContent =
      portfolio.projects?.length || portfolio.experience?.length || portfolio.education?.length || portfolio.skills?.length;
    if (!hasContent) missing.push('at least one of skills, education, experience or projects');
    if (missing.length) {
      throw ApiError.badRequest(
        `Before publishing, add ${missing.join(', ')}. You can keep working on the draft meanwhile.`
      );
    }

    if (!portfolio.slug) {
      portfolio.slug = await generateUniqueSlug(portfolio.profile.fullName || portfolio.title, (candidate) =>
        slugTaken(candidate)
      );
    }
    portfolio.published = true;
    portfolio.publishedAt = new Date();
  } else {
    portfolio.published = false;
  }

  await portfolio.save();
  res.json({ success: true, data: { portfolio: portfolio.toOwnerJSON() } });
});

export const deletePortfolio = asyncHandler(async (req, res) => {
  const portfolio = await findOwnedPortfolio(req.params.id, req.user._id);
  await Portfolio.deleteOne({ _id: portfolio._id });
  res.json({ success: true, data: { message: 'Portfolio deleted.', id: portfolio._id.toString() } });
});

export const saveAnalysis = async (portfolio, analysis) => {
  portfolio.analysis = analysis;
  await portfolio.save();
  return portfolio;
};

export { findOwnedPortfolio, slugTaken };
