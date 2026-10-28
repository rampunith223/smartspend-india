import test from 'node:test';
import assert from 'node:assert/strict';
import { budgetStatus, buildInsights, computeSafeToSpend } from './calc.js';
import { advanceDueDate, daysInMonth, monthBounds, previousMonth } from './date.js';

test('safe-to-spend protects reserved bills and splits the rest over remaining days', () => {
  const result = computeSafeToSpend({
    budgetPaise: 800_000,
    spentPaise: 500_000,
    reservedBills: [
      {
        id: 'bill-1',
        title: 'Electricity',
        amountPaise: 100_000,
        nextDueDate: '2026-10-28',
        category: 'bills',
      },
      {
        id: 'bill-2',
        title: 'Next month bill',
        amountPaise: 50_000,
        nextDueDate: '2026-11-02',
        category: 'bills',
      },
    ],
    month: '2026-10',
    today: '2026-10-22',
  });

  assert.equal(result.reservedPaise, 100_000);
  assert.equal(result.availablePaise, 200_000);
  assert.equal(result.daysRemaining, 10);
  assert.equal(result.dailyLimitPaise, 20_000);
  assert.equal(result.status, 'healthy');
});

test('safe-to-spend returns zero when the flexible budget is used up', () => {
  const result = computeSafeToSpend({
    budgetPaise: 500_000,
    spentPaise: 480_000,
    reservedBills: [{ amountPaise: 50_000, nextDueDate: '2026-10-25' }],
    month: '2026-10',
    today: '2026-10-22',
  });

  assert.equal(result.dailyLimitPaise, 0);
  assert.equal(result.status, 'warning');
  assert.ok(result.availablePaise < 0);
});

test('budget status crosses warning and over thresholds at the right points', () => {
  assert.equal(budgetStatus(7_900, 10_000).status, 'on_track');
  assert.equal(budgetStatus(8_000, 10_000).status, 'warning');
  assert.equal(budgetStatus(10_000, 10_000).status, 'over');
  assert.equal(budgetStatus(100, 0).status, 'unset');
});

test('month helpers handle leap years and month boundaries', () => {
  assert.equal(daysInMonth('2028-02'), 29);
  assert.equal(daysInMonth('2026-02'), 28);
  assert.equal(previousMonth('2026-01'), '2025-12');
  assert.deepEqual(monthBounds('2026-10', '2026-10-24'), {
    month: '2026-10',
    start: '2026-10-01',
    end: '2026-10-31',
    days: 31,
    today: '2026-10-24',
    todayMonth: '2026-10',
    todayDay: 24,
    isCurrent: true,
    isPast: false,
    isFuture: false,
  });
});

test('recurring dates advance without rolling past short months', () => {
  assert.equal(advanceDueDate('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(advanceDueDate('2026-12-15', 'monthly'), '2027-01-15');
  assert.equal(advanceDueDate('2026-10-24', 'weekly'), '2026-10-31');
  assert.equal(advanceDueDate('2026-10-24', 'yearly'), '2027-10-24');
});

test('insights explain the biggest category and a meaningful month-on-month change', () => {
  const insights = buildInsights({
    month: '2026-10',
    today: '2026-10-24',
    summary: {
      incomePaise: 2_400_000,
      expensePaise: 1_300_000,
      savingsPaise: 1_100_000,
      savingsRate: 46,
      smallSpendPaise: 50_000,
      smallSpendCount: 4,
    },
    categories: [
      {
        category: 'food',
        label: 'Food & dining',
        amountPaise: 500_000,
        percent: 38,
        count: 8,
      },
    ],
    previousCategories: [
      {
        category: 'food',
        label: 'Food & dining',
        amountPaise: 400_000,
        percent: 30,
        count: 7,
      },
    ],
    budgets: [
      {
        category: 'food',
        label: 'Food & dining',
        limitPaise: 600_000,
        spentPaise: 500_000,
        status: 'warning',
        percentUsed: 83,
      },
    ],
    safeToSpend: {
      dailyLimitPaise: 20_000,
      availablePaise: 200_000,
      reservedPaise: 100_000,
      daysRemaining: 8,
      status: 'warning',
      budgetPaise: 1_800_000,
    },
    paymentBreakdown: [{ method: 'upi', label: 'UPI', amountPaise: 900_000, percent: 69 }],
  });

  assert.ok(insights.length >= 3);
  assert.ok(insights.some((insight) => insight.id === 'top-category'));
  assert.ok(insights.some((insight) => insight.id === 'category-change'));
  assert.ok(insights.some((insight) => insight.id === 'safe-to-spend'));
});
