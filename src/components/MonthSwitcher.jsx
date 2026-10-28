import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, currentMonth, formatMonth } from '../lib/dates.js';
import { cn } from '../lib/cn.js';

export default function MonthSwitcher({
  month,
  onChange,
  allowFuture = false,
  className = '',
  size = 'md',
}) {
  const max = currentMonth();
  const nextMonth = addMonths(month, 1);
  const nextDisabled = !allowFuture && nextMonth > max;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-2xl border border-ink-200/80 bg-white/80 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(addMonths(month, -1))}
        className="grid h-8 w-8 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Previous month"
      >
        <ChevronLeft size={16} />
      </button>
      <span
        className={cn(
          'min-w-[112px] px-1 text-center font-semibold text-ink-800 dark:text-ink-100',
          size === 'sm' ? 'text-xs' : 'text-[13px]',
        )}
      >
        {formatMonth(month, 'long')}
      </span>
      <button
        type="button"
        onClick={() => onChange(nextMonth)}
        disabled={nextDisabled}
        className="grid h-8 w-8 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
