'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useFirestoreTransactions,
  useFirestoreBudgets,
  useFirestoreCategories,
  useFirestoreDebts,
  useFirestoreDebtPayments,
  useFirestoreSavings,
  useFirestoreSavingsContributions,
  useFirestoreEmergencyFund,
  useFirestoreFinancialFreedomGoals,
} from '@/hooks/use-firestore';
import { Transaction, Budget, Category, Debt, DebtPayment, Savings, SavingsContribution, EmergencyFund, FinancialFreedomGoal } from '@/lib/types';

interface DataContextType {
  // Data
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  savings: Savings[];
  savingsContributions: SavingsContribution[];
  emergencyFund: EmergencyFund[];
  financialFreedomGoals: FinancialFreedomGoal[];

  // Loading states
  transactionsLoading: boolean;
  budgetsLoading: boolean;
  categoriesLoading: boolean;
  debtsLoading: boolean;
  debtPaymentsLoading: boolean;
  savingsLoading: boolean;
  savingsContributionsLoading: boolean;
  emergencyFundLoading: boolean;
  financialFreedomGoalsLoading: boolean;

  // Errors
  transactionsError: string | null;
  budgetsError: string | null;
  categoriesError: string | null;
  debtsError: string | null;
  debtPaymentsError: string | null;
  savingsError: string | null;
  savingsContributionsError: string | null;
  emergencyFundError: string | null;
  financialFreedomGoalsError: string | null;

  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<Transaction>;
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

  addSavings: (savings: Omit<Savings, 'id' | 'userId'>) => Promise<void>;
  updateSavings: (id: string, updates: Partial<Savings>) => Promise<void>;
  deleteSavings: (id: string) => Promise<void>;
  refetchSavings: () => Promise<void>;

  addSavingsContribution: (contribution: Omit<SavingsContribution, 'id' | 'userId'>) => Promise<SavingsContribution>;
  updateSavingsContribution: (id: string, updates: Partial<SavingsContribution>) => Promise<void>;
  deleteSavingsContribution: (id: string) => Promise<void>;
  refetchSavingsContributions: () => Promise<void>;

  addEmergencyFund: (fund: Omit<EmergencyFund, 'id' | 'userId'>) => Promise<void>;
  updateEmergencyFund: (id: string, updates: Partial<EmergencyFund>) => Promise<void>;
  deleteEmergencyFund: (id: string) => Promise<void>;
  refetchEmergencyFund: () => Promise<void>;

  addFinancialFreedomGoal: (goal: Omit<FinancialFreedomGoal, 'id' | 'userId'>) => Promise<void>;
  updateFinancialFreedomGoal: (id: string, updates: Partial<FinancialFreedomGoal>) => Promise<void>;
  deleteFinancialFreedomGoal: (id: string) => Promise<void>;
  refetchFinancialFreedomGoals: () => Promise<void>;
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

  const {
    savings,
    loading: savingsLoading,
    error: savingsError,
    addSavings,
    updateSavings,
    deleteSavings,
    refetch: refetchSavings,
  } = useFirestoreSavings(userId);

  const {
    contributions: savingsContributions,
    loading: savingsContributionsLoading,
    error: savingsContributionsError,
    addContribution: addSavingsContribution,
    updateContribution: updateSavingsContribution,
    deleteContribution: deleteSavingsContribution,
    refetch: refetchSavingsContributions,
  } = useFirestoreSavingsContributions(userId);

  const {
    emergencyFund,
    loading: emergencyFundLoading,
    error: emergencyFundError,
    addEmergencyFund,
    updateEmergencyFund,
    deleteEmergencyFund,
    refetch: refetchEmergencyFund,
  } = useFirestoreEmergencyFund(userId);

  const {
    goals: financialFreedomGoals,
    loading: financialFreedomGoalsLoading,
    error: financialFreedomGoalsError,
    addGoal: addFinancialFreedomGoal,
    updateGoal: updateFinancialFreedomGoal,
    deleteGoal: deleteFinancialFreedomGoal,
    refetch: refetchFinancialFreedomGoals,
  } = useFirestoreFinancialFreedomGoals(userId);

  const value: DataContextType = {
    transactions,
    budgets,
    categories,
    debts,
    debtPayments,
    savings,
    savingsContributions,
    emergencyFund,
    financialFreedomGoals,
    transactionsLoading,
    budgetsLoading,
    categoriesLoading,
    debtsLoading,
    debtPaymentsLoading,
    savingsLoading,
    savingsContributionsLoading,
    emergencyFundLoading,
    financialFreedomGoalsLoading,
    transactionsError,
    budgetsError,
    categoriesError,
    debtsError,
    debtPaymentsError,
    savingsError,
    savingsContributionsError,
    emergencyFundError,
    financialFreedomGoalsError,
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
    addSavings,
    updateSavings,
    deleteSavings,
    refetchSavings,
    addSavingsContribution,
    updateSavingsContribution,
    deleteSavingsContribution,
    refetchSavingsContributions,
    addEmergencyFund,
    updateEmergencyFund,
    deleteEmergencyFund,
    refetchEmergencyFund,
    addFinancialFreedomGoal,
    updateFinancialFreedomGoal,
    deleteFinancialFreedomGoal,
    refetchFinancialFreedomGoals,
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