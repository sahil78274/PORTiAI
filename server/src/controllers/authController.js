import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Portfolio } from '../models/Portfolio.js';
import { Upload } from '../models/Upload.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  signSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from '../middleware/auth.js';

const BCRYPT_ROUNDS = 12;

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with that email address already exists. Try signing in instead.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });

  const token = signSessionToken(user);
  setSessionCookie(res, token);

  res.status(201).json({ success: true, data: { user: user.toPublicJSON() } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  // Same message for unknown email and wrong password: no account enumeration.
  const invalid = ApiError.unauthorized('Email or password is incorrect.');
  if (!user) {
    // Constant-ish work factor to avoid a timing signal on unknown accounts.
    await bcrypt.compare(password, '$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsaltinva');
    throw invalid;
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw invalid;

  const token = signSessionToken(user);
  setSessionCookie(res, token);

  res.json({ success: true, data: { user: user.toPublicJSON() } });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    // Bump the token version so the cookie this browser holds stops working.
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  }
  clearSessionCookie(res);
  res.json({ success: true, data: { message: 'Signed out.' } });
});

export const me = asyncHandler(async (req, res) => {
  const [total, published] = await Promise.all([
    Portfolio.countDocuments({ userId: req.user._id }),
    Portfolio.countDocuments({ userId: req.user._id, published: true }),
  ]);
  res.json({
    success: true,
    data: {
      user: req.user.toPublicJSON(),
      stats: { portfolios: total, published },
    },
  });
});

export const updateAccount = asyncHandler(async (req, res) => {
  const { name, headline, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash +tokenVersion');
  if (!user) throw ApiError.unauthorized();

  if (name !== undefined) user.name = name;
  if (headline !== undefined) user.headline = headline;

  if (newPassword) {
    if (!currentPassword) throw ApiError.badRequest('Enter your current password to set a new one.');
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw ApiError.badRequest('Your current password is incorrect.');
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();
    // Re-issue a session for this device; other devices are signed out.
    setSessionCookie(res, signSessionToken(user));
    return res.json({
      success: true,
      data: { user: user.toPublicJSON(), message: 'Password updated. Other devices have been signed out.' },
    });
  }

  await user.save();
  res.json({ success: true, data: { user: user.toPublicJSON(), message: 'Account updated.' } });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user) throw ApiError.unauthorized();

  const matches = await bcrypt.compare(password || '', user.passwordHash);
  if (!matches) throw ApiError.badRequest('Password is incorrect. Your account was not deleted.');

  await Portfolio.deleteMany({ userId: user._id });
  await Upload.deleteMany({ userId: user._id });
  await User.deleteOne({ _id: user._id });
  clearSessionCookie(res);

  res.json({ success: true, data: { message: 'Account and all portfolios deleted.' } });
});
