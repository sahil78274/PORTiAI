#!/usr/bin/env node
/**
 * Grant or revoke PortiAI Premium for an existing account.
 *
 * This is the operator path used until a billing provider is connected. It
 * writes the plan straight to MongoDB, which is exactly what the API reads when
 * it checks entitlement — there is no client-side flag anywhere.
 *
 *   node scripts/grant-premium.mjs --email user@example.com --plan premium
 *   node scripts/grant-premium.mjs --email user@example.com --plan premium --until 2027-10-28
 *   node scripts/grant-premium.mjs --email user@example.com --plan free
 *   node scripts/grant-premium.mjs --list
 *
 * Requires MONGODB_URI (or the local-mongo settings used by `npm run dev`).
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const has = (name) => args.includes(`--${name}`);

const connect = async () => {
  if (!env.mongoUri) {
    console.error('MONGODB_URI is not configured. Set it in server/.env before granting a plan.');
    process.exit(1);
  }
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
};

await connect();

try {
  if (has('list')) {
    const users = await User.find({}).select('name email plan premiumSince premiumUntil premiumSource').limit(200);
    if (!users.length) console.log('No accounts yet.');
    for (const user of users) {
      console.log(
        `${user.email.padEnd(34)} ${String(user.plan || 'free').padEnd(8)} since=${user.premiumSince?.toISOString() || '—'} until=${
          user.premiumUntil?.toISOString() || '—'
        } source=${user.premiumSource || 'none'}`
      );
    }
    process.exit(0);
  }

  const email = String(flag('email') || '').trim().toLowerCase();
  const plan = String(flag('plan') || '').trim().toLowerCase();
  if (!email || !['premium', 'free'].includes(plan)) {
    console.error('Usage: node scripts/grant-premium.mjs --email <email> --plan <premium|free> [--until ISO_DATE]');
    process.exit(1);
  }

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No account found for ${email}.`);
    process.exit(1);
  }

  if (plan === 'premium') {
    const until = flag('until');
    user.plan = 'premium';
    user.premiumSince = user.premiumSince || new Date();
    user.premiumUntil = until ? new Date(until) : null;
    user.premiumSource = 'grant';
    if (until && Number.isNaN(new Date(until).getTime())) {
      console.error('--until must be a valid ISO date, e.g. 2027-10-28T00:00:00.000Z');
      process.exit(1);
    }
  } else {
    user.plan = 'free';
    user.premiumUntil = null;
    user.premiumSource = 'none';
  }

  await user.save();
  console.log(`${email} is now on the ${user.plan} plan${user.premiumUntil ? ` until ${user.premiumUntil.toISOString()}` : ''}.`);
} finally {
  await mongoose.disconnect();
}
