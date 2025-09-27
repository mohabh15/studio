'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import type { Transaction, Category } from '@/lib/types';
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
  const { t } = useI18n();
  const balance = income - expense;

  const getMonthName = (month: number) => {
    const date = new Date(selectedYear, month, 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
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
        message: `Tus gastos totales ${isIncrease ? 'aumentaron' : 'bajaron'} un ${absPercentage}% respecto al mes pasado.`,
        isIncrease
      });
    }

    // Insight para ingresos totales
    if (totalPrevIncome > 0 || totalCurrentIncome > 0) {
      const percentage = totalPrevIncome > 0 ? ((totalCurrentIncome - totalPrevIncome) / totalPrevIncome) * 100 : 100;
      const isIncrease = percentage >= 0;
      const absPercentage = Math.abs(percentage).toFixed(0);
      insights.push({
        message: `Tus ingresos ${isIncrease ? 'aumentaron' : 'bajaron'} un ${absPercentage}% respecto al mes pasado.`,
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
          message: `Tus gastos en ${t(cat.name)} ${isIncrease ? 'aumentaron' : 'bajaron'} un ${absPercentage}% respecto al mes pasado.`,
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
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.summary.balance')}</CardTitle>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
          <p className="text-xs text-muted-foreground">{t('dashboard.summary.remaining_funds')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.summary.total_income')}</CardTitle>
          <ArrowUp className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(income)}</div>
          <p className="text-xs text-muted-foreground">{getMonthName(selectedMonth)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.summary.total_expenses')}</CardTitle>
          <ArrowDown className="h-5 w-5 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(expense)}</div>
          <p className="text-xs text-muted-foreground">{getMonthName(selectedMonth)}</p>
        </CardContent>
      </Card>
      {dailyInsight && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insight Diario</CardTitle>
            {dailyInsight.isIncrease ? (
              <TrendingUp className="h-5 w-5 text-destructive" />
            ) : (
              <TrendingDown className="h-5 w-5 text-primary" />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {dailyInsight.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
