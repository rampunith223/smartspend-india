import { useEffect, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  Coffee,
  Gauge,
  Pencil,
  PieChart,
  Plus,
  QrCode,
  ReceiptText,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  getCategory,
} from '../../shared/catalog.js';
import MonthSwitcher from '../components/MonthSwitcher.jsx';
import {
  DailySpendChart,
  MonthlyTrendChart,
  SpendingDonut,
} from '../components/charts.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Field, Input, Select, Textarea, Toggle } from '../components/ui/Form.jsx';
import {
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  ProgressRing,
  SectionHeading,
  Skeleton,
} from '../components/ui/Misc.jsx';
import { api, fetcher } from '../lib/api.js';
import { cn } from '../lib/cn.js';
import {
  currentMonth,
  formatDate,
  formatMonth,
  relativeDay,
  toDateKey,
} from '../lib/dates.js';
import {
  formatINR,
  formatRupeeInput,
  parseRupeeInput,
} from '../lib/format.js';
import { CategoryIcon, PaymentIcon } from '../lib/icons.jsx';
import { BUDGET_SUGGESTIONS } from '../../shared/catalog.js';

const INSIGHT_ICONS = {
  'top-category': PieChart,
  'category-change': TrendingUp,
  projection: Gauge,
  'small-spends': Coffee,
  'budget-warning': AlertTriangle,
  'budget-over': AlertCircle,
  'safe-to-spend': ShieldCheck,
  'savings-rate': Wallet,
  'payment-method': QrCode,
};

const INSIGHT_TONES = {
  positive: 'bg-forest-50 text-forest-700 dark:bg-forest-500/15 dark:text-forest-300',
  warning: 'bg-saffron-50 text-saffron-700 dark:bg-saffron-400/15 dark:text-saffron-300',
  danger: 'bg-clay-50 text-clay-700 dark:bg-clay-500/15 dark:text-clay-300',
  neutral: 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
  tip: 'bg-[#e8f0f5] text-[#315c75] dark:bg-[#457b9d]/20 dark:text-[#a9c7db]',
};

const STATUS_META = {
  on_track: { label: 'On track', tone: 'green', color: '#2B9966' },
  warning: { label: 'Watch', tone: 'saffron', color: '#F98F07' },
  over: { label: 'Over', tone: 'red', color: '#C74C2C' },
  unset: { label: 'Not set', tone: 'neutral', color: '#8D99AE' },
};

function OverallBudgetCard({ overall, onEdit }) {
  const status = STATUS_META[overall?.status || 'unset'];
  const remaining = overall ? overall.limitPaise - overall.spentPaise : 0;

  return (
    <div className="surface relative overflow-hidden p-6">
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-forest-300/15 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={overall?.percentUsed || 0}
            size={104}
            stroke={10}
            color={status.color}
          >
            <div className="text-center">
              <p className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink-950 dark:text-white">
                {overall?.percentUsed || 0}%
              </p>
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-ink-400">of plan</p>
            </div>
          </ProgressRing>
          <div>
            <p className="eyebrow">Overall monthly budget</p>
            <p className="mt-1 font-display text-3xl font-semibold tracking-[-0.035em] text-ink-950 dark:text-white">
              {overall ? formatINR(overall.limitPaise) : 'Not set'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {overall ? (
                <>
                  <Badge tone={status.tone}>{status.label}</Badge>
                  <span className="text-[11px] text-ink-400">
                    {formatINR(overall.spentPaise)} spent
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-ink-400">
                  Set a limit to unlock your daily safe-to-spend number.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          {overall ? (
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
                {remaining >= 0 ? 'Left to spend' : 'Over budget'}
              </p>
              <p
                className={cn(
                  'font-display text-2xl font-semibold tracking-[-0.03em]',
                  remaining >= 0
                    ? 'text-forest-800 dark:text-forest-300'
                    : 'text-clay-600 dark:text-clay-300',
                )}
              >
                {formatINR(Math.abs(remaining))}
              </p>
            </div>
          ) : null}
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Pencil size={14} /> {overall ? 'Edit overall' : 'Set overall budget'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CategoryBudgetCard({ budget, onEdit, onDelete }) {
  const status = STATUS_META[budget.status] || STATUS_META.unset;
  return (
    <div className="group rounded-2xl border border-ink-100/80 bg-white/60 p-4 transition hover:border-ink-200 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-white/20">
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
          style={{
            backgroundColor: getCategory(budget.category)?.soft || '#EFF1F5',
            color: budget.color,
          }}
        >
          <CategoryIcon category={budget.category} size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-bold text-ink-900 dark:text-white">{budget.label}</p>
            <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onEdit(budget)}
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={`Edit ${budget.label} budget`}
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(budget)}
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-clay-50 hover:text-clay-600 dark:hover:bg-clay-500/10 dark:hover:text-clay-300"
                aria-label={`Delete ${budget.label} budget`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <p className="mt-0.5 text-[10px] text-ink-400">
            {formatINR(budget.spentPaise)} of {formatINR(budget.limitPaise)}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar value={budget.percentUsed} color={status.color} height="h-1.5" />
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-ink-400">
            {formatINR(Math.max(0, budget.limitPaise - budget.spentPaise))} left
          </span>
          <Badge tone={status.tone}>{budget.percentUsed}%</Badge>
        </div>
      </div>
    </div>
  );
}

function BudgetModal({ open, onClose, month, budget, defaultCategory, existingCategories, onSaved }) {
  const [category, setCategory] = useState('overall');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(budget);

  useEffect(() => {
    if (!open) return;
    const fallback =
      defaultCategory ||
      budget?.category ||
      EXPENSE_CATEGORIES.find((item) => !existingCategories.includes(item.id))?.id ||
      'food';
    setCategory(budget?.category || fallback);
    setAmount(budget ? formatRupeeInput(budget.limitPaise) : '');
    setError('');
    setSaving(false);
  }, [open, budget, defaultCategory, existingCategories]);

  const suggestion = BUDGET_SUGGESTIONS[category];

  async function handleSubmit(event) {
    event.preventDefault();
    const limitPaise = parseRupeeInput(amount);
    if (Number.isNaN(limitPaise) || limitPaise <= 0) {
      setError('Enter a budget amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      await api('/budgets', {
        method: 'POST',
        body: { month, category, limitPaise },
      });
      toast.success(`${category === 'overall' ? 'Overall budget' : 'Category budget'} saved.`);
      onSaved?.();
      onClose?.();
    } catch (requestError) {
      setError(requestError?.message || 'Could not save this budget.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      dismissible={!saving}
      title={isEditing ? 'Edit budget' : 'Add a budget'}
      description={`Plan how ${formatMonth(month, 'long')} should go. You can change this any time.`}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="budget-form" className="flex-1" loading={saving}>
            Save budget
          </Button>
        </div>
      }
    >
      <form id="budget-form" onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Budget for"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          disabled={isEditing}
        >
          <option value="overall">Everything — overall monthly budget</option>
          <optgroup label="Categories">
            {EXPENSE_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </optgroup>
        </Select>

        <Input
          label="Monthly limit"
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          placeholder={suggestion ? String(suggestion) : '0'}
          prefix="₹"
          autoFocus
          hint={
            suggestion
              ? `A starting suggestion for this category is ${formatINR(suggestion * 100)}. Adjust it to your reality.`
              : 'Use a limit you can genuinely stick to.'
          }
        />

        {error ? (
          <p className="rounded-xl bg-clay-50 px-3.5 py-2.5 text-xs font-medium text-clay-700 dark:bg-clay-500/10 dark:text-clay-300">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function BillModal({ open, onClose, bill, onSaved }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('bills');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState(toDateKey());
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(bill);

  useEffect(() => {
    if (!open) return;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setTitle(bill?.title || '');
    setAmount(bill ? formatRupeeInput(bill.amountPaise) : '');
    setCategory(bill?.category || 'bills');
    setFrequency(bill?.frequency || 'monthly');
    setNextDueDate(bill?.nextDueDate || toDateKey(defaultDate));
    setNotes(bill?.notes || '');
    setIsActive(bill?.isActive ?? true);
    setSaving(false);
    setError('');
  }, [open, bill]);

  async function handleSubmit(event) {
    event.preventDefault();
    const amountPaise = parseRupeeInput(amount);
    if (!title.trim()) {
      setError('Give this bill a name.');
      return;
    }
    if (!amountPaise || Number.isNaN(amountPaise)) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!nextDueDate) {
      setError('Choose the next due date.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        amountPaise,
        category,
        frequency,
        nextDueDate,
        notes: notes.trim(),
        isActive,
      };
      if (isEditing) {
        await api(`/recurring/${bill.id}`, { method: 'PATCH', body });
      } else {
        await api('/recurring', { method: 'POST', body });
      }
      toast.success(isEditing ? 'Bill updated.' : 'Recurring bill added.');
      onSaved?.();
      onClose?.();
    } catch (requestError) {
      setError(requestError?.message || 'Could not save this bill.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      dismissible={!saving}
      title={isEditing ? 'Edit recurring bill' : 'Add a recurring bill'}
      description="SmartSpend protects upcoming bills before calculating your safe daily spend."
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="bill-form" className="flex-1" loading={saving}>
            Save bill
          </Button>
        </div>
      }
    >
      <form id="bill-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Bill name"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Hostel rent, WiFi, Netflix"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
            prefix="₹"
            placeholder="0"
          />
          <Select label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>
            {EXPENSE_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Repeats"
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
          >
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
            <option value="yearly">Every year</option>
          </Select>
          <Input
            label="Next due"
            type="date"
            value={nextDueDate}
            onChange={(event) => setNextDueDate(event.target.value)}
          />
        </div>
        <Textarea
          label="Note"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional — e.g. split with roommates"
          rows={2}
        />
        <div className="rounded-2xl border border-ink-100 p-3.5 dark:border-white/10">
          <Toggle
            checked={isActive}
            onChange={setIsActive}
            label="Active bill"
            description="Inactive bills stay in your list but won’t be reserved in safe-to-spend."
          />
        </div>
        {error ? (
          <p className="rounded-xl bg-clay-50 px-3.5 py-2.5 text-xs font-medium text-clay-700 dark:bg-clay-500/10 dark:text-clay-300">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function BillRow({ bill, onEdit, onDelete, onPay, paying }) {
  const meta = getCategory(bill.category);
  const frequencyLabels = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
  return (
    <div className="flex flex-col gap-3 border-b border-ink-100/80 py-3.5 last:border-0 dark:border-white/10 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: meta?.soft || '#EFF1F5', color: meta?.color || '#8D99AE' }}
        >
          <CategoryIcon category={bill.category} size={16} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[13px] font-bold text-ink-900 dark:text-white">{bill.title}</p>
            {!bill.isActive ? <Badge tone="neutral">Paused</Badge> : null}
            {bill.nextDueDate < toDateKey() && bill.isActive ? <Badge tone="red">Overdue</Badge> : null}
          </div>
          <p className="mt-0.5 text-[10px] text-ink-400">
            {meta?.label} · {frequencyLabels[bill.frequency]} · {relativeDay(bill.nextDueDate)}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm font-bold text-ink-900 dark:text-white">{formatINR(bill.amountPaise)}</p>
        <div className="flex items-center gap-1">
          {bill.isActive ? (
            <Button
              variant="soft"
              size="xs"
              onClick={() => onPay(bill)}
              loading={paying}
              disabled={paying}
            >
              <Check size={12} /> Mark paid
            </Button>
          ) : null}
          <button
            type="button"
            onClick={() => onEdit(bill)}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={`Edit ${bill.title}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(bill)}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-clay-50 hover:text-clay-600 dark:hover:bg-clay-500/10 dark:hover:text-clay-300"
            aria-label={`Delete ${bill.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ target, onClose, onConfirm, loading }) {
  const label =
    target?.type === 'bill'
      ? `Delete “${target.item.title}”?`
      : `Remove the ${target?.item?.label} budget?`;
  return (
    <Modal
      open={Boolean(target)}
      onClose={loading ? undefined : onClose}
      dismissible={!loading}
      title={label}
      description={
        target?.type === 'bill'
          ? 'This recurring bill will no longer be protected in your safe-to-spend calculation.'
          : 'Your transactions stay untouched. Only the spending limit is removed.'
      }
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-ink-500 dark:text-ink-400">
        {target?.type === 'bill'
          ? 'You can add it again later if needed.'
          : 'You can set a new limit whenever you like.'}
      </p>
    </Modal>
  );
}

export default function BudgetsPage() {
  const { mutate } = useSWRConfig();
  const [month, setMonth] = useState(currentMonth());
  const [budgetModal, setBudgetModal] = useState({ open: false, budget: null, defaultCategory: null });
  const [billModal, setBillModal] = useState({ open: false, bill: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [payingId, setPayingId] = useState(null);

  const {
    data,
    error,
    isLoading,
    mutate: refreshOverview,
  } = useSWR(`/api/overview?month=${month}`, fetcher);
  const {
    data: recurringData,
    error: recurringError,
    mutate: refreshRecurring,
  } = useSWR('/api/recurring', fetcher);

  const overall = data?.budgets.find((budget) => budget.category === 'overall');
  const categoryBudgets = useMemo(
    () =>
      (data?.budgets || [])
        .filter((budget) => budget.category !== 'overall')
        .sort((a, b) => b.percentUsed - a.percentUsed),
    [data?.budgets],
  );
  const existingCategories = categoryBudgets.map((budget) => budget.category);
  const recurring = recurringData?.recurring || [];
  const activeBills = recurring.filter((bill) => bill.isActive);
  const onTrack = categoryBudgets.filter((budget) => budget.status === 'on_track').length;

  async function refreshAll() {
    await refreshOverview();
    await refreshRecurring();
    await mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'), undefined, {
      revalidate: true,
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'bill') {
        await api(`/recurring/${deleteTarget.item.id}`, { method: 'DELETE' });
        toast.success('Recurring bill deleted.');
      } else {
        await api(`/budgets/${deleteTarget.item.id}`, { method: 'DELETE' });
        toast.success('Budget removed.');
      }
      setDeleteTarget(null);
      await refreshAll();
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not delete this item.');
    } finally {
      setDeleting(false);
    }
  }

  async function handlePay(bill) {
    setPayingId(bill.id);
    try {
      await api(`/recurring/${bill.id}/pay`, { method: 'POST' });
      toast.success(`${bill.title} marked paid and added to expenses.`);
      await refreshAll();
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not mark this bill paid.');
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plan the month"
        title="Budgets & analytics"
        description="Set the guardrails, see the patterns, and keep the plan realistic."
        actions={
          <>
            <MonthSwitcher month={month} onChange={setMonth} />
            <Button
              variant="secondary"
              onClick={() => setBillModal({ open: true, bill: null })}
            >
              <CalendarClock size={15} /> Add bill
            </Button>
            <Button
              onClick={() =>
                setBudgetModal({
                  open: true,
                  budget: null,
                  defaultCategory: overall ? null : 'overall',
                })
              }
            >
              <Plus size={16} /> Add budget
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={() => refreshOverview()} />
      ) : isLoading || !data ? (
        <div className="space-y-5">
          <Skeleton className="h-44 rounded-3xl" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      ) : (
        <>
          <OverallBudgetCard
            overall={overall}
            onEdit={() =>
              setBudgetModal({ open: true, budget: overall || null, defaultCategory: 'overall' })
            }
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink-100/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Spent this month</p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-ink-950 dark:text-white">
                {formatINR(data.summary.expensePaise)}
              </p>
              <p className="mt-0.5 text-[10px] text-ink-400">
                {data.summary.expenseChangePct === null
                  ? 'No comparison yet'
                  : `${Math.abs(data.summary.expenseChangePct)}% ${data.summary.expenseChangePct > 0 ? 'higher' : 'lower'} than last month`}
              </p>
            </div>
            <div className="rounded-2xl border border-ink-100/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Protected for bills</p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-ink-950 dark:text-white">
                {formatINR(data.safeToSpend.reservedPaise)}
              </p>
              <p className="mt-0.5 text-[10px] text-ink-400">
                {data.safeToSpend.reservedBills.length} upcoming bills this month
              </p>
            </div>
            <div className="rounded-2xl border border-ink-100/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Category health</p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-ink-950 dark:text-white">
                {categoryBudgets.length ? `${onTrack}/${categoryBudgets.length}` : '—'}
              </p>
              <p className="mt-0.5 text-[10px] text-ink-400">
                {categoryBudgets.length ? 'categories on track' : 'Add category budgets to track'}
              </p>
            </div>
          </div>

          <section className="surface p-5">
            <SectionHeading
              title="Category limits"
              description="Where the plan needs a little more structure"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBudgetModal({ open: true, budget: null, defaultCategory: null })}
                >
                  <Plus size={14} /> Add
                </Button>
              }
            />
            {categoryBudgets.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categoryBudgets.map((budget) => (
                  <CategoryBudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={(item) =>
                      setBudgetModal({ open: true, budget: item, defaultCategory: item.category })
                    }
                    onDelete={(item) => setDeleteTarget({ type: 'budget', item })}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setBudgetModal({ open: true, budget: null, defaultCategory: null })}
                  className="flex min-h-[124px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-200 text-xs font-semibold text-ink-400 transition hover:border-forest-400 hover:bg-forest-50/40 hover:text-forest-700 dark:border-white/15 dark:hover:border-forest-400/40 dark:hover:bg-forest-500/[0.05] dark:hover:text-forest-300"
                >
                  <Plus size={18} />
                  Add another category
                </button>
              </div>
            ) : (
              <EmptyState
                icon={Wallet}
                title="No category budgets yet"
                description="Set limits for food, transport, shopping and more to get early warnings."
                action={
                  <Button
                    size="sm"
                    onClick={() => setBudgetModal({ open: true, budget: null, defaultCategory: null })}
                  >
                    <Plus size={14} /> Add category budget
                  </Button>
                }
                className="py-8"
              />
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="surface p-5 lg:col-span-4">
              <SectionHeading title="Category split" description="Where the money actually went" />
              <SpendingDonut
                items={data.categories}
                totalPaise={data.summary.expensePaise}
                height={220}
              />
              <div className="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1">
                {data.categories.map((category) => (
                  <div key={category.category} className="flex items-center gap-2 text-[11px]">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink-600 dark:text-ink-300">
                      {category.label}
                    </span>
                    <span className="font-bold text-ink-900 dark:text-white">
                      {formatINR(category.amountPaise)}
                    </span>
                    <span className="w-8 text-right text-ink-400">{category.percent}%</span>
                  </div>
                ))}
                {!data.categories.length ? (
                  <p className="text-xs text-ink-400">No expenses recorded yet.</p>
                ) : null}
              </div>
            </div>

            <div className="surface p-5 lg:col-span-8">
              <SectionHeading
                title="Six-month trend"
                description="Income and expenses side by side"
                action={<Badge tone="neutral">Last 6 months</Badge>}
              />
              <div className="mt-4">
                <MonthlyTrendChart trend={data.monthlyTrend} height={280} />
              </div>
            </div>
          </div>

          <div className="surface p-5">
            <SectionHeading
              title="Daily spending"
              description={`Every expense day in ${formatMonth(month, 'long')}`}
              action={<Badge tone="neutral">{data.monthInfo.days} days</Badge>}
            />
            <div className="mt-4">
              <DailySpendChart series={data.dailySeries} height={230} />
            </div>
          </div>

          <section id="insights" className="surface p-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-saffron-50 text-saffron-700 dark:bg-saffron-400/15 dark:text-saffron-300">
                <Sparkles size={17} />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-950 dark:text-white">
                  Smart insights
                </h2>
                <p className="text-[11px] text-ink-400">What the numbers are trying to tell you</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.insights.map((insight) => {
                const Icon = INSIGHT_ICONS[insight.id] || Sparkles;
                return (
                  <div
                    key={insight.id}
                    className="rounded-2xl border border-ink-100/80 p-4 dark:border-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                          INSIGHT_TONES[insight.tone] || INSIGHT_TONES.neutral,
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">
                          {insight.eyebrow}
                        </p>
                        <p className="mt-1 text-[13px] font-bold leading-snug text-ink-900 dark:text-white">
                          {insight.title}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                          {insight.body}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!data.insights.length ? (
                <p className="text-sm text-ink-400">Add transactions to generate insights.</p>
              ) : null}
            </div>
          </section>

          <section id="bills" className="surface p-5">
            <SectionHeading
              title="Recurring bills"
              description="Protected before your daily spending limit is calculated"
              action={
                <Button variant="secondary" size="sm" onClick={() => setBillModal({ open: true, bill: null })}>
                  <Plus size={14} /> Add bill
                </Button>
              }
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="green">
                <Repeat2 size={11} /> {activeBills.length} active
              </Badge>
              <span className="text-[10px] text-ink-400">
                {formatINR(activeBills.reduce((total, bill) => total + bill.amountPaise, 0))} in
                listed commitments
              </span>
            </div>

            {recurringError ? (
              <p className="mt-4 rounded-xl bg-clay-50 px-3.5 py-2.5 text-xs text-clay-700 dark:bg-clay-500/10 dark:text-clay-300">
                Could not load recurring bills.
              </p>
            ) : (
              <div className="mt-3">
                {recurring.map((bill) => (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    onEdit={(item) => setBillModal({ open: true, bill: item })}
                    onDelete={(item) => setDeleteTarget({ type: 'bill', item })}
                    onPay={handlePay}
                    paying={payingId === bill.id}
                  />
                ))}
                {!recurring.length ? (
                  <EmptyState
                    icon={ReceiptText}
                    title="No recurring bills yet"
                    description="Add rent, electricity, recharge or subscriptions so they’re protected before you spend."
                    action={
                      <Button size="sm" onClick={() => setBillModal({ open: true, bill: null })}>
                        <Plus size={14} /> Add your first bill
                      </Button>
                    }
                    className="py-8"
                  />
                ) : null}
              </div>
            )}
          </section>
        </>
      )}

      <BudgetModal
        open={budgetModal.open}
        onClose={() => setBudgetModal({ open: false, budget: null, defaultCategory: null })}
        month={month}
        budget={budgetModal.budget}
        defaultCategory={budgetModal.defaultCategory}
        existingCategories={existingCategories}
        onSaved={refreshAll}
      />
      <BillModal
        open={billModal.open}
        onClose={() => setBillModal({ open: false, bill: null })}
        bill={billModal.bill}
        onSaved={refreshAll}
      />
      <ConfirmDelete
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
