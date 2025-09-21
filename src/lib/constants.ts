import type { Category } from '@/lib/types';

export const defaultCategories: Category[] = [
  // Expenses
  { id: 'groceries', name: 'Groceries', icon: 'ShoppingCart', type: 'expense' },
  { id: 'rent', name: 'Rent & Utilities', icon: 'Home', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: 'Car', type: 'expense' },
  { id: 'clothing', name: 'Clothing', icon: 'Shirt', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Clapperboard', type: 'expense' },
  { id: 'health', name: 'Health', icon: 'HeartPulse', type: 'expense' },
  { id: 'gifts', name: 'Gifts', icon: 'Gift', type: 'expense' },
  { id: 'other_expense', name: 'Other Expense', icon: 'Briefcase', type: 'expense' },
  
  // Income
  { id: 'salary', name: 'Salary', icon: 'Landmark', type: 'income' },
  { id: 'savings', name: 'Savings', icon: 'PiggyBank', type: 'income' },
  { id: 'other_income', name: 'Other Income', icon: 'Briefcase', type: 'income' },
];
