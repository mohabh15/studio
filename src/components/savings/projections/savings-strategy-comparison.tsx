'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SavingsProjectionResult, SAVINGS_STRATEGIES, SavingsStrategy, formatCurrency } from '@/lib/savings-projections';
import { CheckCircle, Clock, DollarSign, TrendingUp, Target } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

interface SavingsStrategyComparisonProps {
  projections: SavingsProjectionResult[];
  recommendedStrategy?: SavingsStrategy;
  targetAmount?: number;
}

const formatYears = (years: number) => {
  if (years < 1) {
    const months = Math.round(years * 12);
    return `${months} mes${months > 1 ? 'es' : ''}`;
  } else if (years === 1) {
    return '1 año';
  } else {
    return `${Math.floor(years)} años`;
  }
};

export default function SavingsStrategyComparison({
  projections,
  recommendedStrategy,
  targetAmount
}: SavingsStrategyComparisonProps) {
  const { t } = useI18n();

  if (projections.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t('savings_strategy_comparison.no_projections')}</p>
        </CardContent>
      </Card>
    );
  }

  // Identificar estrategias más rentable (mayor valor futuro), más rápida (menor tiempo para objetivo) y recomendada
  const bestProfitableStrategy = projections.reduce((best, current) =>
    current.futureValue > best.futureValue ? current : best
  );

  const bestFastStrategy = projections.reduce((best, current) => {
    if (!current.yearsToTarget && !best.yearsToTarget) return best;
    if (!current.yearsToTarget) return best;
    if (!best.yearsToTarget) return current;
    return current.yearsToTarget < best.yearsToTarget ? current : best;
  });

  return (
    <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('savings_strategy_comparison.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('savings_strategy_comparison.description')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projections.map((projection) => {
            const strategy = projection.strategy;
            const isRecommended = recommendedStrategy === strategy;
            const isBestProfitable = projection.strategy === bestProfitableStrategy.strategy;
            const isBestFast = projection.strategy === bestFastStrategy.strategy;

            return (
              <div
                key={strategy}
                className={`border rounded-lg p-4 transition-colors ${
                  isRecommended ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{SAVINGS_STRATEGIES[strategy].label}</h4>
                      {isRecommended && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('savings_strategy_comparison.recommended')}
                        </Badge>
                      )}
                      {isBestProfitable && !isRecommended && (
                        <Badge variant="secondary" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {t('savings_strategy_comparison.most_profitable')}
                        </Badge>
                      )}
                      {isBestFast && !isRecommended && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {t('savings_strategy_comparison.fastest')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tasa de retorno: {(SAVINGS_STRATEGIES[strategy].rate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(projection.futureValue)}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('savings_strategy_comparison.future_value')}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(projection.totalContributions)}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('savings_strategy_comparison.total_contributions')}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(projection.totalReturns)}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('savings_strategy_comparison.total_returns')}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {projection.yearsToTarget ? formatYears(projection.yearsToTarget) : 'No alcanzado'}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('savings_strategy_comparison.time_to_target')}</div>
                  </div>
                </div>

                {targetAmount && (
                  <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-muted-foreground">
                        <strong>{t('savings_strategy_comparison.target')}:</strong> {formatCurrency(targetAmount)}
                      </div>
                    </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h5 className="font-semibold mb-2">{t('savings_strategy_comparison.recommendations_title')}</h5>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• {t('savings_strategy_comparison.conservative_benefit')}</li>
            <li>• {t('savings_strategy_comparison.moderate_benefit')}</li>
            <li>• {t('savings_strategy_comparison.aggressive_benefit')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}