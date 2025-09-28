'use client';

import { useState } from 'react';
import type { Category, Transaction } from '@/lib/types';
import { useFirestoreTransactions, useFirestoreCategories } from '@/hooks/use-firestore';
import { useAuth } from '@/hooks/use-auth';
import AddTransactionDialog from '../transactions/add-transaction-dialog';
import BottomNav from './bottom-nav';
import { Button } from '@/components/ui/button';
import { Plus, Wallet } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const userId = user?.uid;
  const { addTransaction } = useFirestoreTransactions(userId || '');
  const { categories } = useFirestoreCategories(userId || '');

  const handleTransactionAdded = async (newTx: Omit<Transaction, 'id'>) => {
    if (!userId) return;
    const transactionWithUserId = { ...newTx, userId };
    await addTransaction(transactionWithUserId);
    setAddTransactionOpen(false);
  };
  
  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        {/* Header with title */}
        {user && (
          <header className="flex items-center justify-between border-b bg-background px-3 py-3 sm:px-6">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Wallet className="h-6 w-6 text-primary flex-shrink-0 sm:h-7 sm:w-7" />
              <h1 className="text-lg font-bold tracking-tight text-foreground truncate sm:text-xl">
                {t('app.title')}
              </h1>
            </div>
          </header>
        )}

        <div className="pb-20 sm:pb-24 md:pb-20">{children}</div>

        {/* Botón flotante para añadir transacción - justo encima de la navbar */}
        <div className="fixed bottom-24 right-4 z-50 sm:bottom-28 sm:right-6">
          <Button
            onClick={() => setAddTransactionOpen(true)}
            size="icon"
            className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-primary shadow-lg hover:bg-primary/90"
            disabled={!user}
          >
            <Plus className="h-8 w-8 sm:h-9 sm:w-9" />
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
        userId={userId || ''}
      />
    </>
  );
}
