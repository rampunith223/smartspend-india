import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { db, mapTransaction, nowIso } from '../db.js';
import { ApiError, asyncHandler, parseBody } from '../lib/http.js';
import { monthBounds, toDateKey, toMonthKey } from '../lib/date.js';
import {
  allCategoryIds,
  paymentIds,
  transactionPatchSchema,
  transactionSchema,
} from '../lib/schemas.js';

const router = Router();
router.use(requireAuth);

function ensureNotFuture(date) {
  if (date > toDateKey()) {
    throw new ApiError(400, 'Transactions cannot be dated in the future.');
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month || toMonthKey();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new ApiError(400, 'Choose a valid month.');
    }

    const conditions = ['user_id = ?'];
    const values = [req.user.id];
    const info = monthBounds(month);

    conditions.push('date >= ? AND date <= ?');
    values.push(info.start, info.end);

    if (req.query.from) {
      conditions.push('date >= ?');
      values.push(req.query.from);
    }
    if (req.query.to) {
      conditions.push('date <= ?');
      values.push(req.query.to);
    }
    if (req.query.type === 'expense' || req.query.type === 'income') {
      conditions.push('type = ?');
      values.push(req.query.type);
    }
    if (req.query.category && allCategoryIds.includes(req.query.category)) {
      conditions.push('category = ?');
      values.push(req.query.category);
    }
    if (req.query.payment && paymentIds.includes(req.query.payment)) {
      conditions.push('payment_method = ?');
      values.push(req.query.payment);
    }
    if (req.query.search && String(req.query.search).trim()) {
      const search = `%${String(req.query.search).trim().slice(0, 80)}%`;
      conditions.push('(note LIKE ? OR category LIKE ?)');
      values.push(search, search);
    }

    const where = conditions.join(' AND ');
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const rows = db
      .prepare(
        `SELECT * FROM transactions
         WHERE ${where}
         ORDER BY date DESC, created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...values, limit, offset);

    const totals = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END), 0) AS income,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END), 0) AS expense,
           COUNT(*) AS count
         FROM transactions WHERE ${where}`,
      )
      .get(...values);

    res.json({
      items: rows.map(mapTransaction),
      total: totals.count,
      limit,
      offset,
      hasMore: offset + rows.length < totals.count,
      summary: {
        incomePaise: totals.income,
        expensePaise: totals.expense,
      },
    });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseBody(transactionSchema, req.body);
    ensureNotFuture(input.date);

    const id = crypto.randomUUID();
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO transactions
        (id, user_id, type, amount_paise, category, date, payment_method, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      req.user.id,
      input.type,
      input.amountPaise,
      input.category,
      input.date,
      input.paymentMethod,
      input.note || '',
      timestamp,
      timestamp,
    );

    res.status(201).json({
      transaction: mapTransaction(db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)),
    });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = db
      .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!existing) {
      throw new ApiError(404, 'Transaction not found.');
    }

    const patch = parseBody(transactionPatchSchema, req.body);
    const merged = {
      type: patch.type ?? existing.type,
      amountPaise: patch.amountPaise ?? existing.amount_paise,
      category: patch.category ?? existing.category,
      date: patch.date ?? existing.date,
      paymentMethod: patch.paymentMethod ?? existing.payment_method,
      note: patch.note ?? existing.note,
    };
    const input = parseBody(transactionSchema, merged);
    ensureNotFuture(input.date);

    db.prepare(
      `UPDATE transactions SET
         type = ?, amount_paise = ?, category = ?, date = ?,
         payment_method = ?, note = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    ).run(
      input.type,
      input.amountPaise,
      input.category,
      input.date,
      input.paymentMethod,
      input.note || '',
      nowIso(),
      req.params.id,
      req.user.id,
    );

    res.json({
      transaction: mapTransaction(
        db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id),
      ),
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = db
      .prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    if (!result.changes) {
      throw new ApiError(404, 'Transaction not found.');
    }
    res.json({ ok: true });
  }),
);

export default router;
