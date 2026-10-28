import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const VARIANTS = {
  primary:
    'bg-forest-900 text-white shadow-sm hover:bg-forest-800 active:bg-forest-950 dark:bg-forest-500 dark:text-forest-950 dark:hover:bg-forest-400',
  secondary:
    'border border-ink-200 bg-white text-ink-800 shadow-sm hover:border-ink-300 hover:bg-ink-50 dark:border-white/15 dark:bg-white/5 dark:text-ink-100 dark:hover:bg-white/10',
  soft: 'bg-forest-50 text-forest-800 hover:bg-forest-100 dark:bg-forest-500/10 dark:text-forest-200 dark:hover:bg-forest-500/20',
  saffron:
    'bg-saffron-400 text-ink-950 shadow-sm hover:bg-saffron-300 active:bg-saffron-500 dark:bg-saffron-400 dark:text-ink-950',
  ghost:
    'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white',
  danger:
    'bg-clay-600 text-white shadow-sm hover:bg-clay-700 active:bg-clay-800 dark:bg-clay-500 dark:hover:bg-clay-400',
  'danger-soft':
    'bg-clay-50 text-clay-700 hover:bg-clay-100 dark:bg-clay-500/10 dark:text-clay-300 dark:hover:bg-clay-500/20',
};

const SIZES = {
  xs: 'h-8 gap-1.5 rounded-lg px-2.5 text-xs',
  sm: 'h-9 gap-2 rounded-xl px-3.5 text-sm',
  md: 'h-11 gap-2 rounded-2xl px-5 text-sm',
  lg: 'h-12 gap-2.5 rounded-2xl px-6 text-[15px]',
  icon: 'h-10 w-10 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
