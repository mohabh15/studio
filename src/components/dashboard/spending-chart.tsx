'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartTooltipContent } from '@/components/ui/chart';
import { type Transaction } from '@/lib/types';
import { CATEGORIES, findCategory } from '@/lib/constants';

type SpendingChartProps = {
  transactions: Transaction[];
};

export default function SpendingChart({ transactions }: SpendingChartProps) {
  const chartData = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const spendingByCategory = expenseTransactions.reduce((acc, t) => {
      const categoryName = findCategory(t.category)?.name || 'Other';
      acc[categoryName] = (acc[categoryName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(spendingByCategory)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Overview</CardTitle>
        <CardDescription>A breakdown of your expenses by category for this month.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
            No expense data to display.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
