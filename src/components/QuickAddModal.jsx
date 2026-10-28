import { useEffect, useMemo, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { CalendarDays, Check, IndianRupee, StickyNote } from 'lucide-react';
import {
  PAYMENT_METHODS,
  categoriesForType,
  getCategory,
} from '../../shared/catalog.js';
import { api } from '../lib/api.js';
import { cn } from '../lib/cn.js';
import { toDateKey } from '../lib/dates.js';
import { formatRupeeInput, parseRupeeInput } from '../lib/format.js';
import { CategoryIcon, PaymentIcon } from '../lib/icons.jsx';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import { Field } from './ui/Form.jsx';

export default function QuickAddModal({ open, initialType = 'expense', transaction, onClose }) {
  const { mutate } = useSWRConfig();
  const amountRef = useRef(null);
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(toDateKey());
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => categoriesForType(type), [type]);
  const isEditing = Boolean(transaction);

  useEffect(() => {
    if (!open) return;
    const nextType = transaction?.type || initialType;
    const available = categoriesForType(nextType);
    const recent = localStorage.getItem(`smartspend_recent_category_${nextType}`);
    const fallback = available.some((item) => item.id === recent) ? recent : available[0].id;

    setType(nextType);
    setAmount(transaction ? formatRupeeInput(transaction.amountPaise) : '');
    setCategory(transaction?.category || fallback);
    setDate(transaction?.date || toDateKey());
    setPaymentMethod(transaction?.paymentMethod || (nextType === 'income' ? 'bank' : 'upi'));
    setNote(transaction?.note || '');
    setError('');
    setSaving(false);

    const timer = window.setTimeout(() => amountRef.current?.focus(), 150);
    return () => window.clearTimeout(timer);
  }, [open, transaction, initialType]);

  function changeType(nextType) {
    if (nextType === type) return;
    const available = categoriesForType(nextType);
    const recent = localStorage.getItem(`smartspend_recent_category_${nextType}`);
    const fallback = available.some((item) => item.id === recent) ? recent : available[0].id;
    setType(nextType);
    setCategory(fallback);
    setPaymentMethod(nextType === 'income' ? 'bank' : 'upi');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const amountPaise = parseRupeeInput(amount);
    if (!amountPaise || Number.isNaN(amountPaise)) {
      setError('Enter an amount greater than zero.');
      amountRef.current?.focus();
      return;
    }
    if (!category) {
      setError('Choose a category.');
      return;
    }
    if (!date || date > toDateKey()) {
      setError('Choose today or an earlier date.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        type,
        amountPaise,
        category,
        date,
        paymentMethod,
        note: note.trim(),
      };
      if (isEditing) {
        await api(`/transactions/${transaction.id}`, { method: 'PATCH', body });
      } else {
        await api('/transactions', { method: 'POST', body });
      }
      localStorage.setItem(`smartspend_recent_category_${type}`, category);
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/'),
        undefined,
        { revalidate: true },
      );
      toast.success(
        isEditing
          ? 'Transaction updated'
          : `${type === 'income' ? 'Income' : 'Expense'} added — you're on top of it.`,
      );
      onClose?.();
    } catch (requestError) {
      const message = requestError?.message || 'Could not save the transaction.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      dismissible={!saving}
      title={isEditing ? 'Edit transaction' : 'Log a transaction'}
      description={
        isEditing
          ? 'Update the details and keep your records accurate.'
          : 'A few seconds now keeps your month honest.'
      }
      size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="quick-add-form"
            className="flex-[1.4]"
            loading={saving}
          >
            <Check size={17} />
            {isEditing ? 'Save changes' : `Add ${type}`}
          </Button>
        </div>
      }
    >
      <form id="quick-add-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 rounded-2xl bg-ink-100/80 p-1 dark:bg-white/[0.06]">
          {[
            { id: 'expense', label: 'Expense' },
            { id: 'income', label: 'Income' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeType(item.id)}
              className={cn(
                'rounded-xl py-2.5 text-sm font-semibold transition',
                type === item.id
                  ? 'bg-white text-ink-950 shadow-sm dark:bg-ink-800 dark:text-white'
                  : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-forest-100 bg-forest-50/60 px-5 py-4 dark:border-forest-500/20 dark:bg-forest-500/[0.07]">
          <label
            htmlFor="quick-amount"
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-forest-700/70 dark:text-forest-300/70"
          >
            {type === 'income' ? 'Amount received' : 'Amount spent'}
          </label>
          <div className="mt-1 flex items-center gap-2">
            <IndianRupee size={26} className="mt-1 shrink-0 text-forest-700 dark:text-forest-300" strokeWidth={1.8} />
            <input
              ref={amountRef}
              id="quick-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
              placeholder="0"
              autoComplete="off"
              className="w-full bg-transparent font-display text-[2.6rem] font-semibold leading-none tracking-[-0.04em] text-forest-950 placeholder:text-forest-900/25 focus:outline-none dark:text-forest-100 dark:placeholder:text-forest-100/20"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Category</span>
            <span className="text-[11px] text-ink-400 dark:text-ink-500">
              {getCategory(category)?.label || 'Choose one'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {categories.map((item) => {
              const active = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 text-[10px] font-semibold transition',
                    active
                      ? 'border-forest-600 bg-forest-50 text-forest-800 shadow-sm dark:border-forest-400/60 dark:bg-forest-500/15 dark:text-forest-200'
                      : 'border-ink-100 bg-white/70 text-ink-500 hover:border-ink-200 hover:text-ink-800 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-400 dark:hover:text-white',
                  )}
                >
                  <span
                    className="grid h-8 w-8 place-items-center rounded-xl"
                    style={{ backgroundColor: item.soft, color: item.color }}
                  >
                    <CategoryIcon category={item.id} size={15} />
                  </span>
                  <span className="max-w-full truncate">{item.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="quick-date">
            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                id="quick-date"
                type="date"
                max={toDateKey()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="field pl-10"
              />
            </div>
          </Field>

          <Field label={type === 'income' ? 'Received in' : 'Paid with'}>
            <div className="grid grid-cols-5 gap-1.5">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  title={method.label}
                  aria-label={method.label}
                  className={cn(
                    'flex h-11 items-center justify-center rounded-xl border transition',
                    paymentMethod === method.id
                      ? 'border-forest-600 bg-forest-50 text-forest-700 dark:border-forest-400/60 dark:bg-forest-500/15 dark:text-forest-200'
                      : 'border-ink-100 bg-white/70 text-ink-400 hover:text-ink-700 dark:border-white/10 dark:bg-white/[0.03] dark:hover:text-white',
                  )}
                >
                  <PaymentIcon method={method.id} size={17} />
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Note" htmlFor="quick-note" hint="Optional — a short note helps future you.">
          <div className="relative">
            <StickyNote
              size={16}
              className="pointer-events-none absolute left-4 top-3.5 text-ink-400"
            />
            <input
              id="quick-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={240}
              placeholder={type === 'income' ? 'e.g. Pocket money from home' : 'e.g. Chai and samosa'}
              className="field pl-10"
            />
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
