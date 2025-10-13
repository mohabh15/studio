'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, DollarSign, Calendar, CheckCircle, Clock, Pause } from 'lucide-react';
import { FinancialFreedomGoal } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';

type FinancialFreedomCardProps = {
  goal?: FinancialFreedomGoal;
};

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} €`;
};

export default function FinancialFreedomCard({ goal }: FinancialFreedomCardProps) {
  const { t } = useI18n();

  const goalData = useMemo(() => {
    if (!goal) {
      return {
        currentAssets: 0,
        targetAssets: 0,
        currentPassiveIncome: 0,
        targetPassiveIncome: 0,
        progress: 0,
        monthsUntilTarget: 0,
        status: 'no-goal' as const,
      };
    }

    const currentAssets = goal.patrimonio_actual;
    const targetAssets = goal.patrimonio_objetivo;
    const currentPassiveIncome = 0; // Esto debería calcularse basado en inversiones actuales
    const targetPassiveIncome = goal.ingresos_pasivos_objetivo;
    const progress = targetAssets > 0 ? (currentAssets / targetAssets) * 100 : 0;

    // Calcular meses hasta el objetivo (estimación simple)
    const monthlySavings = 500; // Esto debería venir de datos reales
    const remainingAssets = targetAssets - currentAssets;
    const monthsUntilTarget = remainingAssets > 0 ? Math.ceil(remainingAssets / monthlySavings) : 0;

    let status: 'no-goal' | 'on-track' | 'achieved' | 'behind' | 'paused' = 'no-goal';
    if (goal.status === 'achieved') {
      status = 'achieved';
    } else if (goal.status === 'paused') {
      status = 'paused';
    } else if (progress >= 100) {
      status = 'achieved';
    } else if (monthsUntilTarget <= 12) {
      status = 'on-track';
    } else {
      status = 'behind';
    }

    return {
      currentAssets,
      targetAssets,
      currentPassiveIncome,
      targetPassiveIncome,
      progress,
      monthsUntilTarget,
      status,
    };
  }, [goal]);

  const getStatusInfo = () => {
    switch (goalData.status) {
      case 'achieved':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 border-green-200',
          text: '¡Objetivo Alcanzado!',
          description: 'Has logrado tu libertad financiera',
        };
      case 'on-track':
        return {
          icon: TrendingUp,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 border-blue-200',
          text: 'En camino',
          description: 'Vas por buen camino hacia tu objetivo',
        };
      case 'behind':
        return {
          icon: Clock,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 border-orange-200',
          text: 'Necesita atención',
          description: 'Considera ajustar tu estrategia',
        };
      case 'paused':
        return {
          icon: Pause,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 border-gray-200',
          text: 'Pausado',
          description: 'Objetivo temporalmente pausado',
        };
      default:
        return {
          icon: Target,
          color: 'text-red-500',
          bgColor: 'bg-red-50 border-red-200',
          text: 'Sin objetivo definido',
          description: 'Define tu objetivo de libertad financiera',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={`transition-all duration-300 ${statusInfo.bgColor}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Libertad Financiera
          </CardTitle>
          <CardDescription>
            Tu camino hacia la independencia económica
          </CardDescription>
        </div>
        <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goalData.status === 'no-goal' ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">
              No tienes un objetivo de libertad financiera definido
            </p>
            <Badge variant="outline" className="text-red-600 border-red-200">
              Acción requerida
            </Badge>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Patrimonio Actual</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(goalData.currentAssets)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objetivo</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(goalData.targetAssets)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Progreso</p>
                <p className="text-sm font-medium">
                  {Math.round(goalData.progress)}%
                </p>
              </div>
              <Progress value={goalData.progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Pasivos Objetivo</p>
                <p className="text-xl font-bold flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(goalData.targetPassiveIncome)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant="outline" className={`${statusInfo.color} border-current`}>
                  {statusInfo.text}
                </Badge>
              </div>
            </div>

            {goalData.status !== 'achieved' && goalData.status !== 'paused' && (
              <div className="pt-2 border-t border-border/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {goalData.monthsUntilTarget > 0
                      ? `Aproximadamente ${goalData.monthsUntilTarget} meses restantes`
                      : '¡Ya puedes alcanzar tu objetivo!'
                    }
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground pt-2">
              {statusInfo.description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}