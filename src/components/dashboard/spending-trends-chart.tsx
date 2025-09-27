'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { type Transaction } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { formatMonthName } from '@/lib/utils';
import { useState, useEffect } from 'react';

type SpendingTrendsChartProps = {
  transactions: Transaction[];
};

export default function SpendingTrendsChart({ transactions }: SpendingTrendsChartProps) {
  const { t, locale } = useI18n();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: formatMonthName(date.getFullYear(), date.getMonth(), locale),
      });
    }

    return months.map(({ year, month, label }) => {
      const total = transactions
        .filter(tx => {
          if (tx.type !== 'expense') return false;
          const txDate = new Date(tx.date);
          return txDate.getFullYear() === year && txDate.getMonth() === month;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      return { month: label, total };
    });
  }, [transactions]);

  const chartDataConfig = {
    total: {
      label: t('dashboard.spending_trends.total'),
      color: '#FF6B6B',
    },
  };

  const formatCurrency = (value: number) => {
    return `${new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)} €`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`bg-background border border-border rounded-lg shadow-lg ${
          isMobile ? 'p-2' : 'p-3'
        }`}>
          <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{label}</p>
          <p className={`text-primary font-semibold ${isMobile ? 'text-sm' : ''}`}>
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>
          {t('dashboard.spending_trends.title')}
        </CardTitle>
        <CardDescription className={isMobile ? 'text-sm' : ''}>
          {t('dashboard.spending_trends.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.some(d => d.total > 0) ? (
          <ChartContainer config={chartDataConfig} className={`w-full ${isMobile ? 'min-h-[200px]' : 'min-h-[350px]'}`}>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: isMobile ? 12 : 14 }}
                  interval={0}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? 'end' : 'middle'}
                  height={isMobile ? 60 : 40}
                />
                <YAxis
                  tick={{ fontSize: isMobile ? 12 : 14 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#FF6B6B"
                  strokeWidth={2}
                  dot={{ fill: '#FF6B6B', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className={`flex w-full items-center justify-center rounded-md border-2 border-dashed ${
            isMobile ? 'h-[200px]' : 'h-[400px]'
          }`}>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              {t('dashboard.spending_trends.no_data')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}