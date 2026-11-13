/**
 * One-time administrator provisioning.
 *
 * Creates (or promotes) an administrator account. Credentials are read from
 * environment variables — never hardcoded, never committed:
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' node scripts/grant-admin.mjs
 *
 * Or pass them as flags (prefer the environment form so the password does
 * not appear in shell history):
 *
 *   node scripts/grant-admin.mjs --email you@example.com --password 'a-strong-password' [--name "Your Name"]
 *
 * The password is hashed with bcrypt (12 rounds), the same mechanism as
 * registration. Running the script again for an existing account only
 * promotes it to admin; it never changes the password of an existing
 * account unless --reset-password is passed.
 *
 *   node scripts/grant-admin.mjs --list        # show current administrators
 *   node scripts/grant-admin.mjs --email you@example.com --demote   # remove admin role
 *
 * Never automatically makes the first registered user an admin.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
    console.error('MONGODB_URI is not set. Add it to server/.env before running this script.');
    process.exit(1);
  }
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
};

await connect();

try {
  if (has('list')) {
    const admins = await User.find({ role: 'admin' }).select('name email createdAt').sort({ createdAt: 1 });
    if (!admins.length) console.log('No administrator accounts yet.');
    for (const admin of admins) {
      console.log(`${admin.email}  (${admin.name})  since ${admin.createdAt?.toISOString() || '—'}`);
    }
    process.exit(0);
  }

  const email = String(flag('email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    console.error('Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=\'...\' node scripts/grant-admin.mjs');
    console.error('   or: node scripts/grant-admin.mjs --email you@example.com --password \'...\' [--name "Your Name"]');
    process.exit(1);
  }

  if (has('demote')) {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`No account found for ${email}.`);
      process.exit(1);
    }
    if (user.role !== 'admin') {
      console.log(`${email} is not an administrator.`);
      process.exit(0);
    }
    const admins = await User.countDocuments({ role: 'admin' });
    if (admins <= 1) {
      console.error('Refusing to demote the last administrator account.');
      process.exit(1);
    }
    user.role = 'user';
    await user.save();
    console.log(`${email} is no longer an administrator.`);
    process.exit(0);
  }

  const password = flag('password') || process.env.ADMIN_PASSWORD || '';
  const name = String(flag('name') || process.env.ADMIN_NAME || 'Administrator').trim().slice(0, 80) || 'Administrator';

  const existing = await User.findOne({ email }).select('+passwordHash');
  if (existing) {
    existing.role = 'admin';
    if (has('reset-password')) {
      if (!password) {
        console.error('Pass ADMIN_PASSWORD (or --password) to reset the password.');
        process.exit(1);
      }
      if (password.length < 8) {
        console.error('Password must be at least 8 characters long.');
        process.exit(1);
      }
      existing.passwordHash = await bcrypt.hash(password, 12);
      existing.tokenVersion = (existing.tokenVersion ?? 0) + 1;
    }
    await existing.save();
    console.log(`${email} is now an administrator${has('reset-password') ? ' (password reset)' : ''}.`);
  } else {
    if (!password) {
      console.error('ADMIN_PASSWORD is required to create a new administrator account.');
      process.exit(1);
    }
    if (password.length < 8) {
      console.error('Password must be at least 8 characters long.');
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ name, email, passwordHash, role: 'admin' });
    console.log(`Administrator account created for ${email}.`);
  }
} finally {
  await mongoose.disconnect();
}
