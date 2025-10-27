'use client';

import { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Target, Calculator, BarChart3, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useFirestoreSavings, useFirestoreSavingsContributions, useFirestoreEmergencyFund, useFirestoreFinancialFreedomGoals } from '@/hooks/use-firestore';
import { useAuth } from '@/hooks/use-auth';
import { useI18n } from '@/hooks/use-i18n';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SavingsSummary from '@/components/savings/projections/savings-summary';
import SavingsGrowthSimulator from '@/components/savings/projections/savings-growth-simulator';
import SavingsStrategyComparison from '@/components/savings/projections/savings-strategy-comparison';
import { calculateSavingsProjections } from '@/lib/savings-projections';

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} €`;
};

export default function SavingsProjectionsPage() {
    const { t } = useI18n();
    const { user, loading: authLoading } = useAuth();
    const userId = user?.uid;
    const { toast } = useToast();
    const { savings, loading: savingsLoading, error: savingsError } = useFirestoreSavings(userId || '');
    const { contributions } = useFirestoreSavingsContributions(userId || '');
    const { emergencyFund } = useFirestoreEmergencyFund(userId || '');
    const { goals } = useFirestoreFinancialFreedomGoals(userId || '');
    const [selectedType, setSelectedType] = useState<string>('all');

  const savingsSummary = useMemo(() => {
    if (savings.length === 0 && emergencyFund.length === 0) return null;

    const totalCurrentSavings = savings.reduce((sum, saving) => sum + saving.monto_actual, 0) +
                               emergencyFund.reduce((sum, fund) => sum + fund.monto_actual, 0);
    const totalTargetSavings = savings.reduce((sum, saving) => sum + (saving.monto_objetivo || 0), 0) +
                              emergencyFund.reduce((sum, fund) => sum + fund.monto_objetivo, 0);
    const totalContributions = contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
    const monthlyContributions = contributions
      .filter(c => new Date(c.date).getMonth() === new Date().getMonth())
      .reduce((sum, contribution) => sum + contribution.amount, 0);

    // Estimación simple: tiempo para alcanzar objetivos con contribuciones mensuales
    const remainingToTarget = Math.max(0, totalTargetSavings - totalCurrentSavings);
    const monthsToTarget = monthlyContributions > 0 ? Math.ceil(remainingToTarget / monthlyContributions) : 0;

    return {
      totalCurrentSavings,
      totalTargetSavings,
      totalContributions,
      monthlyContributions,
      monthsToTarget,
      progress: totalTargetSavings > 0 ? ((totalCurrentSavings / totalTargetSavings) * 100) : 0,
    };
  }, [savings, contributions, emergencyFund]);

  const filteredSavings = useMemo(() => {
    if (selectedType === 'all') return [...savings, ...emergencyFund];
    if (selectedType === 'emergency_fund') return emergencyFund;
    return savings.filter(saving => saving.tipo === selectedType);
  }, [savings, emergencyFund, selectedType]);

  const projections = useMemo(() => {
    if (!savingsSummary || savingsSummary.monthlyContributions === 0) return [];

    // Calcular proyecciones basadas en datos reales
    const strategies = ['conservative', 'moderate', 'aggressive'] as const;

    return strategies.map(strategy =>
      calculateSavingsProjections({
        initialAmount: savingsSummary.totalCurrentSavings,
        monthlyContribution: savingsSummary.monthlyContributions,
        years: 10,
        strategy,
        targetAmount: savingsSummary.totalTargetSavings,
      })
    );
  }, [savingsSummary]);

  const scenarioProjections = useMemo(() => {
    // Proyecciones para comparación de escenarios
    return projections;
  }, [projections]);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t('savings_projections.loading')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  useEffect(() => {
    if (savingsError) {
      toast({
        title: "Error al cargar datos",
        description: "Algunos datos no pudieron cargarse. La aplicación sigue siendo funcional.",
        variant: "destructive",
      });
    }
  }, [savingsError, toast]);

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

  if (savingsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t('savings_projections.loading_projections')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!savingsSummary) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/savings">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('savings_projections.back')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{t('savings_projections.title')}</h1>
          </div>

          <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('savings_projections.no_savings')}</h3>
              <p className="text-muted-foreground text-center mb-6">
                {t('savings_projections.no_savings_description')}
              </p>
              <Link href="/savings">
                <Button>
                  {t('savings_projections.manage_savings')}
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
          <Link href="/savings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('savings_projections.back')}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t('savings_projections.title')}</h1>
        </div>

        {/* Resumen Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('savings_projections.total_savings')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(savingsSummary.totalCurrentSavings)}</div>
              <p className="text-xs text-muted-foreground">
                {savingsSummary.progress.toFixed(1)}% {t('savings_projections.to_reach_goals')}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('savings_projections.total_contributions')}</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(savingsSummary.totalContributions)}</div>
              <p className="text-xs text-muted-foreground">
                Total acumulado
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('savings_projections.monthly_contributions')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(savingsSummary.monthlyContributions)}</div>
              <p className="text-xs text-muted-foreground">
                Este mes
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('savings_projections.estimated_time')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savingsSummary.monthsToTarget} meses</div>
              <p className="text-xs text-muted-foreground">
                {t('savings_projections.to_reach_goals')}
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
              <SelectItem value="emergency_fund">Fondo de Emergencia</SelectItem>
              <SelectItem value="investment">Inversión</SelectItem>
              <SelectItem value="retirement">Retiro</SelectItem>
              <SelectItem value="vacation">Vacaciones</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contenido Principal */}
        <Tabs defaultValue="summary" className="space-y-6">
           <TabsList className="grid w-full grid-cols-3">
             <TabsTrigger value="summary" className="flex items-center gap-2">
               <BarChart3 className="h-4 w-4" />
               {t('savings_projections.summary')}
             </TabsTrigger>
             <TabsTrigger value="simulator" className="flex items-center gap-2">
               <Calculator className="h-4 w-4" />
               {t('savings_projections.simulator')}
             </TabsTrigger>
             <TabsTrigger value="scenarios" className="flex items-center gap-2">
               <TrendingUp className="h-4 w-4" />
               {t('savings_projections.scenarios')}
             </TabsTrigger>
           </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <SavingsSummary />
          </TabsContent>

          <TabsContent value="simulator" className="space-y-6">
            <SavingsGrowthSimulator />
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            {scenarioProjections.length > 0 ? (
              <SavingsStrategyComparison
                projections={scenarioProjections}
                targetAmount={savingsSummary?.totalTargetSavings}
              />
            ) : (
              <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No hay datos suficientes para comparar escenarios</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}