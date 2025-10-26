'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, LineChart, Line, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Savings, EmergencyFund, FinancialFreedomGoal } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';

type SavingsChartsProps = {
  savings: Savings[];
  emergencyFund?: EmergencyFund;
  financialFreedomGoal?: FinancialFreedomGoal;
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

export default function SavingsCharts({ savings, emergencyFund, financialFreedomGoal }: SavingsChartsProps) {
  const { t } = useI18n();

  // Datos para gráfico de distribución por tipo
  const savingsTypeData = useMemo(() => {
    const typeMap = savings.reduce((acc, saving) => {
      const typeLabel = saving.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      acc[typeLabel] = (acc[typeLabel] || 0) + saving.monto_actual;
      return acc;
    }, {} as Record<string, number>);

    // Incluir fondo de emergencia si existe
    if (emergencyFund) {
      const emergencyLabel = 'Fondo de Emergencia';
      typeMap[emergencyLabel] = (typeMap[emergencyLabel] || 0) + emergencyFund.monto_actual;
    }

    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  }, [savings, emergencyFund]);

  // Datos para gráfico de progreso hacia objetivos
  const progressData = useMemo(() => {
    return savings
      .filter(saving => saving.monto_objetivo && saving.tipo !== 'emergency_fund')
      .map(saving => ({
        name: saving.nombre,
        actual: saving.monto_actual,
        objetivo: saving.monto_objetivo || 0,
        progreso: saving.monto_objetivo ? (saving.monto_actual / saving.monto_objetivo) * 100 : 0,
      }))
      .sort((a, b) => b.progreso - a.progreso)
      .slice(0, 8); // Top 8
  }, [savings]);

  // Datos para evolución de ahorros (simulado)
  const savingsEvolutionData = useMemo(() => {
    if (savings.length === 0 && !emergencyFund) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    let accumulatedAmount = 0;

    return months.map((month, index) => {
      // Simular crecimiento mensual promedio basado en ahorros actuales
      const monthlyGrowth = savings.reduce((sum, saving) => {
        return sum + (saving.monto_actual * 0.02); // 2% crecimiento mensual promedio
      }, 0);

      // Incluir crecimiento del fondo de emergencia
      const emergencyGrowth = emergencyFund ? emergencyFund.monto_actual * 0.02 : 0;

      accumulatedAmount += monthlyGrowth + emergencyGrowth;

      return {
        month,
        acumulado: Math.round(accumulatedAmount),
      };
    });
  }, [savings, emergencyFund]);

  // Datos para fondo de emergencia
  const emergencyFundData = useMemo(() => {
    if (!emergencyFund) return [];

    const mesesObjetivo = 3; // mínimo 3 meses
    const mesesActual = emergencyFund.meses_cobertura_actual;

    return [
      { name: 'Actual', meses: mesesActual, objetivo: mesesObjetivo },
      { name: 'Objetivo', meses: mesesObjetivo, objetivo: mesesObjetivo },
    ];
  }, [emergencyFund]);

  const chartConfig = {
    value: { label: 'Monto', color: 'hsl(var(--primary))' },
    actual: { label: 'Actual', color: 'hsl(var(--primary))' },
    objetivo: { label: 'Objetivo', color: 'hsl(var(--success))' },
    progreso: { label: 'Progreso %', color: 'hsl(var(--info))' },
    acumulado: { label: 'Acumulado', color: 'hsl(var(--primary))' },
    meses: { label: 'Meses', color: 'hsl(var(--primary))' },
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Gráfico de distribución por tipo */}
      <Card className="md:col-span-2 lg:col-span-1 glass-card depth-2 hover-lift interactive-scale glow-primary">
        <CardHeader>
          <CardTitle>Distribución por Tipo</CardTitle>
          <CardDescription>Composición de tus ahorros por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          {savingsTypeData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={savingsTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={30}
                    fill="hsl(var(--chart-1))"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {savingsTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[250px] w-full items-center justify-center rounded-md border-2 border-dashed">
              <p className="text-muted-foreground">No hay datos de ahorros</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de progreso hacia objetivos */}
      <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
        <CardHeader>
          <CardTitle>Progreso hacia Objetivos</CardTitle>
          <CardDescription>Avance en tus metas de ahorro</CardDescription>
        </CardHeader>
        <CardContent>
          {progressData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={progressData} margin={{ top: 20, right: 10, left: 10, bottom: 60 }}>
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
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="progreso" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[250px] w-full items-center justify-center rounded-md border-2 border-dashed">
              <p className="text-muted-foreground">No hay objetivos definidos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de evolución de ahorros */}
      <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
        <CardHeader>
          <CardTitle>Evolución de Ahorros</CardTitle>
          <CardDescription>Crecimiento acumulado mensual</CardDescription>
        </CardHeader>
        <CardContent>
          {savingsEvolutionData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={savingsEvolutionData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
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
                  <Area
                    type="monotone"
                    dataKey="acumulado"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[250px] w-full items-center justify-center rounded-md border-2 border-dashed">
              <p className="text-muted-foreground">No hay datos históricos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fondo de emergencia si existe */}
      {emergencyFund && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Fondo de Emergencia</CardTitle>
            <CardDescription>Cobertura de gastos mensuales</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={emergencyFundData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
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
                    tickFormatter={(value) => `${value} meses`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="meses"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}