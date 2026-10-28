import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { db, mapBudget, mapGoal, mapTransaction } from '../db.js';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCategory } from '../../shared/catalog.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import {
  addDays,
  addMonths,
  lastNMonths,
  monthBounds,
  previousMonth,
  toDateKey,
  toMonthKey,
} from '../lib/date.js';
import {
  buildInsights,
  budgetStatus,
  categoryBreakdown,
  computeSafeToSpend,
  dailySeries,
  paymentBreakdown,
  summarizeTransactions,
} from '../lib/calc.js';

const router = Router();
router.use(requireAuth);

function monthRows(userId, month) {
  const info = monthBounds(month);
  return db
    .prepare(
      `SELECT * FROM transactions
       WHERE user_id = ? AND date >= ? AND date <= ?
       ORDER BY date DESC, created_at DESC`,
    )
    .all(userId, info.start, info.end)
    .map(mapTransaction);
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month || toMonthKey();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new ApiError(400, 'Choose a valid month.');
    }

    const today = toDateKey();
    const info = monthBounds(month, today);
    const previous = previousMonth(month);

    const currentTransactions = monthRows(req.user.id, month);
    const previousTransactions = monthRows(req.user.id, previous);

    const summary = summarizeTransactions(currentTransactions);
    const previousSummary = summarizeTransactions(previousTransactions);

    const weekStart = addDays(today, -6);
    const weekExpensePaise = db
      .prepare(
        `SELECT COALESCE(SUM(amount_paise), 0) AS total
         FROM transactions
         WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
      )
      .get(req.user.id, weekStart, today).total;

    const todayExpensePaise = db
      .prepare(
        `SELECT COALESCE(SUM(amount_paise), 0) AS total
         FROM transactions
         WHERE user_id = ? AND type = 'expense' AND date = ?`,
      )
      .get(req.user.id, today).total;

    const expenseChangePct =
      previousSummary.expensePaise > 0
        ? Math.round(
            ((summary.expensePaise - previousSummary.expensePaise) /
              previousSummary.expensePaise) *
              100,
          )
        : null;

    const budgetRows = db
      .prepare('SELECT * FROM budgets WHERE user_id = ? AND month = ? ORDER BY category')
      .all(req.user.id, month)
      .map(mapBudget);

    const categories = categoryBreakdown(currentTransactions, EXPENSE_CATEGORIES);
    const previousCategories = categoryBreakdown(previousTransactions, EXPENSE_CATEGORIES);
    const payments = paymentBreakdown(currentTransactions, PAYMENT_METHODS);

    const budgetCards = budgetRows.map((budget) => {
      const spentPaise =
        budget.category === 'overall'
          ? summary.expensePaise
          : categories.find((category) => category.category === budget.category)?.amountPaise || 0;
      const meta = getCategory(budget.category);
      return {
        ...budget,
        label: budget.category === 'overall' ? 'Everything' : meta?.label || budget.category,
        color: meta?.color || '#12402f',
        spentPaise,
        ...budgetStatus(spentPaise, budget.limitPaise),
      };
    });

    const recurringRows = db
      .prepare(
        `SELECT * FROM recurring_expenses
         WHERE user_id = ? AND is_active = 1
         ORDER BY next_due_date ASC`,
      )
      .all(req.user.id);

    const upcomingBills = recurringRows
      .filter((bill) => bill.next_due_date <= addDays(today, 45))
      .map((bill) => {
        const meta = getCategory(bill.category);
        return {
          id: bill.id,
          title: bill.title,
          amountPaise: bill.amount_paise,
          category: bill.category,
          categoryLabel: meta?.label || bill.category,
          color: meta?.color || '#8D99AE',
          frequency: bill.frequency,
          nextDueDate: bill.next_due_date,
          isOverdue: bill.next_due_date < today,
        };
      });

    const reservedBills = recurringRows
      .filter(
        (bill) =>
          bill.next_due_date >= today &&
          bill.next_due_date <= `${month}-${String(info.days).padStart(2, '0')}`,
      )
      .map((bill) => ({
        id: bill.id,
        title: bill.title,
        amountPaise: bill.amount_paise,
        nextDueDate: bill.next_due_date,
        category: bill.category,
      }));

    const overallBudget = budgetRows.find((budget) => budget.category === 'overall');
    const safeToSpend = computeSafeToSpend({
      budgetPaise: overallBudget?.limitPaise || req.user.monthlyIncomePaise || 0,
      spentPaise: summary.expensePaise,
      reservedBills,
      month,
      today,
      source: overallBudget ? 'budget' : 'income',
    });

    const insights = buildInsights({
      month,
      today,
      summary: {
        ...summary,
        expenseChangePct,
        weekExpensePaise,
        todayExpensePaise,
      },
      categories,
      previousCategories,
      budgets: budgetCards,
      safeToSpend,
      paymentBreakdown: payments,
    });

    const trendMonths = lastNMonths(month, 6);
    const trendStart = `${trendMonths[0]}-01`;
    const trendEnd = `${month}-${String(info.days).padStart(2, '0')}`;
    const trendRows = db
      .prepare(
        `SELECT substr(date, 1, 7) AS month,
                SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END) AS income,
                SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END) AS expense
         FROM transactions
         WHERE user_id = ? AND date >= ? AND date <= ?
         GROUP BY substr(date, 1, 7)`,
      )
      .all(req.user.id, trendStart, trendEnd);
    const trendMap = new Map(trendRows.map((row) => [row.month, row]));
    const monthlyTrend = trendMonths.map((trendMonth) => ({
      month: trendMonth,
      incomePaise: trendMap.get(trendMonth)?.income || 0,
      expensePaise: trendMap.get(trendMonth)?.expense || 0,
    }));

    const recentRows = db
      .prepare(
        `SELECT * FROM transactions
         WHERE user_id = ?
         ORDER BY date DESC, created_at DESC
         LIMIT 6`,
      )
      .all(req.user.id)
      .map(mapTransaction);

    const goalRows = db
      .prepare('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at ASC')
      .all(req.user.id)
      .map(mapGoal)
      .map((goal) => {
        const savedThisMonthPaise = goal.monthlyTargetPaise
          ? db
              .prepare(
                `SELECT COALESCE(SUM(amount_paise), 0) AS total
                 FROM savings_contributions
                 WHERE goal_id = ? AND user_id = ? AND substr(date, 1, 7) = ?`,
              )
              .get(goal.id, req.user.id, toMonthKey()).total
          : 0;
        return {
          ...goal,
          progress: goal.targetPaise > 0 ? Math.round((goal.savedPaise / goal.targetPaise) * 100) : 0,
          savedThisMonthPaise,
          monthlyRemainingPaise: Math.max(0, goal.monthlyTargetPaise - savedThisMonthPaise),
          monthlyComplete:
            goal.monthlyTargetPaise > 0 && savedThisMonthPaise >= goal.monthlyTargetPaise,
        };
      });

    // Monthly savings reminder: fires when the budget plan is crossed (or about to be)
    // and a goal with a monthly target still has saving left to do this month.
    const currentMonthKey = toMonthKey();
    let goalReminder = null;
    if (month === currentMonthKey && (safeToSpend.status === 'over' || safeToSpend.status === 'warning')) {
      const reminderGoals = goalRows
        .filter(
          (goal) =>
            goal.monthlyTargetPaise > 0 &&
            goal.savedPaise < goal.targetPaise &&
            !goal.monthlyComplete,
        )
        .sort((a, b) => b.monthlyRemainingPaise - a.monthlyRemainingPaise);

      if (reminderGoals.length) {
        const overduePaise = Math.max(0, safeToSpend.spentPaise - safeToSpend.budgetPaise);
        goalReminder = {
          status: safeToSpend.status,
          overduePaise,
          goal: reminderGoals[0],
          totalMonthlyRemainingPaise: reminderGoals.reduce(
            (total, goal) => total + goal.monthlyRemainingPaise,
            0,
          ),
          goalCount: reminderGoals.length,
        };
      }
    }

    res.json({
      month,
      monthInfo: info,
      user: req.user,
      summary: {
        ...summary,
        previousIncomePaise: previousSummary.incomePaise,
        previousExpensePaise: previousSummary.expensePaise,
        expenseChangePct,
        weekExpensePaise,
        todayExpensePaise,
        monthExpensePaise: summary.expensePaise,
      },
      safeToSpend,
      budgets: budgetCards,
      categories,
      previousCategories,
      dailySeries: dailySeries(currentTransactions, month),
      monthlyTrend,
      paymentBreakdown: payments,
      recentTransactions: recentRows,
      upcomingBills,
      insights,
      goals: goalRows,
      goalReminder,
    });
  }),
);

export default router;
