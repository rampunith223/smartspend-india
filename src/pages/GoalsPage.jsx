import { useEffect, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import {
  BellRing,
  CalendarDays,
  Check,
  Goal,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Wallet,
} from 'lucide-react';
import { GOAL_COLORS } from '../../shared/catalog.js';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Field, Input, Textarea } from '../components/ui/Form.jsx';
import {
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  ProgressRing,
  Skeleton,
} from '../components/ui/Misc.jsx';
import { api, fetcher } from '../lib/api.js';
import { cn } from '../lib/cn.js';
import { formatDate, toDateKey } from '../lib/dates.js';
import { formatINR, formatRupeeInput, parseRupeeInput } from '../lib/format.js';

function GoalCard({ goal, onContribute, onEdit, onDelete }) {
  const progress = Math.min(100, goal.progress);
  const complete = goal.isComplete;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-ink-100/80 bg-paper p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift dark:border-white/10 dark:bg-ink-900/75">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${goal.color}, ${goal.color}55)` }}
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-11 w-11 place-items-center rounded-2xl"
          style={{ backgroundColor: `${goal.color}18`, color: goal.color }}
        >
          {complete ? <Trophy size={20} /> : <Target size={20} />}
        </span>
        <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={`Edit ${goal.title}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal)}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-clay-50 hover:text-clay-600 dark:hover:bg-clay-500/10 dark:hover:text-clay-300"
            aria-label={`Delete ${goal.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-semibold tracking-[-0.025em] text-ink-950 dark:text-white">
            {goal.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-ink-400">
            <CalendarDays size={11} />
            {goal.targetDate ? `Target ${formatDate(goal.targetDate, 'medium')}` : 'No target date'}
          </p>
        </div>
        {complete ? <Badge tone="green"><Check size={10} /> Reached</Badge> : null}
      </div>

      <div className="mt-5 flex items-center gap-5">
        <ProgressRing value={progress} size={82} stroke={8} color={goal.color}>
          <div className="text-center">
            <p className="font-display text-lg font-semibold tracking-[-0.03em] text-ink-950 dark:text-white">
              {goal.progress}%
            </p>
          </div>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Saved</p>
          <p className="font-display text-2xl font-semibold tracking-[-0.035em] text-ink-950 dark:text-white">
            {formatINR(goal.savedPaise)}
          </p>
          <p className="mt-0.5 text-[10px] text-ink-400">
            of {formatINR(goal.targetPaise)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={progress} color={goal.color} height="h-2" />
        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span className="font-semibold text-ink-400">
            {complete ? 'Goal complete' : `${formatINR(goal.remainingPaise)} to go`}
          </span>
          <span className="font-bold" style={{ color: goal.color }}>
            {goal.progress}%
          </span>
        </div>
      </div>

      {goal.monthlyTargetPaise > 0 ? (
        <div
          className={cn(
            'mt-3 rounded-2xl border p-3',
            goal.monthlyComplete
              ? 'border-forest-200 bg-forest-50/70 dark:border-forest-400/30 dark:bg-forest-500/10'
              : 'border-saffron-200 bg-saffron-50/70 dark:border-saffron-400/30 dark:bg-saffron-400/10',
          )}
        >
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-[0.1em] text-ink-500 dark:text-ink-300">
              <BellRing size={11} className={goal.monthlyComplete ? 'text-forest-600' : 'text-saffron-600'} />
              {formatINR(goal.monthlyTargetPaise)} / month
            </span>
            <span
              className={cn(
                'font-bold',
                goal.monthlyComplete
                  ? 'text-forest-700 dark:text-forest-300'
                  : 'text-saffron-700 dark:text-saffron-300',
              )}
            >
              {goal.monthlyComplete
                ? 'Done this month'
                : `${formatINR(goal.monthlyRemainingPaise)} left`}
            </span>
          </div>
          {!goal.monthlyComplete ? (
            <ProgressBar
              value={
                goal.monthlyTargetPaise > 0
                  ? Math.round((goal.savedThisMonthPaise / goal.monthlyTargetPaise) * 100)
                  : 0
              }
              color="#F98F07"
              height="h-1.5"
              className="mt-2"
            />
          ) : null}
        </div>
      ) : null}

      <Button
        variant={complete ? 'secondary' : 'soft'}
        size="sm"
        className="mt-4 w-full"
        onClick={() => onContribute(goal)}
      >
        <Plus size={14} /> {complete ? 'Add extra' : 'Add money'}
      </Button>
    </div>
  );
}

function GoalModal({ open, onClose, goal, onSaved }) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [alreadySaved, setAlreadySaved] = useState('');
  const [monthly, setMonthly] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(goal);

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title || '');
    setTarget(goal ? formatRupeeInput(goal.targetPaise) : '');
    setAlreadySaved('');
    setMonthly(goal?.monthlyTargetPaise ? formatRupeeInput(goal.monthlyTargetPaise) : '');
    setTargetDate(goal?.targetDate || '');
    setColor(goal?.color || GOAL_COLORS[0]);
    setSaving(false);
    setError('');
  }, [open, goal]);

  async function handleSubmit(event) {
    event.preventDefault();
    const targetPaise = parseRupeeInput(target);
    const savedPaise = parseRupeeInput(alreadySaved || '0');
    const monthlyTargetPaise = parseRupeeInput(monthly || '0') || 0;

    if (!title.trim()) {
      setError('Give your goal a name.');
      return;
    }
    if (!targetPaise || Number.isNaN(targetPaise)) {
      setError('Enter a target amount greater than zero.');
      return;
    }
    if (Number.isNaN(savedPaise)) {
      setError('Enter a valid starting amount.');
      return;
    }
    if (Number.isNaN(monthlyTargetPaise)) {
      setError('Enter a valid monthly amount.');
      return;
    }
    if (monthlyTargetPaise > targetPaise) {
      setError('Monthly saving can’t be more than the total target.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        targetPaise,
        monthlyTargetPaise,
        targetDate: targetDate || null,
        color,
      };
      if (isEditing) {
        await api(`/goals/${goal.id}`, { method: 'PATCH', body });
      } else {
        await api('/goals', { method: 'POST', body: { ...body, savedPaise } });
      }
      toast.success(isEditing ? 'Goal updated.' : 'Savings goal created.');
      onSaved?.();
      onClose?.();
    } catch (requestError) {
      setError(requestError?.message || 'Could not save this goal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      dismissible={!saving}
      title={isEditing ? 'Edit savings goal' : 'Create a savings goal'}
      description={
        isEditing
          ? 'Adjust the target or timeline. Your saved amount stays untouched.'
          : 'Give your future self something specific to look forward to.'
      }
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="goal-form" className="flex-1" loading={saving}>
            {isEditing ? 'Save changes' : 'Create goal'}
          </Button>
        </div>
      }
    >
      <form id="goal-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Goal name"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. New laptop, emergency fund, Goa trip"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Target amount"
            value={target}
            onChange={(event) => setTarget(event.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
            prefix="₹"
            placeholder="0"
          />
          {!isEditing ? (
            <Input
              label="Already saved"
              value={alreadySaved}
              onChange={(event) => setAlreadySaved(event.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
              prefix="₹"
              placeholder="0"
            />
          ) : (
            <div className="rounded-2xl border border-ink-100 bg-ink-50/60 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Saved so far</p>
              <p className="mt-1 text-lg font-bold text-ink-900 dark:text-white">
                {formatINR(goal.savedPaise)}
              </p>
            </div>
          )}
        </div>
        <Input
          label="Target date"
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          min={toDateKey()}
          hint="Optional — a deadline makes the goal feel real."
        />
        <Input
          label="Save every month"
          value={monthly}
          onChange={(event) => setMonthly(event.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          prefix="₹"
          placeholder="0"
          hint="Optional — we’ll alarm you on the dashboard if your budget plan is crossed before this month’s saving is done."
        />
        <Field label="Colour">
          <div className="flex gap-2">
            {GOAL_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-full border-2 transition',
                  color === swatch ? 'border-ink-950 dark:border-white' : 'border-transparent',
                )}
                style={{ backgroundColor: swatch }}
                aria-label={`Choose colour ${swatch}`}
              >
                {color === swatch ? <Check size={14} className="text-white" /> : null}
              </button>
            ))}
          </div>
        </Field>
        {error ? (
          <p className="rounded-xl bg-clay-50 px-3.5 py-2.5 text-xs font-medium text-clay-700 dark:bg-clay-500/10 dark:text-clay-300">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function ContributeModal({ open, onClose, goal, onSaved }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toDateKey());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setDate(toDateKey());
    setNote('');
    setSaving(false);
    setError('');
  }, [open, goal]);

  async function handleSubmit(event) {
    event.preventDefault();
    const amountPaise = parseRupeeInput(amount);
    if (!amountPaise || Number.isNaN(amountPaise)) {
      setError('Enter an amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      await api(`/goals/${goal.id}/contributions`, {
        method: 'POST',
        body: { amountPaise, date, note: note.trim() },
      });
      toast.success(`${formatINR(amountPaise)} added to ${goal.title}.`);
      onSaved?.();
      onClose?.();
    } catch (requestError) {
      setError(requestError?.message || 'Could not add this contribution.');
    } finally {
      setSaving(false);
    }
  }

  if (!goal) return null;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      dismissible={!saving}
      title={`Add money to ${goal.title}`}
      description={`${formatINR(goal.remainingPaise)} to go. Every contribution counts.`}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="contribution-form" className="flex-1" loading={saving}>
            Add to goal
          </Button>
        </div>
      }
    >
      <form id="contribution-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-ink-400">Current progress</span>
            <span className="font-bold" style={{ color: goal.color }}>{goal.progress}%</span>
          </div>
          <ProgressBar value={goal.progress} color={goal.color} className="mt-2" />
          <div className="mt-2 flex justify-between text-[10px] text-ink-400">
            <span>{formatINR(goal.savedPaise)} saved</span>
            <span>{formatINR(goal.targetPaise)} target</span>
          </div>
        </div>

        <Input
          label="Amount to add"
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          prefix="₹"
          placeholder="0"
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          {[500, 1000, 2500, 5000].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              className="rounded-full border border-ink-200 px-3 py-1 text-[11px] font-semibold text-ink-600 transition hover:border-forest-400 hover:bg-forest-50 hover:text-forest-700 dark:border-white/15 dark:text-ink-300 dark:hover:border-forest-400/40 dark:hover:bg-forest-500/10 dark:hover:text-forest-300"
            >
              + ₹{value.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            max={toDateKey()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Input
            label="Note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional"
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

function DeleteGoalModal({ goal, onClose, onConfirm, loading }) {
  return (
    <Modal
      open={Boolean(goal)}
      onClose={loading ? undefined : onClose}
      dismissible={!loading}
      title={`Delete “${goal?.title || ''}”?`}
      description="This removes the goal and its contribution history. Your expense records are not affected."
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Keep it
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-ink-500 dark:text-ink-400">
        You’ve saved {formatINR(goal?.savedPaise || 0)} toward this goal. Deleting it won’t move that
        money anywhere — it only removes the tracker.
      </p>
    </Modal>
  );
}

export default function GoalsPage() {
  const { mutate } = useSWRConfig();
  const [goalModal, setGoalModal] = useState({ open: false, goal: null });
  const [contributeGoal, setContributeGoal] = useState(null);
  const [deleteGoal, setDeleteGoal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { data, error, isLoading, mutate: refresh } = useSWR('/api/goals', fetcher);

  const goals = data?.goals || [];
  const summary = useMemo(() => {
    const totalTarget = goals.reduce((total, goal) => total + goal.targetPaise, 0);
    const totalSaved = goals.reduce((total, goal) => total + goal.savedPaise, 0);
    return {
      totalTarget,
      totalSaved,
      remaining: Math.max(0, totalTarget - totalSaved),
      progress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
      complete: goals.filter((goal) => goal.isComplete).length,
    };
  }, [goals]);

  async function refreshAll() {
    await refresh();
    await mutate((key) => typeof key === 'string' && key.startsWith('/api/overview'), undefined, {
      revalidate: true,
    });
  }

  async function handleDelete() {
    if (!deleteGoal) return;
    setDeleting(true);
    try {
      await api(`/goals/${deleteGoal.id}`, { method: 'DELETE' });
      toast.success('Savings goal deleted.');
      setDeleteGoal(null);
      await refreshAll();
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not delete this goal.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Save with intention"
        title="Savings goals"
        description="Turn small monthly commitments into something you can actually see."
        actions={
          <Button onClick={() => setGoalModal({ open: true, goal: null })}>
            <Plus size={16} /> New goal
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={() => refresh()} />
      ) : isLoading || !data ? (
        <div className="space-y-5">
          <Skeleton className="h-48 rounded-4xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-80 rounded-3xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {goals.length ? (
            <div className="relative overflow-hidden rounded-4xl bg-forest-950 p-6 text-white shadow-lift sm:p-8">
              <div className="absolute inset-0 dot-pattern opacity-25" />
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-forest-500/30 blur-3xl" />
              <div className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-saffron-400/10 blur-3xl" />
              <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex items-center gap-2 text-forest-200">
                    <Sparkles size={15} className="text-saffron-300" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                      Your savings story
                    </span>
                  </div>
                  <p className="mt-3 font-display text-4xl font-semibold leading-none tracking-[-0.04em] sm:text-5xl">
                    {formatINR(summary.totalSaved)}
                  </p>
                  <p className="mt-2 text-sm text-forest-100/60">
                    saved toward {formatINR(summary.totalTarget)} across {goals.length}{' '}
                    {goals.length === 1 ? 'goal' : 'goals'}
                  </p>
                  <div className="mt-5 max-w-lg">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-forest-200/60">
                      <span>{summary.progress}% of all targets</span>
                      <span>{formatINR(summary.remaining)} to go</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-saffron-400 transition-[width] duration-700"
                        style={{ width: `${Math.min(100, summary.progress)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-center">
                    <p className="font-display text-2xl font-semibold">{summary.complete}</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-forest-200/50">
                      Goals reached
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-center">
                    <p className="font-display text-2xl font-semibold">{goals.length}</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-forest-200/50">
                      Active goals
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {goals.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...goals]
                .sort((a, b) => Number(a.isComplete) - Number(b.isComplete))
                .map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={setContributeGoal}
                    onEdit={(item) => setGoalModal({ open: true, goal: item })}
                    onDelete={setDeleteGoal}
                  />
                ))}
              <button
                type="button"
                onClick={() => setGoalModal({ open: true, goal: null })}
                className="flex min-h-[340px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-ink-200 text-sm font-semibold text-ink-400 transition hover:border-forest-400 hover:bg-forest-50/40 hover:text-forest-700 dark:border-white/15 dark:hover:border-forest-400/40 dark:hover:bg-forest-500/[0.05] dark:hover:text-forest-300"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 dark:bg-white/10">
                  <Plus size={22} />
                </span>
                Add another goal
              </button>
            </div>
          ) : (
            <div className="surface">
              <EmptyState
                icon={Goal}
                title="No savings goals yet"
                description="A laptop, college fees, an emergency fund — give your savings a name and a target."
                action={
                  <Button onClick={() => setGoalModal({ open: true, goal: null })}>
                    <Plus size={15} /> Create your first goal
                  </Button>
                }
                className="py-20"
              />
            </div>
          )}
        </>
      )}

      <GoalModal
        open={goalModal.open}
        onClose={() => setGoalModal({ open: false, goal: null })}
        goal={goalModal.goal}
        onSaved={refreshAll}
      />
      <ContributeModal
        open={Boolean(contributeGoal)}
        onClose={() => setContributeGoal(null)}
        goal={contributeGoal}
        onSaved={refreshAll}
      />
      <DeleteGoalModal
        goal={deleteGoal}
        onClose={() => setDeleteGoal(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
