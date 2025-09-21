import type { Category } from '@/lib/types';
import {
  ShoppingCart,
  Home,
  UtensilsCrossed,
  Car,
  Shirt,
  Clapperboard,
  HeartPulse,
  Landmark,
  PiggyBank,
  Briefcase,
  Gift,
} from 'lucide-react';

export const CATEGORIES: Category[] = [
  { id: 'groceries', name: 'Groceries', icon: UtensilsCrossed },
  { id: 'rent', name: 'Rent & Utilities', icon: Home },
  { id: 'transport', name: 'Transport', icon: Car },
  { id: 'shopping', name: 'Shopping', icon: ShoppingCart },
  { id: 'clothing', name: 'Clothing', icon: Shirt },
  { id: 'entertainment', a: 'Entertainment', icon: Clapperboard },
  { id: 'health', name: 'Health', icon: HeartPulse },
  { id: 'gifts', name: 'Gifts', icon: Gift },
  { id: 'other_expense', name: 'Other Expense', icon: Briefcase },
  { id: 'salary', name: 'Salary', icon: Landmark },
  { id: 'savings', name: 'Savings', icon: PiggyBank },
  { id: 'other_income', name: 'Other Income', icon: Briefcase },
];

export function findCategory(id: string): Category | undefined {
  return CATEGORIES.find(c => c.id === id);
}
