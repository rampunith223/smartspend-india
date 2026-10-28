import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Field({ label, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={htmlFor} className="label">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-clay-600 dark:text-clay-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-ink-400 dark:text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ label, hint, error, id, className = '', prefix, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">
            {prefix}
          </span>
        ) : null}
        <input
          id={inputId}
          className={cn('field', prefix && 'pl-9', error && 'border-clay-400 focus:border-clay-500', className)}
          {...props}
        />
      </div>
    </Field>
  );
}

export function Select({ label, hint, error, id, className = '', children, ...props }) {
  const generatedId = useId();
  const selectId = id || generatedId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={selectId}>
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'field appearance-none pr-10',
            error && 'border-clay-400 focus:border-clay-500',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400"
        />
      </div>
    </Field>
  );
}

export function Textarea({ label, hint, error, id, className = '', ...props }) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={textareaId}>
      <textarea
        id={textareaId}
        className={cn('field min-h-24 resize-none', error && 'border-clay-400', className)}
        {...props}
      />
    </Field>
  );
}

export function Toggle({ checked, onChange, label, description, disabled = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {label ? (
          <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{label}</p>
        ) : null}
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50',
          checked ? 'bg-forest-600 dark:bg-forest-400' : 'bg-ink-200 dark:bg-white/15',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}
