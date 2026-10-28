import { daysInMonth, monthBounds, monthLabel } from './date.js';
import { formatINR, percent } from './money.js';

export function budgetStatus(spentPaise, limitPaise) {
  if (!limitPaise || limitPaise <= 0) {
    return { percentUsed: 0, status: 'unset' };
  }

  const percentUsed = Math.round((spentPaise / limitPaise) * 100);
  let status = 'on_track';
  if (percentUsed >= 100) status = 'over';
  else if (percentUsed >= 80) status = 'warning';

  return { percentUsed, status };
}

export function computeSafeToSpend({
  budgetPaise = 0,
  spentPaise = 0,
  reservedBills = [],
  month,
  today,
  source = 'budget',
}) {
  const info = monthBounds(month, today);
  const relevantBills = reservedBills.filter((bill) => {
    if (info.isCurrent) return bill.nextDueDate >= today && bill.nextDueDate <= info.end;
    if (info.isFuture) return bill.nextDueDate.startsWith(month);
    return false;
  });

  const reservedPaise = relevantBills.reduce((total, bill) => total + bill.amountPaise, 0);
  const daysRemaining = info.isPast
    ? 0
    : info.isCurrent
      ? info.days - info.todayDay + 1
      : info.days;
  const availablePaise = budgetPaise - spentPaise - reservedPaise;
  const dailyLimitPaise =
    daysRemaining > 0 && budgetPaise > 0
      ? Math.max(0, Math.floor(availablePaise / daysRemaining))
      : 0;

  const { percentUsed } = budgetStatus(spentPaise, budgetPaise);
  let status = 'healthy';
  if (budgetPaise <= 0) status = 'unset';
  else if (spentPaise >= budgetPaise) status = 'over';
  else if (percentUsed >= 80) status = 'warning';

  return {
    month,
    budgetPaise,
    spentPaise,
    reservedPaise,
    reservedBills: relevantBills,
    availablePaise,
    budgetRemainingPaise: budgetPaise - spentPaise,
    dailyLimitPaise,
    daysRemaining,
    percentUsed,
    status,
    source: budgetPaise > 0 ? source : 'none',
  };
}

export function buildInsights({
  month,
  today,
  summary,
  categories,
  previousCategories,
  budgets,
  safeToSpend,
  paymentBreakdown,
}) {
  const info = monthBounds(month, today);
  const insights = [];
  const prevMap = new Map(previousCategories.map((item) => [item.category, item.amountPaise]));
  const top = categories[0];
  const previousTop = [...previousCategories].sort((a, b) => b.amountPaise - a.amountPaise)[0];

  if (top) {
    insights.push({
      id: 'top-category',
      tone: 'neutral',
      eyebrow: 'Biggest bucket',
      title: `${top.label} leads your spending`,
      body: `${formatINR(top.amountPaise)} went to ${top.label.toLowerCase()} — ${top.percent}% of this month's expenses.`,
    });

    const previousAmount = prevMap.get(top.category) || 0;
    if (previousAmount > 0) {
      const change = Math.round(((top.amountPaise - previousAmount) / previousAmount) * 100);
      if (Math.abs(change) >= 8) {
        insights.push({
          id: 'category-change',
          tone: change > 0 ? 'warning' : 'positive',
          eyebrow: 'Month on month',
          title:
            change > 0
              ? `${top.label} is up ${change}%`
              : `You cut ${top.label.toLowerCase()} by ${Math.abs(change)}%`,
          body: `${formatINR(top.amountPaise)} this month versus ${formatINR(previousAmount)} last month.`,
        });
      }
    }
  }

  if (info.isCurrent && info.todayDay > 0 && summary.expensePaise > 0) {
    const projected = Math.round((summary.expensePaise / info.todayDay) * info.days);
    if (safeToSpend.budgetPaise > 0) {
      const over = projected - safeToSpend.budgetPaise;
      insights.push({
        id: 'projection',
        tone: over > 0 ? 'warning' : 'positive',
        eyebrow: 'Month-end forecast',
        title:
          over > 0
            ? `On track to overspend by ${formatINR(over)}`
            : `On track to finish ${formatINR(Math.abs(over))} under budget`,
        body: `At your current pace, you'll spend about ${formatINR(projected)} by ${monthLabel(month, 'short')} end.`,
      });
    }
  }

  const smallTransactions = (summary.smallSpendCount ?? 0) > 0;
  if (smallTransactions) {
    insights.push({
      id: 'small-spends',
      tone: 'tip',
      eyebrow: 'The little leaks',
      title: `${summary.smallSpendCount} small spends added up`,
      body: `Purchases under ₹200 total ${formatINR(summary.smallSpendPaise)}. They're easy to miss, but they matter.`,
    });
  }

  const categoryBudget = budgets.find(
    (budget) => budget.category !== 'overall' && budget.status === 'warning',
  );
  const overBudget = budgets.find(
    (budget) => budget.category !== 'overall' && budget.status === 'over',
  );
  if (overBudget) {
    insights.push({
      id: 'budget-over',
      tone: 'danger',
      eyebrow: 'Budget crossed',
      title: `${overBudget.label} is over its limit`,
      body: `You've spent ${formatINR(overBudget.spentPaise)} against a ${formatINR(overBudget.limitPaise)} limit.`,
    });
  } else if (categoryBudget) {
    insights.push({
      id: 'budget-warning',
      tone: 'warning',
      eyebrow: 'Budget watch',
      title: `${categoryBudget.label} is at ${categoryBudget.percentUsed}%`,
      body: `${formatINR(Math.max(0, categoryBudget.limitPaise - categoryBudget.spentPaise))} left in that category for the rest of the month.`,
    });
  }

  if (safeToSpend.status !== 'unset' && info.isCurrent) {
    insights.push({
      id: 'safe-to-spend',
      tone: safeToSpend.dailyLimitPaise > 0 ? 'positive' : 'danger',
      eyebrow: 'Today’s guardrail',
      title:
        safeToSpend.dailyLimitPaise > 0
          ? `Keep today under ${formatINR(safeToSpend.dailyLimitPaise)}`
          : 'Your flexible budget is used up',
      body:
        safeToSpend.dailyLimitPaise > 0
          ? `${formatINR(Math.max(0, safeToSpend.availablePaise))} is free after protecting ${formatINR(safeToSpend.reservedPaise)} for bills, across ${safeToSpend.daysRemaining} days.`
          : `Bills and spending have used your available budget. Avoid non-essential spends until next month.`,
    });
  }

  if (summary.incomePaise > 0) {
    insights.push({
      id: 'savings-rate',
      tone: summary.savingsRate >= 20 ? 'positive' : 'neutral',
      eyebrow: 'Money kept',
      title:
        summary.savingsRate >= 20
          ? `You're keeping ${summary.savingsRate}% of income`
          : `Savings rate is ${Math.max(0, summary.savingsRate)}%`,
      body:
        summary.savingsRate >= 20
          ? `That's ${formatINR(summary.savingsPaise)} not spent this month. A strong buffer.`
          : `Aim for 20% — about ${formatINR(Math.round(summary.incomePaise * 0.2))} this month.`,
    });
  }

  if (paymentBreakdown?.length && paymentBreakdown[0].amountPaise > 0) {
    const topPayment = paymentBreakdown[0];
    insights.push({
      id: 'payment-method',
      tone: 'neutral',
      eyebrow: 'How you pay',
      title: `${topPayment.label} is your default`,
      body: `${topPayment.percent}% of expenses went through ${topPayment.label}. ${topPayment.label === 'UPI' ? 'One-tap payments add up quickly — check the weekly total.' : 'Review whether this method makes spending feel too frictionless.'}`,
    });
  }

  const unique = [];
  const seen = new Set();
  for (const insight of insights) {
    if (!seen.has(insight.id)) {
      seen.add(insight.id);
      unique.push(insight);
    }
  }
  return unique.slice(0, 6);
}

export function summarizeTransactions(transactions) {
  let incomePaise = 0;
  let expensePaise = 0;
  let smallSpendPaise = 0;
  let smallSpendCount = 0;

  for (const transaction of transactions) {
    if (transaction.type === 'income') {
      incomePaise += transaction.amountPaise;
    } else {
      expensePaise += transaction.amountPaise;
      if (transaction.amountPaise < 20_000) {
        smallSpendPaise += transaction.amountPaise;
        smallSpendCount += 1;
      }
    }
  }

  const savingsPaise = incomePaise - expensePaise;
  const savingsRate = incomePaise > 0 ? Math.round((savingsPaise / incomePaise) * 100) : 0;

  return {
    incomePaise,
    expensePaise,
    savingsPaise,
    savingsRate,
    transactionCount: transactions.length,
    smallSpendPaise,
    smallSpendCount,
  };
}

export function categoryBreakdown(transactions, catalog) {
  const totals = new Map();
  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue;
    const current = totals.get(transaction.category) || { amountPaise: 0, count: 0 };
    current.amountPaise += transaction.amountPaise;
    current.count += 1;
    totals.set(transaction.category, current);
  }

  const totalExpense = [...totals.values()].reduce((total, item) => total + item.amountPaise, 0);
  return [...totals.entries()]
    .map(([category, value]) => {
      const meta = catalog.find((item) => item.id === category);
      return {
        category,
        label: meta?.label || 'Other',
        color: meta?.color || '#8D99AE',
        amountPaise: value.amountPaise,
        count: value.count,
        percent: percent(value.amountPaise, totalExpense),
      };
    })
    .sort((a, b) => b.amountPaise - a.amountPaise);
}

export function dailySeries(transactions, month) {
  const days = daysInMonth(month);
  const values = Array.from({ length: days }, (_, index) => ({
    date: `${month}-${String(index + 1).padStart(2, '0')}`,
    day: index + 1,
    expensePaise: 0,
    incomePaise: 0,
  }));

  for (const transaction of transactions) {
    const day = Number(transaction.date.slice(8, 10));
    if (!values[day - 1]) continue;
    if (transaction.type === 'income') values[day - 1].incomePaise += transaction.amountPaise;
    else values[day - 1].expensePaise += transaction.amountPaise;
  }

  return values;
}

export function paymentBreakdown(transactions, catalog) {
  const totals = new Map();
  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue;
    totals.set(
      transaction.paymentMethod,
      (totals.get(transaction.paymentMethod) || 0) + transaction.amountPaise,
    );
  }
  const total = [...totals.values()].reduce((sum, amount) => sum + amount, 0);

  return [...totals.entries()]
    .map(([method, amountPaise]) => {
      const meta = catalog.find((item) => item.id === method);
      return {
        method,
        label: meta?.label || method,
        amountPaise,
        percent: percent(amountPaise, total),
      };
    })
    .sort((a, b) => b.amountPaise - a.amountPaise);
}
