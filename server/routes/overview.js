import { Router } from 'express';
import { requireAuth } from '../auth.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Recurring from '../models/Recurring.js';
import Goal from '../models/Goal.js';
import Contribution from '../models/Contribution.js';
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

function mapGoal(doc) {
  if (!doc) return null;
  const o = doc.toObject();
  return {
    id: o._id,
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

async function monthRows(userId, month) {
  const info = monthBounds(month);
  const docs = await Transaction.find({
    user_id: userId,
    date: { $gte: info.start, $lte: info.end },
  }).sort({ date: -1, created_at: -1 });
  return docs.map(mapTransaction);
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

    const currentTransactions = await monthRows(req.user.id, month);
    const previousTransactions = await monthRows(req.user.id, previous);

    const summary = summarizeTransactions(currentTransactions);
    const previousSummary = summarizeTransactions(previousTransactions);

    const weekStart = addDays(today, -6);
    const weekExpenseAgg = await Transaction.aggregate([
      {
        $match: {
          user_id: req.user.id,
          type: 'expense',
          date: { $gte: weekStart, $lte: today },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount_paise' } } },
    ]);
    const weekExpensePaise = weekExpenseAgg.length > 0 ? weekExpenseAgg[0].total : 0;

    const todayExpenseAgg = await Transaction.aggregate([
      {
        $match: {
          user_id: req.user.id,
          type: 'expense',
          date: today,
        },
      },
      { $group: { _id: null, total: { $sum: '$amount_paise' } } },
    ]);
    const todayExpensePaise = todayExpenseAgg.length > 0 ? todayExpenseAgg[0].total : 0;

    const expenseChangePct =
      previousSummary.expensePaise > 0
        ? Math.round(
            ((summary.expensePaise - previousSummary.expensePaise) /
              previousSummary.expensePaise) *
              100,
          )
        : null;

    const budgetRows = await Budget.find({
      user_id: req.user.id,
      month,
    }).sort({ category: 1 });
    const budgets = budgetRows.map(mapBudget);

    const categories = categoryBreakdown(currentTransactions, EXPENSE_CATEGORIES);
    const previousCategories = categoryBreakdown(previousTransactions, EXPENSE_CATEGORIES);
    const payments = paymentBreakdown(currentTransactions, PAYMENT_METHODS);

    const budgetCards = budgets.map((budget) => {
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

    const recurringRows = await Recurring.find({
      user_id: req.user.id,
      is_active: true,
    }).sort({ next_due_date: 1 });

    const upcomingBills = recurringRows
      .filter((bill) => bill.next_due_date <= addDays(today, 45))
      .map((bill) => {
        const meta = getCategory(bill.category);
        return {
          id: bill._id,
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
        id: bill._id,
        title: bill.title,
        amountPaise: bill.amount_paise,
        nextDueDate: bill.next_due_date,
        category: bill.category,
      }));

    const overallBudget = budgets.find((budget) => budget.category === 'overall');
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
    const trendRows = await Transaction.aggregate([
      {
        $match: {
          user_id: req.user.id,
          date: { $gte: trendStart, $lte: trendEnd },
        },
      },
      {
        $group: {
          _id: { $substr: ['$date', 0, 7] },
          income: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount_paise', 0] },
          },
          expense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount_paise', 0] },
          },
        },
      },
    ]);
    const trendMap = new Map(trendRows.map((row) => [row._id, row]));
    const monthlyTrend = trendMonths.map((trendMonth) => ({
      month: trendMonth,
      incomePaise: trendMap.get(trendMonth)?.income || 0,
      expensePaise: trendMap.get(trendMonth)?.expense || 0,
    }));

    const recentRows = await Transaction.find({ user_id: req.user.id })
      .sort({ date: -1, created_at: -1 })
      .limit(6)
      .then((docs) => docs.map(mapTransaction));

    const goalRows = await Goal.find({ user_id: req.user.id }).sort({ created_at: 1 });
    const currentMonthKey = toMonthKey();

    const goalRowsWithProgress = await Promise.all(
      goalRows.map(async (goal) => {
        let savedThisMonthPaise = 0;
        if (goal.monthly_target_paise > 0) {
          const agg = await Contribution.aggregate([
            {
              $match: {
                goal_id: goal._id,
                user_id: req.user.id,
                date: { $regex: `^${currentMonthKey}` },
              },
            },
            { $group: { _id: null, total: { $sum: '$amount_paise' } } },
          ]);
          savedThisMonthPaise = agg.length > 0 ? agg[0].total : 0;
        }
        const g = mapGoal(goal);
        return {
          ...g,
          progress: g.targetPaise > 0 ? Math.round((g.savedPaise / g.targetPaise) * 100) : 0,
          savedThisMonthPaise,
          monthlyRemainingPaise: Math.max(0, g.monthlyTargetPaise - savedThisMonthPaise),
          monthlyComplete:
            g.monthlyTargetPaise > 0 && savedThisMonthPaise >= g.monthlyTargetPaise,
        };
      })
    );

    // Monthly savings reminder: fires when the budget plan is crossed (or about to be)
    // and a goal with a monthly target still has saving left to do this month.
    let goalReminder = null;
    if (
      month === currentMonthKey &&
      (safeToSpend.status === 'over' || safeToSpend.status === 'warning')
    ) {
      const reminderGoals = goalRowsWithProgress
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
      goals: goalRowsWithProgress,
      goalReminder,
    });
  }),
);

export default router;
