const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrDecimal = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat('en-IN');

export function formatINR(paise, { decimals = false, compact = false } = {}) {
  const amount = Number(paise || 0) / 100;
  const sign = amount < 0 ? '−' : '';
  const absolute = Math.abs(amount);

  if (compact) {
    if (absolute >= 10_000_000) return `${sign}₹${(absolute / 10_000_000).toFixed(1)}Cr`;
    if (absolute >= 100_000) return `${sign}₹${(absolute / 100_000).toFixed(1)}L`;
    if (absolute >= 1_000) return `${sign}₹${(absolute / 1_000).toFixed(1)}k`;
  }

  const formatter = decimals ? inrDecimal : inr;
  return formatter.format(amount).replace('-', '−');
}

export function formatNumber(value) {
  return number.format(Number(value || 0));
}

export function formatPercent(value, { showSign = false } = {}) {
  const numeric = Number(value || 0);
  const sign = showSign && numeric > 0 ? '+' : '';
  return `${sign}${Math.round(numeric)}%`;
}

export function formatRupeeInput(paise) {
  const amount = Number(paise || 0) / 100;
  if (!Number.isFinite(amount)) return '';
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export function parseRupeeInput(value) {
  const cleaned = String(value ?? '').replace(/[₹,\s]/g, '');
  if (!cleaned) return 0;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return NaN;
  return Math.round(amount * 100);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function titleCase(value = '') {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
