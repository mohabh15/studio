'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Transaction, Budget } from '@/lib/types';
import { findCategory } from '@/lib/constants';

type BudgetStatusProps = {
  transactions: Transaction[];
  budgets: Budget[];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BudgetStatus({ transactions, budgets }: BudgetStatusProps) {
  const budgetData = useMemo(() => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const progress = (spent / budget.amount) * 100;
      const category = findCategory(budget.category);
      return {
        ...budget,
        spent,
        remaining,
        progress,
        categoryName: category?.name,
        Icon: category?.icon,
      };
    });
  }, [transactions, budgets]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Budget Status</CardTitle>
        <CardDescription>How you're tracking against your budgets this month.</CardDescription>
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
                  {formatCurrency(Math.abs(budget.remaining))} {budget.remaining >= 0 ? 'left' : 'over'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] w-full items-center justify-center text-muted-foreground">
            No budgets set.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
