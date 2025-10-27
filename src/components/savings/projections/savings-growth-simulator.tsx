'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { calculateSavingsProjections, SAVINGS_STRATEGIES, SavingsStrategy, formatCurrency } from '@/lib/savings-projections';
import { Calculator, TrendingUp, Clock, DollarSign, Target, Lightbulb } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

const formatMonths = (months: number) => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} meses`;
  } else if (remainingMonths === 0) {
    return `${years} año${years > 1 ? 's' : ''}`;
  } else {
    return `${years} año${years > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
  }
};

export default function SavingsGrowthSimulator() {
  const { t } = useI18n();
  const [monthlyContribution, setMonthlyContribution] = useState<number>(200);
  const [annualReturnRate, setAnnualReturnRate] = useState<number>(6);
  const [timeHorizon, setTimeHorizon] = useState<number>(10);
  const [selectedStrategy, setSelectedStrategy] = useState<SavingsStrategy>('moderate');
  const [initialAmount, setInitialAmount] = useState<number>(1000);
  const [targetAmount, setTargetAmount] = useState<number>(50000);

  const projection = useMemo(() => {
    return calculateSavingsProjections({
      initialAmount,
      monthlyContribution,
      years: timeHorizon,
      strategy: selectedStrategy,
      targetAmount: targetAmount > 0 ? targetAmount : undefined,
    });
  }, [initialAmount, monthlyContribution, timeHorizon, selectedStrategy, targetAmount]);

  const chartData = useMemo(() => {
    return projection.monthlyData.map(data => ({
      year: data.year,
      balance: data.balance,
      contributions: data.contributions,
      returns: data.returns,
    }));
  }, [projection]);

  const strategies: { value: SavingsStrategy; label: string; description: string; rate: number }[] = [
    {
      value: 'conservative',
      label: 'Conservadora',
      description: 'Bajo riesgo',
      rate: SAVINGS_STRATEGIES.conservative.rate * 100,
    },
    {
      value: 'moderate',
      label: 'Moderada',
      description: 'Balance riesgo/retorno',
      rate: SAVINGS_STRATEGIES.moderate.rate * 100,
    },
    {
      value: 'aggressive',
      label: 'Agresiva',
      description: 'Alto riesgo/retorno',
      rate: SAVINGS_STRATEGIES.aggressive.rate * 100,
    },
  ];

  const tips = [
    'Aumenta tus aportaciones mensuales para acelerar el crecimiento.',
    'El interés compuesto es tu mejor aliado a largo plazo.',
    'Diversifica tus inversiones para reducir riesgos.',
    'Revisa y ajusta tu estrategia periódicamente.',
    'Considera automatizar tus aportaciones para mantener la consistencia.',
  ];

  const chartConfig = {
    balance: {
      label: 'Valor Futuro',
      color: 'hsl(var(--chart-1))',
    },
    contributions: {
      label: 'Aportaciones',
      color: 'hsl(var(--chart-2))',
    },
    returns: {
      label: 'Retornos',
      color: 'hsl(var(--chart-3))',
    },
  };

  return (
    <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {t('savings_growth_simulator.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('savings_growth_simulator.description')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controles del Simulador */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">
              {t('savings_growth_simulator.initial_amount')}: {formatCurrency(initialAmount)}
            </Label>
            <Slider
              value={[initialAmount]}
              onValueChange={(value) => setInitialAmount(value[0])}
              max={100000}
              min={0}
              step={500}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 €</span>
              <span>100.000 €</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">
              {t('savings_growth_simulator.monthly_contribution')}: {formatCurrency(monthlyContribution)}
            </Label>
            <Slider
              value={[monthlyContribution]}
              onValueChange={(value) => setMonthlyContribution(value[0])}
              max={5000}
              min={0}
              step={50}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 €</span>
              <span>5.000 €</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">
              {t('savings_growth_simulator.annual_return_rate')}: {annualReturnRate.toFixed(1)}%
            </Label>
            <Slider
              value={[annualReturnRate]}
              onValueChange={(value) => setAnnualReturnRate(value[0])}
              max={15}
              min={0}
              step={0.1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">
              {t('savings_growth_simulator.time_horizon')}: {timeHorizon} años
            </Label>
            <Slider
              value={[timeHorizon]}
              onValueChange={(value) => setTimeHorizon(value[0])}
              max={50}
              min={1}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 año</span>
              <span>50 años</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">
              {t('savings_growth_simulator.target_amount')}: {formatCurrency(targetAmount)}
            </Label>
            <Slider
              value={[targetAmount]}
              onValueChange={(value) => setTargetAmount(value[0])}
              max={1000000}
              min={0}
              step={1000}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Sin objetivo</span>
              <span>1.000.000 €</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">{t('savings_growth_simulator.savings_strategy')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {strategies.map((strategy) => (
                <Button
                  key={strategy.value}
                  variant={selectedStrategy === strategy.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStrategy(strategy.value)}
                  className="flex flex-col h-auto py-3"
                >
                  <span className="font-medium">{t(`savings_growth_simulator.${strategy.value}`)}</span>
                  <span className="text-xs opacity-75">{t(`savings_growth_simulator.${strategy.value}_desc`)}</span>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {strategy.rate.toFixed(1)}%
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Resultados de la Simulación */}
        {projection && (
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('savings_growth_simulator.projection_results')}
            </h4>

            <div className="grid gap-4 mb-4 grid-cols-2 md:grid-cols-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(projection.futureValue)}
                </div>
                <div className="text-xs text-muted-foreground">{t('savings_growth_simulator.future_value')}</div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(projection.totalContributions)}
                </div>
                <div className="text-xs text-muted-foreground">{t('savings_growth_simulator.total_contributions')}</div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(projection.totalReturns)}
                </div>
                <div className="text-xs text-muted-foreground">{t('savings_growth_simulator.total_returns')}</div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold">
                  {projection.yearsToTarget ? `${projection.yearsToTarget} años` : 'No alcanzado'}
                </div>
                <div className="text-xs text-muted-foreground">{t('savings_growth_simulator.time_to_target')}</div>
              </div>
            </div>

            {/* Gráfico de Crecimiento */}
            <div className="mb-6">
              <h5 className="font-medium mb-3">{t('savings_growth_simulator.growth_projection')}</h5>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    tickFormatter={(value) => `Año ${value}`}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === 'balance' ? 'Valor Futuro' :
                        name === 'contributions' ? 'Aportaciones' : 'Retornos'
                      ]}
                    />}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--color-balance)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="contributions"
                    stroke="var(--color-contributions)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            {/* Consejos y Recomendaciones */}
            <div className="border-t pt-4">
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                {t('savings_growth_simulator.tips_title')}
              </h5>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• {t('savings_growth_simulator.tips.increase_contributions')}</li>
                <li>• {t('savings_growth_simulator.tips.compound_interest')}</li>
                <li>• {t('savings_growth_simulator.tips.diversify')}</li>
                <li>• {t('savings_growth_simulator.tips.review_strategy')}</li>
                <li>• {t('savings_growth_simulator.tips.automate')}</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}