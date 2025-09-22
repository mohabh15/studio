import { Category } from '../types';

export const defaultCategories: Category[] = [
  // Expenses
  { id: 'groceries', name: 'categories.groceries', icon: 'basket', type: 'expense' },
  { id: 'rent', name: 'categories.rent', icon: 'home', type: 'expense' },
  { id: 'transport', name: 'categories.transport', icon: 'car', type: 'expense' },
  { id: 'clothing', name: 'categories.clothing', icon: 'shirt', type: 'expense' },
  { id: 'entertainment', name: 'categories.entertainment', icon: 'film', type: 'expense' },
  { id: 'health', name: 'categories.health', icon: 'medical', type: 'expense' },
  { id: 'gifts', name: 'categories.gifts', icon: 'gift', type: 'expense' },
  { id: 'other_expense', name: 'categories.other_expense', icon: 'briefcase', type: 'expense' },
  
  // Income
  { id: 'salary', name: 'categories.salary', icon: 'business', type: 'income' },
  { id: 'savings', name: 'categories.savings', icon: 'wallet', type: 'income' },
  { id: 'other_income', name: 'categories.other_income', icon: 'briefcase', type: 'income' },
];