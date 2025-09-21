'use client';

import { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Transaction, Budget, Category } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/utils';

type BudgetStatusProps = {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BudgetStatus({ transactions, budgets, categories }: BudgetStatusProps) {
  const { t } = useI18n();
  const budgetData = useMemo(() => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const progress = (spent / budget.amount) * 100;
      const category = categories.find(c => c.id === budget.category);
      const Icon = category ? getIcon(category.icon as keyof typeof LucideIcons) : null;
      return {
        ...budget,
        spent,
        remaining,
        progress,
        categoryName: category?.name,
        Icon,
      };
    });
  }, [transactions, budgets, categories]);

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
                    {budget.Icon && <budget.Icon className="h-5 w-5 text-muted-foreground" />}
                    <span className="font-medium">{budget.categoryName}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </span>
                </div>
                <Progress value={budget.progress} aria-label={`${budget.categoryName} budget progress`} />
                <p className="text-xs text-muted-foreground text-right">
                  {formatCurrency(Math.abs(budget.remaining))}{' '}
                  {budget.remaining >= 0 ? t('dashboard.budget_status.left') : t('dashboard.budget_status.over')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] w-full items-center justify-center text-muted-foreground">
            {t('dashboard.budget_status.no_budgets')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
