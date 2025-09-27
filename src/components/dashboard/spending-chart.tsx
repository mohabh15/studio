'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { type Transaction, type Category } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { useState, useEffect } from 'react';

type SpendingChartProps = {
  transactions: Transaction[];
  categories: Category[];
  selectedYear: number;
  selectedMonth: number;
};

export default function SpendingChart({ transactions, categories, selectedYear, selectedMonth }: SpendingChartProps) {
  const { t } = useI18n();
  const [isMobile, setIsMobile] = useState(false);
  const findCategory = (id: string) => categories.find(c => c.id === id);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const chartData = useMemo(() => {
    const expenseTransactions = transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      const txDate = new Date(tx.date);
      return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
    });
    const spendingByCategory = expenseTransactions.reduce((acc, transaction) => {
      const category = findCategory(transaction.category);
      const categoryName = category ? (() => {
        const stripped = category.name.replace(/^categories\./, '');
        const translated = t(`categories.${stripped}`);
        return translated === `categories.${stripped}` ? stripped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
      })() : t('common.other');
      acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(spendingByCategory)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, categories, t, selectedYear, selectedMonth]);

  // Colores únicos y contrastantes para el pie chart
  const COLORS = [
    '#FF6B6B', // Rojo coral
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul cielo
    '#96CEB4', // Verde menta
    '#FFEAA7', // Amarillo crema
    '#DDA0DD', // Ciruela
    '#98D8C8', // Verde agua
    '#F7DC6F', // Amarillo mostaza
    '#BB8FCE', // Lavanda
    '#85C1E9', // Azul claro
    '#F8C471', // Naranja claro
    '#82E0AA', // Verde lima
  ];

  const chartDataConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    chartData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length],
      };
    });
    return config;
  }, [chartData]);

  const formatCurrency = (value: number) => {
    return `${new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)} €`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`bg-background border border-border rounded-lg shadow-lg ${
          isMobile ? 'p-2' : 'p-3'
        }`}>
          <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{data.payload.name}</p>
          <p className={`text-primary font-semibold ${isMobile ? 'text-sm' : ''}`}>
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Configuración responsive del gráfico
  const responsiveConfig = useMemo(() => {
    if (isMobile) {
      return {
        height: 250,
        outerRadius: 80,
        innerRadius: 40,
        legendHeight: 80,
        fontSize: 12,
        showLegend: chartData.length <= 6, // Mostrar legend solo si no hay muchas categorías
      };
    } else {
      return {
        height: 350,
        outerRadius: 150,
        innerRadius: 80,
        legendHeight: 60,
        fontSize: 14,
        showLegend: true,
      };
    }
  }, [isMobile, chartData.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>
          {t('dashboard.spending_overview.title')}
        </CardTitle>
        <CardDescription className={isMobile ? 'text-sm' : ''}>
          {t('dashboard.spending_overview.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartDataConfig} className={`w-full ${isMobile ? 'min-h-[200px]' : 'min-h-[350px]'}`}>
            <ResponsiveContainer width="100%" height={responsiveConfig.height}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy={isMobile ? "75%" : "48%"}
                  outerRadius={responsiveConfig.outerRadius}
                  innerRadius={responsiveConfig.innerRadius}
                  fill="#8884d8"
                  dataKey="total"
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={isMobile ? { fontSize: '12px' } : {}}
                />
                {responsiveConfig.showLegend && (
                  <Legend
                    verticalAlign="bottom"
                    height={responsiveConfig.legendHeight}
                    wrapperStyle={{
                      paddingTop: isMobile ? '70px' : '8px',
                      fontSize: responsiveConfig.fontSize
                    }}
                    formatter={(value, entry) => (
                      <span style={{
                        color: entry.color,
                        fontSize: responsiveConfig.fontSize,
                        maxWidth: isMobile ? '80px' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {value}
                      </span>
                    )}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className={`flex w-full items-center justify-center rounded-md border-2 border-dashed ${
            isMobile ? 'h-[200px]' : 'h-[400px]'
          }`}>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              {t('dashboard.spending_overview.no_data')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
