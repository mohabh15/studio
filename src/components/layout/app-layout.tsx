'use client';

import { useState } from 'react';
import type { Category, Transaction } from '@/lib/types';
import { useFirestoreTransactions, useFirestoreCategories } from '@/hooks/use-firestore';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import AddTransactionDialog from '../transactions/add-transaction-dialog';
import BottomNav from './bottom-nav';
import { Button } from '@/components/ui/button';
import { Plus, Wallet } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        {/* Header with title - Tema oscuro elegante mejorado */}
        {user && (
          <header className={cn(
            "flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-background via-card/50 to-background px-3 py-3 sm:px-6 backdrop-blur-sm transition-all duration-300",
            !isMobile && isSidebarOpen && "ml-64",
            !isMobile && !isSidebarOpen && "ml-16"
          )}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Wallet className="h-6 w-6 text-primary flex-shrink-0 sm:h-7 sm:w-7" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-foreground truncate sm:text-xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                {t('app.title')}
              </h1>
            </div>
          </header>
        )}

        <div className={cn(
          "pb-20 sm:pb-24 md:pb-20 relative transition-all duration-300",
          !isMobile && isSidebarOpen && "ml-64",
          !isMobile && !isSidebarOpen && "ml-16"
        )}>
          {/* Línea de separación visual elegante */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
          {children}
        </div>

        {/* Botón flotante para añadir transacción - con efectos elegantes mejorados */}
        <div className="fixed bottom-24 right-4 z-50 sm:bottom-20 sm:right-6">
          <div className="relative group">
            {/* Efectos de brillo sutil */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Button
              onClick={() => setAddTransactionOpen(true)}
              size="icon"
              className="relative h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-gradient-to-br from-primary via-primary to-accent shadow-2xl hover:shadow-primary/25 hover:scale-105 active:scale-95 transition-all duration-300 border border-primary/20 backdrop-blur-sm"
              disabled={!user}
            >
              <Plus className="h-8 w-8 sm:h-9 sm:w-9 text-primary-foreground drop-shadow-sm" />
              <span className="sr-only">{t('header.add_transaction')}</span>
            </Button>
          </div>
        </div>

        <BottomNav isSidebarOpen={isSidebarOpen} onSidebarToggle={setIsSidebarOpen} />
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
