'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Transaction, Budget, Category } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/hooks/use-auth';
import SummaryCards from '@/components/dashboard/summary-cards';
import SpendingChart from '@/components/dashboard/spending-chart';
import SpendingTrendsChart from '@/components/dashboard/spending-trends-chart';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import BudgetStatus from '@/components/dashboard/budget-status';
import DebtStatus from '@/components/dashboard/debt-status';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import MonthSelector from '@/components/dashboard/month-selector';
import AppLayout from '@/components/layout/app-layout';
import { Wallet, AlertCircle } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useSelectedMonth } from '@/hooks/use-selected-month';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const { t } = useI18n();
    const { user, loading: authLoading, logout } = useAuth();
    const { selectedYear, selectedMonth, updateSelectedMonth } = useSelectedMonth();
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const userId = user?.uid;

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
            toast({
                title: t('auth.logout_success') || 'Sesión cerrada exitosamente',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: t('auth.logout_error') || 'Error al cerrar sesión',
            });
        }
    };

   const {
     transactions: allTransactions,
     budgets: allBudgets,
     categories,
     debts,
     transactionsLoading,
     budgetsLoading,
     categoriesLoading,
     debtsLoading,
     transactionsError,
     budgetsError,
     categoriesError,
     debtsError,
   } = useData();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasError = transactionsError || budgetsError || categoriesError || debtsError;



  const transactions = useMemo(() => {
    return allTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === selectedYear && txDate.getMonth() === selectedMonth;
    });
  }, [allTransactions, selectedYear, selectedMonth]);

  const budgets = useMemo(() => {
    // NOTE: Current Budget type doesn't include month/year information
    // For now, we show all budgets for the selected month
    // In the future, we could extend Budget type to include:
    // - month: number (0-11)
    // - year: number
    // - period: 'monthly' | 'yearly' | 'custom'
    return allBudgets;
  }, [allBudgets]);

  const summary = useMemo(() => {
    const currentMonthTxs = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
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

  if (authLoading || !isClient) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    console.log('Dashboard: Usuario no autenticado, mostrando mensaje de login requerido');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('auth.required_message') || 'Debes iniciar sesión para acceder al dashboard.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (transactionsLoading || budgetsLoading || categoriesLoading || debtsLoading) {
    return <DashboardSkeleton />;
  }

  // Obtener el saludo según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning') || 'Buenos días';
    if (hour < 18) return t('dashboard.greeting.afternoon') || 'Buenas tardes';
    return t('dashboard.greeting.evening') || 'Buenas noches';
  };

  // Obtener el nombre del usuario (primera palabra del email o displayName)
  const getUserName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return t('dashboard.greeting.user') || 'Usuario';
  };

  // Formato de fecha actual
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <AppLayout>
        <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8 animate-in fade-in duration-500">
          {/* Header modernizado con saludo */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 animate-in slide-in-from-left duration-500">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-in fade-in duration-700">
                {getGreeting()}, {getUserName()} 👋
              </h1>
              <p className="text-sm md:text-base text-muted-foreground/80 capitalize">
                {currentDate}
              </p>
            </div>

            <div className="animate-in slide-in-from-right duration-500">
              <MonthSelector
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                updateSelectedMonth={updateSelectedMonth}
              />
            </div>
          </div>

          {/* Tarjetas de resumen con animación */}
          <div className="animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '100ms' }}>
            <SummaryCards
              income={summary.income}
              expense={summary.expense}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              allTransactions={allTransactions}
              categories={categories}
            />
          </div>

          {/* Grid principal con diseño mejorado */}
          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3 animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '200ms' }}>
            <div className="flex flex-col gap-6 lg:col-span-2">
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <SpendingChart
                  transactions={transactions}
                  categories={categories}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                />
              </div>

              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <SpendingTrendsChart transactions={allTransactions} />
              </div>

              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <RecentTransactions transactions={transactions} categories={categories} />
              </div>

              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <DebtStatus debts={debts} userId={userId || ''} />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <BudgetStatus
                  transactions={transactions}
                  budgets={budgets}
                  categories={categories}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                />
              </div>
            </div>
          </div>
        </main>
      </AppLayout>
    </>
  );
}
