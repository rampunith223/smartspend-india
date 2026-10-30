import jwt from 'jsonwebtoken';
import User from './models/User.js';
import { ApiError } from './lib/http.js';

export const COOKIE_NAME = 'smartspend_token';
const TOKEN_DAYS = 7;

function secret() {
  return process.env.JWT_SECRET || 'smartspend-dev-only-secret-change-me';
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: `${TOKEN_DAYS}d` });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function readUserFromRequest(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, secret());
    const user = await User.findById(payload.sub);
    if (!user) return null;
    const o = user.toObject();
    return {
      id: o._id,
      name: o.name,
      email: o.email,
      monthlyIncomePaise: o.monthly_income_paise,
      currency: o.currency,
      locale: o.locale,
      theme: o.theme,
      notifications: o.notifications,
      createdAt: o.created_at,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(req, _res, next) {
  const user = await readUserFromRequest(req);
  if (!user) {
    next(new ApiError(401, 'Please sign in to continue.'));
    return;
  }
  req.user = user;
  next();
}
