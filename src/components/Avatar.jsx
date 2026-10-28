import { cn } from '../lib/cn.js';
import { initials } from '../lib/format.js';

const PALETTES = [
  'bg-forest-100 text-forest-800 dark:bg-forest-500/20 dark:text-forest-200',
  'bg-saffron-100 text-saffron-800 dark:bg-saffron-400/20 dark:text-saffron-200',
  'bg-clay-100 text-clay-800 dark:bg-clay-500/20 dark:text-clay-200',
  'bg-[#e8f0f5] text-[#315c75] dark:bg-[#457b9d]/20 dark:text-[#b8d3e3]',
];

export default function Avatar({ name = '', size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm',
  };
  const index = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-bold',
        sizes[size],
        PALETTES[index % PALETTES.length],
        className,
      )}
      aria-hidden="true"
    >
      {initials(name) || 'SS'}
    </span>
  );
}
