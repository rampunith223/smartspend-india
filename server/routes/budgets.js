import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { db, mapBudget, nowIso } from '../db.js';
import { ApiError, asyncHandler, parseBody } from '../lib/http.js';
import { budgetSchema } from '../lib/schemas.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month;
    const rows = month
      ? db
          .prepare('SELECT * FROM budgets WHERE user_id = ? AND month = ? ORDER BY category')
          .all(req.user.id, month)
      : db
          .prepare('SELECT * FROM budgets WHERE user_id = ? ORDER BY month DESC, category')
          .all(req.user.id);
    res.json({ budgets: rows.map(mapBudget) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseBody(budgetSchema, req.body);
    const existing = db
      .prepare('SELECT * FROM budgets WHERE user_id = ? AND month = ? AND category = ?')
      .get(req.user.id, input.month, input.category);

    const timestamp = nowIso();

    if (existing) {
      db.prepare(
        'UPDATE budgets SET limit_paise = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      ).run(input.limitPaise, timestamp, existing.id, req.user.id);
      res.json({
        budget: mapBudget(
          db.prepare('SELECT * FROM budgets WHERE id = ?').get(existing.id),
        ),
      });
      return;
    }

    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO budgets (id, user_id, month, category, limit_paise, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, req.user.id, input.month, input.category, input.limitPaise, timestamp, timestamp);

    res.status(201).json({ budget: mapBudget(db.prepare('SELECT * FROM budgets WHERE id = ?').get(id)) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = db
      .prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    if (!result.changes) {
      throw new ApiError(404, 'Budget not found.');
    }
    res.json({ ok: true });
  }),
);

export default router;
