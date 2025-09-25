import type { Category } from '@/lib/types';

export const defaultCategories: Category[] = [
  // Expenses
  { id: 'groceries', name: 'categories.groceries', icon: 'ShoppingCart', type: 'expense' },
  { id: 'rent', name: 'categories.rent', icon: 'Home', type: 'expense' },
  { id: 'transport', name: 'categories.transport', icon: 'Car', type: 'expense' },
  { id: 'clothing', name: 'categories.clothing', icon: 'Shirt', type: 'expense' },
  { id: 'entertainment', name: 'categories.entertainment', icon: 'Clapperboard', type: 'expense' },
  { id: 'health', name: 'categories.health', icon: 'HeartPulse', type: 'expense' },
  { id: 'gifts', name: 'categories.gifts', icon: 'Gift', type: 'expense' },
  { id: 'debt', name: 'categories.debt_payment', icon: 'CreditCard', type: 'expense' },
  { id: 'other_expense', name: 'categories.other_expense', icon: 'Briefcase', type: 'expense' },
  
  // Income
  { id: 'salary', name: 'categories.salary', icon: 'Landmark', type: 'income' },
  { id: 'savings', name: 'categories.savings', icon: 'PiggyBank', type: 'income' },
  { id: 'other_income', name: 'categories.other_income', icon: 'Briefcase', type: 'income' },
];
