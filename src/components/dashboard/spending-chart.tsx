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

  // Nueva paleta de colores usando variables del tema oscuro elegante
  const COLORS = [
    'hsl(var(--chart-1))', // Azul principal
    'hsl(var(--chart-2))', // Rosa/Magenta
    'hsl(var(--chart-3))', // Verde para positivos
    'hsl(var(--chart-4))', // Rojo para negativos
    'hsl(var(--chart-5))', // Gris neutro
    'hsl(var(--success))', // Verde esmeralda
    'hsl(var(--warning))', // Amarillo dorado
    'hsl(var(--error))', // Rojo coral
    'hsl(var(--info))', // Azul información
    'hsl(var(--accent))', // Rosa/Magenta vibrante
    'hsl(var(--primary))', // Azul brillante
    'hsl(var(--success))', // Verde esmeralda (complementario)
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
        <div className={`glass-effect border border-border/50 rounded-xl shadow-xl depth-2 ${
          isMobile ? 'p-3' : 'p-4'
        }`}>
          <p className={`font-semibold text-foreground mb-1 ${isMobile ? 'text-sm' : ''}`}>
            {data.payload.name}
          </p>
          <p className={`font-bold text-primary ${isMobile ? 'text-base' : 'text-lg'}`}>
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
        height: 320, // Ajustado para eliminar espacio vacío
        outerRadius: 70, // Reducido para dejar espacio a la leyenda
        innerRadius: 35,
        legendHeight: 100, // Ajustado para eliminar espacio vacío
        fontSize: 11, // Reducido ligeramente para que quepa mejor
        showLegend: true, // Siempre mostrar la leyenda
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
  }, [isMobile]);

  return (
    <Card className="glass-card depth-3 hover-lift">
      <CardHeader className="pb-4">
        <CardTitle className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'} bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`}>
          {t('dashboard.spending_overview.title')}
        </CardTitle>
        <CardDescription className={`${isMobile ? 'text-sm' : ''} text-muted-foreground/80`}>
          {t('dashboard.spending_overview.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "pt-1 -mt-1" : "pt-2"}>
        {chartData.length > 0 ? (
          <ChartContainer config={chartDataConfig} className={`w-full ${isMobile ? 'min-h-[350px]' : 'min-h-[400px]'} chart-container`}>
            <ResponsiveContainer width="100%" height={responsiveConfig.height}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy={isMobile ? "35%" : "48%"} // Movido hacia arriba para dejar espacio a la leyenda
                  outerRadius={responsiveConfig.outerRadius}
                  innerRadius={responsiveConfig.innerRadius}
                  fill="hsl(var(--chart-1))"
                  dataKey="total"
                  paddingAngle={3}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={isMobile ? { fontSize: '12px' } : {}}
                />
                {responsiveConfig.showLegend && (
                  <Legend
                    verticalAlign={isMobile ? "bottom" : "bottom"}
                    height={responsiveConfig.legendHeight}
                    wrapperStyle={{
                      paddingTop: isMobile ? '0px' : '8px',
                      paddingBottom: isMobile ? '0px' : '8px',
                      fontSize: responsiveConfig.fontSize
                    }}
                    formatter={(value, entry) => (
                      <span style={{
                        color: entry.color,
                        fontSize: responsiveConfig.fontSize,
                        maxWidth: isMobile ? '120px' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
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
          <div className={`flex w-full items-center justify-center rounded-xl border-2 border-dashed border-border/50 glass-effect ${
            isMobile ? 'h-[350px]' : 'h-[400px]'
          }`}>
            <div className="text-center">
              <p className={`text-muted-foreground/80 mb-2 ${isMobile ? 'text-sm' : ''}`}>
                {t('dashboard.spending_overview.no_data')}
              </p>
              <div className="text-4xl opacity-50">📊</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
