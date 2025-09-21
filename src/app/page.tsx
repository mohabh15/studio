'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Transaction, Budget } from '@/lib/types';
import { sampleBudgets, sampleTransactions } from '@/lib/sample-data';
import Header from '@/components/header';
import SummaryCards from '@/components/dashboard/summary-cards';
import SpendingChart from '@/components/dashboard/spending-chart';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import BudgetStatus from '@/components/dashboard/budget-status';
import AddTransactionDialog from '@/components/transactions/add-transaction-dialog';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', []);
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // On first load, if there is no data, populate with sample data.
    if (localStorage.getItem('transactions') === null) {
      setTransactions(sampleTransactions);
    }
    if (localStorage.getItem('budgets') === null) {
      setBudgets(sampleBudgets);
    }
  }, [setBudgets, setTransactions]);

  const summary = useMemo(() => {
    return transactions.reduce(
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

  const handleTransactionAdded = (newTx: Omit<Transaction, 'id'>) => {
    const fullTx = { ...newTx, id: new Date().toISOString() };
    setTransactions(prev => [...prev, fullTx]);
    setAddTransactionOpen(false);
  };

  if (!isClient) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <Header onAddTransaction={() => setAddTransactionOpen(true)} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
          <SummaryCards income={summary.income} expense={summary.expense} />
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col gap-4 xl:col-span-2">
              <SpendingChart transactions={transactions} />
              <RecentTransactions transactions={transactions} />
            </div>
            <BudgetStatus transactions={transactions} budgets={budgets} />
          </div>
        </main>
      </div>
      <AddTransactionDialog
        isOpen={isAddTransactionOpen}
        onOpenChange={setAddTransactionOpen}
        onTransactionAdded={handleTransactionAdded}
      />
    </>
  );
}
