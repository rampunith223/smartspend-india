import crypto from 'node:crypto';
import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import NotificationLog from '../models/NotificationLog.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Recurring from '../models/Recurring.js';
import User from '../models/User.js';
import Goal from '../models/Goal.js';
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

export async function saveSubscription(userId, subscription, userAgent = '') {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('Invalid push subscription.');
  }
  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      user_id: userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent.slice(0, 200),
    },
    { upsert: true, new: true },
  );
}

export async function removeSubscription(userId, endpoint) {
  const result = await PushSubscription.deleteOne({ user_id: userId, endpoint });
  return result.deletedCount > 0;
}

export async function listSubscriptions(userId) {
  const rows = await PushSubscription.find({ user_id: userId });
  return rows.map((row) => ({
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
  }));
}

async function sendToSubscription(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 24,
      urgency: 'normal',
    });
    return true;
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
    }
    return false;
  }
}

export async function sendPushToUser(userId, payload) {
  if (!pushConfigured) return 0;
  const subscriptions = await listSubscriptions(userId);
  let sent = 0;
  for (const subscription of subscriptions) {
    const ok = await sendToSubscription(subscription, payload);
    if (ok) sent += 1;
  }
  return sent;
}

export async function alreadyNotifiedToday(userId, kind, day) {
  const row = await NotificationLog.findOne({ user_id: userId, kind, day });
  return Boolean(row);
}

export async function logNotification(userId, kind, day) {
  await NotificationLog.findOneAndUpdate(
    { user_id: userId, kind, day },
    { user_id: userId, kind, day },
    { upsert: true, new: true },
  );
}

// Builds the savings alarm payload if the user's budget plan is crossed and a
// monthly goal still has saving left this month. Returns null when no push is due.
export async function buildGoalReminder(userId) {
  const today = toDateKey();
  const month = toMonthKey();
  const info = monthBounds(month, today);

  const user = await User.findById(userId);
  if (!user || !user.notifications) return null;

  const expenseRow = await Transaction.aggregate([
    {
      $match: {
        user_id: userId,
        type: 'expense',
        date: { $gte: info.start, $lte: info.end },
      },
    },
    {
      $group: { _id: null, total: { $sum: '$amount_paise' } },
    },
  ]);
  const spentPaise = expenseRow.length > 0 ? expenseRow[0].total : 0;

  const overallBudget = await Budget.findOne({
    user_id: userId,
    month,
    category: 'overall',
  });
  const budgetPaise = overallBudget?.limit_paise || user.monthly_income_paise || 0;
  if (budgetPaise <= 0) return null;

  const reservedBills = await Recurring.find({
    user_id: userId,
    is_active: true,
    next_due_date: { $gte: today, $lte: info.end },
  });

  const safe = computeSafeToSpend({
    budgetPaise,
    spentPaise,
    reservedBills: reservedBills.map((b) => ({
      id: b._id,
      title: b.title,
      amountPaise: b.amount_paise,
      nextDueDate: b.next_due_date,
      category: b.category,
    })),
    month,
    today,
  });
  if (safe.status !== 'over' && safe.status !== 'warning') return null;

  const goals = await Goal.find({
    user_id: userId,
    monthly_target_paise: { $gt: 0 },
    saved_paise: { $lt: '$target_paise' },
  });

  const behind = [];
  for (const goal of goals) {
    const savedThisMonthAgg = await Contribution.aggregate([
      {
        $match: {
          goal_id: goal._id,
          user_id: userId,
          date: { $regex: `^${month}` },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount_paise' } } },
    ]);
    const savedThisMonth = savedThisMonthAgg.length > 0 ? savedThisMonthAgg[0].total : 0;
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

  if (await alreadyNotifiedToday(userId, 'goal-reminder', today)) return null;

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
  const users = await PushSubscription.aggregate([
    { $group: { _id: '$user_id' } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $match: { 'user.notifications': true } },
    { $project: { id: '$_id' } },
  ]);

  let sent = 0;
  for (const { id } of users) {
    const reminder = await buildGoalReminder(id);
    if (!reminder) continue;
    const count = await sendPushToUser(id, reminder.payload);
    if (count > 0) {
      await reminder.log();
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
  timer.unref?.();
}

export function stopReminderScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}
