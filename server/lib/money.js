export function rupeesToPaise(value) {
  return Math.round(Number(value) * 100);
}

export function paiseToRupees(value) {
  return Number(value) / 100;
}

export function formatINR(paise, options = {}) {
  const { compact = false, showPaise = false } = options;
  const amount = Number(paise) / 100;

  if (compact) {
    if (Math.abs(amount) >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
    if (Math.abs(amount) >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
    if (Math.abs(amount) >= 1_000) return `₹${(amount / 1_000).toFixed(1)}k`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showPaise ? 2 : 0,
    maximumFractionDigits: showPaise ? 2 : 0,
  }).format(amount);
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
