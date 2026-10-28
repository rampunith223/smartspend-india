import { useEffect, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Download,
  FilterX,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Pencil,
  Wallet,
} from 'lucide-react';
import {
  ALL_CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  getCategory,
  getPaymentMethod,
} from '../../shared/catalog.js';
import MonthSwitcher from '../components/MonthSwitcher.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import {
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from '../components/ui/Misc.jsx';
import { useQuickAdd } from '../context/QuickAddContext.jsx';
import { api, downloadFile, fetcher } from '../lib/api.js';
import { cn } from '../lib/cn.js';
import { currentMonth, formatDate, formatMonth } from '../lib/dates.js';
import { formatINR } from '../lib/format.js';
import { CategoryIcon, PaymentIcon } from '../lib/icons.jsx';

function SummaryItem({ label, value, tone, icon: Icon }) {
  const tones = {
    green: 'text-forest-700 dark:text-forest-300',
    clay: 'text-clay-600 dark:text-clay-300',
    ink: 'text-ink-900 dark:text-white',
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-100/80 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
      <span
        className={cn(
          'grid h-8 w-8 place-items-center rounded-lg',
          tone === 'green'
            ? 'bg-forest-50 text-forest-700 dark:bg-forest-500/15 dark:text-forest-300'
            : tone === 'clay'
              ? 'bg-clay-50 text-clay-700 dark:bg-clay-500/15 dark:text-clay-300'
              : 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
        )}
      >
        <Icon size={15} />
      </span>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">{label}</p>
        <p className={cn('text-sm font-bold', tones[tone])}>{value}</p>
      </div>
    </div>
  );
}

function TransactionActions({ transaction, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(transaction)}
        className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Edit transaction"
        title="Edit"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(transaction)}
        className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-clay-50 hover:text-clay-600 dark:hover:bg-clay-500/10 dark:hover:text-clay-300"
        aria-label="Delete transaction"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function TransactionRow({ transaction, onEdit, onDelete }) {
  const meta = getCategory(transaction.category);
  const payment = getPaymentMethod(transaction.paymentMethod);
  return (
    <tr className="group border-b border-ink-100/70 last:border-0 hover:bg-ink-50/50 dark:border-white/10 dark:hover:bg-white/[0.025]">
      <td className="py-3 pl-4 pr-2">
        <p className="text-xs font-semibold text-ink-800 dark:text-ink-200">
          {formatDate(transaction.date, 'short')}
        </p>
        <p className="text-[10px] text-ink-400">{formatDate(transaction.date, 'medium').split(' ').pop()}</p>
      </td>
      <td className="px-2 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: meta?.soft || '#EFF1F5', color: meta?.color || '#8D99AE' }}
          >
            <CategoryIcon category={transaction.category} size={14} />
          </span>
          <div className="min-w-0">
            <p className="max-w-[280px] truncate text-[13px] font-semibold text-ink-900 dark:text-white">
              {transaction.note || meta?.label || 'Transaction'}
            </p>
            <p className="text-[10px] text-ink-400">{meta?.label || transaction.category}</p>
          </div>
        </div>
      </td>
      <td className="px-2 py-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-500 dark:text-ink-400">
          <PaymentIcon method={transaction.paymentMethod} size={13} />
          {payment?.label || transaction.paymentMethod}
        </span>
      </td>
      <td className="px-2 py-3 text-right">
        <p
          className={cn(
            'text-[13px] font-bold tabular-nums',
            transaction.type === 'income'
              ? 'text-forest-700 dark:text-forest-300'
              : 'text-ink-900 dark:text-white',
          )}
        >
          {transaction.type === 'income' ? '+' : '−'}
          {formatINR(transaction.amountPaise)}
        </p>
        <p className="text-[9px] font-semibold uppercase tracking-wide text-ink-400">
          {transaction.type}
        </p>
      </td>
      <td className="py-3 pl-2 pr-4">
        <TransactionActions transaction={transaction} onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}

function MobileTransaction({ transaction, onEdit, onDelete }) {
  const meta = getCategory(transaction.category);
  return (
    <div className="flex items-start gap-3 border-b border-ink-100/70 py-3 last:border-0 dark:border-white/10">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: meta?.soft || '#EFF1F5', color: meta?.color || '#8D99AE' }}
      >
        <CategoryIcon category={transaction.category} size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink-900 dark:text-white">
          {transaction.note || meta?.label || 'Transaction'}
        </p>
        <p className="mt-0.5 text-[10px] text-ink-400">
          {meta?.label} · {formatDate(transaction.date, 'short')}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            'text-[13px] font-bold tabular-nums',
            transaction.type === 'income'
              ? 'text-forest-700 dark:text-forest-300'
              : 'text-ink-900 dark:text-white',
          )}
        >
          {transaction.type === 'income' ? '+' : '−'}
          {formatINR(transaction.amountPaise)}
        </p>
        <div className="mt-0.5 flex justify-end">
          <TransactionActions transaction={transaction} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { openQuickAdd } = useQuickAdd();
  const { mutate } = useSWRConfig();
  const [month, setMonth] = useState(currentMonth());
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [payment, setPayment] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [limit, setLimit] = useState(50);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLimit(50);
  }, [month, type, category, payment, debouncedSearch]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ month, limit: String(limit) });
    if (type !== 'all') params.set('type', type);
    if (category !== 'all') params.set('category', category);
    if (payment !== 'all') params.set('payment', payment);
    if (debouncedSearch) params.set('search', debouncedSearch);
    return params.toString();
  }, [month, type, category, payment, debouncedSearch, limit]);

  const { data, error, isLoading, mutate: refresh } = useSWR(
    `/api/transactions?${query}`,
    fetcher,
  );

  const hasFilters = type !== 'all' || category !== 'all' || payment !== 'all' || debouncedSearch;

  function resetFilters() {
    setType('all');
    setCategory('all');
    setPayment('all');
    setSearch('');
  }

  async function refreshAll() {
    await refresh();
    await mutate((key) => typeof key === 'string' && key.startsWith('/api/overview'), undefined, {
      revalidate: true,
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/transactions/${deleteTarget.id}`, { method: 'DELETE' });
      toast.success('Transaction deleted.');
      setDeleteTarget(null);
      await refreshAll();
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not delete the transaction.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadFile(
        `/reports/monthly.csv?month=${month}`,
        `smartspend-report-${month}.csv`,
      );
      toast.success('Monthly report downloaded.');
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not download the report.');
    } finally {
      setExporting(false);
    }
  }

  const categoryOptions =
    type === 'income'
      ? INCOME_CATEGORIES
      : type === 'expense'
        ? EXPENSE_CATEGORIES
        : ALL_CATEGORIES;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Money in, money out"
        title="Transactions"
        description="Every chai, auto ride and recharge — searchable, editable and honest."
        actions={
          <>
            <MonthSwitcher month={month} onChange={setMonth} />
            <Button
              variant="secondary"
              onClick={() => openQuickAdd({ type: 'income' })}
            >
              <ArrowDownToLine size={15} /> Add income
            </Button>
            <Button onClick={() => openQuickAdd({ type: 'expense' })}>
              <Plus size={16} /> Add expense
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SummaryItem
          label="Income"
          value={formatINR(data?.summary?.incomePaise || 0)}
          tone="green"
          icon={ArrowDownToLine}
        />
        <SummaryItem
          label="Expenses"
          value={formatINR(data?.summary?.expensePaise || 0)}
          tone="clay"
          icon={ArrowUpRight}
        />
        <SummaryItem
          label="Net"
          value={formatINR((data?.summary?.incomePaise || 0) - (data?.summary?.expensePaise || 0))}
          tone="ink"
          icon={Wallet}
        />
        <div className="ml-auto">
          <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting}>
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-ink-100/80 p-3.5 dark:border-white/10 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes or categories…"
                className="field field-sm pl-10"
                aria-label="Search transactions"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-ink-100/80 p-1 dark:bg-white/[0.06]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'expense', label: 'Expense' },
                  { id: 'income', label: 'Income' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-[11px] font-bold transition',
                      type === item.id
                        ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-800 dark:text-white'
                        : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="field field-sm w-auto min-w-[130px] py-2"
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {categoryOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={payment}
                onChange={(event) => setPayment(event.target.value)}
                className="field field-sm w-auto min-w-[125px] py-2"
                aria-label="Filter by payment method"
              >
                <option value="all">All methods</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>

              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <FilterX size={14} /> Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <ErrorState message={error.message} onRetry={() => refresh()} />
        ) : isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-14" />
            ))}
          </div>
        ) : !data?.items?.length ? (
          <EmptyState
            icon={ReceiptText}
            title={hasFilters ? 'No matching transactions' : 'No transactions yet'}
            description={
              hasFilters
                ? 'Try a different search or clear the filters.'
                : `Nothing recorded for ${formatMonth(month, 'long')}. Add your first transaction.`
            }
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  <FilterX size={14} /> Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => openQuickAdd({ type: 'expense' })}>
                  <Plus size={14} /> Add expense
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-ink-100/80 bg-ink-50/50 text-left dark:border-white/10 dark:bg-white/[0.02]">
                    <th className="w-[95px] py-2.5 pl-4 text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">Date</th>
                    <th className="px-2 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">Transaction</th>
                    <th className="w-[130px] px-2 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">Method</th>
                    <th className="w-[120px] px-2 py-2.5 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">Amount</th>
                    <th className="w-[84px] py-2.5 pl-2 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={(item) => openQuickAdd({ transaction: item })}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 md:hidden">
              {data.items.map((transaction) => (
                <MobileTransaction
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={(item) => openQuickAdd({ transaction: item })}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-100/80 px-4 py-3.5 dark:border-white/10 sm:flex-row">
              <p className="text-[11px] text-ink-400">
                Showing {data.items.length} of {data.total} transactions
                {hasFilters ? ' (filtered)' : ''}
              </p>
              {data.hasMore ? (
                <Button variant="secondary" size="sm" onClick={() => setLimit((value) => value + 50)}>
                  Load more
                </Button>
              ) : (
                <Badge tone="neutral">End of list</Badge>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={deleting ? undefined : () => setDeleteTarget(null)}
        dismissible={!deleting}
        title="Delete this transaction?"
        description="This will remove it from your records and recalculate your budgets. It cannot be undone."
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Keep it
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} loading={deleting}>
              <Trash2 size={15} /> Delete
            </Button>
          </div>
        }
      >
        {deleteTarget ? (
          <div className="flex items-center gap-3 rounded-2xl border border-ink-100 p-4 dark:border-white/10">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{
                backgroundColor: getCategory(deleteTarget.category)?.soft || '#EFF1F5',
                color: getCategory(deleteTarget.category)?.color || '#8D99AE',
              }}
            >
              <CategoryIcon category={deleteTarget.category} size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                {deleteTarget.note || getCategory(deleteTarget.category)?.label}
              </p>
              <p className="text-xs text-ink-400">
                {formatDate(deleteTarget.date)} · {formatINR(deleteTarget.amountPaise)}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
