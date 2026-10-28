import crypto from 'node:crypto';
import webpush from 'web-push';
import { db, nowIso } from '../db.js';
import { computeSafeToSpend } from './calc.js';
import { monthBounds, toDateKey, toMonthKey } from './date.js';
import { formatINR } from './money.js';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:hello@smartspend.in';

export const pushConfigured = Boolean(publicKey && privateKey);

if (pushConfigured) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function getVapidPublicKey() {
  return publicKey || null;
}

function mapSubscription(row) {
  if (!row) return null;
  return {
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
  };
}

export function saveSubscription(userId, subscription, userAgent = '') {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('Invalid push subscription.');
  }
  db.prepare(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`,
  ).run(
    crypto.randomUUID(),
    userId,
    subscription.endpoint,
    subscription.keys.p256dh,
    subscription.keys.auth,
    userAgent.slice(0, 200),
    nowIso(),
  );
}

export function removeSubscription(userId, endpoint) {
  const result = db
    .prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
    .run(userId, endpoint);
  return result.changes > 0;
}

export function listSubscriptions(userId) {
  return db
    .prepare('SELECT * FROM push_subscriptions WHERE user_id = ?')
    .all(userId)
    .map(mapSubscription);
}

async function sendToSubscription(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 24, // keep undelivered pushes for a day
      urgency: 'normal',
    });
    return true;
  } catch (error) {
    // 404/410 = subscription expired or the app was removed.
    if (error.statusCode === 404 || error.statusCode === 410) {
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(subscription.endpoint);
    }
    return false;
  }
}

export async function sendPushToUser(userId, payload) {
  if (!pushConfigured) return 0;
  const subscriptions = listSubscriptions(userId);
  let sent = 0;
  for (const subscription of subscriptions) {
    const ok = await sendToSubscription(subscription, payload);
    if (ok) sent += 1;
  }
  return sent;
}

function alreadyNotifiedToday(userId, kind, day) {
  const row = db
    .prepare('SELECT 1 AS hit FROM notification_log WHERE user_id = ? AND kind = ? AND day = ?')
    .get(userId, kind, day);
  return Boolean(row);
}

function logNotification(userId, kind, day) {
  db.prepare(
    'INSERT OR IGNORE INTO notification_log (id, user_id, kind, day, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(crypto.randomUUID(), userId, kind, day, nowIso());
}

// Builds the savings alarm payload if the user's budget plan is crossed and a
// monthly goal still has saving left this month. Returns null when no push is due.
export function buildGoalReminder(userId) {
  const today = toDateKey();
  const month = toMonthKey();
  const info = monthBounds(month, today);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || !user.notifications) return null;

  const expenseRow = db
    .prepare(
      `SELECT COALESCE(SUM(amount_paise), 0) AS total
       FROM transactions
       WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
    )
    .get(userId, info.start, info.end);

  const overallBudget = db
    .prepare(
      `SELECT limit_paise FROM budgets
       WHERE user_id = ? AND month = ? AND category = 'overall'`,
    )
    .get(userId, month);

  const budgetPaise = overallBudget?.limit_paise || user.monthly_income_paise || 0;
  if (budgetPaise <= 0) return null;

  const reservedBills = db
    .prepare(
      `SELECT id, title, amount_paise, next_due_date AS nextDueDate, category
       FROM recurring_expenses
       WHERE user_id = ? AND is_active = 1 AND next_due_date >= ? AND next_due_date <= ?`,
    )
    .all(userId, today, info.end);

  const safe = computeSafeToSpend({
    budgetPaise,
    spentPaise: expenseRow.total,
    reservedBills,
    month,
    today,
  });
  if (safe.status !== 'over' && safe.status !== 'warning') return null;

  const goals = db
    .prepare(
      `SELECT * FROM savings_goals
       WHERE user_id = ? AND monthly_target_paise > 0 AND saved_paise < target_paise`,
    )
    .all(userId);

  const behind = [];
  for (const goal of goals) {
    const savedThisMonth = db
      .prepare(
        `SELECT COALESCE(SUM(amount_paise), 0) AS total
         FROM savings_contributions
         WHERE goal_id = ? AND user_id = ? AND substr(date, 1, 7) = ?`,
      )
      .get(goal.id, userId, month).total;
    const remaining = goal.monthly_target_paise - savedThisMonth;
    if (remaining > 0) {
      behind.push({
        title: goal.title,
        remainingPaise: remaining,
        monthlyTargetPaise: goal.monthly_target_paise,
      });
    }
  }
  if (!behind.length) return null;
  behind.sort((a, b) => b.remainingPaise - a.remainingPaise);

  if (alreadyNotifiedToday(userId, 'goal-reminder', today)) return null;

  const top = behind[0];
  const overPaise = Math.max(0, safe.spentPaise - safe.budgetPaise);
  const body =
    safe.status === 'over'
      ? `You're ${formatINR(overPaise)} over your budget plan. Even so, save ${formatINR(top.remainingPaise)} toward “${top.title}” this month.`
      : `Your budget is almost used up. Lock in ${formatINR(top.remainingPaise)} for “${top.title}” before it's gone.`;

  return {
    userId,
    payload: {
      title: safe.status === 'over' ? 'Savings alarm: budget crossed' : 'Savings nudge',
      body,
      url: '/app',
      tag: 'goal-reminder',
      requireInteraction: true,
    },
    log: () => logNotification(userId, 'goal-reminder', today),
  };
}

export async function runReminderSweep() {
  if (!pushConfigured) return 0;
  const users = db
    .prepare(
      `SELECT DISTINCT u.id AS id
       FROM users u
       JOIN push_subscriptions p ON p.user_id = u.id
       WHERE u.notifications = 1`,
    )
    .all();

  let sent = 0;
  for (const { id } of users) {
    const reminder = buildGoalReminder(id);
    if (!reminder) continue;
    const count = await sendPushToUser(id, reminder.payload);
    if (count > 0) {
      reminder.log();
      sent += count;
    }
  }
  return sent;
}

let timer = null;

export function startReminderScheduler(intervalMs = 15 * 60 * 1000) {
  if (!pushConfigured || timer) return;
  timer = setInterval(() => {
    runReminderSweep().catch((error) => {
      console.error('Reminder sweep failed:', error.message);
    });
  }, intervalMs);
  // Do not keep the process alive just for the scheduler.
  timer.unref?.();
}

export function stopReminderScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}
