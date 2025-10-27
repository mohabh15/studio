'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { SavingsProjectionResult, formatCurrency } from '@/lib/savings-projections';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Target } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useIsMobile } from '@/hooks/use-mobile';

interface SavingsProjectionChartsProps {
  projections: SavingsProjectionResult[];
  targetAmount?: number;
  currentBalance?: number;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function SavingsProjectionCharts({
  projections,
  targetAmount,
  currentBalance = 0
}: SavingsProjectionChartsProps) {
  const { t } = useI18n();
  const isMobile = useIsMobile();

  // Datos para gráfico de crecimiento proyectado
  const growthChartData = useMemo(() => {
    if (projections.length === 0) return [];

    const maxYears = Math.max(...projections.map(p => p.monthlyData.length));
    const yearsToShow = isMobile ? Math.min(maxYears, 5) : maxYears;
    const data = [];

    for (let year = 1; year <= yearsToShow; year++) {
      const yearData: any = { year: `Año ${year}` };

      projections.forEach(projection => {
        const yearProjection = projection.monthlyData.find(d => d.year === year);
        if (yearProjection) {
          yearData[`${projection.strategy}_balance`] = yearProjection.balance;
          yearData[`${projection.strategy}_contributions`] = yearProjection.contributions;
          yearData[`${projection.strategy}_returns`] = yearProjection.returns;
        }
      });

      data.push(yearData);
    }

    return data;
  }, [projections, isMobile]);

  // Datos para gráfico de comparación de escenarios
  const scenarioComparisonData = useMemo(() => {
    return projections.map(projection => ({
      strategy: projection.strategy,
      futureValue: projection.futureValue,
      totalContributions: projection.totalContributions,
      totalReturns: projection.totalReturns,
      yearsToTarget: projection.yearsToTarget || 0,
    }));
  }, [projections]);

  // Datos para gráfico de composición (usando la primera proyección como ejemplo)
  const compositionData = useMemo(() => {
    if (projections.length === 0) return [];

    const projection = projections[0];
    return [
      { name: 'Aportaciones', value: projection.totalContributions, color: COLORS[0] },
      { name: 'Retornos', value: projection.totalReturns, color: COLORS[1] },
    ];
  }, [projections]);

  // Datos para gráfico de progreso hacia objetivo
  const progressData = useMemo(() => {
    if (!targetAmount || projections.length === 0) return 0;

    const progress = Math.min((currentBalance / targetAmount) * 100, 100);
    return Math.round(progress);
  }, [currentBalance, targetAmount]);

  const chartConfig = {
    balance: { label: 'Balance', color: 'hsl(var(--chart-1))' },
    contributions: { label: 'Aportaciones', color: 'hsl(var(--chart-2))' },
    returns: { label: 'Retornos', color: 'hsl(var(--chart-3))' },
    futureValue: { label: 'Valor Futuro', color: 'hsl(var(--chart-1))' },
    totalContributions: { label: 'Aportaciones Totales', color: 'hsl(var(--chart-2))' },
    totalReturns: { label: 'Retornos Totales', color: 'hsl(var(--chart-3))' },
  };

  if (projections.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t('savings_projection_charts.no_projections')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Gráfico de crecimiento proyectado */}
      <Card className="lg:col-span-2 glass-card depth-2 hover-lift interactive-scale glow-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('savings_projection_charts.projected_growth')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('savings_projection_charts.projected_growth_desc')}
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <ChartTooltip
                  content={<ChartTooltipContent
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      typeof name === 'string' && name.includes('balance') ? 'Balance' :
                      typeof name === 'string' && name.includes('contributions') ? 'Aportaciones' : 'Retornos'
                    ]}
                  />}
                />
                {!isMobile && <Legend />}
                {projections.map((projection, index) => (
                  <Line
                    key={`${projection.strategy}_balance`}
                    type="monotone"
                    dataKey={`${projection.strategy}_balance`}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    name={`${projection.strategy}`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico de comparación de escenarios */}
      <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('savings_projection_charts.scenario_comparison')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('savings_projection_charts.scenario_comparison_desc')}
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarioComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="strategy" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <ChartTooltip
                  content={<ChartTooltipContent
                    formatter={(value) => [formatCurrency(Number(value)), 'Valor Futuro']}
                  />}
                />
                <Bar dataKey="futureValue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico de composición */}
      <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            {t('savings_projection_charts.future_value_composition')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('savings_projection_charts.future_value_composition_desc')}
          </p>
        </CardHeader>
        <CardContent>
          <div className={isMobile ? "flex justify-center" : ""}>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent
                      formatter={(value) => [formatCurrency(Number(value)), '']}
                    />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de progreso hacia objetivo */}
      {targetAmount && (
        <Card className="lg:col-span-2 glass-card depth-2 hover-lift interactive-scale glow-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('savings_projection_charts.progress_to_target')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Avance hacia el monto objetivo de {formatCurrency(targetAmount)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Círculo de fondo */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Círculo de progreso */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${progressData * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{progressData}%</div>
                    <div className="text-sm text-muted-foreground">{t('savings_projection_charts.completed')}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Balance actual: {formatCurrency(currentBalance)} / Objetivo: {formatCurrency(targetAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}