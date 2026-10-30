import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import Budget from '../models/Budget.js';
import { ApiError, asyncHandler, parseBody } from '../lib/http.js';
import { budgetSchema } from '../lib/schemas.js';

const router = Router();
router.use(requireAuth);

function mapBudget(doc) {
  if (!doc) return null;
  const o = doc.toObject();
  return {
    id: o._id,
    month: o.month,
    category: o.category,
    limitPaise: o.limit_paise,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month;
    let rows;
    if (month) {
      rows = await Budget.find({
        user_id: req.user.id,
        month,
      }).sort({ category: 1 });
    } else {
      rows = await Budget.find({ user_id: req.user.id }).sort({ month: -1, category: 1 });
    }
    res.json({ budgets: rows.map(mapBudget) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseBody(budgetSchema, req.body);
    const existing = await Budget.findOne({
      user_id: req.user.id,
      month: input.month,
      category: input.category,
    });

    const timestamp = new Date();

    if (existing) {
      existing.limit_paise = input.limitPaise;
      existing.updated_at = timestamp;
      await existing.save();
      res.json({ budget: mapBudget(existing) });
      return;
    }

    const budget = await Budget.create({
      _id: crypto.randomUUID(),
      user_id: req.user.id,
      month: input.month,
      category: input.category,
      limit_paise: input.limitPaise,
    });

    res.status(201).json({ budget: mapBudget(budget) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await Budget.deleteOne({
      _id: req.params.id,
      user_id: req.user.id,
    });
    if (result.deletedCount === 0) {
      throw new ApiError(404, 'Budget not found.');
    }
    res.json({ ok: true });
  }),
);

export default router;
