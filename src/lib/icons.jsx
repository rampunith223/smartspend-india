import {
  Banknote,
  BriefcaseBusiness,
  BusFront,
  CircleEllipsis,
  CreditCard,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  Popcorn,
  QrCode,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Utensils,
  Wallet,
} from 'lucide-react';
import { getCategory, getPaymentMethod } from '../../shared/catalog.js';

const CATEGORY_ICONS = {
  Utensils,
  ShoppingBasket,
  BusFront,
  House,
  ShoppingBag,
  ReceiptText,
  Smartphone,
  GraduationCap,
  HeartPulse,
  Popcorn,
  Gift,
  CircleEllipsis,
  Wallet,
  BriefcaseBusiness,
  Laptop,
  RotateCcw,
};

const PAYMENT_ICONS = {
  QrCode,
  Banknote,
  CreditCard,
  Landmark,
};

export function CategoryIcon({ category, size = 18, className = '', strokeWidth = 1.8 }) {
  const meta = getCategory(category);
  const Icon = CATEGORY_ICONS[meta?.icon] || CircleEllipsis;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
}

export function PaymentIcon({ method, size = 16, className = '', strokeWidth = 1.8 }) {
  const meta = getPaymentMethod(method);
  const Icon = PAYMENT_ICONS[meta?.icon] || CreditCard;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
}
