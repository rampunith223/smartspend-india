import { Link } from 'react-router-dom';
import { cn } from '../lib/cn.js';

export function LogoMark({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-8 w-8 rounded-[10px] text-base',
    md: 'h-10 w-10 rounded-[13px] text-xl',
    lg: 'h-12 w-12 rounded-2xl text-2xl',
  };
  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center bg-forest-900 font-display font-semibold text-cream shadow-sm dark:bg-forest-400 dark:text-forest-950',
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      ₹
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-cream bg-saffron-400 dark:border-[#0b1512]" />
    </span>
  );
}

export default function Logo({
  to = '/',
  compact = false,
  className = '',
  markSize = 'md',
  inverted = false,
}) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={markSize} />
      {!compact ? (
        <span className="leading-none">
          <span
            className={cn(
              'block font-display text-[19px] font-semibold tracking-[-0.03em]',
              inverted ? 'text-white' : 'text-ink-950 dark:text-white',
            )}
          >
            SmartSpend
          </span>
          <span
            className={cn(
              'mt-1 block text-[9px] font-bold uppercase tracking-[0.24em]',
              inverted ? 'text-forest-200/60' : 'text-ink-400 dark:text-ink-500',
            )}
          >
            India
          </span>
        </span>
      ) : null}
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} className="inline-flex rounded-xl" aria-label="SmartSpend India home">
      {content}
    </Link>
  );
}
