'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Transaction, Budget, Category } from '@/lib/types';
import { useFirestoreTransactions, useFirestoreBudgets, useFirestoreCategories, useFirestoreDebts } from '@/hooks/use-firestore';
import SummaryCards from '@/components/dashboard/summary-cards';
import SpendingChart from '@/components/dashboard/spending-chart';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import BudgetStatus from '@/components/dashboard/budget-status';
import DebtStatus from '@/components/dashboard/debt-status';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import AppLayout from '@/components/layout/app-layout';
import { Wallet } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useSelectedYear } from '@/hooks/use-selected-year';

export default function DashboardPage() {
  const { t } = useI18n();
  const { selectedYear } = useSelectedYear();
  const [isClient, setIsClient] = useState(false);
  const { transactions: allTransactions, loading: transactionsLoading } = useFirestoreTransactions();
  const { budgets: allBudgets, loading: budgetsLoading } = useFirestoreBudgets();
  const { categories, loading: categoriesLoading } = useFirestoreCategories();
  const { debts, loading: debtsLoading } = useFirestoreDebts();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const transactions = useMemo(() => {
    return allTransactions.filter(tx => new Date(tx.date).getFullYear() === selectedYear);
  }, [allTransactions, selectedYear]);

  const budgets = useMemo(() => {
    return allBudgets.filter(budget => {
      // Assuming budgets are yearly, or filter by year if they have dates
      // For now, return all, or add year to budgets
      return true; // TODO: filter budgets by year if applicable
    });
  }, [allBudgets, selectedYear]);

  const summary = useMemo(() => {
    const currentMonthTxs = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === new Date().getMonth() && txDate.getFullYear() === new Date().getFullYear();
    });
    return currentMonthTxs.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  if (!isClient || transactionsLoading || budgetsLoading || categoriesLoading || debtsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <AppLayout>
        <header className="flex items-center gap-2 p-4 sm:px-6 sm:py-4 border-b">
          <Wallet className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {t('app.title')}
          </h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
          <SummaryCards income={summary.income} expense={summary.expense} />
          <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <SpendingChart transactions={transactions} categories={categories} />
              <RecentTransactions transactions={transactions} categories={categories} />
            </div>
            <div className="flex flex-col gap-4">
              <BudgetStatus transactions={transactions} budgets={budgets} categories={categories} />
              <DebtStatus debts={debts} />
            </div>
          </div>
        </main>
      </AppLayout>
    </>
  );
}
