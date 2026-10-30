import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from './db.js';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import Budget from './models/Budget.js';
import Recurring from './models/Recurring.js';
import Goal from './models/Goal.js';
import Contribution from './models/Contribution.js';
import { addDays, addMonths, daysInMonth, toDateKey, toMonthKey } from './lib/date.js';

const DEMO_EMAIL = 'demo@smartspend.in';
const DEMO_PASSWORD = 'Demo@123';

const CURRENT_EXPENSES = [
  [2, 'rent', 5500, 'bank', 'Hostel rent'],
  [3, 'groceries', 1240, 'upi', 'Weekly groceries'],
  [4, 'food', 180, 'upi', 'Lunch at canteen'],
  [5, 'transport', 60, 'cash', 'Auto to college'],
  [6, 'subscriptions', 199, 'upi', 'Music subscription'],
  [7, 'food', 320, 'upi', 'Dinner with friends'],
  [8, 'shopping', 899, 'credit', 'Running shoes'],
  [9, 'bills', 650, 'upi', 'Electricity share'],
  [10, 'food', 240, 'cash', 'Chai and snacks'],
  [11, 'groceries', 780, 'upi', 'Groceries and fruit'],
  [12, 'transport', 120, 'upi', 'Metro recharge'],
  [13, 'entertainment', 500, 'upi', 'Movie tickets'],
  [14, 'food', 180, 'upi', 'Canteen lunch'],
  [15, 'health', 350, 'cash', 'Pharmacy'],
  [17, 'food', 260, 'upi', 'Food delivery'],
  [18, 'groceries', 640, 'upi', 'Monthly staples'],
  [19, 'transport', 90, 'cash', 'Auto fare'],
  [20, 'food', 150, 'upi', 'Evening snacks'],
  [21, 'bills', 300, 'upi', 'Water bill share'],
  [22, 'food', 220, 'upi', 'Dinner'],
  [23, 'shopping', 450, 'upi', 'Phone accessories'],
  [24, 'transport', 75, 'cash', 'Bus fare'],
  [24, 'entertainment', 300, 'upi', 'Weekend outing'],
];

const PREVIOUS_EXPENSES = [
  [2, 'rent', 5500, 'bank', 'Hostel rent'],
  [3, 'groceries', 1450, 'upi', 'Weekly groceries'],
  [4, 'food', 420, 'upi', 'Dinner with friends'],
  [5, 'transport', 150, 'cash', 'Auto fares'],
  [7, 'subscriptions', 199, 'upi', 'Music subscription'],
  [8, 'food', 680, 'upi', 'Weekend food'],
  [9, 'bills', 700, 'upi', 'Electricity share'],
  [10, 'shopping', 1299, 'credit', 'Jacket'],
  [11, 'food', 260, 'cash', 'Chai and snacks'],
  [12, 'groceries', 680, 'upi', 'Fruit and vegetables'],
  [13, 'transport', 240, 'upi', 'Metro recharge'],
  [15, 'entertainment', 400, 'upi', 'Concert'],
  [16, 'food', 340, 'upi', 'Food delivery'],
  [17, 'health', 300, 'cash', 'Pharmacy'],
  [18, 'groceries', 670, 'upi', 'Monthly staples'],
  [19, 'education', 500, 'upi', 'Course material'],
  [20, 'food', 240, 'upi', 'Canteen lunch'],
  [21, 'shopping', 500, 'upi', 'Stationery'],
  [22, 'transport', 110, 'cash', 'Auto fare'],
  [23, 'food', 260, 'upi', 'Dinner'],
  [25, 'entertainment', 0, 'upi', 'Skipped outing'],
  [27, 'food', 180, 'cash', 'Snacks'],
];

const TWO_MONTHS_EXPENSES = [
  [2, 'rent', 5500, 'bank', 'Hostel rent'],
  [3, 'groceries', 1320, 'upi', 'Weekly groceries'],
  [4, 'food', 300, 'upi', 'Canteen lunch'],
  [6, 'transport', 140, 'cash', 'Auto fares'],
  [7, 'subscriptions', 199, 'upi', 'Music subscription'],
  [8, 'food', 520, 'upi', 'Weekend food'],
  [9, 'bills', 650, 'upi', 'Electricity share'],
  [10, 'shopping', 900, 'upi', 'Clothes'],
  [12, 'groceries', 980, 'upi', 'Monthly staples'],
  [13, 'transport', 180, 'upi', 'Metro recharge'],
  [14, 'entertainment', 700, 'upi', 'Movie and dinner'],
  [16, 'food', 280, 'upi', 'Food delivery'],
  [18, 'education', 500, 'upi', 'Lab manual'],
  [19, 'food', 210, 'cash', 'Chai and snacks'],
  [21, 'groceries', 500, 'upi', 'Fruit and vegetables'],
  [22, 'transport', 80, 'cash', 'Bus fare'],
  [23, 'food', 260, 'upi', 'Dinner'],
  [25, 'shopping', 0, 'upi', 'Skipped purchase'],
];

function dateFor(month, day) {
  const maxDay = daysInMonth(month);
  return `${month}-${String(Math.min(Math.max(1, day), maxDay)).padStart(2, '0')}`;
}

async function insertTransaction(userId, { type, category, rupees, day, method, note, month }) {
  if (!rupees || rupees <= 0) return;
  const date = dateFor(month, day);
  const timestamp = new Date(`${date}T10:00:00.000Z`);
  await Transaction.create({
    _id: crypto.randomUUID(),
    user_id: userId,
    type,
    amount_paise: Math.round(rupees * 100),
    category,
    date,
    payment_method: method,
    note,
    created_at: timestamp,
    updated_at: timestamp,
  });
}

async function seedCurrentMonth(userId, month, todayDay) {
  await insertTransaction(userId, {
    type: 'income',
    category: 'allowance',
    rupees: 18000,
    day: 1,
    method: 'bank',
    note: 'Monthly pocket money',
    month,
  });
  await insertTransaction(userId, {
    type: 'income',
    category: 'freelance',
    rupees: 6000,
    day: Math.min(8, todayDay),
    method: 'bank',
    note: 'Freelance design work',
    month,
  });

  for (const [day, category, rupees, method, note] of CURRENT_EXPENSES) {
    const scaledDay = Math.max(1, Math.ceil((day / 31) * todayDay));
    await insertTransaction(userId, {
      type: 'expense',
      category,
      rupees,
      day: scaledDay,
      method,
      note,
      month,
    });
  }
}

async function seedPastMonth(userId, month, template, variation) {
  await insertTransaction(userId, {
    type: 'income',
    category: 'allowance',
    rupees: 18000,
    day: 1,
    method: 'bank',
    note: 'Monthly pocket money',
    month,
  });
  await insertTransaction(userId, {
    type: 'income',
    category: 'freelance',
    rupees: variation === 2 ? 4000 : 5500,
    day: 8,
    method: 'bank',
    note: 'Freelance design work',
    month,
  });

  for (const [day, category, rupees, method, note] of template) {
    await insertTransaction(userId, {
      type: 'expense',
      category,
      rupees: variation === 2 ? Math.round(rupees * 0.94) : rupees,
      day,
      method,
      note,
      month,
    });
  }
}

async function seedBudgets(userId, month) {
  const limits = {
    overall: 18000,
    food: 4000,
    groceries: 3500,
    transport: 2000,
    rent: 6000,
    shopping: 2500,
    bills: 1800,
    subscriptions: 1000,
    entertainment: 1500,
    health: 1000,
    education: 1500,
  };
  const timestamp = new Date();
  for (const [category, rupees] of Object.entries(limits)) {
    await Budget.create({
      _id: crypto.randomUUID(),
      user_id: userId,
      month,
      category,
      limit_paise: Math.round(rupees * 100),
      created_at: timestamp,
      updated_at: timestamp,
    });
  }
}

async function seedRecurring(userId, today) {
  const bills = [
    {
      title: 'Electricity bill',
      amount: 850,
      category: 'bills',
      frequency: 'monthly',
      nextDueDate: addDays(today, 2),
      notes: 'Split with hostel roommates',
    },
    {
      title: 'Mobile recharge',
      amount: 299,
      category: 'subscriptions',
      frequency: 'monthly',
      nextDueDate: addDays(today, 4),
      notes: 'Monthly data pack',
    },
    {
      title: 'Netflix',
      amount: 199,
      category: 'subscriptions',
      frequency: 'monthly',
      nextDueDate: addDays(today, 7),
      notes: 'Shared family plan',
    },
    {
      title: 'Hostel rent',
      amount: 5500,
      category: 'rent',
      frequency: 'monthly',
      nextDueDate: dateFor(addMonths(today.slice(0, 7), 1), 2),
      notes: 'Due on the 2nd',
    },
  ];
  const timestamp = new Date();

  for (const bill of bills) {
    await Recurring.create({
      _id: crypto.randomUUID(),
      user_id: userId,
      title: bill.title,
      amount_paise: Math.round(bill.amount * 100),
      category: bill.category,
      frequency: bill.frequency,
      next_due_date: bill.nextDueDate,
      notes: bill.notes,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    });
  }
}

async function seedGoals(userId, today) {
  const goals = [
    {
      title: 'Emergency fund',
      target: 30000,
      saved: 12000,
      monthly: 3000,
      targetDate: addMonths(today.slice(0, 7), 6) + '-15',
      color: '#2B9966',
    },
    {
      title: 'New laptop',
      target: 60000,
      saved: 22500,
      monthly: 5000,
      targetDate: addMonths(today.slice(0, 7), 9) + '-10',
      color: '#457B9D',
    },
    {
      title: 'Goa trip',
      target: 15000,
      saved: 6500,
      monthly: 1500,
      targetDate: addMonths(today.slice(0, 7), 3) + '-20',
      color: '#E76F51',
    },
  ];
  const timestamp = new Date();

  for (const goal of goals) {
    const goalId = crypto.randomUUID();
    const goalDoc = await Goal.create({
      _id: goalId,
      user_id: userId,
      title: goal.title,
      target_paise: Math.round(goal.target * 100),
      saved_paise: Math.round(goal.saved * 100),
      monthly_target_paise: Math.round((goal.monthly || 0) * 100),
      target_date: goal.targetDate,
      color: goal.color,
      created_at: timestamp,
      updated_at: timestamp,
    });
    await Contribution.create({
      _id: crypto.randomUUID(),
      goal_id: goalId,
      user_id: userId,
      amount_paise: Math.round(goal.saved * 100),
      date: addDays(today, -20),
      note: 'Opening balance',
      created_at: timestamp,
    });
  }
}

export async function seedDemo({ force = false } = {}) {
  if (process.env.SEED_DEMO === 'false') return { seeded: false, reason: 'disabled' };

  await connectDB();

  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing && !force) return { seeded: false, reason: 'exists' };

  if (existing && force) {
    await User.deleteOne({ _id: existing._id });
    await Goal.deleteMany({ user_id: existing._id });
    await Contribution.deleteMany({ user_id: existing._id });
    await Transaction.deleteMany({ user_id: existing._id });
    await Budget.deleteMany({ user_id: existing._id });
    await Recurring.deleteMany({ user_id: existing._id });
    await PushSubscription.deleteMany({ user_id: existing._id });
    await NotificationLog.deleteMany({ user_id: existing._id });
  }

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const timestamp = new Date();
  const today = toDateKey();
  const month = toMonthKey();
  const todayDay = Number(today.slice(8, 10));

  await User.create({
    _id: userId,
    name: 'Aarav Sharma',
    email: DEMO_EMAIL,
    password_hash: passwordHash,
    monthly_income_paise: 2_400_000,
    currency: 'INR',
    locale: 'en',
    theme: 'light',
    notifications: true,
  });

  await seedCurrentMonth(userId, month, todayDay);
  await seedPastMonth(userId, addMonths(month, -1), PREVIOUS_EXPENSES, 1);
  await seedPastMonth(userId, addMonths(month, -2), TWO_MONTHS_EXPENSES, 2);
  await seedBudgets(userId, month);
  await seedRecurring(userId, today);
  await seedGoals(userId, today);

  return { seeded: true, email: DEMO_EMAIL, password: DEMO_PASSWORD };
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      const result = await seedDemo({ force: process.argv.includes('--force') });
      console.log(result);
    } catch (error) {
      console.error(error);
    } finally {
      process.exit(0);
    }
  })();
}
