'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Debt } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';

type DebtChartsProps = {
  debts: Debt[];
};

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
  'hsl(var(--destructive))', // Rojo para negativos
];

const formatCurrency = (value: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} €`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-primary font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function DebtCharts({ debts }: DebtChartsProps) {
  const { t } = useI18n();
  // Datos para gráfico de distribución por tipo
  const debtTypeData = useMemo(() => {
    const typeMap = debts.reduce((acc, debt) => {
      const typeLabel = debt.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      acc[typeLabel] = (acc[typeLabel] || 0) + debt.monto_actual;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  }, [debts]);

  // Datos para gráfico de pagos mínimos
  const minimumPaymentsData = useMemo(() => {
    return debts
      .map(debt => ({
        name: debt.descripcion || debt.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        minimum: debt.pagos_minimos,
      }))
      .sort((a, b) => b.minimum - a.minimum)
      .slice(0, 8); // Top 8
  }, [debts]);

  // Datos para evolución de intereses (simulado)
  const interestEvolutionData = useMemo(() => {
    if (debts.length === 0) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return months.map((month, index) => {
      const totalInterest = debts.reduce((sum, debt) => {
        // Simular acumulación de intereses
        return sum + (debt.monto_actual * debt.tasa_interes / 100 * (index + 1) / 12);
      }, 0);

      return {
        month,
        intereses: Math.round(totalInterest),
      };
    });
  }, [debts]);

  const chartConfig = {
    value: { label: 'Monto', color: 'hsl(var(--primary))' },
    minimum: { label: 'Pago Mínimo', color: 'hsl(var(--primary))' },
    intereses: { label: 'Intereses', color: 'hsl(var(--destructive))' },
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Gráfico de distribución por tipo */}
      <Card className="md:col-span-2 lg:col-span-1 glass-card depth-2 hover-lift interactive-scale glow-primary">
        <CardHeader>
          <CardTitle>{t('debt_charts.distribution_by_type')}</CardTitle>
          <CardDescription>{t('debt_charts.distribution_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {debtTypeData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={debtTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={30}
                    fill="hsl(var(--chart-1))"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {debtTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[250px] w-full items-center justify-center rounded-md border-2 border-dashed">
              <p className="text-muted-foreground">{t('debt_charts.no_data')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de pagos mínimos */}
      <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
        <CardHeader>
          <CardTitle>{t('debt_charts.minimum_payments_chart')}</CardTitle>
          <CardDescription>{t('debt_charts.minimum_payments_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {minimumPaymentsData.length > 0 ? (
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={minimumPaymentsData} margin={{ top: 20, right: 10, left: 10, bottom: 60 }}>
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="minimum" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] w-full items-center justify-center rounded-md border-2 border-dashed">
              <p className="text-muted-foreground">{t('debt_charts.no_data')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de evolución de intereses */}
      <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
        <CardHeader>
          <CardTitle>{t('debt_charts.interest_evolution')}</CardTitle>
          <CardDescription>{t('debt_charts.interest_evolution_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {interestEvolutionData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={interestEvolutionData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="intereses"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] w-full items-center justify-center rounded-md border-2 border-dashed">
              <p className="text-muted-foreground">{t('debt_charts.no_data')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}