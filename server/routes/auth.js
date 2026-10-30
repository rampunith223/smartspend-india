import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { clearAuthCookie, requireAuth, setAuthCookie, signToken } from '../auth.js';
import User from '../models/User.js';
import { ApiError, asyncHandler, parseBody } from '../lib/http.js';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../lib/schemas.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const input = parseBody(registerSchema, req.body);
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists. Try signing in.');
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
      _id: id,
      name: input.name,
      email: input.email,
      password_hash: passwordHash,
    });
    setAuthCookie(res, signToken(user._id));
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncomePaise: user.monthly_income_paise,
        currency: user.currency,
        locale: user.locale,
        theme: user.theme,
        notifications: user.notifications,
        createdAt: user.created_at,
      },
    });
  }),
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const input = parseBody(loginSchema, req.body);
    const user = await User.findOne({ email: input.email });
    if (!user) {
      throw new ApiError(401, 'Email or password is incorrect.');
    }

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) {
      throw new ApiError(401, 'Email or password is incorrect.');
    }

    setAuthCookie(res, signToken(user._id));
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncomePaise: user.monthly_income_paise,
        currency: user.currency,
        locale: user.locale,
        theme: user.theme,
        notifications: user.notifications,
        createdAt: user.created_at,
      },
    });
  }),
);

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);

router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = parseBody(updateProfileSchema, req.body);
    const updateData = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.monthlyIncomePaise !== undefined)
      updateData.monthly_income_paise = input.monthlyIncomePaise;
    if (input.locale !== undefined) updateData.locale = input.locale;
    if (input.theme !== undefined) updateData.theme = input.theme;
    if (input.notifications !== undefined) updateData.notifications = input.notifications;

    if (!Object.keys(updateData).length) {
      throw new ApiError(400, 'Nothing to update.');
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncomePaise: user.monthly_income_paise,
        currency: user.currency,
        locale: user.locale,
        theme: user.theme,
        notifications: user.notifications,
        createdAt: user.created_at,
      },
    });
  }),
);

router.post(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = parseBody(changePasswordSchema, req.body);
    const user = await User.findById(req.user.id);
    const valid = await bcrypt.compare(input.currentPassword, user.password_hash);
    if (!valid) {
      throw new ApiError(400, 'Your current password is incorrect.');
    }
    user.password_hash = await bcrypt.hash(input.newPassword, 12);
    await user.save();
    res.json({ ok: true });
  }),
);

export default router;
