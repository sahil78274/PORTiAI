import { z } from 'zod';
import { env } from '../config/env.js';
import { AiProject, PROJECT_COMPLEXITIES } from '../models/AiProject.js';
import { AiGeneration } from '../models/AiGeneration.js';
import { Portfolio } from '../models/Portfolio.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createZip, zipFilename } from '../utils/zip.js';
import { assertPremiumAccess } from '../services/subscriptionService.js';
import { consumeAiCredit, refundAiCredit, getAiCredits } from '../services/aiCreditService.js';
import {
  generateProject,
  regenerateFile,
  validateProject,
  buildStaticPreview,
  safeProjectPath,
  AI_PROJECT_ERRORS,
  PROJECT_STACKS as STACKS,
  COMPLEXITY_PROFILES,
} from '../services/projectBuilderService.js';
import { AiUnavailableError, isProjectAiConfigured } from '../services/aiProvider.js';

const ID_PATTERN = /^[a-f0-9]{24}$/i;

const generateSchema = z.object({
  idea: z.string().trim().min(12, 'Describe the project in a little more detail.').max(2000),
  stack: z.enum(Object.keys(STACKS)),
  complexity: z.enum(PROJECT_COMPLEXITIES).default('standard'),
  designPreferences: z.string().trim().max(800).optional().default(''),
  requestId: z.string().trim().max(80).optional().default(''),
});

const fileInstructionSchema = z.object({
  path: z.string().trim().min(1).max(300),
  instruction: z.string().trim().max(1200).optional().default(''),
  mode: z.enum(['regenerate', 'modify']).default('regenerate'),
});

const fileSaveSchema = z.object({
  path: z.string().trim().min(1).max(300),
  content: z.string().max(60000),
});

const addToPortfolioSchema = z.object({
  portfolioId: z.string().regex(ID_PATTERN, 'Choose a portfolio.'),
});

/** Maps provider failures to honest API responses without leaking internals. */
const handleAiError = (res, error) => {
  if (error instanceof AiUnavailableError) {
    const statusMap = {
      NOT_CONFIGURED: 503,
      INVALID_KEY: 503,
      PERMISSION: 503,
      MODEL_NOT_FOUND: 503,
      RATE: 429,
      QUOTA: 429,
      TIMEOUT: 504,
      UNAVAILABLE: 503,
      TRUNCATED: 502,
      BLOCKED: 422,
      BAD_RESPONSE: 502,
      INCOMPLETE_PROJECT: 502,
    };
    const status = statusMap[error.code] || 502;
    return res.status(status).json({
      success: false,
      error: {
        code: error.code || 'AI_UNAVAILABLE',
        message: error.message || AI_PROJECT_ERRORS.UNAVAILABLE,
        aiAvailable: isProjectAiConfigured() && !['NOT_CONFIGURED', 'INVALID_KEY', 'PERMISSION', 'MODEL_NOT_FOUND'].includes(error.code),
        ...(error.retryAfterSeconds ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
      },
    });
  }
  if (error?.status) {
    return res.status(error.status).json({
      success: false,
      error: { code: error.code || 'ERROR', message: error.message, ...(error.details ? { details: error.details } : {}) },
    });
  }
  throw error;
};

const findOwnedProject = async (id, userId) => {
  if (!ID_PATTERN.test(String(id))) throw ApiError.badRequest('That project id is not valid.');
  const project = await AiProject.findOne({ _id: id, userId });
  if (!project) throw ApiError.notFound('Project not found.');
  return project;
};

const recordGeneration = async ({ userId, projectId, kind, stack, result, startedAt, status = 'success', errorCode = '' }) => {
  await AiGeneration.create({
    userId,
    projectId: projectId || null,
    kind,
    provider: result?.provider || '',
    model: result?.model || '',
    stack: stack || '',
    credits: 1,
    status,
    errorCode: errorCode || '',
    promptChars: result?.promptChars || 0,
    outputChars: Array.isArray(result?.files)
      ? result.files.reduce((sum, file) => sum + (file.content?.length || 0), 0)
      : 0,
    durationMs: result?.stats?.durationMs || Date.now() - startedAt,
  }).catch(() => {
    /* auditing must never fail a generation */
  });
};

/** GET /api/ai-projects/credits */
export const credits = asyncHandler(async (req, res) => {
  assertPremiumAccess(req.user);
  res.json({
    success: true,
    data: { credits: await getAiCredits(req.user), aiAvailable: isProjectAiConfigured() },
  });
});

/** GET /api/ai-projects */
export const listProjects = asyncHandler(async (req, res) => {
  assertPremiumAccess(req.user);
  const [found, creditsSummary] = await Promise.all([
    AiProject.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(60),
    getAiCredits(req.user),
  ]);
  const projects = [];
  for (const project of found) {
    projects.push(await failStaleProject(project));
  }
  res.json({
    success: true,
    data: { projects: projects.map((project) => project.toSummaryJSON()), credits: creditsSummary },
  });
});

/** GET /api/ai-projects/:id */
export const getProject = asyncHandler(async (req, res) => {
  assertPremiumAccess(req.user);
  const found = await findOwnedProject(req.params.id, req.user._id);
  const project = await failStaleProject(found);
  res.json({
    success: true,
    data: {
      project: project.toOwnerJSON(),
      issues: project.status === 'ready' ? validateProject({ files: project.files, stack: project.stack, entryFile: project.entryFile }) : [],
      credits: await getAiCredits(req.user),
    },
  });
});

const STALE_AFTER_MS = () => env.ai.projectTimeoutMs + 120000;

const isStaleGenerating = (project) =>
  project?.status === 'generating' &&
  Date.now() - new Date(project.updatedAt).getTime() > STALE_AFTER_MS();

/** Marks a generation abandoned by a crashed/restarted process and refunds it once. */
const failStaleProject = async (project) => {
  if (!isStaleGenerating(project)) return project;
  const refundable = Number(project.creditsUsed) > 0;
  const updated = await AiProject.findOneAndUpdate(
    { _id: project._id, status: 'generating' },
    {
      $set: {
        status: 'failed',
        creditsUsed: 0,
        errorCode: 'INTERRUPTED',
        errorMessage: 'The previous generation was interrupted before it finished. The credit was returned.',
      },
    },
    { new: true }
  );
  if (updated && refundable) await refundAiCredit(project.userId);
  return updated || project;
};

/**
 * POST /api/ai-projects/generate
 *
 * Premium-only, credit-metered and idempotent per `requestId`. A project record
 * is created before the provider call so concurrent double-clicks are stopped
 * by the unique (userId, requestId) index. The project only becomes `ready`
 * after every manifest file has been generated and validated; failures are
 * recorded and the credit is refunded.
 */
export const generate = asyncHandler(async (req, res) => {
  assertPremiumAccess(
    req.user,
    'The AI Project Builder is part of PortiAI Premium. Upgrade to generate real projects and add them to your portfolio.'
  );

  if (!isProjectAiConfigured()) {
    throw ApiError.serviceUnavailable(AI_PROJECT_ERRORS.NOT_CONFIGURED, 'AI_NOT_CONFIGURED');
  }

  const input = generateSchema.parse(req.body || {});
  const stack = STACKS[input.stack];

  const respondWithExisting = async (existing) => {
    const current = await failStaleProject(existing);
    if (current.status === 'ready') {
      res.json({
        success: true,
        data: {
          project: current.toOwnerJSON(),
          credits: await getAiCredits(req.user),
          replayed: true,
        },
      });
      return true;
    }
    if (current.status === 'generating') {
      throw ApiError.conflict('This project is already being generated. Wait for it to finish.');
    }
    await current.deleteOne();
    return false;
  };

  if (input.requestId) {
    const existing = await AiProject.findOne({ userId: req.user._id, requestId: input.requestId });
    if (existing && (await respondWithExisting(existing))) return;
  }

  const startedAt = Date.now();
  let project;
  try {
    project = await AiProject.create({
      userId: req.user._id,
      requestId: input.requestId || undefined,
      title: 'Generating project…',
      idea: input.idea,
      stack: input.stack,
      stackLabel: stack.label,
      complexity: input.complexity,
      designPreferences: input.designPreferences,
      status: 'generating',
      creditsUsed: 0,
    });
  } catch (error) {
    // A concurrent request won the unique requestId race. Replay/stop instead
    // of spending a second credit.
    if (error?.code === 11000 && input.requestId) {
      const existing = await AiProject.findOne({ userId: req.user._id, requestId: input.requestId });
      if (existing && (await respondWithExisting(existing))) return;
      throw ApiError.conflict('A generation with this request id is already running. Wait for it to finish.');
    }
    throw error;
  }

  let credits;
  try {
    credits = await consumeAiCredit(req.user);
  } catch (error) {
    await project.deleteOne().catch(() => {});
    throw error;
  }

  try {
    project.creditsUsed = 1;
    await project.save();
  } catch (error) {
    await refundAiCredit(req.user._id).catch(() => {});
    await project.deleteOne().catch(() => {});
    throw error;
  }

  try {
    const result = await generateProject({
      idea: input.idea,
      stack: input.stack,
      complexity: input.complexity,
      designPreferences: input.designPreferences,
      requestId: input.requestId || project._id.toString(),
    });

    project.title = result.title;
    project.description = result.description;
    project.techStack = result.techStack;
    project.dependencies = result.dependencies;
    project.setupSteps = result.setupSteps;
    project.apiEndpoints = result.apiEndpoints || [];
    project.files = result.files;
    project.entryFile = result.entryFile;
    project.readme = result.readme;
    project.previewHtml = result.previewHtml;
    project.previewSupported = result.previewSupported;
    project.stackLabel = result.stackLabel;
    project.provider = result.provider;
    project.model = result.model;
    project.status = 'ready';
    project.generatedAt = new Date();
    project.errorCode = '';
    project.errorMessage = '';
    await project.save();

    await recordGeneration({
      userId: req.user._id,
      projectId: project._id,
      kind: 'project',
      stack: input.stack,
      result,
      startedAt,
    });

    res.status(201).json({
      success: true,
      data: {
        project: project.toOwnerJSON(),
        issues: result.issues,
        credits: await getAiCredits(req.user),
        creditsBefore: {
          ...credits,
          used: Math.max(0, credits.used - 1),
          remaining: credits.remaining + 1,
        },
        stats: result.stats,
      },
    });
  } catch (error) {
    await refundAiCredit(req.user._id);
    project.status = 'failed';
    project.creditsUsed = 0;
    project.errorCode = error.code || 'GENERATION_FAILED';
    project.errorMessage = String(error.message || 'Generation failed').slice(0, 600);
    await project.save().catch(() => {});
    await recordGeneration({
      userId: req.user._id,
      projectId: project._id,
      kind: 'project',
      stack: input.stack,
      result: null,
      startedAt,
      status: 'failed',
      errorCode: project.errorCode,
    });
    return handleAiError(res, error);
  }
});

/**
 * POST /api/ai-projects/:id/files/regenerate
 * Regenerates or modifies a single file. Costs one credit.
 */
export const regenerateProjectFile = asyncHandler(async (req, res) => {
  assertPremiumAccess(req.user);
  const project = await findOwnedProject(req.params.id, req.user._id);
  if (project.status !== 'ready') throw ApiError.badRequest('This project is not ready yet.');

  const input = fileInstructionSchema.parse(req.body || {});
  const path = safeProjectPath(input.path);
  if (!path || !project.files.some((file) => file.path === path)) {
    throw ApiError.badRequest('That file is not part of this project.');
  }

  await consumeAiCredit(req.user);
  const startedAt = Date.now();

  try {
    const generated = await regenerateFile({
      project: project.toOwnerJSON(),
      filePath: path,
      instruction: input.instruction,
      mode: input.mode,
      requestId: project._id.toString(),
    });

    const file = project.files.find((item) => item.path === path);
    file.content = generated.content;
    file.updatedAt = new Date();

    if (path === 'README.md') project.readme = generated.content;
    project.previewHtml =
      project.stack === 'html-css-js' ? buildStaticPreview(project.files, project.entryFile) || '' : '';
    project.previewSupported = Boolean(project.previewHtml);
    project.model = generated.model || project.model;
    project.provider = generated.provider || project.provider;
    await project.save();

    await recordGeneration({
      userId: req.user._id,
      projectId: project._id,
      kind: input.mode === 'modify' ? 'modify-file' : 'regenerate-file',
      stack: project.stack,
      result: generated,
      startedAt,
    });

    res.json({
      success: true,
      data: {
        project: project.toOwnerJSON(),
        issues: validateProject({ files: project.files, stack: project.stack, entryFile: project.entryFile }),
        credits: await getAiCredits(req.user),
      },
    });
  } catch (error) {
    await refundAiCredit(req.user._id);
    await recordGeneration({
      userId: req.user._id,
      projectId: project._id,
      kind: input.mode === 'modify' ? 'modify-file' : 'regenerate-file',
      stack: project.stack,
      result: null,
      startedAt,
      status: 'failed',
      errorCode: error.code || 'GENERATION_FAILED',
    });
    return handleAiError(res, error);
  }
});

/** PATCH /api/ai-projects/:id/files — manual edit, no credit used. */
export const saveProjectFile = asyncHandler(async (req, res) => {
  assertPremiumAccess(req.user);
  const project = await findOwnedProject(req.params.id, req.user._id);
  const input = fileSaveSchema.parse(req.body || {});
  const path = safeProjectPath(input.path);
  const file = project.files.find((item) => item.path === path);
  if (!file) throw ApiError.notFound('That file is not part of this project.');

  file.content = input.content;
  file.updatedAt = new Date();
  if (path === 'README.md') project.readme = input.content;
  project.previewHtml =
    project.stack === 'html-css-js' ? buildStaticPreview(project.files, project.entryFile) || '' : '';
  project.previewSupported = Boolean(project.previewHtml);
  await project.save();

  res.json({
    success: true,
    data: {
      project: project.toOwnerJSON(),
      issues: validateProject({ files: project.files, stack: project.stack, entryFile: project.entryFile }),
    },
  });
});

/** POST /api/ai-projects/:id/regenerate — rebuilds the entire project (1 credit). */
export const regenerateProject = asyncHandler(async (req, res) => {
  assertPremiumAccess(req.user);
  const project = await findOwnedProject(req.params.id, req.user._id);
  if (!isProjectAiConfigured()) {
    throw ApiError.serviceUnavailable('AI project generation is not configured on this server.', 'AI_NOT_CONFIGURED');
  }

  await consumeAiCredit(req.user);
  const startedAt = Date.now();

  try {
    const result = await generateProject({
      idea: project.idea,
      stack: project.stack,
      complexity: project.complexity,
      designPreferences: project.designPreferences,
      requestId: project._id.toString(),
    });

    project.title = result.title;
    project.description = result.description;
    project.techStack = result.techStack;
    project.dependencies = result.dependencies;
    project.setupSteps = result.setupSteps;
    project.apiEndpoints = result.apiEndpoints || [];
    project.files = result.files;
    project.entryFile = result.entryFile;
    project.readme = result.readme;
    project.previewHtml = result.previewHtml;
    project.previewSupported = result.previewSupported;
    project.provider = result.provider;
    project.model = result.model;
    project.status = 'ready';
    project.generatedAt = new Date();
    project.creditsUsed += 1;
    project.errorCode = '';
    project.errorMessage = '';
    await project.save();

    await recordGeneration({
      userId: req.user._id,
      projectId: project._id,
      kind: 'project',
      stack: project.stack,
      result,
      startedAt,
    });

    res.json({
      success: true,
      data: {
        project: project.toOwnerJSON(),
        issues: result.issues,
        credits: await getAiCredits(req.user),
      },
    });
  } catch (error) {
    await refundAiCredit(req.user._id);
    await recordGeneration({
      userId: req.user._id,
      projectId: project._id,
      kind: 'project',
      stack: project.stack,
      result: null,
      startedAt,
      status: 'failed',
      errorCode: error.code || 'GENERATION_FAILED',
    });
    return handleAiError(res, error);
  }
});

/** GET /api/ai-projects/:id/download — ZIP of every file. */
export const downloadProject = asyncHandler(async (req, res) => {
  assertPremiumAccess(req.user);
  const project = await findOwnedProject(req.params.id, req.user._id);
  if (project.status !== 'ready') throw ApiError.badRequest('This project is not ready to download yet.');

  const archive = createZip(
    project.files.map((file) => ({ path: file.path, content: file.content }))
  );

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename(project.title)}"`);
  res.setHeader('Content-Length', String(archive.length));
  res.setHeader('Cache-Control', 'no-store');
  res.send(archive);
});

/**
 * POST /api/ai-projects/:id/add-to-portfolio
 * Appends the generated project to one of the caller's portfolios.
 */
export const addToPortfolio = asyncHandler(async (req, res) => {
  assertPremiumAccess(req.user);
  const project = await findOwnedProject(req.params.id, req.user._id);
  if (project.status !== 'ready') throw ApiError.badRequest('This project is not ready yet.');

  const { portfolioId } = addToPortfolioSchema.parse(req.body || {});
  const portfolio = await Portfolio.findOne({ _id: portfolioId, userId: req.user._id });
  if (!portfolio) throw ApiError.notFound('Portfolio not found.');

  if (portfolio.projects.length >= 20) {
    throw ApiError.badRequest('That portfolio already has the maximum of 20 projects. Remove one first.');
  }

  const technologies = project.techStack.slice(0, 12);
  const summary = project.description || project.idea;
  portfolio.projects.push({
    name: project.title.slice(0, 160),
    description: summary.slice(0, 2500),
    technologies,
    projectUrl: '',
    githubUrl: '',
    contributions: '',
    imageUrl: '',
    imageAlt: '',
  });
  await portfolio.save();

  res.status(201).json({
    success: true,
    data: {
      portfolio: {
        id: portfolio._id.toString(),
        title: portfolio.title,
        slug: portfolio.slug,
        projectCount: portfolio.projects.length,
      },
      message: `Added "${project.title}" to ${portfolio.title}. Upload a screenshot from the portfolio editor.`,
    },
  });
});

/** DELETE /api/ai-projects/:id */
export const deleteProject = asyncHandler(async (req, res) => {
  assertPremiumAccess(req.user);
  const project = await findOwnedProject(req.params.id, req.user._id);
  await project.deleteOne();
  res.json({ success: true, data: { message: 'Project deleted.' } });
});

/** GET /api/ai-projects/meta — stacks and limits for the builder UI. */
export const meta = asyncHandler(async (req, res) => {
  assertPremiumAccess(req.user);
  res.json({
    success: true,
    data: {
      stacks: Object.entries(STACKS).map(([id, stack]) => ({ id, label: stack.label, kind: stack.kind, guidance: stack.guidance })),
      complexities: PROJECT_COMPLEXITIES,
      modes: PROJECT_COMPLEXITIES.map((id) => ({
        id,
        label: COMPLEXITY_PROFILES[id].label,
        guidance: COMPLEXITY_PROFILES[id].guidance,
      })),
      aiAvailable: isProjectAiConfigured(),
      provider: env.ai.provider,
      timeoutSeconds: Math.round(env.ai.projectTimeoutMs / 1000),
    },
  });
});
