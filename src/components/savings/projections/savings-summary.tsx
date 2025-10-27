'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Calculator, PiggyBank, DollarSign, Calendar } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useData } from '@/contexts/data-context';
import { formatCurrency } from '@/lib/savings-projections';
import SavingsProjectionCharts from './savings-projection-charts';
import EmergencyFundCard from '../emergency-fund-card';
import FinancialFreedomCard from '../financial-freedom-card';

export default function SavingsSummary() {
  const { t } = useI18n();
  const {
    savings,
    savingsContributions,
    emergencyFund,
    financialFreedomGoals,
    savingsLoading,
    savingsContributionsLoading,
    emergencyFundLoading,
    financialFreedomGoalsLoading,
  } = useData();

  // Calcular métricas clave del resumen
  const summaryMetrics = useMemo(() => {
    if (savingsLoading || savingsContributionsLoading) return null;

    // Ahorro total actual
    const totalCurrentSavings = savings.reduce((sum, saving) => sum + saving.monto_actual, 0) +
                               emergencyFund.reduce((sum, fund) => sum + fund.monto_actual, 0);

    // Aportaciones mensuales promedio
    const monthlyContributions = savingsContributions
      .filter(c => {
        const contributionDate = new Date(c.date);
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return contributionDate >= threeMonthsAgo;
      })
      .reduce((sum, contribution) => sum + contribution.amount, 0) / 3;

    // Monto objetivo total
    const totalTargetAmount = savings.reduce((sum, saving) => sum + (saving.monto_objetivo || 0), 0) +
                             emergencyFund.reduce((sum, fund) => sum + fund.monto_objetivo, 0) +
                             financialFreedomGoals.reduce((sum, goal) => sum + goal.patrimonio_objetivo, 0);

    // Progreso hacia objetivos
    const progress = totalTargetAmount > 0 ? (totalCurrentSavings / totalTargetAmount) * 100 : 0;

    // Tasa de retorno estimada (promedio simple basado en estrategias)
    const estimatedReturnRate = 0.06; // 6% promedio

    return {
      totalCurrentSavings,
      monthlyContributions: monthlyContributions || 0,
      estimatedReturnRate,
      progress: Math.min(progress, 100),
      totalTargetAmount,
    };
  }, [savings, savingsContributions, emergencyFund, financialFreedomGoals, savingsLoading, savingsContributionsLoading]);

  // Calcular proyecciones para el gráfico
  const projections = useMemo(() => {
    if (!summaryMetrics || summaryMetrics.monthlyContributions === 0) return [];

    // Crear proyecciones basadas en datos actuales
    const { calculateSavingsProjections } = require('@/lib/savings-projections');
    const strategies = ['conservative', 'moderate', 'aggressive'] as const;

    return strategies.map(strategy =>
      calculateSavingsProjections({
        initialAmount: summaryMetrics.totalCurrentSavings,
        monthlyContribution: summaryMetrics.monthlyContributions,
        years: 10,
        strategy,
        targetAmount: summaryMetrics.totalTargetAmount,
      })
    );
  }, [summaryMetrics]);

  // Obtener objetivos de ahorro activos
  const activeSavingsGoals = useMemo(() => {
    return savings.filter(saving => saving.monto_objetivo && saving.monto_actual < saving.monto_objetivo);
  }, [savings]);

  if (savingsLoading || savingsContributionsLoading || emergencyFundLoading || financialFreedomGoalsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summaryMetrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t('savings_summary.no_savings_data')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas clave del resumen */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('savings_summary.total_current_savings')}</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalCurrentSavings)}</div>
            <p className="text-xs text-muted-foreground">
              {summaryMetrics.progress.toFixed(1)}% del objetivo total
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('savings_summary.monthly_contributions')}</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summaryMetrics.monthlyContributions)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('savings_summary.last_three_months_avg')}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('savings_summary.estimated_return_rate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summaryMetrics.estimatedReturnRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {t('savings_summary.annual_avg_return')}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('savings_summary.overall_progress')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.progress.toFixed(1)}%</div>
            <Progress value={summaryMetrics.progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {t('savings_summary.towards_all_goals')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de fondo de emergencia y libertad financiera */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <EmergencyFundCard
          emergencyFund={emergencyFund[0]}
          monthlyExpenses={emergencyFund[0]?.gastos_mensuales || 0}
        />
        <FinancialFreedomCard
          goal={financialFreedomGoals[0]}
        />
      </div>

      {/* Gráfico de resumen usando SavingsProjectionCharts */}
      {projections.length > 0 && (
        <SavingsProjectionCharts
          projections={projections}
          targetAmount={summaryMetrics.totalTargetAmount}
          currentBalance={summaryMetrics.totalCurrentSavings}
        />
      )}

      {/* Información de objetivos de ahorro activos */}
      {activeSavingsGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('savings_summary.active_savings_goals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSavingsGoals.map((goal) => {
                const targetAmount = goal.monto_objetivo || 0;
                const progress = targetAmount > 0 ? (goal.monto_actual / targetAmount) * 100 : 0;
                const remaining = targetAmount - goal.monto_actual;
                const monthsToGoal = summaryMetrics.monthlyContributions > 0
                  ? Math.ceil(remaining / summaryMetrics.monthlyContributions)
                  : 0;

                return (
                  <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{goal.nombre}</h4>
                        <Badge variant="outline">{goal.tipo}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>{formatCurrency(goal.monto_actual)} / {formatCurrency(targetAmount)}</span>
                        <span>{progress.toFixed(1)}% completado</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-muted-foreground mb-1">{t('savings_summary.remaining')}</div>
                      <div className="font-medium">{formatCurrency(remaining)}</div>
                      {monthsToGoal > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {monthsToGoal} {t('savings_summary.months')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}