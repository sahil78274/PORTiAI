import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { analyzeRules, enrichWithAi } from '../services/analyzerService.js';
import { generateContent, improveText } from '../services/aiService.js';
import { AiUnavailableError, isAiEnabled, AI_ERROR_MESSAGES } from '../services/geminiService.js';
import { assertAiBudget, recordAiUsage, getAiUsageToday } from '../services/aiUsageService.js';
import { findOwnedPortfolio } from './portfolioController.js';
import { hashPortfolioContent } from '../validators/portfolioInput.js';

const aiErrorBody = (error) => {
  const code = error.code || 'AI_UNAVAILABLE';
  const message = error.message || AI_ERROR_MESSAGES.UNAVAILABLE;
  return {
    success: false,
    error: {
      code,
      message,
      aiAvailable: isAiEnabled() && !['NOT_CONFIGURED', 'INVALID_KEY'].includes(code),
      ...(error.retryAfterSeconds ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
    },
  };
};

/** Turns provider failures into honest, non-leaky API responses. */
const handleAiError = (res, error) => {
  if (error instanceof AiUnavailableError) {
    const status = error.code === 'NOT_CONFIGURED' || error.code === 'INVALID_KEY' ? 503 : error.code === 'RATE' ? 429 : error.code === 'QUOTA' ? 429 : 502;
    return res.status(status).json(aiErrorBody(error));
  }
  if (error.status) {
    return res.status(error.status).json({
      success: false,
      error: { code: error.code || 'ERROR', message: error.message },
    });
  }
  throw error;
};

export const generate = asyncHandler(async (req, res) => {
  const { kind, input, portfolioId } = req.body;

  if (portfolioId) await findOwnedPortfolio(portfolioId, req.user._id);

  try {
    await assertAiBudget(req.user._id);
    const { result, model } = await generateContent({ kind, input });
    await recordAiUsage(req.user._id);
    const usage = await getAiUsageToday(req.user._id);
    res.json({ success: true, data: { kind, result, model, usage, source: 'ai' } });
  } catch (error) {
    if (error instanceof AiUnavailableError) return handleAiError(res, error);
    return handleAiError(res, error);
  }
});

export const improve = asyncHandler(async (req, res) => {
  const { kind, text, context } = req.body;
  try {
    await assertAiBudget(req.user._id);
    const { result, model } = await improveText({ kind, text, context });
    await recordAiUsage(req.user._id);
    const usage = await getAiUsageToday(req.user._id);
    res.json({ success: true, data: { kind, result, model, usage, source: 'ai' } });
  } catch (error) {
    return handleAiError(res, error);
  }
});

/**
 * Portfolio analysis.
 * Deterministic rules always run. AI feedback is layered on top only when it is
 * configured and requested, and any AI failure downgrades to rule-based results
 * instead of failing the request.
 */
export const analyze = asyncHandler(async (req, res) => {
  const portfolioId = req.params.id || req.body?.portfolioId;
  if (!portfolioId) throw ApiError.badRequest('A portfolio id is required to run analysis.');

  const portfolio = await findOwnedPortfolio(portfolioId, req.user._id);
  const force = Boolean(req.body?.force);
  const useAi = req.body?.useAi !== false;

  const contentHash = hashPortfolioContent(portfolio);
  const existing = portfolio.analysis;
  const hasStored = existing && typeof existing.score === 'number';

  if (!force && hasStored && existing.contentHash === contentHash) {
    return res.json({
      success: true,
      data: {
        analysis: existing,
        cached: true,
        aiAvailable: isAiEnabled(),
        usage: await getAiUsageToday(req.user._id),
      },
    });
  }

  const ruleResult = analyzeRules(portfolio);
  let analysis = ruleResult;
  let aiNotice = null;

  if (useAi && isAiEnabled()) {
    try {
      await assertAiBudget(req.user._id);
      const enriched = await enrichWithAi(portfolio, ruleResult);
      if (enriched.ok) {
        analysis = { ...enriched.result, contentHash, generatedAt: new Date() };
        await recordAiUsage(req.user._id);
      } else {
        aiNotice = enriched.reason;
      }
    } catch (error) {
      aiNotice =
        error instanceof AiUnavailableError || error.code === 'AI_DAILY_CAP_REACHED'
          ? `${error.message} The deterministic checks below are still accurate.`
          : 'AI feedback was unavailable, so only rule-based results are shown.';
    }
  } else if (useAi && !isAiEnabled()) {
    aiNotice = 'AI feedback is not configured on this server. Results below are from the rule-based analyzer only.';
  }

  portfolio.analysis = { ...analysis, aiNotice: analysis.aiNotice || aiNotice };
  await portfolio.save();

  res.json({
    success: true,
    data: {
      analysis: portfolio.analysis,
      cached: false,
      aiUsed: analysis.source === 'hybrid',
      aiAvailable: isAiEnabled(),
      usage: await getAiUsageToday(req.user._id),
      notice: aiNotice,
    },
  });
});

export const aiStatus = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      configured: isAiEnabled(),
      usage: await getAiUsageToday(req.user._id),
    },
  });
});
