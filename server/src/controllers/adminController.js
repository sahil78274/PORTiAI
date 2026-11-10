import { AiGeneration } from '../models/AiGeneration.js';
import { AiProject } from '../models/AiProject.js';
import { Payment } from '../models/Payment.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPricing } from '../config/pricing.js';

/**
 * Admin reporting.
 *
 * Read-only aggregates over the collections the billing and AI features write.
 * Nothing secret is returned: no Razorpay key secret, no webhook secret, no
 * password hash, no session token, no full payment instrument details.
 */

const pageParams = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(query.limit) || 25));
  return { page, limit, skip: (page - 1) * limit };
};

const emailsFor = async (ids) => {
  const unique = [...new Set(ids.filter(Boolean).map((id) => id.toString()))];
  if (!unique.length) return new Map();
  const users = await User.find({ _id: { $in: unique } }).select('email name').lean();
  return new Map(users.map((user) => [user._id.toString(), user.email]));
};

/** GET /api/admin/summary */
export const summary = asyncHandler(async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    totalUsers,
    premiumUsers,
    monthlyActive,
    yearlyActive,
    statusCounts,
    revenueAll,
    revenueMonth,
    revenueByKind,
    paymentsFailed,
    aiGenerations,
    aiGenerationsMonth,
    aiCreditsSpent,
    aiCreditsSpentMonth,
    aiFailures,
    aiProjects,
    webhookFailures,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ plan: 'premium', premiumUntil: { $gt: now } }),
    Subscription.countDocuments({ status: 'active', interval: 'monthly' }),
    Subscription.countDocuments({ status: 'active', interval: 'yearly' }),
    Subscription.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { status: 'captured' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([
      { $match: { status: 'captured', paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: '$kind', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.countDocuments({ status: 'failed' }),
    AiGeneration.countDocuments({}),
    AiGeneration.countDocuments({ createdAt: { $gte: monthStart } }),
    AiGeneration.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$credits' } } }]),
    AiGeneration.aggregate([
      { $match: { status: 'success', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$credits' } } },
    ]),
    AiGeneration.countDocuments({ status: 'failed' }),
    AiProject.countDocuments({ status: 'ready' }),
    WebhookEvent.countDocuments({ status: 'failed' }),
  ]);

  const statuses = Object.fromEntries(statusCounts.map((row) => [row._id, row.count]));
  const revenue = revenueAll[0]?.total || 0;
  const revenueThisMonth = revenueMonth[0]?.total || 0;

  const failedPayments = await Payment.find({ status: 'failed' })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  const failedEmails = await emailsFor(failedPayments.map((payment) => payment.userId));

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        free: Math.max(0, totalUsers - premiumUsers),
        conversionPercent: totalUsers ? Math.round((premiumUsers / totalUsers) * 100) : 0,
      },
      subscriptions: {
        active: statuses.active || 0,
        pending: statuses.pending || 0,
        failed: statuses.failed || 0,
        cancelled: statuses.cancelled || 0,
        expired: statuses.expired || 0,
        monthly: monthlyActive,
        yearly: yearlyActive,
        total: Object.values(statuses).reduce((sum, value) => sum + value, 0),
      },
      revenue: {
        currency: getPricing().currency,
        total: revenue,
        totalMajor: Math.round(revenue) / 100,
        thisMonth: revenueThisMonth,
        thisMonthMajor: Math.round(revenueThisMonth) / 100,
        byKind: revenueByKind.map((row) => ({
          kind: row._id,
          total: row.total,
          totalMajor: Math.round(row.total) / 100,
          count: row.count,
        })),
      },
      payments: {
        failed: paymentsFailed,
        recentFailed: failedPayments.map((payment) => ({
          id: payment._id.toString(),
          userEmail: failedEmails.get(payment.userId.toString()) || '',
          amount: payment.amount,
          amountMajor: Math.round(payment.amount) / 100,
          kind: payment.kind,
          failureReason: payment.failureReason || '',
          createdAt: payment.createdAt,
          providerPaymentId: payment.providerPaymentId || '',
        })),
      },
      ai: {
        available: true,
        generations: aiGenerations,
        generationsThisMonth: aiGenerationsMonth,
        creditsSpent: aiCreditsSpent[0]?.total || 0,
        creditsSpentThisMonth: aiCreditsSpentMonth[0]?.total || 0,
        failedGenerations: aiFailures,
        savedProjects: aiProjects,
        creditAllowancePerUser: process.env.AI_PROJECT_CREDITS_MONTHLY || 20,
      },
      webhooks: { failed: webhookFailures },
      generatedAt: now.toISOString(),
    },
  });
});

/** GET /api/admin/subscriptions */
export const listSubscriptions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.interval && req.query.interval !== 'all') query.interval = req.query.interval;

  const [rows, total] = await Promise.all([
    Subscription.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Subscription.countDocuments(query),
  ]);

  const users = await User.find({ _id: { $in: rows.map((row) => row.userId) } })
    .select('email name plan premiumUntil')
    .lean();
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  res.json({
    success: true,
    data: {
      subscriptions: rows.map((row) => {
        const user = userMap.get(row.userId.toString());
        const json = row.toAdminJSON(user?.email || '');
        return {
          ...json,
          userName: user?.name || '',
          userPlan: user?.plan || 'free',
          userPremiumUntil: user?.premiumUntil || null,
        };
      }),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/** GET /api/admin/payments */
export const listPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.kind && req.query.kind !== 'all') query.kind = req.query.kind;

  const [rows, total] = await Promise.all([
    Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(query),
  ]);
  const emailMap = await emailsFor(rows.map((row) => row.userId));

  res.json({
    success: true,
    data: {
      payments: rows.map((row) => row.toAdminJSON(emailMap.get(row.userId.toString()) || '')),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/** GET /api/admin/ai-usage — generations + saved projects + per-user totals. */
export const listAiUsage = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));

  const [generations, total, projects, projectTotal, perUser] = await Promise.all([
    AiGeneration.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AiGeneration.countDocuments({}),
    AiProject.find({}).sort({ createdAt: -1 }).limit(25).lean(),
    AiProject.countDocuments({}),
    AiGeneration.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id: '$userId',
          credits: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$credits', 0] } },
          generations: { $sum: 1 },
          failures: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
      { $sort: { credits: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const emailMap = await emailsFor([
    ...generations.map((row) => row.userId),
    ...projects.map((row) => row.userId),
    ...perUser.map((row) => row._id),
  ]);

  res.json({
    success: true,
    data: {
      generations: generations.map((row) => ({
        id: row._id.toString(),
        userEmail: emailMap.get(row.userId.toString()) || '',
        kind: row.kind,
        provider: row.provider,
        model: row.model,
        stack: row.stack,
        credits: row.credits,
        status: row.status,
        errorCode: row.errorCode || '',
        durationMs: row.durationMs,
        createdAt: row.createdAt,
      })),
      projects: projects.map((row) => ({
        id: row._id.toString(),
        userEmail: emailMap.get(row.userId.toString()) || '',
        title: row.title,
        stack: row.stack,
        complexity: row.complexity,
        status: row.status,
        fileCount: row.files?.length || 0,
        creditsUsed: row.creditsUsed,
        createdAt: row.createdAt,
      })),
      topUsers: perUser.map((row) => ({
        userEmail: emailMap.get(row._id?.toString()) || '',
        credits: row.credits,
        generations: row.generations,
        failures: row.failures,
      })),
      page,
      limit,
      total,
      projectTotal,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/** GET /api/admin/webhooks */
export const listWebhooks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const [events, total] = await Promise.all([
    WebhookEvent.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WebhookEvent.countDocuments({}),
  ]);
  res.json({
    success: true,
    data: {
      events: events.map((event) => ({
        id: event._id.toString(),
        eventId: event.eventId,
        eventType: event.eventType,
        status: event.status,
        signatureValid: event.signatureValid,
        attempts: event.attempts,
        summary: event.summary,
        error: event.error,
        createdAt: event.createdAt,
        processedAt: event.processedAt,
      })),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});
