import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellRing,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronRight,
  Coffee,
  Gauge,
  PiggyBank,
  PieChart,
  Plus,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import MonthSwitcher from '../components/MonthSwitcher.jsx';
import { CategoryIcon, PaymentIcon } from '../lib/icons.jsx';
import { DailySpendChart, SpendingDonut } from '../components/charts.jsx';
import Button from '../components/ui/Button.jsx';
import {
  Badge,
  EmptyState,
  ErrorState,
  IconBubble,
  PageHeader,
  ProgressBar,
  ProgressRing,
  SectionHeading,
  Skeleton,
} from '../components/ui/Misc.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useQuickAdd } from '../context/QuickAddContext.jsx';
import { api, fetcher } from '../lib/api.js';
import Modal from '../components/ui/Modal.jsx';
import { cn } from '../lib/cn.js';
import { currentMonth, formatDate, formatMonth, greeting, relativeDay, toDateKey } from '../lib/dates.js';
import { formatINR, formatPercent } from '../lib/format.js';
import { enablePush, getPushStatus, pushSupported } from '../lib/push.js';
import { getCategory } from '../../shared/catalog.js';

const INSIGHT_ICONS = {
  'top-category': PieChart,
  'category-change': TrendingUp,
  projection: Gauge,
  'small-spends': Coffee,
  'budget-warning': AlertTriangle,
  'budget-over': AlertCircle,
  'safe-to-spend': ShieldCheck,
  'savings-rate': PiggyBank,
  'payment-method': QrCode,
};

const INSIGHT_TONES = {
  positive: {
    icon: 'bg-forest-50 text-forest-700 dark:bg-forest-500/15 dark:text-forest-300',
    dot: 'bg-forest-500',
  },
  warning: {
    icon: 'bg-saffron-50 text-saffron-700 dark:bg-saffron-400/15 dark:text-saffron-300',
    dot: 'bg-saffron-400',
  },
  danger: {
    icon: 'bg-clay-50 text-clay-700 dark:bg-clay-500/15 dark:text-clay-300',
    dot: 'bg-clay-500',
  },
  neutral: {
    icon: 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
    dot: 'bg-ink-400',
  },
  tip: {
    icon: 'bg-[#e8f0f5] text-[#315c75] dark:bg-[#457b9d]/20 dark:text-[#a9c7db]',
    dot: 'bg-[#457b9d]',
  },
};

function StatCard({ icon: Icon, label, value, sub, tone = 'forest', badge }) {
  const tones = {
    forest: 'bg-forest-50 text-forest-700 dark:bg-forest-500/15 dark:text-forest-300',
    clay: 'bg-clay-50 text-clay-700 dark:bg-clay-500/15 dark:text-clay-300',
    saffron: 'bg-saffron-50 text-saffron-700 dark:bg-saffron-400/15 dark:text-saffron-300',
    ink: 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
  };
  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className={cn('grid h-9 w-9 place-items-center rounded-xl', tones[tone])}>
          <Icon size={17} strokeWidth={1.8} />
        </span>
        {badge}
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400 dark:text-ink-500">
        {label}
      </p>
      <p className="mt-0.5 font-display text-[1.65rem] font-semibold leading-tight tracking-[-0.035em] text-ink-950 dark:text-white">
        {value}
      </p>
      {sub ? <p className="mt-1 text-[11px] leading-relaxed text-ink-400 dark:text-ink-500">{sub}</p> : null}
    </div>
  );
}

function SafeToSpendCard({ data, onAdd }) {
  const safe = data.safeToSpend;
  const info = data.monthInfo;
  const overall = data.budgets.find((budget) => budget.category === 'overall');
  const isCurrent = info.isCurrent;
  const over = safe.budgetPaise > 0 && safe.availablePaise < 0;
  const percentUsed = safe.percentUsed;
  const billCount = safe.reservedBills.length;

  return (
    <div className="relative overflow-hidden rounded-4xl bg-forest-950 p-6 text-white shadow-lift sm:p-7">
      <div className="absolute inset-0 dot-pattern opacity-25" />
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-forest-500/30 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-saffron-400/10 blur-3xl" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-forest-200">
            <ShieldCheck size={17} className="text-saffron-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
              {isCurrent ? 'Safe to spend today' : 'Month at a glance'}
            </span>
          </div>
          {isCurrent ? (
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[10px] font-bold text-forest-100">
              {safe.daysRemaining} {safe.daysRemaining === 1 ? 'day' : 'days'} left
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[10px] font-bold text-forest-100">
              {formatMonth(data.month, 'short')}
            </span>
          )}
        </div>

        {safe.budgetPaise <= 0 ? (
          <>
            <p className="mt-5 font-display text-5xl font-semibold leading-none tracking-[-0.04em]">
              Set a plan
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-forest-100/65">
              Add an overall monthly budget or your monthly income so we can calculate a safe daily
              number for you.
            </p>
            <Link to="/app/budgets" className="mt-6 w-fit">
              <Button variant="saffron" size="sm">
                Set up a budget <ArrowRight size={14} />
              </Button>
            </Link>
          </>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className="font-display text-[3.4rem] font-semibold leading-none tracking-[-0.05em] sm:text-[4.1rem]">
                {isCurrent ? formatINR(safe.dailyLimitPaise) : formatINR(safe.spentPaise)}
              </p>
              {isCurrent ? (
                <span className="pb-1.5 text-sm font-semibold text-forest-200/60">/ day</span>
              ) : (
                <span className="pb-1.5 text-sm font-semibold text-forest-200/60">spent</span>
              )}
            </div>
            <p className="mt-2 max-w-md text-[12px] leading-relaxed text-forest-100/60 sm:text-[13px]">
              {isCurrent ? (
                over ? (
                  <>You’re {formatINR(Math.abs(safe.availablePaise))} beyond your flexible budget. Keep today light.</>
                ) : (
                  <>
                    {formatINR(Math.max(0, safe.availablePaise))} is free for the rest of the month
                    {billCount > 0 ? (
                      <> after protecting {formatINR(safe.reservedPaise)} across {billCount} upcoming {billCount === 1 ? 'bill' : 'bills'}</>
                    ) : (
                      <> with no upcoming bills reserved</>
                    )}
                    .
                  </>
                )
              ) : (
                <>
                  {formatINR(safe.budgetRemainingPaise)} {safe.budgetRemainingPaise < 0 ? 'over' : 'left'} of
                  your {formatINR(safe.budgetPaise)} budget for {formatMonth(data.month, 'long')}.
                </>
              )}
            </p>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-forest-200/60">
                <span>{percentUsed}% of budget used</span>
                <span>{over ? 'Over plan' : `${formatINR(Math.max(0, safe.budgetRemainingPaise))} remaining`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-700',
                    over ? 'bg-clay-400' : 'bg-saffron-400',
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, percentUsed))}%` }}
                />
              </div>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-3 pt-6">
              {[
                ['Budget', safe.budgetPaise],
                ['Spent', safe.spentPaise],
                ['Protected', safe.reservedPaise],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-forest-200/45">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-white">{formatINR(value)}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button variant="saffron" size="sm" onClick={onAdd}>
                <Plus size={15} /> Log today’s spend
              </Button>
              <Link to="/app/budgets">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-forest-100 hover:bg-white/10 hover:text-white"
                >
                  Adjust plan <ChevronRight size={14} />
                </Button>
              </Link>
            </div>
            {safe.source === 'income' ? (
              <p className="mt-3 text-[9px] text-forest-200/35">
                Using monthly income as your plan. Add an overall budget for a sharper number.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function GoalReminderAlarm({ reminder, month, onSaved }) {
  const { mutate } = useSWRConfig();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(`smarts:alarm-dismissed:${month}`) === '1';
    } catch {
      return false;
    }
  });
  const [saving, setSaving] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const soundedRef = useRef(false);

  const goal = reminder?.goal;

  useEffect(() => {
    if (!pushSupported()) return;
    getPushStatus()
      .then((status) => setPushOn(status.subscribed))
      .catch(() => {});
  }, []);

  // One-time alarm: beep + browser notification when the reminder first appears.
  useEffect(() => {
    if (!reminder || !goal || soundedRef.current || dismissed) return;
    soundedRef.current = true;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        [0, 0.28].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = offset === 0 ? 880 : 660;
          gain.gain.setValueAtTime(0.001, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + offset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.22);
          osc.connect(gain).connect(ctx.destination);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.25);
        });
        setTimeout(() => ctx.close(), 1200);
      }
    } catch {
      /* audio is best-effort */
    }

    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('SmartSpend reminder: save toward your goal', {
          body: `Your budget plan is over. Set aside ${formatINR(goal.monthlyRemainingPaise)} for “${goal.title}”.`,
          tag: `goal-alarm-${goal.id}`,
        });
      }
    } catch {
      /* notification is best-effort */
    }
  }, [reminder, goal, dismissed, soundedRef]);

  if (!reminder || !goal || dismissed) return null;

  const isOver = reminder.status === 'over';

  async function handleSaveNow() {
    setSaving(true);
    try {
      await api(`/goals/${goal.id}/contributions`, {
        method: 'POST',
        body: {
          amountPaise: goal.monthlyRemainingPaise,
          date: toDateKey(),
          note: 'Monthly saving',
        },
      });
      toast.success(`${formatINR(goal.monthlyRemainingPaise)} saved toward ${goal.title}.`);
      onSaved?.();
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not record this saving.');
    } finally {
      setSaving(false);
    }
  }

  function handleDismiss() {
    try {
      window.localStorage.setItem(`smarts:alarm-dismissed:${month}`, '1');
    } catch {
      /* storage is best-effort */
    }
    setDismissed(true);
  }

  async function handleEnableNotifications() {
    if (!pushSupported()) {
      toast.error('This browser does not support push notifications.');
      return;
    }
    try {
      await enablePush();
      toast.success('Phone alerts enabled — you’ll get a pop-up with sound even when the app is closed.');
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not enable phone alerts.');
    }
  }

  return (
    <div className="relative overflow-hidden rounded-4xl border-2 border-clay-300/70 bg-gradient-to-br from-clay-50 via-paper to-saffron-50/60 p-5 shadow-lift dark:border-clay-500/40 dark:from-clay-500/15 dark:via-ink-900 dark:to-saffron-400/10 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-clay-500 text-white dark:bg-clay-500">
          <BellRing size={22} className="animate-bell" />
          <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-saffron-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-clay-600 dark:text-clay-300">
            <AlertCircle size={12} />
            {isOver ? 'Budget plan crossed — savings alarm' : 'Budget running low — savings nudge'}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-[-0.03em] text-ink-950 dark:text-white sm:text-2xl">
            Don’t let “{goal.title}” slip this month
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-300">
            {isOver ? (
              <>
                You’re {formatINR(reminder.overduePaise)} over your budget plan. Even so, keep your
                promise:{' '}
              </>
            ) : (
              <>You’ve used most of your budget plan. Lock in your saving before it’s gone: </>
            )}
            <strong className="font-bold text-ink-900 dark:text-white">
              {formatINR(goal.monthlyRemainingPaise)} still to save
            </strong>{' '}
            toward “{goal.title}” this month ({formatINR(goal.savedThisMonthPaise)} of{' '}
            {formatINR(goal.monthlyTargetPaise)} done).
            {reminder.goalCount > 1 ? (
              <> Plus {reminder.goalCount - 1} other {reminder.goalCount === 2 ? 'goal' : 'goals'}, {formatINR(reminder.totalMonthlyRemainingPaise - goal.monthlyRemainingPaise)} more in total.</>
            ) : null}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="danger" size="sm" onClick={handleSaveNow} loading={saving}>
              <PiggyBank size={15} /> Save {formatINR(goal.monthlyRemainingPaise)} now
            </Button>
            <Link to="/app/goals">
              <Button variant="secondary" size="sm">
                Open goals
              </Button>
            </Link>
            {pushSupported() && !pushOn ? (
              <Button variant="ghost" size="sm" onClick={handleEnableNotifications}>
                <Bell size={14} /> Enable phone alerts
              </Button>
            ) : null}
            <button
              type="button"
              onClick={handleDismiss}
              className="ml-auto text-[11px] font-bold text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-200"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetOverviewCard({ data }) {
  const overall = data.budgets.find((budget) => budget.category === 'overall');
  const categories = data.budgets
    .filter((budget) => budget.category !== 'overall')
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .slice(0, 3);

  const statusColor =
    overall?.status === 'over' ? '#C74C2C' : overall?.status === 'warning' ? '#F98F07' : '#2B9966';

  return (
    <div className="surface flex h-full flex-col p-5 sm:p-6">
      <SectionHeading
        title="Budget health"
        description="Your overall plan for the month"
        action={
          <Link
            to="/app/budgets"
            className="text-[11px] font-bold text-forest-700 hover:text-forest-900 dark:text-forest-300"
          >
            Manage
          </Link>
        }
      />

      {overall ? (
        <>
          <div className="mt-5 flex items-center gap-5">
            <ProgressRing value={overall.percentUsed} size={92} stroke={9} color={statusColor}>
              <div className="text-center">
                <p className="font-display text-xl font-semibold tracking-[-0.03em] text-ink-950 dark:text-white">
                  {overall.percentUsed}%
                </p>
                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-ink-400">used</p>
              </div>
            </ProgressRing>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ink-400 dark:text-ink-500">Left to spend</p>
              <p className="mt-0.5 font-display text-[1.9rem] font-semibold leading-none tracking-[-0.035em] text-ink-950 dark:text-white">
                {formatINR(Math.max(0, overall.limitPaise - overall.spentPaise))}
              </p>
              <p className="mt-1.5 text-[11px] text-ink-400 dark:text-ink-500">
                of {formatINR(overall.limitPaise)} overall
              </p>
              {overall.status === 'warning' ? (
                <Badge tone="saffron" className="mt-2">
                  <AlertTriangle size={10} /> Approaching limit
                </Badge>
              ) : overall.status === 'over' ? (
                <Badge tone="red" className="mt-2">
                  <AlertCircle size={10} /> Over budget
                </Badge>
              ) : (
                <Badge tone="green" className="mt-2">
                  <Check size={10} /> On track
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-ink-100/80 pt-4 dark:border-white/10">
            {categories.length ? (
              categories.map((budget) => (
                <div key={budget.id}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 font-semibold text-ink-600 dark:text-ink-300">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: budget.color }} />
                      {budget.label}
                    </span>
                    <span className="font-bold text-ink-800 dark:text-ink-100">
                      {budget.percentUsed}%
                    </span>
                  </div>
                  <ProgressBar
                    value={budget.percentUsed}
                    color={
                      budget.status === 'over'
                        ? '#C74C2C'
                        : budget.status === 'warning'
                          ? '#F98F07'
                          : budget.color
                    }
                    height="h-1.5"
                    className="mt-1.5"
                  />
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-400">Add category limits to see them here.</p>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Wallet}
          title="No overall budget yet"
          description="Set a monthly limit so SmartSpend can protect your bills and calculate a daily number."
          action={
            <Link to="/app/budgets">
              <Button size="sm">Set a budget</Button>
            </Link>
          }
          className="py-8"
        />
      )}
    </div>
  );
}

function InsightsPanel({ insights }) {
  return (
    <div className="surface flex h-full flex-col p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-saffron-50 text-saffron-700 dark:bg-saffron-400/15 dark:text-saffron-300">
            <Sparkles size={16} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-950 dark:text-white">
              Smart insights
            </h2>
            <p className="text-[10px] text-ink-400">Plain-language reads</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3">
        {insights.slice(0, 3).map((insight) => {
          const Icon = INSIGHT_ICONS[insight.id] || Sparkles;
          const tone = INSIGHT_TONES[insight.tone] || INSIGHT_TONES.neutral;
          return (
            <div key={insight.id} className="rounded-2xl border border-ink-100/80 p-3 dark:border-white/10">
              <div className="flex items-start gap-2.5">
                <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg', tone.icon)}>
                  <Icon size={13} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">
                    {insight.eyebrow}
                  </p>
                  <p className="mt-0.5 text-xs font-bold leading-snug text-ink-900 dark:text-white">
                    {insight.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-ink-500 dark:text-ink-400">
                    {insight.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {!insights.length ? (
          <p className="rounded-2xl bg-ink-50 p-4 text-xs leading-relaxed text-ink-500 dark:bg-white/5 dark:text-ink-400">
            Add a few transactions and your insights will appear here.
          </p>
        ) : null}
      </div>
      <Link
        to="/app/budgets#insights"
        className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-forest-700 hover:text-forest-900 dark:text-forest-300"
      >
        All insights <ArrowRight size={13} />
      </Link>
    </div>
  );
}

function CategoryCard({ data }) {
  const items = data.categories.slice(0, 5);
  const total = data.summary.expensePaise;

  return (
    <div className="surface p-5">
      <SectionHeading
        title="Where it went"
        description={formatMonth(data.month, 'long')}
        action={
          <Link
            to="/app/budgets"
            className="text-[11px] font-bold text-forest-700 hover:text-forest-900 dark:text-forest-300"
          >
            Details
          </Link>
        }
      />
      <SpendingDonut items={data.categories} totalPaise={total} height={190} />
      <div className="mt-3 space-y-2">
        {items.map((category) => (
          <div key={category.category} className="flex items-center gap-2 text-[11px]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
            <span className="min-w-0 flex-1 truncate font-semibold text-ink-600 dark:text-ink-300">
              {category.label}
            </span>
            <span className="font-bold text-ink-900 dark:text-white">{formatINR(category.amountPaise)}</span>
            <span className="w-8 text-right text-ink-400">{category.percent}%</span>
          </div>
        ))}
        {!items.length ? (
          <p className="py-3 text-center text-xs text-ink-400">No expenses yet this month.</p>
        ) : null}
      </div>
    </div>
  );
}

function DailyChartCard({ data }) {
  const highest = [...data.dailySeries].sort((a, b) => b.expensePaise - a.expensePaise)[0];
  return (
    <div className="surface p-5">
      <SectionHeading
        title="Daily rhythm"
        description="Every spike tells a story"
        action={
          <span className="pill">
            <CalendarRange size={12} />
            {formatMonth(data.month, 'short')}
          </span>
        }
      />
      <div className="mt-5">
        <DailySpendChart series={data.dailySeries} height={225} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-ink-100/80 pt-3 text-[11px] dark:border-white/10">
        <span className="text-ink-400">Highest spending day</span>
        <span className="font-bold text-ink-800 dark:text-ink-100">
          {highest?.expensePaise > 0
            ? `${formatDate(highest.date, 'short')} · ${formatINR(highest.expensePaise)}`
            : 'No spending yet'}
        </span>
      </div>
    </div>
  );
}

function RecentTransactions({ transactions }) {
  return (
    <div className="surface p-5">
      <SectionHeading
        title="Recent activity"
        description="Your latest money moves"
        action={
          <Link
            to="/app/transactions"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-700 hover:text-forest-900 dark:text-forest-300"
          >
            View all <ArrowRight size={13} />
          </Link>
        }
      />
      <div className="mt-4 divide-y divide-ink-100/80 dark:divide-white/10">
        {transactions.map((transaction) => {
          const meta = getCategory(transaction.category);
          return (
            <div key={transaction.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                style={{ backgroundColor: meta?.soft || '#EFF1F5', color: meta?.color || '#8D99AE' }}
              >
                <CategoryIcon category={transaction.category} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink-900 dark:text-white">
                  {transaction.note || meta?.label || 'Transaction'}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink-400">
                  <PaymentIcon method={transaction.paymentMethod} size={11} />
                  <span>{meta?.label}</span>
                  <span>·</span>
                  <span>{formatDate(transaction.date, 'short')}</span>
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 text-[13px] font-bold tabular-nums',
                  transaction.type === 'income'
                    ? 'text-forest-700 dark:text-forest-300'
                    : 'text-ink-900 dark:text-white',
                )}
              >
                {transaction.type === 'income' ? '+' : '−'}
                {formatINR(transaction.amountPaise)}
              </span>
            </div>
          );
        })}
        {!transactions.length ? (
          <EmptyState
            icon={ReceiptText}
            title="No transactions yet"
            description="Add your first expense or income to start building the picture."
            className="py-8"
          />
        ) : null}
      </div>
    </div>
  );
}

function UpcomingBills({ bills, onPay, payingId }) {
  return (
    <div className="surface p-5">
      <SectionHeading
        title="Bills ahead"
        description="Money already spoken for"
        action={
          <Link
            to="/app/budgets#bills"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-700 hover:text-forest-900 dark:text-forest-300"
          >
            Manage <ArrowRight size={13} />
          </Link>
        }
      />
      <div className="mt-4 space-y-2.5">
        {bills.slice(0, 4).map((bill) => (
          <div
            key={bill.id}
            className="flex items-center gap-3 rounded-2xl border border-ink-100/80 p-3 dark:border-white/10"
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: `${bill.color}18`, color: bill.color }}
            >
              <CategoryIcon category={bill.category} size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-ink-900 dark:text-white">{bill.title}</p>
              <p className="mt-0.5 text-[10px] text-ink-400">
                {bill.isOverdue ? (
                  <span className="font-semibold text-clay-600 dark:text-clay-400">Overdue</span>
                ) : (
                  relativeDay(bill.nextDueDate)
                )}{' '}
                · {bill.categoryLabel}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-bold text-ink-900 dark:text-white">{formatINR(bill.amountPaise)}</p>
              <button
                type="button"
                onClick={() => onPay(bill)}
                disabled={payingId === bill.id}
                className="mt-0.5 text-[10px] font-bold text-forest-700 hover:text-forest-900 disabled:opacity-50 dark:text-forest-300"
              >
                {payingId === bill.id ? 'Paying…' : 'Mark paid'}
              </button>
            </div>
          </div>
        ))}
        {!bills.length ? (
          <div className="rounded-2xl border border-dashed border-ink-200 px-4 py-6 text-center text-xs text-ink-400 dark:border-white/10">
            No upcoming bills. Add recurring expenses in Budgets.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GoalsStrip({ goals }) {
  if (!goals.length) return null;
  return (
    <div className="surface p-5">
      <SectionHeading
        title="Goals in motion"
        description="Small contributions, real progress"
        action={
          <Link
            to="/app/goals"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-700 hover:text-forest-900 dark:text-forest-300"
          >
            All goals <ArrowRight size={13} />
          </Link>
        }
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {goals.slice(0, 3).map((goal) => (
          <Link
            key={goal.id}
            to="/app/goals"
            className="group rounded-2xl border border-ink-100/80 p-4 transition hover:border-ink-200 hover:shadow-sm dark:border-white/10 dark:hover:border-white/20"
          >
            <div className="flex items-center justify-between">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{ backgroundColor: `${goal.color}18`, color: goal.color }}
              >
                <Target size={15} />
              </span>
              <span className="text-[10px] font-bold text-ink-400">{goal.progress}%</span>
            </div>
            <p className="mt-3 truncate text-[12px] font-bold text-ink-900 dark:text-white">{goal.title}</p>
            <p className="mt-0.5 text-[10px] text-ink-400">
              {formatINR(goal.savedPaise)} of {formatINR(goal.targetPaise)}
            </p>
            <ProgressBar value={goal.progress} color={goal.color} height="h-1.5" className="mt-2.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function BudgetOverPopup({ data, onClose }) {
  const safe = data.safeToSpend;
  const overduePaise = Math.max(0, safe.spentPaise - safe.budgetPaise);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(`smarts:budget-over-dismissed:${data.month}`) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed || safe.status !== 'over') return null;

  function handleDismiss() {
    try {
      window.localStorage.setItem(`smarts:budget-over-dismissed:${data.month}`, '1');
    } catch {
      /* storage is best-effort */
    }
    setDismissed(true);
    onClose();
  }

  return (
    <Modal
      open={true}
      onClose={handleDismiss}
      dismissible
      title="Budget Overused"
      description="You've spent more than your monthly budget plan."
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleDismiss}>
            Dismiss
          </Button>
          <Link to="/app/budgets">
            <Button className="flex-1">View Budget</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clay-50 text-clay-600 dark:bg-clay-500/15 dark:text-clay-300"
          >
            <AlertCircle size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-clay-600 dark:text-clay-300">
              Budget Alert
            </p>
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-950 dark:text-white">
              You're over budget
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
              You've spent{' '}
              <strong className="text-ink-900 dark:text-white">{formatINR(safe.spentPaise)}</strong>{' '}
              against a{' '}
              <strong className="text-ink-900 dark:text-white">{formatINR(safe.budgetPaise)}</strong>{' '}
              monthly budget.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-clay-200 bg-clay-50 px-4 py-4 dark:border-clay-500/20 dark:bg-clay-500/10">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-ink-600 dark:text-ink-300">Amount over budget</span>
            <span className="font-bold text-clay-700 dark:text-clay-300">
              {formatINR(overduePaise)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2">
            <span className="font-bold text-ink-600 dark:text-ink-300">You need to save</span>
            <span className="font-bold text-clay-700 dark:text-clay-300">
              {formatINR(overduePaise)}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-ink-500 dark:text-ink-400">
            Cut back on non-essential spends or add income to get back on track this month.
          </p>
        </div>
      </div>
    </Modal>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-12">
        <Skeleton className="h-[360px] rounded-4xl lg:col-span-7" />
        <Skeleton className="h-[360px] rounded-4xl lg:col-span-5" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-32 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <Skeleton className="h-96 rounded-3xl lg:col-span-4" />
        <Skeleton className="h-96 rounded-3xl lg:col-span-5" />
        <Skeleton className="h-96 rounded-3xl lg:col-span-3" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const { mutate } = useSWRConfig();
  const [month, setMonth] = useState(currentMonth());
  const [payingId, setPayingId] = useState(null);
  const { data, error, isLoading, mutate: refresh } = useSWR(
    `/api/overview?month=${month}`,
    fetcher,
  );

  async function handlePayBill(bill) {
    setPayingId(bill.id);
    try {
      await api(`/recurring/${bill.id}/pay`, { method: 'POST' });
      toast.success(`${bill.title} marked paid and added to expenses.`);
      await mutate(`/api/overview?month=${month}`);
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'), undefined, {
        revalidate: true,
      });
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not mark this bill paid.');
    } finally {
      setPayingId(null);
    }
  }

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={formatMonth(month, 'long')}
        title={`${greeting()}, ${firstName}.`}
        description={
          data
            ? `Here’s where your money stands ${data.monthInfo.isCurrent ? 'today' : `in ${formatMonth(month, 'long')}`}.`
            : 'Here’s where your money stands.'
        }
        actions={
          <>
            <MonthSwitcher month={month} onChange={setMonth} />
            <Button onClick={() => openQuickAdd({ type: 'expense' })}>
              <Plus size={16} /> Add expense
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={() => refresh()} />
      ) : isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          {data.goalReminder ? (
            <GoalReminderAlarm
              reminder={data.goalReminder}
              month={data.month}
              onSaved={async () => {
                await refresh();
                await mutate(
                  (key) => typeof key === 'string' && key.startsWith('/api/goals'),
                  undefined,
                  { revalidate: true },
                );
              }}
            />
          ) : null}

          <BudgetOverPopup data={data} onClose={() => {}} />

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SafeToSpendCard data={data} onAdd={() => openQuickAdd({ type: 'expense' })} />
            </div>
            <div className="lg:col-span-5">
              <BudgetOverviewCard data={data} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={ArrowDownToLine}
              label="Income"
              value={formatINR(data.summary.incomePaise)}
              sub="Money in this month"
              tone="forest"
            />
            <StatCard
              icon={ArrowUpRight}
              label="Expenses"
              value={formatINR(data.summary.expensePaise)}
              sub={
                data.summary.expenseChangePct === null
                  ? 'No prior month to compare'
                  : `${formatPercent(data.summary.expenseChangePct, { showSign: true })} vs last month`
              }
              tone="clay"
              badge={
                data.summary.expenseChangePct !== null ? (
                  <Badge tone={data.summary.expenseChangePct > 0 ? 'red' : 'green'}>
                    {data.summary.expenseChangePct > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(data.summary.expenseChangePct)}%
                  </Badge>
                ) : null
              }
            />
            <StatCard
              icon={PiggyBank}
              label="Savings"
              value={formatINR(data.summary.savingsPaise)}
              sub={`${Math.max(0, data.summary.savingsRate)}% of income kept`}
              tone="saffron"
            />
            <StatCard
              icon={CalendarDays}
              label="Last 7 days"
              value={formatINR(data.summary.weekExpensePaise)}
              sub={`Today: ${formatINR(data.summary.todayExpensePaise)}`}
              tone="ink"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <CategoryCard data={data} />
            </div>
            <div className="lg:col-span-5">
              <DailyChartCard data={data} />
            </div>
            <div className="lg:col-span-3" id="insights">
              <InsightsPanel insights={data.insights} />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <RecentTransactions transactions={data.recentTransactions} />
            </div>
            <div className="lg:col-span-5">
              <UpcomingBills bills={data.upcomingBills} onPay={handlePayBill} payingId={payingId} />
            </div>
          </div>

          <GoalsStrip goals={data.goals} />
        </>
      )}
    </div>
  );
}
