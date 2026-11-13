import mongoose from 'mongoose';
import { AiGeneration } from '../models/AiGeneration.js';
import { AiProject } from '../models/AiProject.js';
import { Payment } from '../models/Payment.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { Portfolio } from '../models/Portfolio.js';
import { BlogPost } from '../models/BlogPost.js';
import { Upload } from '../models/Upload.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { TemplateSetting } from '../models/TemplateSetting.js';
import { AiUsage } from '../services/aiUsageService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getPricing } from '../config/pricing.js';
import { TEMPLATE_CATALOGUE } from '../utils/portfolioDefaults.js';
import { logAdminAction } from '../services/adminAuditService.js';

/**
 * Admin reporting and management.
 *
 * Every handler here runs behind `requireAuth` + `requireAdmin` (see
 * routes/adminRoutes.js), so `req.user` is always a fresh administrator
 * document. Nothing secret is ever returned: no password hashes, no session
 * tokens, no Razorpay key/webhook secrets, no card details, no AI prompts.
 *
 * Sensitive mutations (suspend, delete, grant/revoke Premium, unpublish,
 * template toggles, password change) write an AdminAuditLog entry.
 */

const ID_PATTERN = /^[a-f0-9]{24}$/i;

const pageParams = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(query.limit) || 25));
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const searchRegex = (value) => new RegExp(escapeRegExp(String(value).trim().slice(0, 120)), 'i');

/** Parses ?from=&to= ISO dates into a createdAt range, ignoring invalid values. */
const dateRangeFilter = (query) => {
  const range = {};
  if (query.from) {
    const from = new Date(query.from);
    if (!Number.isNaN(from.getTime())) range.$gte = from;
  }
  if (query.to) {
    const to = new Date(query.to);
    if (!Number.isNaN(to.getTime())) range.$lte = to;
  }
  return Object.keys(range).length ? range : null;
};

const emailsFor = async (ids) => {
  const unique = [...new Set(ids.filter(Boolean).map((id) => id.toString()))];
  if (!unique.length) return new Map();
  const users = await User.find({ _id: { $in: unique } }).select('email name').lean();
  return new Map(users.map((user) => [user._id.toString(), user.email]));
};

/** User ids whose name or email matches a search term (for cross-collection filters). */
const userIdsForSearch = async (search) => {
  if (!search || !String(search).trim()) return null;
  const regex = searchRegex(search);
  const users = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id').lean();
  return users.map((user) => user._id);
};

/** Per-user counts for a page of users, in three grouped aggregations. */
const countsForUsers = async (ids) => {
  const map = new Map(ids.map((id) => [id.toString(), { portfolios: 0, aiProjects: 0, payments: 0 }]));
  if (!ids.length) return map;
  const [portfolios, projects, payments] = await Promise.all([
    Portfolio.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
    AiProject.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
  ]);
  portfolios.forEach((row) => map.get(row._id.toString()) && (map.get(row._id.toString()).portfolios = row.count));
  projects.forEach((row) => map.get(row._id.toString()) && (map.get(row._id.toString()).aiProjects = row.count));
  payments.forEach((row) => map.get(row._id.toString()) && (map.get(row._id.toString()).payments = row.count));
  return map;
};

const toUserAdminJSON = (user, counts = {}) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  headline: user.headline || '',
  plan: user.plan || 'free',
  premiumSince: user.premiumSince || null,
  premiumUntil: user.premiumUntil || null,
  premiumSource: user.premiumSource || 'none',
  role: user.role || 'user',
  isAdmin: user.role === 'admin',
  status: user.status || 'active',
  suspendedAt: user.suspendedAt || null,
  lastLoginAt: user.lastLoginAt || null,
  aiCredits: user.aiCredits || { limit: 0, used: 0 },
  portfolioCount: counts.portfolios ?? 0,
  aiProjectCount: counts.aiProjects ?? 0,
  paymentCount: counts.payments ?? 0,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const findTargetUser = async (id) => {
  if (!ID_PATTERN.test(String(id))) throw ApiError.badRequest('That user id is not valid.');
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found.');
  return user;
};

/**
 * Guards every destructive admin action: an admin can never suspend, delete
 * or otherwise manage their own account, and administrator accounts are
 * never managed through the user-management endpoints (role changes happen
 * only via the operator script or ADMIN_EMAILS).
 */
const assertCanManageUser = (req, target, verb) => {
  if (target._id.toString() === req.user._id.toString()) {
    throw ApiError.badRequest(`You cannot ${verb} your own administrator account.`);
  }
  if (target.role === 'admin') {
    throw ApiError.badRequest(`Administrator accounts cannot be ${verb} from user management.`);
  }
};

const assertNotLastAdmin = async (target) => {
  if (target.role !== 'admin') return;
  const admins = await User.countDocuments({ role: 'admin' });
  if (admins <= 1) throw ApiError.badRequest('This is the last administrator account and cannot be removed.');
};

/* ------------------------------------------------------------------ */
/* CSV helpers                                                         */
/* ------------------------------------------------------------------ */

const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const sendCsv = (res, filename, headers, rows) => {
  const body = [headers.join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
};

/* ------------------------------------------------------------------ */
/* Overview / summary                                                  */
/* ------------------------------------------------------------------ */

/** GET /api/admin/summary */
export const summary = asyncHandler(async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    totalUsers,
    premiumUsers,
    activeUsers,
    suspendedUsers,
    adminUsers,
    newThisMonth,
    totalPortfolios,
    publishedPortfolios,
    monthlyActive,
    yearlyActive,
    statusCounts,
    revenueAll,
    revenueMonth,
    revenueByKind,
    paymentsFailed,
    paymentsCaptured,
    paymentsTotal,
    aiGenerations,
    aiGenerationsMonth,
    aiCreditsSpent,
    aiCreditsSpentMonth,
    aiFailures,
    aiProjects,
    webhookFailures,
    registrationsByMonth,
    revenueByMonth,
    recentRegistrations,
    recentPayments,
    recentActivities,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ plan: 'premium', premiumUntil: { $gt: now } }),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'suspended' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    Portfolio.countDocuments({}),
    Portfolio.countDocuments({ published: true }),
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
    Payment.countDocuments({ status: 'captured' }),
    Payment.countDocuments({}),
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
    User.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { status: 'captured', paidAt: { $ne: null } } },
      {
        $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
    User.find({}).sort({ createdAt: -1 }).limit(5).select('name email plan status createdAt').lean(),
    Payment.find({ status: 'captured' }).sort({ paidAt: -1 }).limit(5).lean(),
    AdminAuditLog.find({}).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const statuses = Object.fromEntries(statusCounts.map((row) => [row._id, row.count]));
  const revenue = revenueAll[0]?.total || 0;
  const revenueThisMonth = revenueMonth[0]?.total || 0;

  const monthSeries = (rows, valueKey) => {
    const byKey = new Map(rows.map((row) => [`${row._id.year}-${row._id.month}`, row[valueKey] ?? row.count ?? 0]));
    const out = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
      out.push({
        month: d.toISOString().slice(0, 7),
        label: d.toLocaleString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
        value: byKey.get(key) || 0,
      });
    }
    return out;
  };

  const failedPayments = await Payment.find({ status: 'failed' })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  const failedEmails = await emailsFor(failedPayments.map((payment) => payment.userId));
  const recentPaymentEmails = await emailsFor(recentPayments.map((payment) => payment.userId));

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        free: Math.max(0, totalUsers - premiumUsers),
        active: activeUsers,
        suspended: suspendedUsers,
        admins: adminUsers,
        newThisMonth,
        conversionPercent: totalUsers ? Math.round((premiumUsers / totalUsers) * 100) : 0,
      },
      portfolios: {
        total: totalPortfolios,
        published: publishedPortfolios,
        drafts: Math.max(0, totalPortfolios - publishedPortfolios),
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
        successful: paymentsCaptured,
        failed: paymentsFailed,
        total: paymentsTotal,
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
      charts: {
        registrationsByMonth: monthSeries(registrationsByMonth, 'count'),
        revenueByMonth: monthSeries(revenueByMonth, 'total').map((row) => ({
          ...row,
          value: Math.round(row.value) / 100,
        })),
      },
      recentRegistrations: recentRegistrations.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        status: user.status || 'active',
        createdAt: user.createdAt,
      })),
      recentPayments: recentPayments.map((payment) => ({
        id: payment._id.toString(),
        userEmail: recentPaymentEmails.get(payment.userId.toString()) || '',
        amount: payment.amount,
        amountMajor: Math.round(payment.amount) / 100,
        kind: payment.kind,
        status: payment.status,
        paidAt: payment.paidAt,
        providerPaymentId: payment.providerPaymentId || '',
      })),
      recentActivities: recentActivities.map((entry) => ({
        id: entry._id.toString(),
        adminEmail: entry.adminEmail,
        action: entry.action,
        targetEmail: entry.targetEmail || '',
        createdAt: entry.createdAt,
      })),
      generatedAt: now.toISOString(),
    },
  });
});

/* ------------------------------------------------------------------ */
/* User management                                                     */
/* ------------------------------------------------------------------ */

/** GET /api/admin/users */
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const query = {};
  if (req.query.plan && req.query.plan !== 'all') query.plan = req.query.plan;
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.search && String(req.query.search).trim()) {
    const regex = searchRegex(req.query.search);
    query.$or = [{ name: regex }, { email: regex }];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name: { name: 1 },
    email: { email: 1 },
  };

  const [rows, total] = await Promise.all([
    User.find(query).sort(sortMap[req.query.sort] || sortMap.newest).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);
  const counts = await countsForUsers(rows.map((row) => row._id));

  res.json({
    success: true,
    data: {
      users: rows.map((row) => toUserAdminJSON(row, counts.get(row._id.toString()))),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/** GET /api/admin/users/:id */
export const getUser = asyncHandler(async (req, res) => {
  const user = await findTargetUser(req.params.id);
  const [counts, subscription, payments, portfolios, generations] = await Promise.all([
    countsForUsers([user._id]),
    Subscription.findOne({ userId: user._id }).lean(),
    Payment.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Portfolio.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(20).lean(),
    AiGeneration.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          credits: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$credits', 0] } },
        },
      },
    ]),
  ]);
  const paymentEmails = await emailsFor(payments.map((payment) => payment.userId));

  res.json({
    success: true,
    data: {
      user: toUserAdminJSON(user, counts.get(user._id.toString())),
      subscription: subscription
        ? {
            id: subscription._id.toString(),
            status: subscription.status,
            interval: subscription.interval,
            amount: subscription.amount,
            currency: subscription.currency,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            startedAt: subscription.startedAt,
            endedAt: subscription.endedAt,
            provider: subscription.provider,
            note: subscription.note || '',
          }
        : null,
      payments: payments.map((payment) => ({
        id: payment._id.toString(),
        userEmail: paymentEmails.get(payment.userId.toString()) || '',
        kind: payment.kind,
        status: payment.status,
        amount: payment.amount,
        amountMajor: Math.round(payment.amount) / 100,
        currency: payment.currency,
        providerPaymentId: payment.providerPaymentId || '',
        providerOrderId: payment.providerOrderId || '',
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      })),
      portfolios: portfolios.map((portfolio) => ({
        id: portfolio._id.toString(),
        title: portfolio.title,
        slug: portfolio.slug || null,
        templateId: portfolio.templateId,
        published: portfolio.published,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt,
      })),
      aiUsage: generations[0] || { total: 0, success: 0, failed: 0, credits: 0 },
    },
  });
});

/** PATCH /api/admin/users/:id/suspend */
export const suspendUser = asyncHandler(async (req, res) => {
  const target = await findTargetUser(req.params.id);
  assertCanManageUser(req, target, 'suspend');
  if (target.status === 'suspended') throw ApiError.badRequest('This account is already suspended.');

  const reason = String(req.body?.reason || '').trim().slice(0, 500);
  target.status = 'suspended';
  target.suspendedAt = new Date();
  // Bump the token version so every live session stops working immediately.
  target.tokenVersion = (target.tokenVersion ?? 0) + 1;
  await target.save();

  await logAdminAction(req, {
    action: 'user.suspend',
    targetType: 'user',
    targetId: target._id.toString(),
    targetEmail: target.email,
    details: { reason },
  });

  res.json({ success: true, data: { user: toUserAdminJSON(target), message: 'Account suspended. All active sessions have been signed out.' } });
});

/** PATCH /api/admin/users/:id/reactivate */
export const reactivateUser = asyncHandler(async (req, res) => {
  const target = await findTargetUser(req.params.id);
  assertCanManageUser(req, target, 'reactivate');
  if (target.status !== 'suspended') throw ApiError.badRequest('This account is not suspended.');

  target.status = 'active';
  target.suspendedAt = null;
  await target.save();

  await logAdminAction(req, {
    action: 'user.reactivate',
    targetType: 'user',
    targetId: target._id.toString(),
    targetEmail: target.email,
  });

  res.json({ success: true, data: { user: toUserAdminJSON(target), message: 'Account reactivated.' } });
});

/** DELETE /api/admin/users/:id */
export const deleteUser = asyncHandler(async (req, res) => {
  const target = await findTargetUser(req.params.id);
  assertCanManageUser(req, target, 'delete');
  await assertNotLastAdmin(target);

  const targetId = target._id;
  const targetEmail = target.email;
  await Promise.all([
    Portfolio.deleteMany({ userId: targetId }),
    BlogPost.deleteMany({ userId: targetId }),
    Upload.deleteMany({ userId: targetId }),
    Payment.deleteMany({ userId: targetId }),
    Subscription.deleteOne({ userId: targetId }),
    AiProject.deleteMany({ userId: targetId }),
    AiGeneration.deleteMany({ userId: targetId }),
  ]);
  await User.deleteOne({ _id: targetId });

  await logAdminAction(req, {
    action: 'user.delete',
    targetType: 'user',
    targetId: targetId.toString(),
    targetEmail,
  });

  res.json({ success: true, data: { message: 'User and all associated data deleted.', id: targetId.toString() } });
});

/* ------------------------------------------------------------------ */
/* Premium grant / revoke (explicit admin action, always audited)      */
/* ------------------------------------------------------------------ */

/**
 * POST /api/admin/users/:id/grant-premium
 *
 * The only way Premium is granted without a verified Razorpay payment.
 * Creates a `manual` payment record so billing history stays consistent
 * with the entitlement.
 */
export const grantPremium = asyncHandler(async (req, res) => {
  const target = await findTargetUser(req.params.id);
  const months = Math.min(36, Math.max(1, Number(req.body?.months) || 1));
  const reason = String(req.body?.reason || '').trim().slice(0, 500);

  const now = new Date();
  const existing = target.premiumUntil ? new Date(target.premiumUntil) : null;
  const base = existing && existing.getTime() > now.getTime() ? existing : now;
  const until = new Date(base);
  until.setMonth(until.getMonth() + months);

  target.plan = 'premium';
  target.premiumSince = target.premiumSince || now;
  target.premiumUntil = until;
  target.premiumSource = 'grant';
  await target.save();

  let subscription = await Subscription.findOne({ userId: target._id });
  if (subscription) {
    subscription.provider = 'none';
    subscription.status = 'active';
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = until;
    subscription.startedAt = subscription.startedAt || now;
    subscription.endedAt = null;
    subscription.cancelAtPeriodEnd = false;
    subscription.cancelledAt = null;
    subscription.cancelEffectiveAt = null;
    subscription.note = `Premium granted manually by an administrator for ${months} month(s).${reason ? ` Reason: ${reason}` : ''}`.slice(0, 500);
    await subscription.save();
  } else {
    subscription = await Subscription.create({
      userId: target._id,
      provider: 'none',
      status: 'active',
      interval: null,
      amount: 0,
      currency: 'INR',
      currentPeriodStart: now,
      currentPeriodEnd: until,
      startedAt: now,
      note: `Premium granted manually by an administrator for ${months} month(s).${reason ? ` Reason: ${reason}` : ''}`.slice(0, 500),
    });
  }

  await Payment.create({
    userId: target._id,
    subscriptionId: subscription._id,
    provider: 'manual',
    kind: 'manual',
    status: 'captured',
    amount: 0,
    currency: 'INR',
    signatureVerified: false,
    description: `Manual Premium grant by admin (${months} month(s))`,
    paidAt: now,
  });

  await logAdminAction(req, {
    action: 'premium.grant',
    targetType: 'user',
    targetId: target._id.toString(),
    targetEmail: target.email,
    details: { months, until: until.toISOString(), reason },
  });

  res.json({
    success: true,
    data: {
      user: toUserAdminJSON(target),
      subscription: subscription.toAdminJSON(target.email),
      message: `Premium granted until ${until.toISOString().slice(0, 10)}.`,
    },
  });
});

/** POST /api/admin/users/:id/revoke-premium */
export const revokePremium = asyncHandler(async (req, res) => {
  const target = await findTargetUser(req.params.id);
  const reason = String(req.body?.reason || '').trim().slice(0, 500);
  if (target.plan !== 'premium') throw ApiError.badRequest('This account is not on Premium.');

  target.plan = 'free';
  target.premiumUntil = null;
  target.premiumSource = 'none';
  await target.save();

  const subscription = await Subscription.findOne({ userId: target._id });
  if (subscription && ['active', 'pending', 'failed'].includes(subscription.status)) {
    subscription.status = 'cancelled';
    subscription.cancelAtPeriodEnd = false;
    subscription.cancelledAt = new Date();
    subscription.cancelEffectiveAt = new Date();
    subscription.endedAt = new Date();
    subscription.note = `Premium revoked by an administrator.${reason ? ` Reason: ${reason}` : ''}`.slice(0, 500);
    await subscription.save();
  }

  await logAdminAction(req, {
    action: 'premium.revoke',
    targetType: 'user',
    targetId: target._id.toString(),
    targetEmail: target.email,
    details: { reason },
  });

  res.json({
    success: true,
    data: {
      user: toUserAdminJSON(target),
      subscription: subscription ? subscription.toAdminJSON(target.email) : null,
      message: 'Premium access revoked.',
    },
  });
});

/* ------------------------------------------------------------------ */
/* Subscriptions                                                       */
/* ------------------------------------------------------------------ */

/** GET /api/admin/subscriptions */
export const listSubscriptions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.interval && req.query.interval !== 'all') query.interval = req.query.interval;

  let userFilterIds = null;
  if (req.query.search && String(req.query.search).trim()) {
    userFilterIds = await userIdsForSearch(req.query.search);
    query.userId = { $in: userFilterIds };
  }

  const [rows, total] = await Promise.all([
    Subscription.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Subscription.countDocuments(query),
  ]);

  const userIds = rows.map((row) => row.userId);
  const [users, recentPayments] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('email name plan premiumUntil').lean(),
    Payment.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .select('userId status paidAt amount currency createdAt')
      .lean(),
  ]);
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const paymentMap = new Map();
  for (const payment of recentPayments) {
    const key = payment.userId.toString();
    if (!paymentMap.has(key)) paymentMap.set(key, payment);
  }

  res.json({
    success: true,
    data: {
      subscriptions: rows.map((row) => {
        const user = userMap.get(row.userId.toString());
        const payment = paymentMap.get(row.userId.toString());
        const json = row.toAdminJSON(user?.email || '');
        return {
          ...json,
          userName: user?.name || '',
          userPlan: user?.plan || 'free',
          userPremiumUntil: user?.premiumUntil || null,
          latestPaymentStatus: payment?.status || null,
          latestPaymentAt: payment?.paidAt || payment?.createdAt || null,
          latestPaymentAmount: payment?.amount ?? null,
          latestPaymentCurrency: payment?.currency || row.currency || 'INR',
        };
      }),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

/** GET /api/admin/payments */
export const listPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.kind && req.query.kind !== 'all') query.kind = req.query.kind;

  const range = dateRangeFilter(req.query);
  if (range) query.createdAt = range;

  if (req.query.search && String(req.query.search).trim()) {
    const term = String(req.query.search).trim().slice(0, 120);
    const userIds = await userIdsForSearch(term);
    query.$or = [
      { providerPaymentId: { $regex: escapeRegExp(term), $options: 'i' } },
      { providerOrderId: { $regex: escapeRegExp(term), $options: 'i' } },
      ...(userIds && userIds.length ? [{ userId: { $in: userIds } }] : []),
    ];
  }

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

/** GET /api/admin/payments/:id */
export const getPayment = asyncHandler(async (req, res) => {
  if (!ID_PATTERN.test(String(req.params.id))) throw ApiError.badRequest('That payment id is not valid.');
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw ApiError.notFound('Payment not found.');
  const emailMap = await emailsFor([payment.userId]);
  res.json({
    success: true,
    data: { payment: payment.toAdminJSON(emailMap.get(payment.userId.toString()) || '') },
  });
});

/* ------------------------------------------------------------------ */
/* AI Project Builder monitoring                                       */
/* ------------------------------------------------------------------ */

/** GET /api/admin/ai-builder/stats */
export const aiBuilderStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 13));

  const [totals, byComplexity, byStack, byKind, errorBreakdown, byStatus, topUsers, daily, projectsByStatus] =
    await Promise.all([
      AiGeneration.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            credits: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$credits', 0] } },
            monthTotal: { $sum: { $cond: [{ $gte: ['$createdAt', monthStart] }, 1, 0] } },
          },
        },
      ]),
      AiProject.aggregate([{ $group: { _id: '$complexity', count: { $sum: 1 } } }]),
      AiProject.aggregate([{ $group: { _id: '$stack', count: { $sum: 1 } } }]),
      AiGeneration.aggregate([{ $group: { _id: '$kind', count: { $sum: 1 } } }]),
      AiGeneration.aggregate([
        { $match: { status: 'failed' } },
        { $group: { _id: '$errorCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      AiProject.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      AiGeneration.aggregate([
        {
          $group: {
            _id: '$userId',
            generations: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            credits: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$credits', 0] } },
          },
        },
        { $sort: { generations: -1 } },
        { $limit: 10 },
      ]),
      AiGeneration.aggregate([
        { $match: { createdAt: { $gte: dayStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            generations: { $sum: 1 },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      AiProject.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

  const emailMap = await emailsFor(topUsers.map((row) => row._id));
  const total = totals[0] || { total: 0, success: 0, failed: 0, credits: 0, monthTotal: 0 };

  const dailySeries = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    const row = daily.find((entry) => entry._id === key);
    dailySeries.push({ date: key, generations: row?.generations || 0, failed: row?.failed || 0 });
  }

  res.json({
    success: true,
    data: {
      totals: {
        generations: total.total,
        success: total.success,
        failed: total.failed,
        successRate: total.total ? Math.round((total.success / total.total) * 100) : 0,
        creditsSpent: total.credits,
        generationsThisMonth: total.monthTotal,
      },
      projectsByComplexity: Object.fromEntries(byComplexity.map((row) => [row._id, row.count])),
      projectsByStack: Object.fromEntries(byStack.map((row) => [row._id, row.count])),
      projectsByStatus: Object.fromEntries(projectsByStatus.map((row) => [row._id, row.count])),
      generationsByKind: Object.fromEntries(byKind.map((row) => [row._id, row.count])),
      errorBreakdown: errorBreakdown.map((row) => ({ errorCode: row._id || 'UNKNOWN', count: row.count })),
      topUsers: topUsers.map((row) => ({
        userId: row._id.toString(),
        userEmail: emailMap.get(row._id.toString()) || '',
        generations: row.generations,
        success: row.success,
        failed: row.failed,
        credits: row.credits,
      })),
      dailySeries,
      // Token counts and API costs are not recorded by the current pipeline,
      // so they are reported as unavailable rather than estimated.
      tokenUsage: null,
      costEstimate: null,
      notes: [
        'Token usage and API cost are not recorded by the generation pipeline and are not estimated here.',
        'Failure stage is not stored per generation; the error code is the failure category.',
      ],
    },
  });
});

/** GET /api/admin/ai-generations */
export const listGenerations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.kind && req.query.kind !== 'all') query.kind = req.query.kind;
  if (req.query.stack && req.query.stack !== 'all') query.stack = req.query.stack;
  const range = dateRangeFilter(req.query);
  if (range) query.createdAt = range;
  if (req.query.search && String(req.query.search).trim()) {
    const userIds = await userIdsForSearch(req.query.search);
    query.userId = { $in: userIds || [] };
  }

  const [rows, total] = await Promise.all([
    AiGeneration.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AiGeneration.countDocuments(query),
  ]);
  const emailMap = await emailsFor(rows.map((row) => row.userId));

  res.json({
    success: true,
    data: {
      generations: rows.map((row) => ({
        id: row._id.toString(),
        userId: row.userId.toString(),
        userEmail: emailMap.get(row.userId.toString()) || '',
        projectId: row.projectId ? row.projectId.toString() : null,
        kind: row.kind,
        provider: row.provider,
        model: row.model,
        stack: row.stack,
        credits: row.credits,
        status: row.status,
        errorCode: row.errorCode || '',
        promptChars: row.promptChars,
        outputChars: row.outputChars,
        durationMs: row.durationMs,
        createdAt: row.createdAt,
      })),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/** GET /api/admin/ai-projects */
export const listAiProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.complexity && req.query.complexity !== 'all') query.complexity = req.query.complexity;
  if (req.query.stack && req.query.stack !== 'all') query.stack = req.query.stack;
  const range = dateRangeFilter(req.query);
  if (range) query.createdAt = range;
  if (req.query.search && String(req.query.search).trim()) {
    const userIds = await userIdsForSearch(req.query.search);
    query.userId = { $in: userIds || [] };
  }

  const [rows, total] = await Promise.all([
    AiProject.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AiProject.countDocuments(query),
  ]);
  const emailMap = await emailsFor(rows.map((row) => row.userId));

  res.json({
    success: true,
    data: {
      projects: rows.map((row) => ({
        id: row._id.toString(),
        userId: row.userId.toString(),
        userEmail: emailMap.get(row.userId.toString()) || '',
        title: row.title,
        stack: row.stack,
        complexity: row.complexity,
        status: row.status,
        fileCount: row.files?.length || 0,
        creditsUsed: row.creditsUsed,
        provider: row.provider || '',
        model: row.model || '',
        errorCode: row.errorCode || '',
        createdAt: row.createdAt,
        generatedAt: row.generatedAt,
      })),
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

  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.kind && req.query.kind !== 'all') query.kind = req.query.kind;

  const [generations, total, projects, projectTotal, perUser] = await Promise.all([
    AiGeneration.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AiGeneration.countDocuments(query),
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

/* ------------------------------------------------------------------ */
/* AI usage & analytics                                                */
/* ------------------------------------------------------------------ */

/** GET /api/admin/analytics */
export const analytics = asyncHandler(async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 13));

  const [analyzerTotals, analyzerUsers, analysesStored, generationTotals, dailyGenerations, dailyAnalyzer, monthlyGenerations, topUsers] =
    await Promise.all([
      AiUsage.aggregate([{ $group: { _id: null, total: { $sum: '$count' } } }]),
      AiUsage.distinct('userId'),
      Portfolio.countDocuments({ 'analysis.score': { $ne: null } }),
      AiGeneration.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            credits: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$credits', 0] } },
            monthTotal: { $sum: { $cond: [{ $gte: ['$createdAt', monthStart] }, 1, 0] } },
          },
        },
      ]),
      AiGeneration.aggregate([
        { $match: { createdAt: { $gte: dayStart } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      AiUsage.aggregate([
        { $match: { day: { $gte: dayStart.toISOString().slice(0, 10) } } },
        { $group: { _id: '$day', count: { $sum: '$count' } } },
        { $sort: { _id: 1 } },
      ]),
      AiGeneration.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)) } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      AiGeneration.aggregate([
        {
          $group: {
            _id: '$userId',
            generations: { $sum: 1 },
            credits: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$credits', 0] } },
            failures: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
        { $sort: { generations: -1 } },
        { $limit: 10 },
      ]),
    ]);

  const emailMap = await emailsFor(topUsers.map((row) => row._id));
  const gen = generationTotals[0] || { total: 0, success: 0, failed: 0, credits: 0, monthTotal: 0 };
  const analyzerTotal = analyzerTotals[0]?.total || 0;

  const dailySeries = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    dailySeries.push({
      date: key,
      generations: dailyGenerations.find((row) => row._id === key)?.count || 0,
      analyzerRequests: dailyAnalyzer.find((row) => row._id === key)?.count || 0,
    });
  }

  const monthlyByKey = new Map(monthlyGenerations.map((row) => [`${row._id.year}-${row._id.month}`, row.count]));
  const monthlySeries = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    monthlySeries.push({
      month: d.toISOString().slice(0, 7),
      label: d.toLocaleString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      generations: monthlyByKey.get(`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`) || 0,
    });
  }

  res.json({
    success: true,
    data: {
      analyzer: {
        totalRequests: analyzerTotal,
        activeUsers: analyzerUsers.length,
        analysesStored: analysesStored,
      },
      projectBuilder: {
        totalGenerations: gen.total,
        success: gen.success,
        failed: gen.failed,
        successRate: gen.total ? Math.round((gen.success / gen.total) * 100) : 0,
        creditsSpent: gen.credits,
        generationsThisMonth: gen.monthTotal,
      },
      apiRequests: {
        total: analyzerTotal + gen.total,
        analyzer: analyzerTotal,
        projectBuilder: gen.total,
      },
      dailySeries,
      monthlySeries,
      topUsers: topUsers.map((row) => ({
        userEmail: emailMap.get(row._id.toString()) || '',
        generations: row.generations,
        credits: row.credits,
        failures: row.failures,
      })),
      // Token counts and estimated costs are not recorded anywhere in the
      // current pipeline, so they are reported as unavailable, never invented.
      tokenUsage: null,
      costEstimate: null,
      notes: [
        'Token usage and estimated API cost are not recorded by the AI pipeline and are not estimated here.',
        'Analyzer requests are counted by the daily per-user AI budget counter; project generations are counted from the generation audit records.',
      ],
    },
  });
});

/* ------------------------------------------------------------------ */
/* Portfolio management                                                */
/* ------------------------------------------------------------------ */

/** GET /api/admin/portfolios */
export const listPortfolios = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const query = {};
  if (req.query.published === 'published') query.published = true;
  if (req.query.published === 'draft') query.published = false;
  if (req.query.templateId) query.templateId = req.query.templateId;

  if (req.query.search && String(req.query.search).trim()) {
    const regex = searchRegex(req.query.search);
    const userIds = await userIdsForSearch(req.query.search);
    query.$or = [
      { title: regex },
      { slug: regex },
      { 'profile.fullName': regex },
      ...(userIds && userIds.length ? [{ userId: { $in: userIds } }] : []),
    ];
  }

  const [rows, total] = await Promise.all([
    Portfolio.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Portfolio.countDocuments(query),
  ]);
  const emailMap = await emailsFor(rows.map((row) => row.userId));

  res.json({
    success: true,
    data: {
      portfolios: rows.map((row) => ({
        id: row._id.toString(),
        userId: row.userId.toString(),
        userEmail: emailMap.get(row.userId.toString()) || '',
        title: row.title,
        slug: row.slug || null,
        templateId: row.templateId,
        published: row.published,
        publishedAt: row.publishedAt,
        fullName: row.profile?.fullName || '',
        projectCount: row.projects?.length || 0,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/** GET /api/admin/portfolios/:id */
export const getPortfolio = asyncHandler(async (req, res) => {
  if (!ID_PATTERN.test(String(req.params.id))) throw ApiError.badRequest('That portfolio id is not valid.');
  const portfolio = await Portfolio.findById(req.params.id).lean();
  if (!portfolio) throw ApiError.notFound('Portfolio not found.');
  const emailMap = await emailsFor([portfolio.userId]);
  res.json({
    success: true,
    data: {
      portfolio: {
        id: portfolio._id.toString(),
        userId: portfolio.userId.toString(),
        userEmail: emailMap.get(portfolio.userId.toString()) || '',
        title: portfolio.title,
        slug: portfolio.slug || null,
        templateId: portfolio.templateId,
        published: portfolio.published,
        publishedAt: portfolio.publishedAt,
        fullName: portfolio.profile?.fullName || '',
        professionalTitle: portfolio.profile?.title || '',
        projectCount: portfolio.projects?.length || 0,
        skillCount: portfolio.skills?.length || 0,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt,
      },
    },
  });
});

/** PATCH /api/admin/portfolios/:id/unpublish */
export const unpublishPortfolio = asyncHandler(async (req, res) => {
  if (!ID_PATTERN.test(String(req.params.id))) throw ApiError.badRequest('That portfolio id is not valid.');
  const portfolio = await Portfolio.findById(req.params.id);
  if (!portfolio) throw ApiError.notFound('Portfolio not found.');
  if (!portfolio.published) throw ApiError.badRequest('This portfolio is not published.');

  portfolio.published = false;
  await portfolio.save();

  await logAdminAction(req, {
    action: 'portfolio.unpublish',
    targetType: 'portfolio',
    targetId: portfolio._id.toString(),
  });

  res.json({ success: true, data: { message: 'Portfolio unpublished.', id: portfolio._id.toString() } });
});

/** DELETE /api/admin/portfolios/:id */
export const deletePortfolio = asyncHandler(async (req, res) => {
  if (!ID_PATTERN.test(String(req.params.id))) throw ApiError.badRequest('That portfolio id is not valid.');
  const portfolio = await Portfolio.findById(req.params.id);
  if (!portfolio) throw ApiError.notFound('Portfolio not found.');

  await BlogPost.deleteMany({ portfolioId: portfolio._id });
  await Portfolio.deleteOne({ _id: portfolio._id });

  await logAdminAction(req, {
    action: 'portfolio.delete',
    targetType: 'portfolio',
    targetId: portfolio._id.toString(),
  });

  res.json({ success: true, data: { message: 'Portfolio and its blog posts deleted.', id: portfolio._id.toString() } });
});

/* ------------------------------------------------------------------ */
/* Blog management                                                     */
/* ------------------------------------------------------------------ */

/** GET /api/admin/blog */
export const listBlogPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const query = {};
  if (req.query.published === 'published') query.published = true;
  if (req.query.published === 'draft') query.published = false;

  if (req.query.search && String(req.query.search).trim()) {
    const regex = searchRegex(req.query.search);
    const userIds = await userIdsForSearch(req.query.search);
    query.$or = [
      { title: regex },
      { excerpt: regex },
      ...(userIds && userIds.length ? [{ userId: { $in: userIds } }] : []),
    ];
  }

  const [rows, total] = await Promise.all([
    BlogPost.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    BlogPost.countDocuments(query),
  ]);
  const emailMap = await emailsFor(rows.map((row) => row.userId));

  res.json({
    success: true,
    data: {
      posts: rows.map((row) => ({
        id: row._id.toString(),
        userId: row.userId.toString(),
        userEmail: emailMap.get(row.userId.toString()) || '',
        portfolioId: row.portfolioId.toString(),
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt || '',
        tags: row.tags || [],
        published: row.published,
        publishedAt: row.publishedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/** PATCH /api/admin/blog/:id/publish */
export const setBlogPublish = asyncHandler(async (req, res) => {
  if (!ID_PATTERN.test(String(req.params.id))) throw ApiError.badRequest('That post id is not valid.');
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found.');
  const { published } = req.body || {};
  if (typeof published !== 'boolean') throw ApiError.badRequest('`published` must be true or false.');

  post.published = published;
  post.publishedAt = published ? post.publishedAt || new Date() : null;
  await post.save();

  await logAdminAction(req, {
    action: published ? 'blog.publish' : 'blog.unpublish',
    targetType: 'blogPost',
    targetId: post._id.toString(),
  });

  res.json({ success: true, data: { message: published ? 'Post published.' : 'Post unpublished.', id: post._id.toString() } });
});

/** DELETE /api/admin/blog/:id */
export const deleteBlogPost = asyncHandler(async (req, res) => {
  if (!ID_PATTERN.test(String(req.params.id))) throw ApiError.badRequest('That post id is not valid.');
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found.');

  await BlogPost.deleteOne({ _id: post._id });

  await logAdminAction(req, {
    action: 'blog.delete',
    targetType: 'blogPost',
    targetId: post._id.toString(),
  });

  res.json({ success: true, data: { message: 'Post deleted.', id: post._id.toString() } });
});

/* ------------------------------------------------------------------ */
/* Template management                                                 */
/* ------------------------------------------------------------------ */

/** GET /api/admin/templates */
export const listTemplates = asyncHandler(async (_req, res) => {
  const [settings, usage] = await Promise.all([
    TemplateSetting.find({}).lean(),
    Portfolio.aggregate([{ $group: { _id: '$templateId', count: { $sum: 1 } } }]),
  ]);
  const enabledMap = new Map(settings.map((row) => [row.templateId, row.enabled]));
  const usageMap = new Map(usage.map((row) => [row._id, row.count]));

  res.json({
    success: true,
    data: {
      templates: TEMPLATE_CATALOGUE.map((template) => ({
        id: template.id,
        name: template.name,
        tier: template.tier,
        accent: template.accent,
        font: template.font,
        layout: template.layout,
        style: template.style,
        enabled: enabledMap.has(template.id) ? enabledMap.get(template.id) : true,
        usageCount: usageMap.get(template.id) || 0,
      })),
      total: TEMPLATE_CATALOGUE.length,
      free: TEMPLATE_CATALOGUE.filter((template) => template.tier === 'free').length,
      premium: TEMPLATE_CATALOGUE.filter((template) => template.tier === 'premium').length,
      disabled: TEMPLATE_CATALOGUE.filter((template) => enabledMap.get(template.id) === false).length,
    },
  });
});

/** PATCH /api/admin/templates/:id */
export const setTemplateEnabled = asyncHandler(async (req, res) => {
  const templateId = String(req.params.id || '').trim();
  if (!TEMPLATE_CATALOGUE.some((template) => template.id === templateId)) {
    throw ApiError.notFound('Template not found.');
  }
  const { enabled } = req.body || {};
  if (typeof enabled !== 'boolean') throw ApiError.badRequest('`enabled` must be true or false.');

  await TemplateSetting.updateOne(
    { templateId },
    { $set: { enabled, updatedBy: req.user._id } },
    { upsert: true }
  );

  await logAdminAction(req, {
    action: enabled ? 'template.enable' : 'template.disable',
    targetType: 'template',
    targetId: templateId,
  });

  res.json({ success: true, data: { templateId, enabled, message: enabled ? 'Template enabled.' : 'Template disabled.' } });
});

/* ------------------------------------------------------------------ */
/* Reports (CSV export)                                                */
/* ------------------------------------------------------------------ */

/** GET /api/admin/reports/users.csv */
export const reportUsersCsv = asyncHandler(async (_req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 }).limit(1000).lean();
  const counts = await countsForUsers(users.map((user) => user._id));
  sendCsv(
    res,
    'portiai-users.csv',
    ['id', 'name', 'email', 'plan', 'status', 'role', 'premium_since', 'premium_until', 'portfolios', 'ai_projects', 'payments', 'last_login', 'created_at'],
    users.map((user) => {
      const c = counts.get(user._id.toString()) || {};
      return [
        user._id.toString(),
        user.name,
        user.email,
        user.plan,
        user.status || 'active',
        user.role,
        user.premiumSince,
        user.premiumUntil,
        c.portfolios ?? 0,
        c.aiProjects ?? 0,
        c.payments ?? 0,
        user.lastLoginAt,
        user.createdAt,
      ];
    })
  );
});

/** GET /api/admin/reports/subscriptions.csv */
export const reportSubscriptionsCsv = asyncHandler(async (_req, res) => {
  const rows = await Subscription.find({}).sort({ updatedAt: -1 }).limit(1000).lean();
  const emailMap = await emailsFor(rows.map((row) => row.userId));
  sendCsv(
    res,
    'portiai-subscriptions.csv',
    ['id', 'user_email', 'provider', 'status', 'interval', 'amount_minor', 'currency', 'period_start', 'period_end', 'started_at', 'ended_at', 'updated_at'],
    rows.map((row) => [
      row._id.toString(),
      emailMap.get(row.userId.toString()) || '',
      row.provider,
      row.status,
      row.interval || '',
      row.amount,
      row.currency,
      row.currentPeriodStart,
      row.currentPeriodEnd,
      row.startedAt,
      row.endedAt,
      row.updatedAt,
    ])
  );
});

/** GET /api/admin/reports/payments.csv */
export const reportPaymentsCsv = asyncHandler(async (_req, res) => {
  const rows = await Payment.find({}).sort({ createdAt: -1 }).limit(1000).lean();
  const emailMap = await emailsFor(rows.map((row) => row.userId));
  sendCsv(
    res,
    'portiai-payments.csv',
    ['id', 'user_email', 'kind', 'status', 'amount_minor', 'amount_major', 'currency', 'provider', 'provider_payment_id', 'provider_order_id', 'signature_verified', 'paid_at', 'created_at'],
    rows.map((row) => [
      row._id.toString(),
      emailMap.get(row.userId.toString()) || '',
      row.kind,
      row.status,
      row.amount,
      Math.round(row.amount) / 100,
      row.currency,
      row.provider,
      row.providerPaymentId || '',
      row.providerOrderId || '',
      row.signatureVerified ? 'yes' : 'no',
      row.paidAt,
      row.createdAt,
    ])
  );
});

/** GET /api/admin/reports/ai-usage.csv */
export const reportAiUsageCsv = asyncHandler(async (_req, res) => {
  const rows = await AiGeneration.find({}).sort({ createdAt: -1 }).limit(1000).lean();
  const emailMap = await emailsFor(rows.map((row) => row.userId));
  sendCsv(
    res,
    'portiai-ai-usage.csv',
    ['id', 'user_email', 'kind', 'provider', 'model', 'stack', 'credits', 'status', 'error_code', 'duration_ms', 'created_at'],
    rows.map((row) => [
      row._id.toString(),
      emailMap.get(row.userId.toString()) || '',
      row.kind,
      row.provider,
      row.model,
      row.stack,
      row.credits,
      row.status,
      row.errorCode || '',
      row.durationMs,
      row.createdAt,
    ])
  );
});

/** GET /api/admin/reports/projects.csv */
export const reportProjectsCsv = asyncHandler(async (_req, res) => {
  const rows = await AiProject.find({}).sort({ createdAt: -1 }).limit(1000).lean();
  const emailMap = await emailsFor(rows.map((row) => row.userId));
  sendCsv(
    res,
    'portiai-projects.csv',
    ['id', 'user_email', 'title', 'stack', 'complexity', 'status', 'file_count', 'credits_used', 'provider', 'model', 'error_code', 'created_at', 'generated_at'],
    rows.map((row) => [
      row._id.toString(),
      emailMap.get(row.userId.toString()) || '',
      row.title,
      row.stack,
      row.complexity,
      row.status,
      row.files?.length || 0,
      row.creditsUsed,
      row.provider || '',
      row.model || '',
      row.errorCode || '',
      row.createdAt,
      row.generatedAt,
    ])
  );
});

/* ------------------------------------------------------------------ */
/* Audit logs                                                          */
/* ------------------------------------------------------------------ */

/** GET /api/admin/audit-logs */
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const query = {};
  if (req.query.action && String(req.query.action).trim()) query.action = String(req.query.action).trim();
  if (req.query.search && String(req.query.search).trim()) {
    const regex = searchRegex(req.query.search);
    query.$or = [{ adminEmail: regex }, { targetEmail: regex }, { action: regex }];
  }

  const [rows, total] = await Promise.all([
    AdminAuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AdminAuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      logs: rows.map((row) => ({
        id: row._id.toString(),
        adminEmail: row.adminEmail,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        targetEmail: row.targetEmail || '',
        details: row.details || {},
        ip: row.ip || '',
        createdAt: row.createdAt,
      })),
      page,
      limit,
      total,
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
