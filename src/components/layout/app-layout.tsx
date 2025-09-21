'use client';

import { useState } from 'react';
import Header from '../header';
import AddTransactionDialog from '../transactions/add-transaction-dialog';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Category, Transaction } from '@/lib/types';
import { defaultCategories } from '@/lib/constants';

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [categories] = useLocalStorage<Category[]>('categories', defaultCategories);

  const handleTransactionAdded = (newTx: Omit<Transaction, 'id'>) => {
    const fullTx = { ...newTx, id: new Date().toISOString() };
    setTransactions(prev => [fullTx, ...prev]);
    setAddTransactionOpen(false);
  };
  
  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <Header onAddTransaction={() => setAddTransactionOpen(true)} />
        {children}
      </div>
      <AddTransactionDialog
        isOpen={isAddTransactionOpen}
        onOpenChange={setAddTransactionOpen}
        onTransactionAdded={handleTransactionAdded}
        categories={categories}
      />
    </>
  );
}
