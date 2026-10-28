import { z } from 'zod';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../../shared/catalog.js';
import { isValidDateKey, isValidMonthKey } from './date.js';

const expenseCategoryIds = EXPENSE_CATEGORIES.map((category) => category.id);
const incomeCategoryIds = INCOME_CATEGORIES.map((category) => category.id);
const allCategoryIds = [...expenseCategoryIds, ...incomeCategoryIds];
const paymentIds = PAYMENT_METHODS.map((method) => method.id);

const dateKey = z
  .string()
  .refine(isValidDateKey, 'Please choose a valid date.')
  .refine((value) => value <= '2100-12-31', 'Date is too far in the future.');

const monthKey = z.string().refine(isValidMonthKey, 'Please choose a valid month.');

const amountPaise = z
  .number({ invalid_type_error: 'Enter a valid amount.' })
  .int('Amount must be a whole number of paise.')
  .min(1, 'Amount must be greater than zero.')
  .max(100_000_000_000, 'That amount is too large.');

const note = z.string().trim().max(240, 'Keep the note under 240 characters.').default('');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80, 'Name is too long.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters for your password.')
    .max(128, 'Password is too long.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80, 'Name is too long.').optional(),
  monthlyIncomePaise: z.number().int().min(0).max(100_000_000_000).optional(),
  currency: z.literal('INR').optional(),
  locale: z.enum(['en', 'hi', 'te']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: z
    .string()
    .min(8, 'Use at least 8 characters for your new password.')
    .max(128, 'Password is too long.'),
});

export const transactionSchema = z
  .object({
    type: z.enum(['expense', 'income']),
    amountPaise,
    category: z.string(),
    date: dateKey,
    paymentMethod: z.enum(paymentIds).default('upi'),
    note,
  })
  .superRefine((value, context) => {
    const allowed = value.type === 'income' ? incomeCategoryIds : expenseCategoryIds;
    if (!allowed.includes(value.category)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category'],
        message: 'Choose a category that matches the transaction type.',
      });
    }
  });

export const transactionPatchSchema = z.object({
  type: z.enum(['expense', 'income']).optional(),
  amountPaise: amountPaise.optional(),
  category: z.string().optional(),
  date: dateKey.optional(),
  paymentMethod: z.enum(paymentIds).optional(),
  note: z.string().trim().max(240).optional(),
});

export const budgetSchema = z.object({
  month: monthKey,
  category: z.enum(['overall', ...expenseCategoryIds]),
  limitPaise: z.number().int().min(0).max(100_000_000_000),
});

export const recurringSchema = z.object({
  title: z.string().trim().min(2, 'Give this bill a name.').max(80, 'Title is too long.'),
  amountPaise,
  category: z.enum(expenseCategoryIds),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  nextDueDate: dateKey,
  notes: z.string().trim().max(240).default(''),
  isActive: z.boolean().optional(),
});

export const recurringPatchSchema = recurringSchema.partial();

export const goalSchema = z.object({
  title: z.string().trim().min(2, 'Give your goal a name.').max(80, 'Title is too long.'),
  targetPaise: amountPaise,
  savedPaise: z.number().int().min(0).max(100_000_000_000).optional(),
  monthlyTargetPaise: z.number().int().min(0).max(100_000_000_000).optional(),
  targetDate: dateKey.nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Choose a valid colour.')
    .optional(),
});

export const goalPatchSchema = z.object({
  title: z.string().trim().min(2, 'Give your goal a name.').max(80, 'Title is too long.').optional(),
  targetPaise: amountPaise.optional(),
  monthlyTargetPaise: z.number().int().min(0).max(100_000_000_000).optional(),
  targetDate: dateKey.nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Choose a valid colour.')
    .optional(),
});

export const contributionSchema = z.object({
  amountPaise,
  date: dateKey,
  note,
});

export const categoryIdSchema = z.string().refine((value) => allCategoryIds.includes(value));

export { expenseCategoryIds, incomeCategoryIds, allCategoryIds, paymentIds };
