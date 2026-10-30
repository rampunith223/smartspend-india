import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import Goal from '../models/Goal.js';
import Contribution from '../models/Contribution.js';
import { ApiError, asyncHandler, parseBody } from '../lib/http.js';
import { contributionSchema, goalPatchSchema, goalSchema } from '../lib/schemas.js';
import { toDateKey, toMonthKey } from '../lib/date.js';

const router = Router();
router.use(requireAuth);

function mapGoal(doc) {
  if (!doc) return null;
  const o = doc.toObject();
  return {
    id: o._id,
    userId: o.user_id,
    title: o.title,
    targetPaise: o.target_paise,
    savedPaise: o.saved_paise,
    monthlyTargetPaise: o.monthly_target_paise || 0,
    targetDate: o.target_date,
    color: o.color,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

function withProgress(goal, today = toDateKey()) {
  const month = toMonthKey(new Date(`${today}T00:00:00`));
  let savedThisMonthPaise = 0;
  if (goal.monthlyTargetPaise > 0) {
    const agg = Contribution.aggregate([
      {
        $match: {
          goal_id: goal.id,
          user_id: goal.userId,
          date: { $regex: `^${month}` },
        },
      },
      {
        $group: { _id: null, total: { $sum: '$amount_paise' } },
      },
    ]);
    const result = agg;
    savedThisMonthPaise = result.length > 0 ? result[0].total : 0;
  }

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
  return Goal.findOne({ _id: id, user_id: userId });
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const goals = await Goal.find({ user_id: req.user.id }).sort({ created_at: 1 });
    const rows = goals.map((g) => withProgress(mapGoal(g)));
    res.json({ goals: rows });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseBody(goalSchema, req.body);
    const goal = await Goal.create({
      _id: crypto.randomUUID(),
      user_id: req.user.id,
      title: input.title,
      target_paise: input.targetPaise,
      saved_paise: input.savedPaise || 0,
      monthly_target_paise: input.monthlyTargetPaise || 0,
      target_date: input.targetDate || null,
      color: input.color || '#2B9966',
    });
    res.status(201).json({ goal: withProgress(mapGoal(goal)) });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await getGoal(req.user.id, req.params.id);
    if (!existing) throw new ApiError(404, 'Savings goal not found.');

    const input = parseBody(goalPatchSchema, req.body);
    const merged = {
      title: input.title ?? existing.title,
      targetPaise: input.targetPaise ?? existing.target_paise,
      monthlyTargetPaise: input.monthlyTargetPaise ?? existing.monthly_target_paise,
      targetDate:
        input.targetDate === undefined ? existing.target_date : input.targetDate,
      color: input.color ?? existing.color,
    };

    existing.title = merged.title;
    existing.target_paise = merged.targetPaise;
    existing.monthly_target_paise = merged.monthlyTargetPaise;
    existing.target_date = merged.targetDate;
    existing.color = merged.color;
    existing.updated_at = new Date();
    await existing.save();

    res.json({
      goal: withProgress(mapGoal(existing)),
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await Goal.deleteOne({
      _id: req.params.id,
      user_id: req.user.id,
    });
    if (result.deletedCount === 0) throw new ApiError(404, 'Savings goal not found.');
    res.json({ ok: true });
  }),
);

router.post(
  '/:id/contributions',
  asyncHandler(async (req, res) => {
    const existing = await getGoal(req.user.id, req.params.id);
    if (!existing) throw new ApiError(404, 'Savings goal not found.');

    const input = parseBody(contributionSchema, req.body);

    const contribution = await Contribution.create({
      _id: crypto.randomUUID(),
      goal_id: existing._id,
      user_id: req.user.id,
      amount_paise: input.amountPaise,
      date: input.date,
      note: input.note || '',
    });

    existing.saved_paise += input.amountPaise;
    existing.updated_at = new Date();
    await existing.save();

    res.status(201).json({
      goal: withProgress(mapGoal(existing)),
    });
  }),
);

router.get(
  '/:id/contributions',
  asyncHandler(async (req, res) => {
    const existing = await getGoal(req.user.id, req.params.id);
    if (!existing) throw new ApiError(404, 'Savings goal not found.');

    const rows = await Contribution.find({
      goal_id: existing._id,
      user_id: req.user.id,
    }).sort({ date: -1, created_at: -1 });

    res.json({
      contributions: rows.map((row) => ({
        id: row._id,
        amountPaise: row.amount_paise,
        date: row.date,
        note: row.note,
        createdAt: row.created_at,
      })),
    });
  }),
);

export default router;
