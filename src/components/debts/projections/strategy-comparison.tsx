'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectionResult, getStrategyName, getStrategyDescription } from '@/lib/debt-projections';
import { CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

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
  const { t } = useI18n();
  if (projections.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t('strategy_comparison.no_projections')}</p>
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
          {t('strategy_comparison.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('strategy_comparison.description')}
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
                          {t('strategy_comparison.recommended')}
                        </Badge>
                      )}
                      {isBestTime && !isRecommended && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {t('strategy_comparison.fastest')}
                        </Badge>
                      )}
                      {isBestSavings && !isRecommended && (
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {t('strategy_comparison.least_interest')}
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
                    <div className="text-xs text-muted-foreground">{t('strategy_comparison.total_time')}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(projection.totalPaid)}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('strategy_comparison.total_paid')}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(projection.totalInterest)}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('strategy_comparison.interest')}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(projection.monthlyPayment)}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('strategy_comparison.monthly_payment')}</div>
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
          <h5 className="font-semibold mb-2">{t('strategy_comparison.recommendations_title')}</h5>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• {t('strategy_comparison.avalanche_benefit')}</li>
            <li>• {t('strategy_comparison.snowball_benefit')}</li>
            <li>• {t('strategy_comparison.personal_situation')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}