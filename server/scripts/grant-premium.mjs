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
import { Subscription } from '../src/models/Subscription.js';

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
    if (until && Number.isNaN(new Date(until).getTime())) {
      console.error('--until must be a valid ISO date, e.g. 2027-10-28T00:00:00.000Z');
      process.exit(1);
    }
    user.plan = 'premium';
    user.premiumSince = user.premiumSince || new Date();
    user.premiumUntil = until ? new Date(until) : null;
    user.premiumSource = 'grant';
  } else {
    user.plan = 'free';
    user.premiumUntil = null;
    user.premiumSource = 'none';
  }

  await user.save();

  /* Keep the admin reporting and billing history consistent with the grant. */
  const subscription = await Subscription.findOne({ userId: user._id });
  if (plan === 'premium') {
    if (subscription) {
      subscription.status = 'active';
      subscription.currentPeriodEnd = user.premiumUntil;
      subscription.cancelAtPeriodEnd = false;
      subscription.cancelledAt = null;
      subscription.cancelEffectiveAt = null;
      subscription.endedAt = null;
      subscription.note = 'Activated by an operator with scripts/grant-premium.mjs.';
      await subscription.save();
    } else {
      await Subscription.create({
        userId: user._id,
        provider: 'none',
        status: 'active',
        interval: null,
        amount: 0,
        currency: 'INR',
        currentPeriodStart: new Date(),
        currentPeriodEnd: user.premiumUntil,
        startedAt: new Date(),
        note: 'Activated by an operator with scripts/grant-premium.mjs.',
      });
    }
  } else if (subscription && ['active', 'pending', 'failed'].includes(subscription.status)) {
    subscription.status = 'cancelled';
    subscription.cancelAtPeriodEnd = false;
    subscription.cancelledAt = new Date();
    subscription.cancelEffectiveAt = new Date();
    subscription.endedAt = new Date();
    subscription.note = 'Revoked by an operator with scripts/grant-premium.mjs.';
    await subscription.save();
  }

  console.log(`${email} is now on the ${user.plan} plan${user.premiumUntil ? ` until ${user.premiumUntil.toISOString()}` : ''}.`);
} finally {
  await mongoose.disconnect();
}
