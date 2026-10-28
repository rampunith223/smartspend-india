import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const configuredPath = process.env.DATABASE_PATH;
const databasePath = configuredPath
  ? path.resolve(projectRoot, configuredPath)
  : path.join(__dirname, 'data', 'smartspend.db');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    monthly_income_paise INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    locale TEXT NOT NULL DEFAULT 'en',
    theme TEXT NOT NULL DEFAULT 'light',
    notifications INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'upi',
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_user_date
    ON transactions(user_id, date DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_category
    ON transactions(user_id, category);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_type
    ON transactions(user_id, type);

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    category TEXT NOT NULL,
    limit_paise INTEGER NOT NULL CHECK (limit_paise >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, month, category)
  );

  CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

  CREATE TABLE IF NOT EXISTS recurring_expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
    category TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
    next_due_date TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_recurring_user_due
    ON recurring_expenses(user_id, next_due_date);

  CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_paise INTEGER NOT NULL CHECK (target_paise > 0),
    saved_paise INTEGER NOT NULL DEFAULT 0 CHECK (saved_paise >= 0),
    monthly_target_paise INTEGER NOT NULL DEFAULT 0,
    target_date TEXT,
    color TEXT NOT NULL DEFAULT '#2B9966',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_goals_user ON savings_goals(user_id);

  CREATE TABLE IF NOT EXISTS savings_contributions (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
    date TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_contributions_goal
    ON savings_contributions(goal_id, date DESC);

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

  CREATE TABLE IF NOT EXISTS notification_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    day TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, kind, day)
  );
`);

// Lightweight migration for databases created before the monthly goal target existed.
const goalColumns = db.prepare('PRAGMA table_info(savings_goals)').all();
if (!goalColumns.some((column) => column.name === 'monthly_target_paise')) {
  db.exec(
    'ALTER TABLE savings_goals ADD COLUMN monthly_target_paise INTEGER NOT NULL DEFAULT 0',
  );
}

export function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    monthlyIncomePaise: row.monthly_income_paise,
    currency: row.currency,
    locale: row.locale,
    theme: row.theme,
    notifications: Boolean(row.notifications),
    createdAt: row.created_at,
  };
}

export function mapTransaction(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    amountPaise: row.amount_paise,
    category: row.category,
    date: row.date,
    paymentMethod: row.payment_method,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBudget(row) {
  if (!row) return null;
  return {
    id: row.id,
    month: row.month,
    category: row.category,
    limitPaise: row.limit_paise,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRecurring(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    amountPaise: row.amount_paise,
    category: row.category,
    frequency: row.frequency,
    nextDueDate: row.next_due_date,
    notes: row.notes,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapGoal(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    targetPaise: row.target_paise,
    savedPaise: row.saved_paise,
    monthlyTargetPaise: row.monthly_target_paise || 0,
    targetDate: row.target_date,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function nowIso() {
  return new Date().toISOString();
}

export { databasePath, projectRoot };
