'use client';

import { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Target, Calculator, BarChart3, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useFirestoreDebts, useFirestoreDebtPayments } from '@/hooks/use-firestore';
import { useAuth } from '@/hooks/use-auth';
import { useI18n } from '@/hooks/use-i18n';
import AppLayout from '@/components/layout/app-layout';
import StrategyComparison from '@/components/debts/projections/strategy-comparison';
import PaymentSimulator from '@/components/debts/projections/payment-simulator';
import { calculateDebtProjections } from '@/lib/debt-projections';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} €`;
};

export default function DebtProjectionsPage() {
    const { t } = useI18n();
    const { user, loading: authLoading } = useAuth();
    const userId = user?.uid;
    const { toast } = useToast();
    const { debts, loading: debtsLoading, error: debtsError } = useFirestoreDebts(userId || '');
    const { debtPayments } = useFirestoreDebtPayments(userId || '');
    const [selectedType, setSelectedType] = useState<string>('all');

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

  const filteredDebts = useMemo(() => {
    if (selectedType === 'all') return debts;
    return debts.filter(debt => debt.tipo === selectedType);
  }, [debts, selectedType]);

  const projections = useMemo(() => {
    if (filteredDebts.length === 0) return [];
    return calculateDebtProjections({ debts: filteredDebts });
  }, [filteredDebts]);

  const incomingProjections = useMemo(() => {
    if (filteredDebts.length === 0) return [];
    return calculateDebtProjections({ debts: filteredDebts, isIncoming: true });
  }, [filteredDebts]);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t('debt_projections.loading')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  useEffect(() => {
    if (debtsError) {
      toast({
        title: "Error al cargar datos",
        description: "Algunos datos no pudieron cargarse. La aplicación sigue siendo funcional.",
        variant: "destructive",
      });
    }
  }, [debtsError, toast]);

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('auth.required_message') || 'Debes iniciar sesión para acceder a las proyecciones.'}
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  if (debtsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t('debt_projections.loading_projections')}</p>
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
                {t('debt_projections.back')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{t('debt_projections.title')}</h1>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('debt_projections.no_debts')}</h3>
              <p className="text-muted-foreground text-center mb-6">
                {t('debt_projections.no_debts_description')}
              </p>
              <Link href="/debts">
                <Button>
                  {t('debt_projections.manage_debts')}
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
          <h1 className="text-2xl font-bold">{t('debt_projections.title')}</h1>
        </div>

        {/* Resumen Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('debt_projections.total_debt')}</CardTitle>
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
              <CardTitle className="text-sm font-medium">{t('debt_projections.total_paid')}</CardTitle>
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
              <CardTitle className="text-sm font-medium">{t('debt_projections.monthly_payment')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(debtSummary.totalMinimumPayments)}</div>
              <p className="text-xs text-muted-foreground">
                {t('debt_projections.minimum_payments_total')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('debt_projections.estimated_time')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debtSummary.monthsToPayOff} meses</div>
              <p className="text-xs text-muted-foreground">
                {t('debt_projections.with_minimum_payments')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtro por Tipo */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
              <SelectItem value="personal_loan">Préstamo Personal</SelectItem>
              <SelectItem value="mortgage">Hipoteca</SelectItem>
              <SelectItem value="student_loan">Préstamo Estudiantil</SelectItem>
              <SelectItem value="car_loan">Préstamo de Auto</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contenido Principal */}
        <Tabs defaultValue="comparison" className="space-y-6">
           <TabsList className="grid w-full grid-cols-3">
             <TabsTrigger value="comparison" className="flex items-center gap-2">
               <BarChart3 className="h-4 w-4" />
               {t('strategy_comparison.title')}
             </TabsTrigger>
             <TabsTrigger value="simulator" className="flex items-center gap-2">
               <Calculator className="h-4 w-4" />
               {t('payment_simulator.title')}
             </TabsTrigger>
             <TabsTrigger value="incoming" className="flex items-center gap-2">
               <TrendingUp className="h-4 w-4" />
               Cobros Entrantes
             </TabsTrigger>
           </TabsList>

          <TabsContent value="comparison" className="space-y-6">
            <StrategyComparison
              projections={projections}
              recommendedStrategy="avalanche"
            />
          </TabsContent>

          <TabsContent value="simulator" className="space-y-6">
            <PaymentSimulator debts={filteredDebts} />
          </TabsContent>

          <TabsContent value="incoming" className="space-y-6">
            <StrategyComparison
              projections={incomingProjections}
              isIncoming={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}