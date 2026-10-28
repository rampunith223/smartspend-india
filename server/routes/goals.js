import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { db, mapGoal, nowIso } from '../db.js';
import { ApiError, asyncHandler, parseBody } from '../lib/http.js';
import { contributionSchema, goalPatchSchema, goalSchema } from '../lib/schemas.js';
import { toDateKey, toMonthKey } from '../lib/date.js';

const router = Router();
router.use(requireAuth);

function withProgress(goal, today = toDateKey()) {
  const month = toMonthKey(new Date(`${today}T00:00:00`));
  const savedThisMonthPaise = goal.monthlyTargetPaise
    ? db
        .prepare(
          `SELECT COALESCE(SUM(amount_paise), 0) AS total
           FROM savings_contributions
           WHERE goal_id = ? AND user_id = ? AND substr(date, 1, 7) = ?`,
        )
        .get(goal.id, goal.userId, month).total
    : 0;

  return {
    ...goal,
    progress: goal.targetPaise > 0 ? Math.round((goal.savedPaise / goal.targetPaise) * 100) : 0,
    remainingPaise: Math.max(0, goal.targetPaise - goal.savedPaise),
    isComplete: goal.savedPaise >= goal.targetPaise,
    savedThisMonthPaise,
    monthlyRemainingPaise: Math.max(0, goal.monthlyTargetPaise - savedThisMonthPaise),
    monthlyComplete:
      goal.monthlyTargetPaise > 0 && savedThisMonthPaise >= goal.monthlyTargetPaise,
  };
}

function getGoal(userId, id) {
  return db
    .prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?')
    .get(id, userId);
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at ASC')
      .all(req.user.id)
      .map(mapGoal)
      .map(withProgress);
    res.json({ goals: rows });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseBody(goalSchema, req.body);
    const id = crypto.randomUUID();
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO savings_goals
        (id, user_id, title, target_paise, saved_paise, monthly_target_paise, target_date, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      req.user.id,
      input.title,
      input.targetPaise,
      input.savedPaise || 0,
      input.monthlyTargetPaise || 0,
      input.targetDate || null,
      input.color || '#2B9966',
      timestamp,
      timestamp,
    );
    const goal = withProgress(
      mapGoal(db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id)),
    );
    res.status(201).json({ goal });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = getGoal(req.user.id, req.params.id);
    if (!existing) throw new ApiError(404, 'Savings goal not found.');

    const input = parseBody(goalPatchSchema, req.body);
    const merged = {
      title: input.title ?? existing.title,
      targetPaise: input.targetPaise ?? existing.target_paise,
      monthlyTargetPaise: input.monthlyTargetPaise ?? existing.monthly_target_paise,
      targetDate:
        input.targetDate === undefined
          ? existing.target_date
          : input.targetDate,
      color: input.color ?? existing.color,
    };

    db.prepare(
      `UPDATE savings_goals SET title = ?, target_paise = ?, monthly_target_paise = ?, target_date = ?, color = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    ).run(
      merged.title,
      merged.targetPaise,
      merged.monthlyTargetPaise,
      merged.targetDate,
      merged.color,
      nowIso(),
      req.params.id,
      req.user.id,
    );

    res.json({
      goal: withProgress(mapGoal(getGoal(req.user.id, req.params.id))),
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = db
      .prepare('DELETE FROM savings_goals WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    if (!result.changes) throw new ApiError(404, 'Savings goal not found.');
    res.json({ ok: true });
  }),
);

router.post(
  '/:id/contributions',
  asyncHandler(async (req, res) => {
    const existing = getGoal(req.user.id, req.params.id);
    if (!existing) throw new ApiError(404, 'Savings goal not found.');

    const input = parseBody(contributionSchema, req.body);
    const id = crypto.randomUUID();
    const timestamp = nowIso();

    db.transaction(() => {
      db.prepare(
        `INSERT INTO savings_contributions (id, goal_id, user_id, amount_paise, date, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        existing.id,
        req.user.id,
        input.amountPaise,
        input.date,
        input.note || '',
        timestamp,
      );
      db.prepare(
        'UPDATE savings_goals SET saved_paise = saved_paise + ?, updated_at = ? WHERE id = ?',
      ).run(input.amountPaise, timestamp, existing.id);
    })();

    res.status(201).json({
      goal: withProgress(mapGoal(getGoal(req.user.id, req.params.id))),
    });
  }),
);

router.get(
  '/:id/contributions',
  asyncHandler(async (req, res) => {
    const existing = getGoal(req.user.id, req.params.id);
    if (!existing) throw new ApiError(404, 'Savings goal not found.');

    const rows = db
      .prepare(
        `SELECT * FROM savings_contributions
         WHERE goal_id = ? AND user_id = ?
         ORDER BY date DESC, created_at DESC`,
      )
      .all(req.params.id, req.user.id);

    res.json({
      contributions: rows.map((row) => ({
        id: row.id,
        amountPaise: row.amount_paise,
        date: row.date,
        note: row.note,
        createdAt: row.created_at,
      })),
    });
  }),
);

export default router;
