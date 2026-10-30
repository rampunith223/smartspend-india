import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import Recurring from '../models/Recurring.js';
import Transaction from '../models/Transaction.js';
import { advanceDueDate, toDateKey } from '../lib/date.js';
import { ApiError, asyncHandler, parseBody } from '../lib/http.js';
import { recurringPatchSchema, recurringSchema } from '../lib/schemas.js';

const router = Router();
router.use(requireAuth);

function mapRecurring(doc) {
  if (!doc) return null;
  const o = doc.toObject();
  return {
    id: o._id,
    title: o.title,
    amountPaise: o.amount_paise,
    category: o.category,
    frequency: o.frequency,
    nextDueDate: o.next_due_date,
    notes: o.notes,
    isActive: o.is_active,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await Recurring.find({ user_id: req.user.id }).sort({
      is_active: -1,
      next_due_date: 1,
    });
    res.json({ recurring: rows.map(mapRecurring) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseBody(recurringSchema, req.body);
    const recurring = await Recurring.create({
      _id: crypto.randomUUID(),
      user_id: req.user.id,
      title: input.title,
      amount_paise: input.amountPaise,
      category: input.category,
      frequency: input.frequency,
      next_due_date: input.nextDueDate,
      notes: input.notes || '',
      is_active: input.isActive !== false,
    });
    res.status(201).json({
      recurring: mapRecurring(recurring),
    });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await Recurring.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });
    if (!existing) throw new ApiError(404, 'Recurring expense not found.');

    const input = parseBody(recurringPatchSchema, req.body);
    const merged = {
      title: input.title ?? existing.title,
      amountPaise: input.amountPaise ?? existing.amount_paise,
      category: input.category ?? existing.category,
      frequency: input.frequency ?? existing.frequency,
      nextDueDate: input.nextDueDate ?? existing.next_due_date,
      notes: input.notes ?? existing.notes,
      isActive: input.isActive ?? existing.is_active,
    };
    const valid = parseBody(recurringSchema, merged);

    existing.title = valid.title;
    existing.amount_paise = valid.amountPaise;
    existing.category = valid.category;
    existing.frequency = valid.frequency;
    existing.next_due_date = valid.nextDueDate;
    existing.notes = valid.notes || '';
    existing.is_active = valid.isActive !== false;
    existing.updated_at = new Date();
    await existing.save();

    res.json({
      recurring: mapRecurring(existing),
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await Recurring.deleteOne({
      _id: req.params.id,
      user_id: req.user.id,
    });
    if (result.deletedCount === 0) throw new ApiError(404, 'Recurring expense not found.');
    res.json({ ok: true });
  }),
);

router.post(
  '/:id/pay',
  asyncHandler(async (req, res) => {
    const bill = await Recurring.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });
    if (!bill) throw new ApiError(404, 'Recurring expense not found.');

    const today = toDateKey();
    let nextDueDate = advanceDueDate(bill.next_due_date, bill.frequency);
    let guard = 0;
    while (nextDueDate <= today && guard < 60) {
      nextDueDate = advanceDueDate(nextDueDate, bill.frequency);
      guard += 1;
    }

    const transactionId = crypto.randomUUID();
    const timestamp = new Date();

    const transaction = await Transaction.create({
      _id: transactionId,
      user_id: req.user.id,
      type: 'expense',
      amount_paise: bill.amount_paise,
      category: bill.category,
      date: today,
      payment_method: 'upi',
      note: `Bill paid: ${bill.title}`,
    });

    bill.next_due_date = nextDueDate;
    bill.updated_at = timestamp;
    await bill.save();

    res.status(201).json({
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amountPaise: transaction.amount_paise,
        category: transaction.category,
        date: transaction.date,
        paymentMethod: transaction.payment_method,
        note: transaction.note,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      },
      recurring: mapRecurring(bill),
    });
  }),
);

export default router;
