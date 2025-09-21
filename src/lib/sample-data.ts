import type { Transaction, Budget } from '@/lib/types';

const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

export const sampleTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 3500,
    date: new Date(firstDayOfMonth.setDate(1)).toISOString(),
    category: 'salary',
    merchant: 'Employer Inc.',
    notes: 'Monthly salary',
  },
  {
    id: '2',
    type: 'expense',
    amount: 1200,
    date: new Date(firstDayOfMonth.setDate(2)).toISOString(),
    category: 'rent',
    merchant: 'Landlord',
    notes: 'Monthly rent and utilities',
  },
  {
    id: '3',
    type: 'expense',
    amount: 75.5,
    date: new Date(firstDayOfMonth.setDate(3)).toISOString(),
    category: 'groceries',
    merchant: 'SuperMart',
    notes: 'Weekly groceries',
  },
  {
    id: '4',
    type: 'expense',
    amount: 45,
    date: new Date(firstDayOfMonth.setDate(4)).toISOString(),
    category: 'transport',
    merchant: 'City Transit',
    notes: 'Monthly pass',
  },
  {
    id: '5',
    type: 'expense',
    amount: 120,
    date: new Date(firstDayOfMonth.setDate(5)).toISOString(),
    category: 'shopping',
    merchant: 'Gadget Store',
    notes: 'New headphones',
  },
];

export const sampleBudgets: Budget[] = [
  { id: '1', category: 'groceries', amount: 400 },
  { id: '2', category: 'shopping', amount: 250 },
  { id: '3', category: 'entertainment', amount: 150 },
];
