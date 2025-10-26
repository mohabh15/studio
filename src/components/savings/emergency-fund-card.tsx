'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Edit } from 'lucide-react';
import { EmergencyFund } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';

type EmergencyFundCardProps = {
  emergencyFund?: EmergencyFund;
  monthlyExpenses?: number;
  onEdit?: () => void;
};

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} €`;
};

export default function EmergencyFundCard({ emergencyFund, monthlyExpenses, onEdit }: EmergencyFundCardProps) {
  const { t } = useI18n();

  const fundData = useMemo(() => {
    if (!emergencyFund || emergencyFund.monto_objetivo === 0 || emergencyFund.gastos_mensuales === 0) {
      return {
        currentAmount: emergencyFund?.monto_actual || 0,
        targetAmount: emergencyFund?.monto_objetivo || (monthlyExpenses ? monthlyExpenses * 3 : 0),
        monthsCoverage: emergencyFund?.meses_cobertura_actual || 0,
        progress: 0,
        status: 'no-fund' as const,
      };
    }

    const currentAmount = emergencyFund.monto_actual;
    const targetAmount = emergencyFund.monto_objetivo;
    const monthsCoverage = emergencyFund.gastos_mensuales > 0 ? currentAmount / emergencyFund.gastos_mensuales : 0;
    const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

    let status: 'no-fund' | 'insufficient' | 'minimum' | 'good' | 'excellent' = 'no-fund';
    if (monthsCoverage >= 6) {
      status = 'excellent';
    } else if (monthsCoverage >= 3) {
      status = 'good';
    } else if (monthsCoverage >= 1) {
      status = 'minimum';
    } else if (currentAmount > 0) {
      status = 'insufficient';
    }

    return {
      currentAmount,
      targetAmount,
      monthsCoverage,
      progress,
      status,
    };
  }, [emergencyFund, monthlyExpenses]);

  const getStatusInfo = () => {
    switch (fundData.status) {
      case 'excellent':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 border-green-200',
          text: 'Excelente cobertura',
          description: 'Tienes más de 6 meses cubiertos',
        };
      case 'good':
        return {
          icon: CheckCircle,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 border-blue-200',
          text: 'Buena cobertura',
          description: 'Tienes al menos 3 meses cubiertos',
        };
      case 'minimum':
        return {
          icon: TrendingUp,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 border-yellow-200',
          text: 'Cobertura mínima',
          description: 'Tienes al menos 1 mes cubierto',
        };
      case 'insufficient':
        return {
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 border-orange-200',
          text: 'Fondos insuficientes',
          description: 'Necesitas más ahorros para emergencias',
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 border-red-200',
          text: 'Sin fondo de emergencia',
          description: 'No tienes un fondo de emergencia configurado',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Fondo de Emergencia
          </CardTitle>
          <CardDescription>
            Protección financiera para imprevistos
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Editar fondo de emergencia"
            >
              <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          {fundData.status !== 'no-fund' && (
            <div className="p-2 rounded-lg bg-primary/20">
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fundData.status === 'no-fund' && (!emergencyFund || emergencyFund.monto_objetivo === 0 || emergencyFund.gastos_mensuales === 0) ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">
              {emergencyFund ? 'Configura tu monto objetivo y gastos mensuales' : 'No tienes un fondo de emergencia configurado'}
            </p>
            <Badge variant="outline" className="text-red-600 border-red-200">
              Acción requerida
            </Badge>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monto Actual</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(fundData.currentAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objetivo (3 meses)</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(fundData.targetAmount)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Progreso</p>
                <p className="text-sm font-medium">
                  {Math.round(fundData.progress)}%
                </p>
              </div>
              <Progress value={fundData.progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">Meses Cubiertos</p>
                <p className="text-xl font-bold">
                  {fundData.monthsCoverage.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant="outline" className={`${statusInfo.color} border-current`}>
                  {statusInfo.text}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              {statusInfo.description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}