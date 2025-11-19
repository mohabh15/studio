'use client';

import { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Transaction, Budget, Category, SurplusStrategy } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      const surplus = Math.max(0, remaining);
      const deficit = Math.max(0, spent - budget.amount);
      const progress = Math.min((spent / budget.amount) * 100, 100);
      const category = categories.find(c => c.id === budget.category);
      const Icon = category ? getIcon(category.icon as keyof typeof LucideIcons) : LucideIcons.Package;
      const strategy = budget.surplusStrategy || { type: 'ignore' };
      return {
        ...budget,
        spent,
        remaining,
        surplus,
        deficit,
        progress,
        categoryName: (() => {
          const stripped = category?.name.replace(/^categories\./, '') || '';
          const translated = t(`categories.${stripped}`);
          return translated === `categories.${stripped}` ? stripped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
        })(),
        Icon,
        strategy,
      };
    });
  }, [transactions, budgets, categories, selectedYear, selectedMonth, t]);

  return (
     <Card className="flex flex-col glass-card depth-3 hover-lift">
       <CardHeader className="pb-4">
         <CardTitle className="font-bold bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">
           {t('dashboard.budget_status.title')}
         </CardTitle>
         <CardDescription className="text-muted-foreground/80">
           {t('dashboard.budget_status.description')}
         </CardDescription>
       </CardHeader>
      <CardContent className="flex-1">
        {budgetData.length > 0 ? (
          <div className="grid gap-6">
            {budgetData.map(budget => {
              const isOverBudget = budget.progress > 100;
              const isNearLimit = budget.progress > 80 && budget.progress <= 100;
              return (
                <div key={budget.id} className={`group p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
                  isOverBudget
                    ? 'bg-error/10 border border-error/30 hover:bg-error/20'
                    : isNearLimit
                      ? 'bg-warning/10 border border-warning/30 hover:bg-warning/20'
                      : 'bg-muted/30 hover:bg-muted/50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-all duration-200 group-hover:scale-110 ${
                        isOverBudget
                          ? 'bg-error/20'
                          : isNearLimit
                            ? 'bg-warning/20'
                            : 'bg-primary/20'
                      }`}>
                        <budget.Icon className={`h-5 w-5 ${
                          isOverBudget
                            ? 'text-error'
                            : isNearLimit
                              ? 'text-warning'
                              : 'text-primary'
                        }`} />
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {budget.categoryName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${
                        isOverBudget
                          ? 'text-error'
                          : isNearLimit
                            ? 'text-warning'
                            : 'text-success'
                      }`}>
                        {formatCurrency(budget.spent)}
                      </span>
                      <p className="text-xs text-muted-foreground/80">
                        de {formatCurrency(budget.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <Progress
                      value={budget.progress}
                      aria-label={`${budget.categoryName} budget progress`}
                      className={`h-3 ${isOverBudget ? '[&>div]:bg-error' : isNearLimit ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <Badge
                      variant={isOverBudget ? 'error' : isNearLimit ? 'warning' : 'success'}
                      className="text-xs"
                    >
                      {budget.progress.toFixed(1)}% usado
                    </Badge>
                    <span className="text-muted-foreground/80 font-medium">
                      {t('dashboard.budget_status.budget_label')}: {formatCurrency(budget.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full min-h-[250px] w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/50 glass-effect">
            <div className="text-center">
              <p className="text-muted-foreground/80 mb-2">{t('dashboard.budget_status.no_budgets')}</p>
              <div className="text-4xl opacity-50 mb-4">💰</div>
            </div>
            <Button asChild variant="outline" size="sm" className="glass-effect hover-lift">
              <Link href="/budgets">{t('budgets_page.add_budget')}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
