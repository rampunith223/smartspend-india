import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { clearAuthCookie, requireAuth, setAuthCookie, signToken } from '../auth.js';
import { db, mapUser, nowIso } from '../db.js';
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
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(input.email);
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists. Try signing in.');
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(input.password, 12);
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, input.name, input.email, passwordHash, nowIso());

    const user = mapUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
    setAuthCookie(res, signToken(id));
    res.status(201).json({ user });
  }),
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const input = parseBody(loginSchema, req.body);
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(input.email);
    if (!row) {
      throw new ApiError(401, 'Email or password is incorrect.');
    }

    const valid = await bcrypt.compare(input.password, row.password_hash);
    if (!valid) {
      throw new ApiError(401, 'Email or password is incorrect.');
    }

    setAuthCookie(res, signToken(row.id));
    res.json({ user: mapUser(row) });
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
    const fields = [];
    const values = [];

    if (input.name !== undefined) {
      fields.push('name = ?');
      values.push(input.name);
    }
    if (input.monthlyIncomePaise !== undefined) {
      fields.push('monthly_income_paise = ?');
      values.push(input.monthlyIncomePaise);
    }
    if (input.locale !== undefined) {
      fields.push('locale = ?');
      values.push(input.locale);
    }
    if (input.theme !== undefined) {
      fields.push('theme = ?');
      values.push(input.theme);
    }
    if (input.notifications !== undefined) {
      fields.push('notifications = ?');
      values.push(input.notifications ? 1 : 0);
    }

    if (!fields.length) {
      throw new ApiError(400, 'Nothing to update.');
    }

    values.push(req.user.id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const user = mapUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id));
    res.json({ user });
  }),
);

router.post(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = parseBody(changePasswordSchema, req.body);
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    const valid = await bcrypt.compare(input.currentPassword, row.password_hash);
    if (!valid) {
      throw new ApiError(400, 'Your current password is incorrect.');
    }
    const hash = await bcrypt.hash(input.newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
    res.json({ ok: true });
  }),
);

export default router;
