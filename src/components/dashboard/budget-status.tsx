'use client';

import { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Transaction, Budget, Category } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type BudgetStatusProps = {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  selectedYear: number;
  selectedMonth: number;
};

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)} €`;
};

export default function BudgetStatus({ transactions, budgets, categories, selectedYear, selectedMonth }: BudgetStatusProps) {
  const { t } = useI18n();
  const budgetData = useMemo(() => {
    const currentMonthTxs = transactions.filter(
      tx => new Date(tx.date).getMonth() === selectedMonth &&
            new Date(tx.date).getFullYear() === selectedYear &&
            tx.type === 'expense'
    );
    return budgets.map(budget => {
      const spent = currentMonthTxs
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const progress = Math.min((spent / budget.amount) * 100, 100);
      const category = categories.find(c => c.id === budget.category);
      const Icon = category ? getIcon(category.icon as keyof typeof LucideIcons) : LucideIcons.Package;
      return {
        ...budget,
        spent,
        remaining,
        progress,
        categoryName: (() => {
          const stripped = category?.name.replace(/^categories\./, '') || '';
          const translated = t(`categories.${stripped}`);
          return translated === `categories.${stripped}` ? stripped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
        })(),
        Icon,
      };
    });
  }, [transactions, budgets, categories, selectedYear, selectedMonth, t]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{t('dashboard.budget_status.title')}</CardTitle>
        <CardDescription>{t('dashboard.budget_status.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {budgetData.length > 0 ? (
          <div className="grid gap-6">
            {budgetData.map(budget => (
              <div key={budget.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <budget.Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{budget.categoryName}</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(budget.spent)}
                  </span>
                </div>
                <Progress value={budget.progress} aria-label={`${budget.categoryName} budget progress`} />
                <p className="text-xs text-muted-foreground text-right">
                  <span className="font-semibold">{formatCurrency(budget.amount)}</span> {t('dashboard.budget_status.budget_label')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed">
            <p className="text-center text-muted-foreground">{t('dashboard.budget_status.no_budgets')}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/budgets">{t('budgets_page.add_budget')}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
