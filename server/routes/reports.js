import { Router } from 'express';
import { requireAuth } from '../auth.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCategory } from '../../shared/catalog.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import { monthBounds, monthLabel, previousMonth, toDateKey, toMonthKey } from '../lib/date.js';
import { categoryBreakdown, summarizeTransactions } from '../lib/calc.js';

const router = Router();
router.use(requireAuth);

function csvCell(value) {
  const stringValue = String(value ?? '');
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function csvRows(rows) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

router.get(
  '/monthly.csv',
  asyncHandler(async (req, res) => {
    const month = req.query.month || toMonthKey();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new ApiError(400, 'Choose a valid month.');
    }

    const info = monthBounds(month);
    const transactions = await Transaction.find({
      user_id: req.user.id,
      date: { $gte: info.start, $lte: info.end },
    }).sort({ date: 1, created_at: 1 });

    const mappedTransactions = transactions.map((t) => ({
      id: t._id,
      type: t.type,
      amountPaise: t.amount_paise,
      category: t.category,
      date: t.date,
      paymentMethod: t.payment_method,
      note: t.note,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    const summary = summarizeTransactions(mappedTransactions);
    const categories = categoryBreakdown(mappedTransactions, EXPENSE_CATEGORIES);
    const budgets = await Budget.find({
      user_id: req.user.id,
      month,
    }).sort({ category: 1 });

    const prevMonth = previousMonth(month);
    const prevInfo = monthBounds(prevMonth);
    const previousTransactions = await Transaction.find({
      user_id: req.user.id,
      date: { $gte: prevInfo.start, $lte: prevInfo.end },
    }).map((t) => ({
      id: t._id,
      type: t.type,
      amountPaise: t.amount_paise,
      category: t.category,
      date: t.date,
      paymentMethod: t.payment_method,
      note: t.note,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
    const previousSummary = summarizeTransactions(previousTransactions);

    const rows = [
      ['SmartSpend India — Monthly report'],
      ['Month', monthLabel(month)],
      ['Generated', new Date().toLocaleString('en-IN')],
      [],
      ['Summary'],
      ['Total income (INR)', (summary.incomePaise / 100).toFixed(2)],
      ['Total expenses (INR)', (summary.expensePaise / 100).toFixed(2)],
      ['Savings (INR)', (summary.savingsPaise / 100).toFixed(2)],
      ['Savings rate (%)', summary.savingsRate],
      ['Transactions', summary.transactionCount],
      ['Previous month expenses (INR)', (previousSummary.expensePaise / 100).toFixed(2)],
      [],
      ['Spending by category'],
      ['Category', 'Amount (INR)', 'Share (%)', 'Transactions'],
      ...categories.map((category) => [
        category.label,
        (category.amountPaise / 100).toFixed(2),
        category.percent,
        category.count,
      ]),
      [],
      ['Budgets'],
      ['Category', 'Limit (INR)', 'Spent (INR)', 'Remaining (INR)', 'Used (%)'],
      ...budgets.map((budget) => {
        const spent =
          budget.category === 'overall'
            ? summary.expensePaise
            : categories.find((category) => category.category === budget.category)?.amountPaise ||
              0;
        return [
          budget.category === 'overall' ? 'Everything' : getCategory(budget.category)?.label,
          (budget.limit_paise / 100).toFixed(2),
          (spent / 100).toFixed(2),
          ((budget.limit_paise - spent) / 100).toFixed(2),
          budget.limit_paise > 0 ? Math.round((spent / budget.limit_paise) * 100) : 0,
        ];
      }),
      [],
      ['Transactions'],
      ['Date', 'Type', 'Category', 'Payment method', 'Note', 'Amount (INR)'],
      ...mappedTransactions.map((transaction) => [
        transaction.date,
        transaction.type,
        getCategory(transaction.category)?.label || transaction.category,
        PAYMENT_METHODS.find((method) => method.id === transaction.paymentMethod)?.label ||
          transaction.paymentMethod,
        transaction.note,
        (transaction.amountPaise / 100).toFixed(2),
      ]),
    ];

    const filename = `smartspend-report-${month}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(`\uFEFF${csvRows(rows)}`);
  }),
);

export default router;
