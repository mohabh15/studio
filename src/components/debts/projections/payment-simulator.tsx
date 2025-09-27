'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Debt } from '@/lib/types';
import { calculateDebtProjections, PaymentStrategy, ProjectionResult } from '@/lib/debt-projections';
import { Calculator, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

interface PaymentSimulatorProps {
  debts: Debt[];
}

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)} €`;
};

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

export default function PaymentSimulator({ debts }: PaymentSimulatorProps) {
  const { t } = useI18n();
  const [extraPayment, setExtraPayment] = useState<number>(0);
  const [selectedStrategy, setSelectedStrategy] = useState<PaymentStrategy>('avalanche');

  const projections = useMemo(() => {
    if (debts.length === 0) return [];
    return calculateDebtProjections({ debts, extraPayment, strategy: selectedStrategy });
  }, [debts, extraPayment, selectedStrategy]);

  const currentProjection = projections[0];

  // Calcular el ahorro comparado con pagos mínimos
  const baseProjection = useMemo(() => {
    if (debts.length === 0) return null;
    return calculateDebtProjections({ debts, extraPayment: 0, strategy: selectedStrategy })[0];
  }, [debts, selectedStrategy]);

  const savings = useMemo(() => {
    if (!currentProjection || !baseProjection) return null;

    return {
      timeSaved: baseProjection.monthsToPayOff - currentProjection.monthsToPayOff,
      interestSaved: baseProjection.totalInterest - currentProjection.totalInterest,
      totalSaved: baseProjection.totalPaid - currentProjection.totalPaid,
    };
  }, [currentProjection, baseProjection]);

  const strategies: { value: PaymentStrategy; label: string; description: string }[] = [
    {
      value: 'avalanche',
      label: 'Avalancha',
      description: 'Mayor interés primero'
    },
    {
      value: 'snowball',
      label: 'Bola de Nieve',
      description: 'Menor monto primero'
    },
    {
      value: 'combined',
      label: 'Combinada',
      description: 'Balance optimizado'
    },
  ];

  if (debts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t('payment_simulator.no_debts_to_simulate')}</p>
        </CardContent>
      </Card>
    );
  }

  const minPayments = debts.reduce((sum, debt) => sum + debt.pagos_minimos, 0);
  const maxExtraPayment = Math.max(5000, minPayments * 2); // Máximo razonable

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {t('payment_simulator.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('payment_simulator.description')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controles del Simulador */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">
              {`Pago Extra Mensual: ${formatCurrency(extraPayment)}`}
            </Label>
            <Slider
              value={[extraPayment]}
              onValueChange={(value) => setExtraPayment(value[0])}
              max={maxExtraPayment}
              step={50}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 €</span>
              <span>{formatCurrency(maxExtraPayment)}</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">{t('payment_simulator.payment_strategy')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {strategies.map((strategy) => (
                <Button
                  key={strategy.value}
                  variant={selectedStrategy === strategy.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStrategy(strategy.value)}
                  className="flex flex-col h-auto py-3"
                >
                  <span className="font-medium">{strategy.label}</span>
                  <span className="text-xs opacity-75">{strategy.description}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Resultados de la Simulación */}
        {currentProjection && (
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('payment_simulator.simulation_results')}
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold text-primary">
                  {formatMonths(currentProjection.monthsToPayOff)}
                </div>
                <div className="text-xs text-muted-foreground">{t('payment_simulator.total_time')}</div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(currentProjection.totalPaid)}
                </div>
                <div className="text-xs text-muted-foreground">{t('payment_simulator.total_paid')}</div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {formatCurrency(currentProjection.totalInterest)}
                </div>
                <div className="text-xs text-muted-foreground">{t('payment_simulator.interest')}</div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold">
                  {formatCurrency(currentProjection.monthlyPayment)}
                </div>
                <div className="text-xs text-muted-foreground">{t('payment_simulator.monthly_payment')}</div>
              </div>
            </div>

            {/* Ahorro Comparado */}
            {savings && (savings.timeSaved > 0 || savings.interestSaved > 0) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('payment_simulator.savings_vs_minimum')}
                </h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-green-700">
                      {savings.timeSaved} meses
                    </div>
                    <div className="text-green-600">{t('payment_simulator.time_saved')}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-700">
                      {formatCurrency(savings.interestSaved)}
                    </div>
                    <div className="text-green-600">{t('payment_simulator.interest_saved')}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-700">
                      {formatCurrency(savings.totalSaved)}
                    </div>
                    <div className="text-green-600">{t('payment_simulator.total_saved')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Información Adicional */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-800">{t('payment_simulator.freedom_date')}</div>
                  <div className="text-blue-700">
                    {currentProjection.payoffDate.toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consejos */}
         <div className="border-t pt-4">
           <h5 className="font-medium mb-2">{t('payment_simulator.tips_title')}</h5>
           <ul className="text-sm space-y-1 text-muted-foreground">
             <li>• {t('payment_simulator.tips.increase_payments')}</li>
             <li>• {t('payment_simulator.tips.additional_income')}</li>
             <li>• {t('payment_simulator.tips.review_expenses')}</li>
             <li>• {t('payment_simulator.tips.consistency')}</li>
           </ul>
         </div>
      </CardContent>
    </Card>
  );
}