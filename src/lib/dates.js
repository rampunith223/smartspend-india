const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTHS = MONTHS.map((month) => month.slice(0, 3));

export function pad(value) {
  return String(value).padStart(2, '0');
}

export function toDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function parseDateKey(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value, style = 'medium') {
  if (!value) return '—';
  const date = parseDateKey(value);
  if (Number.isNaN(date.getTime())) return '—';
  if (style === 'short') return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
  if (style === 'long') {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  if (style === 'month') return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatMonth(month, style = 'long') {
  if (!month) return '';
  const [year, monthNumber] = month.split('-').map(Number);
  if (style === 'short') return `${SHORT_MONTHS[monthNumber - 1]} ${String(year).slice(2)}`;
  return `${MONTHS[monthNumber - 1]} ${year}`;
}

export function addMonths(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number);
  return toMonthKey(new Date(year, monthNumber - 1 + delta, 1));
}

export function shiftMonth(month, delta) {
  return addMonths(month, delta);
}

export function daysInMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

export function relativeDay(value, today = toDateKey()) {
  if (!value) return '';
  const target = parseDateKey(value);
  const current = parseDateKey(today);
  const diff = Math.round((target - current) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff <= 7) return `In ${diff} days`;
  if (diff < -1 && diff >= -7) return `${Math.abs(diff)} days ago`;
  return formatDate(value, 'short');
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function isSameMonth(value, month) {
  return value?.startsWith(month);
}

export function currentMonth() {
  return toMonthKey();
}

export function monthRangeLabel(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return `${SHORT_MONTHS[monthNumber - 1]} ${year}`;
}
