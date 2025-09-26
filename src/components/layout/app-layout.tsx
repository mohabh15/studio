'use client';

import { useState } from 'react';
import type { Category, Transaction } from '@/lib/types';
import { useFirestoreTransactions, useFirestoreCategories } from '@/hooks/use-firestore';
import AddTransactionDialog from '../transactions/add-transaction-dialog';
import BottomNav from './bottom-nav';
import { ThemeToggle } from '../theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { t } = useI18n();
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
        <div className="pb-28 sm:pb-32">{children}</div>

        {/* Botón flotante para añadir transacción - justo encima de la navbar */}
        <div className="fixed bottom-24 right-4 z-50 sm:bottom-28 sm:right-6">
          <Button
            onClick={() => setAddTransactionOpen(true)}
            size="icon"
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90"
          >
            <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="sr-only">{t('header.add_transaction')}</span>
          </Button>
        </div>

        <BottomNav />
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
