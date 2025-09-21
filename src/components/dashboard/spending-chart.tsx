'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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
    const spendingByCategory = expenseTransactions.reduce((acc, tx) => {
      const categoryName = findCategory(tx.category)?.name || t('common.other');
      acc[categoryName] = (acc[categoryName] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(spendingByCategory)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, categories, t]);

  const chartConfig = {
    total: {
      label: t('common.total'),
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
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <ChartTooltip 
                  cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
            {t('dashboard.spending_overview.no_data')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
