'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, AlertTriangle, CreditCard } from 'lucide-react';
import { Debt } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';

type DebtStatusProps = {
  debts: Debt[];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function DebtStatus({ debts }: DebtStatusProps) {
  const { t } = useI18n();

  const debtSummary = useMemo(() => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.monto_actual, 0);
    const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.pagos_minimos, 0);
    const averageInterestRate = debts.length > 0
      ? debts.reduce((sum, debt) => sum + debt.tasa_interes, 0) / debts.length
      : 0;

    // Próximos vencimientos (próximos 30 días)
    const upcomingPayments = debts.filter(debt => {
      const dueDate = new Date(debt.fecha_vencimiento);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      return dueDate >= today && dueDate <= thirtyDaysFromNow;
    });

    return {
      totalDebt,
      totalMinimumPayments,
      averageInterestRate,
      upcomingPayments: upcomingPayments.length,
      totalDebts: debts.length,
    };
  }, [debts]);

  if (debts.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Estado de Deudas</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">Sin deudas</div>
          <p className="text-xs text-muted-foreground mb-4">
            No tienes deudas registradas
          </p>
          <Link href="/debts">
            <Button size="sm" className="w-full">
              Gestionar Deudas
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Estado de Deudas</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{formatCurrency(debtSummary.totalDebt)}</div>
        <p className="text-xs text-muted-foreground mb-4">
          {debtSummary.totalDebts} deuda{debtSummary.totalDebts !== 1 ? 's' : ''} •
          Tasa promedio: {debtSummary.averageInterestRate.toFixed(1)}%
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Pagos mínimos mensuales
            </span>
            <span className="font-medium">{formatCurrency(debtSummary.totalMinimumPayments)}</span>
          </div>

          {debtSummary.upcomingPayments > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                Vencimientos próximos
              </span>
              <span className="font-medium text-amber-600">{debtSummary.upcomingPayments}</span>
            </div>
          )}
        </div>

        <Link href="/debts" className="mt-4 block">
          <Button size="sm" variant="outline" className="w-full">
            Ver Detalles
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}