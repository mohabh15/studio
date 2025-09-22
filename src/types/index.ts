export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO string
  category: string; // category id
  notes?: string;
  merchant?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
};

export type Budget = {
  id: string;
  category: string; // category id
  amount: number;
};

export type Locale = 'en' | 'es';