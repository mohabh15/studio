'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, DollarSign, AlertTriangle, CreditCard } from 'lucide-react';
import { Debt } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { useFirestoreDebtPayments } from '@/hooks/use-firestore';

type DebtStatusProps = {
  debts: Debt[];
  userId: string;
};

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} €`;
};

export default function DebtStatus({ debts, userId }: DebtStatusProps) {
  const { t } = useI18n();
  const { debtPayments } = useFirestoreDebtPayments(userId);

  const debtSummary = useMemo(() => {
    // Separar deudas outgoing e incoming
    const outgoingDebts = debts.filter(debt => debt.direction !== 'incoming');
    const incomingDebts = debts.filter(debt => debt.direction === 'incoming');

    // Summary para outgoing
    const totalCurrentDebtOutgoing = outgoingDebts.reduce((sum, debt) => sum + debt.monto_actual, 0);
    const totalOriginalDebtOutgoing = outgoingDebts.reduce((sum, debt) => sum + debt.monto, 0);
    const totalMinimumPaymentsOutgoing = outgoingDebts.reduce((sum, debt) => sum + debt.pagos_minimos, 0);
    const averageInterestRateOutgoing = outgoingDebts.length > 0
      ? outgoingDebts.reduce((sum, debt) => sum + debt.tasa_interes, 0) / outgoingDebts.length
      : 0;
    const totalPaidOutgoing = debtPayments.filter(payment => payment.tipo !== 'collection' && outgoingDebts.some(debt => debt.id === payment.debt_id)).reduce((sum, payment) => sum + payment.amount, 0);
    const progressOutgoing = totalOriginalDebtOutgoing > 0 ? ((totalOriginalDebtOutgoing - totalCurrentDebtOutgoing) / totalOriginalDebtOutgoing) * 100 : 0;
    const upcomingPaymentsOutgoing = outgoingDebts.filter(debt => {
      const dueDate = new Date(debt.fecha_vencimiento);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      return dueDate >= today && dueDate <= thirtyDaysFromNow;
    }).length;

    // Summary para incoming
    const totalPorCobrar = incomingDebts.reduce((sum, debt) => sum + debt.monto_actual, 0);
    const totalCobrado = debtPayments.filter(payment => payment.tipo === 'collection' && incomingDebts.some(debt => debt.id === payment.debt_id)).reduce((sum, payment) => sum + payment.amount, 0);
    const progressIncoming = totalPorCobrar > 0 ? (totalCobrado / totalPorCobrar) * 100 : 0;
    const upcomingCobros = incomingDebts.filter(debt => {
      const dueDate = new Date(debt.fecha_vencimiento);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      return dueDate >= today && dueDate <= thirtyDaysFromNow;
    }).length;

    return {
      outgoing: {
        totalCurrentDebt: totalCurrentDebtOutgoing,
        totalOriginalDebt: totalOriginalDebtOutgoing,
        totalPaid: totalPaidOutgoing,
        progress: progressOutgoing,
        totalMinimumPayments: totalMinimumPaymentsOutgoing,
        averageInterestRate: averageInterestRateOutgoing,
        upcomingPayments: upcomingPaymentsOutgoing,
        totalDebts: outgoingDebts.length,
      },
      incoming: {
        totalPorCobrar,
        totalCobrado,
        progress: progressIncoming,
        upcomingCobros,
        totalDebts: incomingDebts.length,
      },
    };
  }, [debts, debtPayments]);

  if (debts.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t('dashboard.debt_status.title')}</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{t('dashboard.debt_status.no_debts')}</div>
          <p className="text-xs text-muted-foreground mb-4">
            {t('dashboard.debt_status.no_debts_description')}
          </p>
          <Link href="/debts">
            <Button size="sm" className="w-full">
              {t('dashboard.debt_status.manage_debts')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t('dashboard.debt_status.title')}</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Outgoing Debts */}
          <div className="space-y-3">
            <div className="text-red-600 text-sm font-medium">Total Deudas</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(debtSummary.outgoing.totalCurrentDebt)}</div>
            <p className="text-xs text-muted-foreground">
              {debtSummary.outgoing.totalDebts === 1
                ? debtSummary.outgoing.totalDebts + ' ' + t('dashboard.debt_status.debts_count').replace('{{count}} ', '')
                : debtSummary.outgoing.totalDebts + ' ' + t('dashboard.debt_status.debts_count_plural').replace('{{count}} ', '')
              } •
              {t('dashboard.debt_status.average_rate').replace('{{rate}}', debtSummary.outgoing.averageInterestRate.toFixed(1))}
            </p>

            {/* Barra de progreso reducción */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span>{t('dashboard.debt_status.progress_reduction')}</span>
                <span className="font-medium">{debtSummary.outgoing.progress.toFixed(1)}%</span>
              </div>
              <Progress value={debtSummary.outgoing.progress} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {t('dashboard.debt_status.total_paid')}
                </span>
                <span className="font-medium">{formatCurrency(debtSummary.outgoing.totalPaid)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {t('dashboard.debt_status.minimum_monthly_payments')}
                </span>
                <span className="font-medium">{formatCurrency(debtSummary.outgoing.totalMinimumPayments)}</span>
              </div>

              {debtSummary.outgoing.upcomingPayments > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    Próximos Pagos
                  </span>
                  <span className="font-medium text-amber-600">{debtSummary.outgoing.upcomingPayments}</span>
                </div>
              )}
            </div>
          </div>

          {/* Incoming Debts */}
          <div className="space-y-3">
            <div className="text-green-600 text-sm font-medium">Total Por Cobrar</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(debtSummary.incoming.totalPorCobrar)}</div>
            <p className="text-xs text-muted-foreground">
              {debtSummary.incoming.totalDebts === 1
                ? debtSummary.incoming.totalDebts + ' ' + t('dashboard.debt_status.debts_count').replace('{{count}} ', '')
                : debtSummary.incoming.totalDebts + ' ' + t('dashboard.debt_status.debts_count_plural').replace('{{count}} ', '')
              }
            </p>

            {/* Barra de progreso cobro */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span>Porcentaje Cobrado</span>
                <span className="font-medium">{debtSummary.incoming.progress.toFixed(1)}%</span>
              </div>
              <Progress value={debtSummary.incoming.progress} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Total Cobrado
                </span>
                <span className="font-medium">{formatCurrency(debtSummary.incoming.totalCobrado)}</span>
              </div>

              {debtSummary.incoming.upcomingCobros > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    Próximos Cobros
                  </span>
                  <span className="font-medium text-amber-600">{debtSummary.incoming.upcomingCobros}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <Link href="/debts/projections" className="block">
            <Button size="sm" className="w-full text-xs sm:text-sm">
              {t('dashboard.debt_status.view_projections')}
            </Button>
          </Link>
          <Link href="/debts" className="block">
            <Button size="sm" variant="outline" className="w-full text-xs sm:text-sm">
              {t('dashboard.debt_status.view_details')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}