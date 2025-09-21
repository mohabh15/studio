'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { type Transaction, type Category } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';

type SpendingChartProps = {
  transactions: Transaction[];
  categories: Category[];
};

export default function SpendingChart({ transactions, categories }: SpendingChartProps) {
  const { t } = useI18n();
  const findCategory = (id: string) => categories.find(c => c.id === id);

  const chartData = useMemo(() => {
    const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
    const spendingByCategory = expenseTransactions.reduce((acc, transaction) => {
      const categoryName = findCategory(transaction.category)?.name || t('common.other');
      acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(spendingByCategory)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, categories, t]);

  const chartConfig = {
    total: {
      label: t('common.total'),
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.spending_overview.title')}</CardTitle>
        <CardDescription>{t('dashboard.spending_overview.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--primary))', opacity: 0.1 }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] w-full items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">{t('dashboard.spending_overview.no_data')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
