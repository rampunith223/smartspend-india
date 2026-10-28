import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import Button from './Button.jsx';

export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={cn('animate-spin text-forest-600', className)} />;
}

export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
    green: 'bg-forest-50 text-forest-700 dark:bg-forest-500/15 dark:text-forest-200',
    saffron: 'bg-saffron-50 text-saffron-700 dark:bg-saffron-400/15 dark:text-saffron-200',
    red: 'bg-clay-50 text-clay-700 dark:bg-clay-500/15 dark:text-clay-300',
    blue: 'bg-[#e8f0f5] text-[#315c75] dark:bg-[#457b9d]/20 dark:text-[#a9c7db]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
        tones[tone] || tones.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value = 0, color = '#2B9966', className = '', height = 'h-2' }) {
  const width = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div
      className={cn(
        'overflow-hidden rounded-full bg-ink-100 dark:bg-white/10',
        height,
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function ProgressRing({
  value = 0,
  size = 84,
  stroke = 8,
  color = '#2B9966',
  track = 'rgba(120, 145, 135, 0.16)',
  children,
}) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {children ? <div className="absolute inset-0 grid place-items-center">{children}</div> : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon ? (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-forest-50 text-forest-600 dark:bg-forest-500/10 dark:text-forest-300">
          <Icon size={24} strokeWidth={1.6} />
        </div>
      ) : null}
      <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-ink-100/80 dark:bg-white/[0.07]',
        className,
      )}
    />
  );
}

export function ErrorState({ message = 'We could not load this page.', onRetry }) {
  return (
    <div className="surface flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-clay-50 text-clay-600 dark:bg-clay-500/10 dark:text-clay-300">
        <AlertCircle size={22} />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">
        Something went sideways
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500 dark:text-ink-400">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw size={14} /> Try again
        </Button>
      ) : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-ink-950 dark:text-white sm:text-[2.5rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeading({ title, description, action, className = '' }) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div>
        <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-950 dark:text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function IconBubble({ icon: Icon, color = '#2B9966', soft = '#E3F5EA', size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-12 w-12 rounded-2xl',
  };
  const iconSizes = { sm: 15, md: 18, lg: 22 };
  return (
    <div
      className={cn('grid shrink-0 place-items-center', sizes[size])}
      style={{ backgroundColor: soft, color }}
    >
      <Icon size={iconSizes[size]} strokeWidth={1.8} />
    </div>
  );
}
