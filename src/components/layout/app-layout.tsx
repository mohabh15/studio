'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { FirestoreTransactionsProvider, useFirestoreTransactionsContext } from '@/context/firestore-transactions-context';
import type { Category, Transaction } from '@/lib/types';
import { defaultCategories } from '@/lib/constants';
import AddTransactionDialog from '../transactions/add-transaction-dialog';
import BottomNav from './bottom-nav';
import { ThemeToggle } from '../theme/theme-toggle';

type AppLayoutProps = {
  children: React.ReactNode;
};

// Componente interno que usa el contexto
function AppLayoutContent({ children }: AppLayoutProps) {
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const { addTransaction } = useFirestoreTransactionsContext();
  const [categories] = useLocalStorage<Category[]>('categories', defaultCategories);

  const handleTransactionAdded = async (newTx: Omit<Transaction, 'id'>) => {
    try {
      await addTransaction(newTx);
      setAddTransactionOpen(false);
    } catch (err) {
      console.error('Error al guardar transacción:', err);
    }
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

// Componente principal que provee el contexto
export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <FirestoreTransactionsProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </FirestoreTransactionsProvider>
  );
}
