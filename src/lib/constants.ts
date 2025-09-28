import type { Category } from '@/lib/types';

export const defaultCategories: Category[] = [
  // Expenses
  { id: 'groceries', name: 'categories.groceries', icon: 'ShoppingCart', type: 'expense', userId: 'default' },
  { id: 'rent', name: 'categories.rent', icon: 'Home', type: 'expense', userId: 'default' },
  { id: 'transport', name: 'categories.transport', icon: 'Car', type: 'expense', userId: 'default' },
  { id: 'clothing', name: 'categories.clothing', icon: 'Shirt', type: 'expense', userId: 'default' },
  { id: 'entertainment', name: 'categories.entertainment', icon: 'Clapperboard', type: 'expense', userId: 'default' },
  { id: 'health', name: 'categories.health', icon: 'HeartPulse', type: 'expense', userId: 'default' },
  { id: 'gifts', name: 'categories.gifts', icon: 'Gift', type: 'expense', userId: 'default' },
  { id: 'debt', name: 'categories.debt_payment', icon: 'CreditCard', type: 'expense', userId: 'default' },
  { id: 'shopping', name: 'categories.shopping', icon: 'ShoppingBag', type: 'expense', userId: 'default' },
  { id: 'other_expense', name: 'categories.other_expense', icon: 'Briefcase', type: 'expense', userId: 'default' },

  // Income
  { id: 'salary', name: 'categories.salary', icon: 'Landmark', type: 'income', userId: 'default' },
  { id: 'savings', name: 'categories.savings', icon: 'PiggyBank', type: 'income', userId: 'default' },
  { id: 'debt_collection', name: 'categories.debt_collection', icon: 'DollarSign', type: 'income', userId: 'default' },
  { id: 'other_income', name: 'categories.other_income', icon: 'Briefcase', type: 'income', userId: 'default' },
];
