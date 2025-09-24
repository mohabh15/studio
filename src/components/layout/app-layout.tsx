'use client';

import { useState } from 'react';
import type { Category, Transaction } from '@/lib/types';
import { useFirestoreTransactions, useFirestoreCategories } from '@/hooks/use-firestore';
import AddTransactionDialog from '../transactions/add-transaction-dialog';
import BottomNav from './bottom-nav';
import { ThemeToggle } from '../theme/theme-toggle';

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const { addTransaction } = useFirestoreTransactions();
  const { categories } = useFirestoreCategories();

  const handleTransactionAdded = async (newTx: Omit<Transaction, 'id'>) => {
    await addTransaction(newTx);
    setAddTransactionOpen(false);
  };
  
  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <div className="pb-24">{children}</div>
        <BottomNav onAddTransaction={() => setAddTransactionOpen(true)} />
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
