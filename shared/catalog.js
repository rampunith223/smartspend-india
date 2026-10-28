export const EXPENSE_CATEGORIES = [
  {
    id: 'food',
    label: 'Food & dining',
    shortLabel: 'Food',
    color: '#E76F51',
    soft: '#FCEAE5',
    icon: 'Utensils',
  },
  {
    id: 'groceries',
    label: 'Groceries',
    shortLabel: 'Groceries',
    color: '#F2A65A',
    soft: '#FDF1E3',
    icon: 'ShoppingBasket',
  },
  {
    id: 'transport',
    label: 'Transport',
    shortLabel: 'Transport',
    color: '#2A9D8F',
    soft: '#E4F5F1',
    icon: 'BusFront',
  },
  {
    id: 'rent',
    label: 'Hostel & rent',
    shortLabel: 'Rent',
    color: '#315C5A',
    soft: '#E6EFEE',
    icon: 'House',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    shortLabel: 'Shopping',
    color: '#D5A021',
    soft: '#FBF3DB',
    icon: 'ShoppingBag',
  },
  {
    id: 'bills',
    label: 'Bills & utilities',
    shortLabel: 'Bills',
    color: '#457B9D',
    soft: '#E8F0F5',
    icon: 'ReceiptText',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    shortLabel: 'Subscriptions',
    color: '#8E7DBE',
    soft: '#F0ECF9',
    icon: 'Smartphone',
  },
  {
    id: 'education',
    label: 'Education',
    shortLabel: 'Education',
    color: '#4F7C6A',
    soft: '#E8F1ED',
    icon: 'GraduationCap',
  },
  {
    id: 'health',
    label: 'Health',
    shortLabel: 'Health',
    color: '#D65A5A',
    soft: '#FBE9E9',
    icon: 'HeartPulse',
  },
  {
    id: 'entertainment',
    label: 'Fun & leisure',
    shortLabel: 'Leisure',
    color: '#C97B63',
    soft: '#F8ECE7',
    icon: 'Popcorn',
  },
  {
    id: 'family',
    label: 'Family & gifts',
    shortLabel: 'Family',
    color: '#B5838D',
    soft: '#F6EBEE',
    icon: 'Gift',
  },
  {
    id: 'other',
    label: 'Other',
    shortLabel: 'Other',
    color: '#8D99AE',
    soft: '#EFF1F5',
    icon: 'CircleEllipsis',
  },
];

export const INCOME_CATEGORIES = [
  {
    id: 'allowance',
    label: 'Pocket money',
    shortLabel: 'Allowance',
    color: '#2B9966',
    soft: '#E3F5EA',
    icon: 'Wallet',
  },
  {
    id: 'salary',
    label: 'Salary',
    shortLabel: 'Salary',
    color: '#176243',
    soft: '#DDEFE6',
    icon: 'BriefcaseBusiness',
  },
  {
    id: 'freelance',
    label: 'Freelance',
    shortLabel: 'Freelance',
    color: '#2A9D8F',
    soft: '#E4F5F1',
    icon: 'Laptop',
  },
  {
    id: 'refund',
    label: 'Refund',
    shortLabel: 'Refund',
    color: '#457B9D',
    soft: '#E8F0F5',
    icon: 'RotateCcw',
  },
  {
    id: 'gift',
    label: 'Gift',
    shortLabel: 'Gift',
    color: '#B5838D',
    soft: '#F6EBEE',
    icon: 'Gift',
  },
  {
    id: 'other_income',
    label: 'Other income',
    shortLabel: 'Other',
    color: '#8D99AE',
    soft: '#EFF1F5',
    icon: 'CircleEllipsis',
  },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: 'QrCode' },
  { id: 'cash', label: 'Cash', icon: 'Banknote' },
  { id: 'debit', label: 'Debit card', icon: 'CreditCard' },
  { id: 'credit', label: 'Credit card', icon: 'CreditCard' },
  { id: 'bank', label: 'Bank transfer', icon: 'Landmark' },
];

export const GOAL_COLORS = [
  '#2B9966',
  '#E76F51',
  '#F2A65A',
  '#457B9D',
  '#8E7DBE',
  '#C97B63',
];

export const BUDGET_SUGGESTIONS = {
  food: 4000,
  groceries: 3500,
  transport: 2000,
  rent: 6000,
  shopping: 2500,
  bills: 1800,
  subscriptions: 1000,
  education: 1500,
  health: 1000,
  entertainment: 1500,
  family: 1000,
  other: 1000,
};

export function getCategory(id) {
  return ALL_CATEGORIES.find((category) => category.id === id) || null;
}

export function getPaymentMethod(id) {
  return PAYMENT_METHODS.find((method) => method.id === id) || null;
}

export function categoriesForType(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}
