import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { db, mapRecurring, mapTransaction, nowIso } from '../db.js';
import { advanceDueDate, toDateKey } from '../lib/date.js';
import { ApiError, asyncHandler, parseBody } from '../lib/http.js';
import { recurringPatchSchema, recurringSchema } from '../lib/schemas.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare(
        `SELECT * FROM recurring_expenses
         WHERE user_id = ?
         ORDER BY is_active DESC, next_due_date ASC`,
      )
      .all(req.user.id);
    res.json({ recurring: rows.map(mapRecurring) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseBody(recurringSchema, req.body);
    const id = crypto.randomUUID();
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO recurring_expenses
        (id, user_id, title, amount_paise, category, frequency, next_due_date, notes, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      req.user.id,
      input.title,
      input.amountPaise,
      input.category,
      input.frequency,
      input.nextDueDate,
      input.notes || '',
      input.isActive === false ? 0 : 1,
      timestamp,
      timestamp,
    );
    res.status(201).json({
      recurring: mapRecurring(db.prepare('SELECT * FROM recurring_expenses WHERE id = ?').get(id)),
    });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = db
      .prepare('SELECT * FROM recurring_expenses WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!existing) throw new ApiError(404, 'Recurring expense not found.');

    const input = parseBody(recurringPatchSchema, req.body);
    const merged = {
      title: input.title ?? existing.title,
      amountPaise: input.amountPaise ?? existing.amount_paise,
      category: input.category ?? existing.category,
      frequency: input.frequency ?? existing.frequency,
      nextDueDate: input.nextDueDate ?? existing.next_due_date,
      notes: input.notes ?? existing.notes,
      isActive: input.isActive ?? Boolean(existing.is_active),
    };
    const valid = parseBody(recurringSchema, merged);

    db.prepare(
      `UPDATE recurring_expenses SET
         title = ?, amount_paise = ?, category = ?, frequency = ?,
         next_due_date = ?, notes = ?, is_active = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    ).run(
      valid.title,
      valid.amountPaise,
      valid.category,
      valid.frequency,
      valid.nextDueDate,
      valid.notes || '',
      valid.isActive === false ? 0 : 1,
      nowIso(),
      req.params.id,
      req.user.id,
    );

    res.json({
      recurring: mapRecurring(
        db.prepare('SELECT * FROM recurring_expenses WHERE id = ?').get(req.params.id),
      ),
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = db
      .prepare('DELETE FROM recurring_expenses WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    if (!result.changes) throw new ApiError(404, 'Recurring expense not found.');
    res.json({ ok: true });
  }),
);

router.post(
  '/:id/pay',
  asyncHandler(async (req, res) => {
    const bill = db
      .prepare('SELECT * FROM recurring_expenses WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!bill) throw new ApiError(404, 'Recurring expense not found.');

    const today = toDateKey();
    let nextDueDate = advanceDueDate(bill.next_due_date, bill.frequency);
    let guard = 0;
    while (nextDueDate <= today && guard < 60) {
      nextDueDate = advanceDueDate(nextDueDate, bill.frequency);
      guard += 1;
    }

    const transactionId = crypto.randomUUID();
    const timestamp = nowIso();

    const result = db.transaction(() => {
      db.prepare(
        `INSERT INTO transactions
          (id, user_id, type, amount_paise, category, date, payment_method, note, created_at, updated_at)
         VALUES (?, ?, 'expense', ?, ?, ?, 'upi', ?, ?, ?)`,
      ).run(
        transactionId,
        req.user.id,
        bill.amount_paise,
        bill.category,
        today,
        `Bill paid: ${bill.title}`,
        timestamp,
        timestamp,
      );
      db.prepare(
        'UPDATE recurring_expenses SET next_due_date = ?, updated_at = ? WHERE id = ?',
      ).run(nextDueDate, timestamp, bill.id);
      return db.prepare('SELECT * FROM transactions WHERE id = ?').get(transactionId);
    })();

    res.status(201).json({
      transaction: mapTransaction(result),
      recurring: mapRecurring(
        db.prepare('SELECT * FROM recurring_expenses WHERE id = ?').get(bill.id),
      ),
    });
  }),
);

export default router;
