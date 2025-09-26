'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectionResult, getStrategyName, getStrategyDescription } from '@/lib/debt-projections';
import { CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface StrategyComparisonProps {
  projections: ProjectionResult[];
  recommendedStrategy?: string;
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

export default function StrategyComparison({ projections, recommendedStrategy }: StrategyComparisonProps) {
  if (projections.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No hay proyecciones disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const sortedProjections = [...projections].sort((a, b) => a.monthsToPayOff - b.monthsToPayOff);
  const bestTimeStrategy = sortedProjections[0];
  const bestSavingsStrategy = [...projections].sort((a, b) => a.totalPaid - b.totalPaid)[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Comparación de Estrategias
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compara diferentes enfoques para saldar tus deudas
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projections.map((projection) => {
            const isRecommended = recommendedStrategy === projection.strategy;
            const isBestTime = projection.strategy === bestTimeStrategy.strategy;
            const isBestSavings = projection.strategy === bestSavingsStrategy.strategy;

            return (
              <div
                key={projection.strategy}
                className={`border rounded-lg p-4 transition-colors ${
                  isRecommended ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{getStrategyName(projection.strategy)}</h4>
                      {isRecommended && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Recomendado
                        </Badge>
                      )}
                      {isBestTime && !isRecommended && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Más Rápido
                        </Badge>
                      )}
                      {isBestSavings && !isRecommended && (
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Menos Intereses
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getStrategyDescription(projection.strategy)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatMonths(projection.monthsToPayOff)}
                    </div>
                    <div className="text-xs text-muted-foreground">Tiempo Total</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(projection.totalPaid)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Pagado</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(projection.totalInterest)}
                    </div>
                    <div className="text-xs text-muted-foreground">Intereses</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(projection.monthlyPayment)}
                    </div>
                    <div className="text-xs text-muted-foreground">Pago Mensual</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    <strong>Fecha estimada de libertad financiera:</strong>{' '}
                    {projection.payoffDate.toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h5 className="font-semibold mb-2">💡 Recomendaciones</h5>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• La estrategia <strong>Avalancha</strong> minimiza los intereses totales pagados</li>
            <li>• La estrategia <strong>Bola de Nieve</strong> proporciona motivación psicológica</li>
            <li>• Considera tu situación financiera personal para elegir la mejor opción</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}