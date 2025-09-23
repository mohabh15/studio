'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useFirestoreTransactionsContext } from '@/context/firestore-transactions-context';
import type { Transaction, Budget, Category } from '@/lib/types';
import { sampleBudgets, sampleTransactions } from '@/lib/sample-data';
import { defaultCategories } from '@/lib/constants';
import SummaryCards from '@/components/dashboard/summary-cards';
import SpendingChart from '@/components/dashboard/spending-chart';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import BudgetStatus from '@/components/dashboard/budget-status';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import AppLayout from '@/components/layout/app-layout';
import { Wallet } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';


// Componente interno que usa el contexto
function DashboardContent() {
  const { t } = useI18n();
  const { transactions, loading, error } = useFirestoreTransactionsContext();
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);

  useEffect(() => {
    // Solo inicializar datos de muestra si no hay datos en localStorage
    if (localStorage.getItem('budgets') === null) {
      setBudgets(sampleBudgets);
    }
    if (localStorage.getItem('categories') === null) {
      setCategories(defaultCategories);
    }
  }, [setBudgets, setCategories]);

  const summary = useMemo(() => {
    const currentMonthTxs = transactions.filter(tx => new Date(tx.date).getMonth() === new Date().getMonth());
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error al cargar transacciones: {error}</p>
      </div>
    );
  }

  return (
    <>
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
            <RecentTransactions transactions={transactions} categories={categories} />
          </div>
          <div className="flex flex-col gap-4">
            <BudgetStatus transactions={transactions} budgets={budgets} categories={categories} />
            <SpendingChart transactions={transactions} categories={categories} />
          </div>
        </div>
      </main>
    </>
  );
}

// Componente principal que envuelve todo en AppLayout
export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <DashboardSkeleton />;
  }

  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  );
}
