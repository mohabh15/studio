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
         height: 240, // Reducido para mejor ajuste
         outerRadius: 60, // Reducido para que quepa completamente
         innerRadius: 30, // Proporcional al outerRadius
         legendHeight: 70, // Mantiene espacio para leyenda
         fontSize: 11, // Legibilidad óptima
         showLegend: true,
         chartPadding: { top: 10, bottom: 10, left: 10, right: 10 },
       };
     } else {
       return {
         height: 280, // Reducido para mejor proporción
         outerRadius: 130, // Aumentado para mejor visibilidad en PC
         innerRadius: 65, // Proporcional al outerRadius
         legendHeight: 45, // Espacio adecuado para leyenda
         fontSize: 12, // Tamaño óptimo para desktop
         showLegend: true,
         chartPadding: { top: 15, bottom: 15, left: 15, right: 15 },
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
      <CardContent className={isMobile ? "p-2" : "p-3"}>
        {chartData.length > 0 ? (
          <ChartContainer config={chartDataConfig} className={`w-full ${isMobile ? 'min-h-[260px]' : 'min-h-[300px]'} chart-container`}>
            <ResponsiveContainer width="100%" height={responsiveConfig.height}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy={isMobile ? "40%" : "38%"} // Mejor centrado para ambos dispositivos
                  outerRadius={responsiveConfig.outerRadius}
                  innerRadius={responsiveConfig.innerRadius}
                  fill="hsl(var(--chart-1))"
                  dataKey="total"
                  paddingAngle={isMobile ? 2 : 3} // Espaciado optimizado por dispositivo
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
                    verticalAlign="bottom"
                    align={isMobile ? "center" : "center"}
                    height={responsiveConfig.legendHeight}
                    wrapperStyle={{
                      paddingTop: isMobile ? '16px' : '0px', // Ajustado para móvil: espacio equilibrado entre gráfico y leyenda
                      paddingBottom: isMobile ? '2px' : '4px',
                      fontSize: responsiveConfig.fontSize,
                      lineHeight: 1.3
                    }}
                    formatter={(value, entry) => (
                      <span style={{
                        color: entry.color,
                        fontSize: responsiveConfig.fontSize,
                        maxWidth: isMobile ? '100px' : '140px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        display: 'inline-block'
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
            isMobile ? 'h-[260px]' : 'h-[300px]'
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
