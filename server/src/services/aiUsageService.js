import mongoose from 'mongoose';
import { env } from '../config/env.js';

/**
 * Very small daily counter per user, stored in MongoDB.
 * Keeps the shared free-tier quota from being burned by a single account and
 * lets the API return an honest "quota" message before calling Gemini.
 */
const usageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: String, required: true }, // YYYY-MM-DD (UTC)
    count: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);
usageSchema.index({ userId: 1, day: 1 }, { unique: true });

const AiUsage = mongoose.models.AiUsage || mongoose.model('AiUsage', usageSchema);

const today = () => new Date().toISOString().slice(0, 10);

export const getAiUsageToday = async (userId) => {
  const record = await AiUsage.findOne({ userId, day: today() }).lean();
  return {
    used: record?.count || 0,
    limit: env.gemini.dailyRequestCap,
    remaining: Math.max(0, env.gemini.dailyRequestCap - (record?.count || 0)),
  };
};

export const assertAiBudget = async (userId) => {
  const usage = await getAiUsageToday(userId);
  if (usage.used >= usage.limit) {
    const error = new Error(
      `Your daily AI allowance (${usage.limit} requests) is used up. It resets at midnight UTC. ` +
        'Portfolio editing, preview and publishing are unaffected.'
    );
    error.status = 429;
    error.code = 'AI_DAILY_CAP_REACHED';
    throw error;
  }
  return usage;
};

export const recordAiUsage = async (userId) => {
  await AiUsage.updateOne({ userId, day: today() }, { $inc: { count: 1 } }, { upsert: true });
};
