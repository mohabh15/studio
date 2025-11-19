'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Transaction } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { useState, useEffect } from 'react';

type SpendingTrendsChartProps = {
  transactions: Transaction[];
};

export default function SpendingTrendsChart({ transactions }: SpendingTrendsChartProps) {
  const { t, locale } = useI18n();
  const [isMobile, setIsMobile] = useState(false);
  const [filter, setFilter] = useState<'month' | 'day'>('month');

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

    if (filter === 'month') {
      const months = [];

      // Generate last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          year: date.getFullYear(),
          month: date.getMonth(),
          label: `${date.getMonth() + 1}/${date.getFullYear()}`,
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
    } else {
      // Generate last 30 days
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        days.push({
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          label: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        });
      }

      return days.map(({ date, label }) => {
        const total = transactions
          .filter(tx => {
            if (tx.type !== 'expense') return false;
            const txDate = new Date(tx.date);
            return txDate.getFullYear() === date.getFullYear() &&
                   txDate.getMonth() === date.getMonth() &&
                   txDate.getDate() === date.getDate();
          })
          .reduce((sum, tx) => sum + tx.amount, 0);

        return { day: label, total };
      });
    }
  }, [transactions, filter, locale]);

  const chartDataConfig = {
    total: {
      label: t('dashboard.spending_trends.total'),
      color: 'hsl(var(--chart-1))',
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
        <div className={`glass-effect border border-border/50 rounded-xl shadow-xl depth-2 ${
          isMobile ? 'p-3' : 'p-4'
        }`}>
          <p className={`font-semibold text-foreground mb-1 ${isMobile ? 'text-sm' : ''}`}>
            {label}
          </p>
          <p className={`font-bold text-primary ${isMobile ? 'text-base' : 'text-lg'}`}>
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card depth-3 hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'} bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent`}>
              {t('dashboard.spending_trends.title')}
            </CardTitle>
            <CardDescription className={`${isMobile ? 'text-sm' : ''} text-muted-foreground/80`}>
              {filter === 'month' ? t('dashboard.spending_trends.description') : t('dashboard.spending_trends.day_description')}
            </CardDescription>
          </div>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as 'month' | 'day')}>
            <TabsList>
              <TabsTrigger value="month">{t('dashboard.spending_trends.month')}</TabsTrigger>
              <TabsTrigger value="day">{t('dashboard.spending_trends.day')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? "pt-1 -mt-2" : "pt-2"}>
        {chartData.some(d => d.total > 0) ? (
          <ChartContainer config={chartDataConfig} className={`w-full ${isMobile ? 'min-h-[250px]' : 'min-h-[400px]'} chart-container`}>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
              <LineChart data={chartData} margin={isMobile ? { top: 2, right: 30, left: 20, bottom: 5 } : { top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border)/0.3)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey={filter === 'month' ? 'month' : 'day'}
                  tick={{ fontSize: isMobile ? 11 : 12, fill: 'hsl(var(--muted-foreground))' }}
                  interval={filter === 'day' ? 1 : 0}
                  angle={filter === 'day' ? -75 : -60}
                  textAnchor={isMobile ? 'end' : 'end'}
                  height={80}
                  stroke="hsl(var(--border))"
                />
                <YAxis
                  tick={{ fontSize: isMobile ? 12 : 14, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCurrency}
                  stroke="hsl(var(--border))"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  dot={{
                    fill: 'hsl(var(--chart-1))',
                    strokeWidth: 2,
                    r: 4,
                    stroke: 'hsl(var(--background))'
                  }}
                  activeDot={{
                    r: 6,
                    fill: 'hsl(var(--primary))',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2
                  }}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className={`flex w-full items-center justify-center rounded-xl border-2 border-dashed border-border/50 glass-effect ${
            isMobile ? 'h-[250px]' : 'h-[400px]'
          }`}>
            <div className="text-center">
              <p className={`text-muted-foreground/80 mb-2 ${isMobile ? 'text-sm' : ''}`}>
                {t('dashboard.spending_trends.no_data')}
              </p>
              <div className="text-4xl opacity-50">📈</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}