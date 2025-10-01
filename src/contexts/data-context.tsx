'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useFirestoreTransactions,
  useFirestoreBudgets,
  useFirestoreCategories,
  useFirestoreDebts,
  useFirestoreDebtPayments,
} from '@/hooks/use-firestore';
import { Transaction, Budget, Category, Debt, DebtPayment } from '@/lib/types';

interface DataContextType {
  // Data
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  debts: Debt[];
  debtPayments: DebtPayment[];

  // Loading states
  transactionsLoading: boolean;
  budgetsLoading: boolean;
  categoriesLoading: boolean;
  debtsLoading: boolean;
  debtPaymentsLoading: boolean;

  // Errors
  transactionsError: string | null;
  budgetsError: string | null;
  categoriesError: string | null;
  debtsError: string | null;
  debtPaymentsError: string | null;

  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refetchTransactions: () => Promise<void>;

  addBudget: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  refetchBudgets: () => Promise<void>;

  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  refetchCategories: () => Promise<void>;

  addDebt: (debt: Omit<Debt, 'id' | 'userId'>) => Promise<void>;
  updateDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  refetchDebts: () => Promise<void>;

  addDebtPayment: (payment: Omit<DebtPayment, 'id' | 'userId'>) => Promise<void>;
  updateDebtPayment: (id: string, updates: Partial<DebtPayment>) => Promise<void>;
  deleteDebtPayment: (id: string) => Promise<void>;
  refetchDebtPayments: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.uid || '';

  // Use the existing hooks
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: refetchTransactions,
  } = useFirestoreTransactions(userId);

  const {
    budgets,
    loading: budgetsLoading,
    error: budgetsError,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: refetchBudgets,
  } = useFirestoreBudgets(userId);

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: refetchCategories,
  } = useFirestoreCategories(userId);

  const {
    debts,
    loading: debtsLoading,
    error: debtsError,
    addDebt,
    updateDebt,
    deleteDebt,
    refetch: refetchDebts,
  } = useFirestoreDebts(userId);

  const {
    debtPayments,
    loading: debtPaymentsLoading,
    error: debtPaymentsError,
    addDebtPayment,
    updateDebtPayment,
    deleteDebtPayment,
    refetch: refetchDebtPayments,
  } = useFirestoreDebtPayments(userId);

  const value: DataContextType = {
    transactions,
    budgets,
    categories,
    debts,
    debtPayments,
    transactionsLoading,
    budgetsLoading,
    categoriesLoading,
    debtsLoading,
    debtPaymentsLoading,
    transactionsError,
    budgetsError,
    categoriesError,
    debtsError,
    debtPaymentsError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetchTransactions,
    addBudget,
    updateBudget,
    deleteBudget,
    refetchBudgets,
    addCategory,
    updateCategory,
    deleteCategory,
    refetchCategories,
    addDebt,
    updateDebt,
    deleteDebt,
    refetchDebts,
    addDebtPayment,
    updateDebtPayment,
    deleteDebtPayment,
    refetchDebtPayments,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}