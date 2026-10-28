const MONTH_NAMES = [
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

export function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const parsed = parseDateKey(value);
  return toDateKey(parsed) === value;
}

export function isValidMonthKey(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value));
}

export function daysInMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

export function addMonths(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return toMonthKey(date);
}

export function monthBounds(month, today = toDateKey()) {
  const todayMonth = today.slice(0, 7);
  const days = daysInMonth(month);
  return {
    month,
    start: `${month}-01`,
    end: `${month}-${pad(days)}`,
    days,
    today,
    todayMonth,
    todayDay: todayMonth === month ? Number(today.slice(8, 10)) : null,
    isCurrent: todayMonth === month,
    isPast: month < todayMonth,
    isFuture: month > todayMonth,
  };
}

export function previousMonth(month) {
  return addMonths(month, -1);
}

export function lastNMonths(month, count) {
  const months = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    months.push(addMonths(month, -index));
  }
  return months;
}

export function monthLabel(month, style = 'long') {
  const [year, monthNumber] = month.split('-').map(Number);
  if (style === 'short') return `${MONTH_NAMES[monthNumber - 1].slice(0, 3)} ${year}`;
  return `${MONTH_NAMES[monthNumber - 1]} ${year}`;
}

export function advanceDueDate(dateKey, frequency) {
  const date = parseDateKey(dateKey);
  const originalDay = date.getDate();

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
    return toDateKey(date);
  }

  if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
    return toDateKey(date);
  }

  date.setDate(1);
  date.setMonth(date.getMonth() + 1);
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + 1;
  const maxDay = new Date(targetYear, targetMonth, 0).getDate();
  return `${targetYear}-${pad(targetMonth)}-${pad(Math.min(originalDay, maxDay))}`;
}

export function daysBetween(startDateKey, endDateKey) {
  const start = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);
  return Math.round((end - start) / 86_400_000);
}

export function addDays(dateKey, days) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}
