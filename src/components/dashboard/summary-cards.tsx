'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import type { Transaction, Category } from '@/lib/types';
import { formatMonthName } from '@/lib/utils';
import { useMemo } from 'react';

type SummaryCardsProps = {
  income: number;
  expense: number;
  selectedYear: number;
  selectedMonth: number;
  allTransactions: Transaction[];
  categories: Category[];
};

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} €`;
};

export default function SummaryCards({ income, expense, selectedYear, selectedMonth, allTransactions, categories }: SummaryCardsProps) {
  const { t, locale } = useI18n();
  const balance = income - expense;

  const getMonthName = (month: number) => {
    return formatMonthName(selectedYear, month, locale);
  };

  const dailyInsight = useMemo(() => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

    const currentExpenses = allTransactions.filter(tx =>
      tx.type === 'expense' &&
      new Date(tx.date).getFullYear() === selectedYear &&
      new Date(tx.date).getMonth() === selectedMonth
    );

    const prevExpenses = allTransactions.filter(tx =>
      tx.type === 'expense' &&
      new Date(tx.date).getFullYear() === prevYear &&
      new Date(tx.date).getMonth() === prevMonth
    );

    const currentIncomes = allTransactions.filter(tx =>
      tx.type === 'income' &&
      new Date(tx.date).getFullYear() === selectedYear &&
      new Date(tx.date).getMonth() === selectedMonth
    );

    const prevIncomes = allTransactions.filter(tx =>
      tx.type === 'income' &&
      new Date(tx.date).getFullYear() === prevYear &&
      new Date(tx.date).getMonth() === prevMonth
    );

    const currentByCategory = currentExpenses.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    const prevByCategory = prevExpenses.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalCurrentExpense = currentExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const totalPrevExpense = prevExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const totalCurrentIncome = currentIncomes.reduce((sum, tx) => sum + tx.amount, 0);
    const totalPrevIncome = prevIncomes.reduce((sum, tx) => sum + tx.amount, 0);

    const insights: { message: string; isIncrease: boolean }[] = [];

    // Insight para gastos totales
    if (totalPrevExpense > 0 || totalCurrentExpense > 0) {
      const percentage = totalPrevExpense > 0 ? ((totalCurrentExpense - totalPrevExpense) / totalPrevExpense) * 100 : 100;
      const isIncrease = percentage >= 0;
      const absPercentage = Math.abs(percentage).toFixed(0);
      insights.push({
        message: isIncrease
          ? t('dashboard.summary.expenses_increased').replace('{{percentage}}', absPercentage)
          : t('dashboard.summary.expenses_decreased').replace('{{percentage}}', absPercentage),
        isIncrease
      });
    }

    // Insight para ingresos totales
    if (totalPrevIncome > 0 || totalCurrentIncome > 0) {
      const percentage = totalPrevIncome > 0 ? ((totalCurrentIncome - totalPrevIncome) / totalPrevIncome) * 100 : 100;
      const isIncrease = percentage >= 0;
      const absPercentage = Math.abs(percentage).toFixed(0);
      insights.push({
        message: isIncrease
          ? t('dashboard.summary.income_increased').replace('{{percentage}}', absPercentage)
          : t('dashboard.summary.income_decreased').replace('{{percentage}}', absPercentage),
        isIncrease
      });
    }

    // Insights para categorías
    categories.forEach(cat => {
      const current = currentByCategory[cat.id] || 0;
      const prev = prevByCategory[cat.id] || 0;
      if (prev > 0 || current > 0) {
        const percentage = prev > 0 ? ((current - prev) / prev) * 100 : 100;
        const isIncrease = percentage >= 0;
        const absPercentage = Math.abs(percentage).toFixed(0);
        insights.push({
          message: isIncrease
            ? t('dashboard.summary.category_expenses_increased').replace('{{category}}', t(cat.name)).replace('{{percentage}}', absPercentage)
            : t('dashboard.summary.category_expenses_decreased').replace('{{category}}', t(cat.name)).replace('{{percentage}}', absPercentage),
          isIncrease
        });
      }
    });

    if (insights.length === 0) return null;

    const dayOfMonth = new Date().getDate();
    const selectedInsight = insights[dayOfMonth % insights.length];

    return selectedInsight;
  }, [allTransactions, categories, selectedYear, selectedMonth]);

  return (
    <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <Card className={`glass-card depth-2 hover-lift interactive-scale ${balance >= 0 ? 'glow-primary' : 'glow-accent'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-foreground/90">{t('dashboard.summary.balance')}</CardTitle>
          <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-success/20' : 'bg-warning/20'}`}>
            <DollarSign className={`h-5 w-5 ${balance >= 0 ? 'text-success' : 'text-warning'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold mb-1 ${balance >= 0 ? 'text-success' : 'text-warning'}`}>
            {formatCurrency(balance)}
          </div>
          <p className="text-xs text-muted-foreground/80">{t('dashboard.summary.remaining_funds')}</p>
        </CardContent>
      </Card>

      <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-foreground/90">{t('dashboard.summary.total_income')}</CardTitle>
          <div className="p-2 rounded-lg bg-success/20">
            <ArrowUp className="h-5 w-5 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-1 text-success">
            {formatCurrency(income)}
          </div>
          <p className="text-xs text-muted-foreground/80">{getMonthName(selectedMonth)}</p>
        </CardContent>
      </Card>

      <Card className="glass-card depth-2 hover-lift interactive-scale glow-accent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-foreground/90">{t('dashboard.summary.total_expenses')}</CardTitle>
          <div className="p-2 rounded-lg bg-error/20">
            <ArrowDown className="h-5 w-5 text-error" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-1 text-error">
            {formatCurrency(expense)}
          </div>
          <p className="text-xs text-muted-foreground/80">{getMonthName(selectedMonth)}</p>
        </CardContent>
      </Card>

      {dailyInsight && (
        <Card className={`glass-card depth-2 hover-lift interactive-scale ${dailyInsight.isIncrease ? 'glow-accent' : 'glow-primary'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground/90">{t('dashboard.summary.daily_insight')}</CardTitle>
            <div className={`p-2 rounded-lg ${dailyInsight.isIncrease ? 'bg-error/20' : 'bg-success/20'}`}>
              {dailyInsight.isIncrease ? (
                <TrendingUp className="h-5 w-5 text-error" />
              ) : (
                <TrendingDown className="h-5 w-5 text-success" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`p-3 rounded-lg ${dailyInsight.isIncrease ? 'bg-error/10 border border-error/30' : 'bg-success/10 border border-success/30'}`}>
              <p className={`text-sm font-medium ${dailyInsight.isIncrease ? 'text-error' : 'text-success'}`}>
                {dailyInsight.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
