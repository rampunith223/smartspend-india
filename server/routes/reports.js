import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { db, mapBudget, mapTransaction } from '../db.js';
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
    const transactions = db
      .prepare(
        `SELECT * FROM transactions
         WHERE user_id = ? AND date >= ? AND date <= ?
         ORDER BY date ASC, created_at ASC`,
      )
      .all(req.user.id, info.start, info.end)
      .map(mapTransaction);

    const summary = summarizeTransactions(transactions);
    const categories = categoryBreakdown(transactions, EXPENSE_CATEGORIES);
    const budgets = db
      .prepare('SELECT * FROM budgets WHERE user_id = ? AND month = ? ORDER BY category')
      .all(req.user.id, month)
      .map(mapBudget);

    const previousTransactions = db
      .prepare(
        `SELECT * FROM transactions
         WHERE user_id = ? AND date >= ? AND date <= ?`,
      )
      .all(
        req.user.id,
        `${previousMonth(month)}-01`,
        `${previousMonth(month)}-${String(monthBounds(previousMonth(month)).days).padStart(2, '0')}`,
      )
      .map(mapTransaction);
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
          (budget.limitPaise / 100).toFixed(2),
          (spent / 100).toFixed(2),
          ((budget.limitPaise - spent) / 100).toFixed(2),
          budget.limitPaise > 0 ? Math.round((spent / budget.limitPaise) * 100) : 0,
        ];
      }),
      [],
      ['Transactions'],
      ['Date', 'Type', 'Category', 'Payment method', 'Note', 'Amount (INR)'],
      ...transactions.map((transaction) => [
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
