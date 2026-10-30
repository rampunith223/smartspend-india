import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import Transaction from '../models/Transaction.js';
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

function mapTransaction(doc) {
  if (!doc) return null;
  const o = doc.toObject();
  return {
    id: o._id,
    type: o.type,
    amountPaise: o.amount_paise,
    category: o.category,
    date: o.date,
    paymentMethod: o.payment_method,
    note: o.note,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month || toMonthKey();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new ApiError(400, 'Choose a valid month.');
    }

    const info = monthBounds(month);
    const filter = {
      user_id: req.user.id,
      date: { $gte: info.start, $lte: info.end },
    };

    if (req.query.from) filter.date.$gte = req.query.from;
    if (req.query.to) filter.date.$lte = req.query.to;
    if (req.query.type === 'expense' || req.query.type === 'income') {
      filter.type = req.query.type;
    }
    if (req.query.category && allCategoryIds.includes(req.query.category)) {
      filter.category = req.query.category;
    }
    if (req.query.payment && paymentIds.includes(req.query.payment)) {
      filter.payment_method = req.query.payment;
    }
    if (req.query.search && String(req.query.search).trim()) {
      const search = new RegExp(String(req.query.search).trim().slice(0, 80), 'i');
      filter.$or = [{ note: search }, { category: search }];
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const itemsCursor = Transaction.find(filter)
      .sort({ date: -1, created_at: -1 })
      .skip(offset)
      .limit(limit);

    const totalsCursor = Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          income: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount_paise', 0] },
          },
          expense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount_paise', 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const [items, totals] = await Promise.all([itemsCursor, totalsCursor]);

    const total = totals.length > 0 ? totals[0].count : 0;
    const incomePaise = totals.length > 0 ? totals[0].income : 0;
    const expensePaise = totals.length > 0 ? totals[0].expense : 0;

    res.json({
      items: items.map(mapTransaction),
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
      summary: {
        incomePaise,
        expensePaise,
      },
    });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseBody(transactionSchema, req.body);
    ensureNotFuture(input.date);

    const transaction = await Transaction.create({
      _id: crypto.randomUUID(),
      user_id: req.user.id,
      type: input.type,
      amount_paise: input.amountPaise,
      category: input.category,
      date: input.date,
      payment_method: input.paymentMethod,
      note: input.note || '',
    });

    res.status(201).json({
      transaction: mapTransaction(transaction),
    });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await Transaction.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });
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

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        type: input.type,
        amount_paise: input.amountPaise,
        category: input.category,
        date: input.date,
        payment_method: input.paymentMethod,
        note: input.note || '',
        updated_at: new Date(),
      },
      { new: true },
    );

    res.json({
      transaction: mapTransaction(updated),
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await Transaction.deleteOne({
      _id: req.params.id,
      user_id: req.user.id,
    });
    if (result.deletedCount === 0) {
      throw new ApiError(404, 'Transaction not found.');
    }
    res.json({ ok: true });
  }),
);

export default router;
