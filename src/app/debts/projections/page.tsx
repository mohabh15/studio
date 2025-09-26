'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Target, Calculator, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useFirestoreDebts, useFirestoreDebtPayments } from '@/hooks/use-firestore';
import { useI18n } from '@/hooks/use-i18n';
import AppLayout from '@/components/layout/app-layout';
import StrategyComparison from '@/components/debts/projections/strategy-comparison';
import PaymentSimulator from '@/components/debts/projections/payment-simulator';
import { calculateDebtProjections } from '@/lib/debt-projections';

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} €`;
};

export default function DebtProjectionsPage() {
  const { t } = useI18n();
  const { debts, loading: debtsLoading } = useFirestoreDebts();
  const { debtPayments } = useFirestoreDebtPayments();

  const debtSummary = useMemo(() => {
    if (debts.length === 0) return null;

    const totalCurrentDebt = debts.reduce((sum, debt) => sum + debt.monto_actual, 0);
    const totalOriginalDebt = debts.reduce((sum, debt) => sum + debt.monto, 0);
    const totalPaid = debtPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.pagos_minimos, 0);

    // Estimación simple: tiempo para pagar con pagos mínimos
    const monthsToPayOff = totalCurrentDebt > 0 ? Math.ceil(totalCurrentDebt / totalMinimumPayments) : 0;

    return {
      totalCurrentDebt,
      totalOriginalDebt,
      totalPaid,
      totalMinimumPayments,
      monthsToPayOff,
      progress: totalOriginalDebt > 0 ? ((totalOriginalDebt - totalCurrentDebt) / totalOriginalDebt) * 100 : 0,
    };
  }, [debts, debtPayments]);

  const projections = useMemo(() => {
    if (debts.length === 0) return [];
    return calculateDebtProjections({ debts });
  }, [debts]);

  if (debtsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando proyecciones...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!debtSummary) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/debts">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Proyecciones de Deudas</h1>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay deudas registradas</h3>
              <p className="text-muted-foreground text-center mb-6">
                Agrega tus deudas para ver proyecciones y estrategias de pago.
              </p>
              <Link href="/debts">
                <Button>
                  Gestionar Deudas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/debts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Proyecciones de Deudas</h1>
        </div>

        {/* Resumen Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(debtSummary.totalCurrentDebt)}</div>
              <p className="text-xs text-muted-foreground">
                {debtSummary.progress.toFixed(1)}% reducido
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(debtSummary.totalPaid)}</div>
              <p className="text-xs text-muted-foreground">
                De {formatCurrency(debtSummary.totalOriginalDebt)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pago Mensual</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(debtSummary.totalMinimumPayments)}</div>
              <p className="text-xs text-muted-foreground">
                Pagos mínimos totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Estimado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debtSummary.monthsToPayOff} meses</div>
              <p className="text-xs text-muted-foreground">
                Con pagos mínimos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido Principal */}
        <Tabs defaultValue="comparison" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Comparación de Estrategias
            </TabsTrigger>
            <TabsTrigger value="simulator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Simulador Interactivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-6">
            <StrategyComparison
              projections={projections}
              recommendedStrategy="avalanche"
            />
          </TabsContent>

          <TabsContent value="simulator" className="space-y-6">
            <PaymentSimulator debts={debts} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}