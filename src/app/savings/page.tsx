'use client';

import { useState, useEffect } from 'react';
import { Savings, SavingsContribution, EmergencyFund, FinancialFreedomGoal } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/hooks/use-auth';
import { useSelectedMonth } from '@/hooks/use-selected-month';
import AppLayout from '@/components/layout/app-layout';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import { useI18n } from '@/hooks/use-i18n';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, TrendingUp, DollarSign, Target, Calendar, PiggyBank, Shield, TrendingDown, MoreHorizontal, Edit, Trash2, Wallet } from 'lucide-react';
import SavingsDialog from '@/components/savings/savings-dialog';
import SavingsCharts from '@/components/savings/savings-charts';
import EmergencyFundCard from '@/components/savings/emergency-fund-card';
import EmergencyFundDialog from '@/components/savings/emergency-fund-dialog';
import ContributionDialog from '@/components/savings/contribution-dialog';

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} €`;
};

export default function SavingsPage() {
   const { t } = useI18n();
   const { user, loading: authLoading } = useAuth();
   const { selectedYear, selectedMonth } = useSelectedMonth();
   const [isClient, setIsClient] = useState(false);
   const userId = user?.uid;
   const { toast } = useToast();
   const {
     transactions,
     categories,
     savings,
     savingsContributions,
     savingsLoading,
     savingsError,
     addTransaction,
     addCategory,
     addSavings,
     updateSavings,
     deleteSavings,
     addSavingsContribution,
     updateSavingsContribution,
     emergencyFund,
     addEmergencyFund,
     updateEmergencyFund,
   } = useData();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingSavings, setEditingSavings] = useState<Savings | null>(null);
  const [deletingSavings, setDeletingSavings] = useState<Savings | null>(null);
  const [isEmergencyFundDialogOpen, setEmergencyFundDialogOpen] = useState(false);
  const [editingEmergencyFund, setEditingEmergencyFund] = useState<EmergencyFund | null>(null);
  const [isContributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (savingsError) {
      toast({
        title: "Error al cargar datos",
        description: "Algunos datos no pudieron cargarse. La aplicación sigue siendo funcional.",
        variant: "destructive",
      });
    }
  }, [savingsError, toast]);

  const handleSaveSavings = async (savingsData: Omit<Savings, 'id'>) => {
    if (!userId) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar conectado para guardar ahorros.",
        variant: "destructive",
      });
      return;
    }

    try {
      const savingsWithUserId = { ...savingsData, userId };
      if (editingSavings) {
        await updateSavings(editingSavings.id, savingsWithUserId);
        toast({
          title: "Ahorro actualizado",
          description: `El ahorro "${savingsData.nombre}" se ha actualizado correctamente.`,
        });
      } else {
        await addSavings(savingsWithUserId);
        toast({
          title: "Ahorro añadido",
          description: `El ahorro "${savingsData.nombre}" se ha añadido correctamente.`,
        });
      }
      setDialogOpen(false);
      setEditingSavings(null);
    } catch (error) {
      console.error('Error saving savings:', error);
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar el ahorro. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleEditSavings = (savings: Savings) => {
    setEditingSavings(savings);
    setDialogOpen(true);
  };

  const handleDeleteSavings = (savings: Savings) => {
    setDeletingSavings(savings);
  };

  const handleEditEmergencyFund = (emergencyFund: EmergencyFund) => {
    setEditingEmergencyFund(emergencyFund);
    setEmergencyFundDialogOpen(true);
  };

  const handleSaveEmergencyFund = async (emergencyFundData: Omit<EmergencyFund, 'id'>) => {
    if (!userId) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar conectado para guardar el fondo de emergencia.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingEmergencyFund) {
        await updateEmergencyFund(editingEmergencyFund.id, emergencyFundData);
        toast({
          title: "Fondo de emergencia actualizado",
          description: "Los ajustes del fondo de emergencia se han actualizado correctamente.",
        });
      } else {
        await addEmergencyFund(emergencyFundData);
        toast({
          title: "Fondo de emergencia creado",
          description: "El fondo de emergencia se ha configurado correctamente.",
        });
      }
      setEmergencyFundDialogOpen(false);
      setEditingEmergencyFund(null);
    } catch (error) {
      console.error('Error saving emergency fund:', error);
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar el fondo de emergencia. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleSaveContribution = async (contributionData: Omit<SavingsContribution, 'id'>) => {
    if (!userId) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar conectado para guardar la contribución.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, ensure the "contribuciones" category exists
      let contribucionesCategory = categories.find(cat => cat.name === 'contribuciones' && cat.type === 'expense');
      if (!contribucionesCategory) {
        // Create the category if it doesn't exist
        contribucionesCategory = {
          id: 'contribuciones',
          name: 'contribuciones',
          icon: 'PiggyBank',
          type: 'expense',
          userId: 'default', // System category
        };
        await addCategory(contribucionesCategory);
      }

      // Add the contribution
      const savedContribution = await addSavingsContribution(contributionData);

      // Create a transaction for the contribution
      const transactionData = {
        type: 'expense' as const,
        amount: contributionData.amount,
        date: contributionData.date,
        category: contribucionesCategory.id,
        notes: `Contribución a ahorros: ${contributionData.description || 'Sin descripción'}`,
        merchant: 'Contribución de Ahorros',
        userId,
      };

      const savedTransaction = await addTransaction(transactionData);

      // Update the contribution with the transaction ID
      await updateSavingsContribution(savedContribution.id, {
        transaction_id: savedTransaction.id,
      });

      // Update the corresponding savings or emergency fund
      if (contributionData.savings_id === 'emergency_fund') {
        const currentEmergencyFund = emergencyFund[0];
        if (currentEmergencyFund) {
          await updateEmergencyFund(currentEmergencyFund.id, {
            ...currentEmergencyFund,
            monto_actual: currentEmergencyFund.monto_actual + contributionData.amount,
          });
        }
      } else {
        const saving = savings.find(s => s.id === contributionData.savings_id);
        if (saving) {
          await updateSavings(saving.id, {
            ...saving,
            monto_actual: saving.monto_actual + contributionData.amount,
          });
        }
      }

      toast({
        title: "Contribución añadida",
        description: `La contribución de ${formatCurrency(contributionData.amount)} se ha añadido correctamente.`,
      });
      setContributionDialogOpen(false);
    } catch (error) {
      console.error('Error saving contribution:', error);
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar la contribución. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (deletingSavings) {
      await deleteSavings(deletingSavings.id);
      setDeletingSavings(null);
    }
  };

  // Calcular métricas
  const totalSavings = savings.reduce((sum, saving) => sum + saving.monto_actual, 0) + (emergencyFund[0]?.monto_actual || 0);
  const totalGoals = savings.filter(saving => saving.monto_objetivo).length;
  const completedGoals = savings.filter(saving => saving.status === 'completed').length;
  const averageProgress = savings.length > 0
    ? savings.reduce((sum, saving) => {
        if (saving.monto_objetivo) {
          return sum + (saving.monto_actual / saving.monto_objetivo) * 100;
        }
        return sum;
      }, 0) / savings.length
    : 0;

  // Calcular ingresos del mes seleccionado
  const monthlyIncome = transactions
    .filter(transaction =>
      transaction.type === 'income' &&
      new Date(transaction.date).getFullYear() === selectedYear &&
      new Date(transaction.date).getMonth() === selectedMonth
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  // Calcular ahorros del mes seleccionado
  const monthlySavings = savingsContributions
    .filter(contribution =>
      new Date(contribution.date).getFullYear() === selectedYear &&
      new Date(contribution.date).getMonth() === selectedMonth
    )
    .reduce((sum, contribution) => sum + contribution.amount, 0);

  // Calcular tasa de ahorro
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  // Próximos vencimientos de objetivos (próximos 30 días)
  const upcomingGoals = savings.filter(saving => {
    if (!saving.fecha_objetivo) return false;
    const dueDate = new Date(saving.fecha_objetivo);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    return dueDate >= today && dueDate <= thirtyDaysFromNow;
  });

  // Calcular totales por tipo
  const savingsByType = savings.reduce((acc, saving) => {
    acc[saving.tipo] = (acc[saving.tipo] || 0) + saving.monto_actual;
    return acc;
  }, {} as Record<string, number>);

  const filteredSavings = savings.filter(saving => {
    if (filter === 'all') {
      return true;
    } else if (filter === 'active') {
      return saving.status === 'active';
    } else if (filter === 'completed') {
      return saving.status === 'completed';
    } else {
      return saving.tipo === filter;
    }
  });

  if (authLoading || !isClient) {
    return <DashboardSkeleton />;
  }

  if (savingsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('savings.title') || 'Ahorros'}</h1>
            <p className="text-muted-foreground">{t('savings.description') || 'Gestión de ahorros e inversiones'}</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button
              variant="outline"
              onClick={() => setContributionDialogOpen(true)}
              className="h-8 px-3 text-sm md:h-9 md:px-3 md:text-sm"
            >
              <Wallet className="mr-1 h-4 w-4" />
              Añadir Contribución
            </Button>
            <Button onClick={() => {
              setEditingSavings(null);
              setDialogOpen(true);
            }} className="h-8 px-3 text-sm md:h-9 md:px-3 md:text-sm">
              <PlusCircle className="mr-1 h-4 w-4" />
              Añadir Ahorro
            </Button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ahorrado</CardTitle>
              <PiggyBank className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSavings)}</div>
              <p className="text-xs text-muted-foreground">Dinero ahorrado</p>
            </CardContent>
          </Card>

          <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Ahorro</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(savingsRate)}%</div>
              <p className="text-xs text-muted-foreground">Del mes actual</p>
            </CardContent>
          </Card>

          <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(averageProgress)}%</div>
              <p className="text-xs text-muted-foreground">Hacia objetivos</p>
            </CardContent>
          </Card>

          <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos Objetivos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingGoals.length}</div>
              <p className="text-xs text-muted-foreground">En 30 días</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards especiales */}
        <div className="grid gap-6 grid-cols-1 mb-6">
          <EmergencyFundCard
            emergencyFund={emergencyFund[0]}
            monthlyExpenses={2000} // Esto debería calcularse de los gastos reales
            onEdit={() => handleEditEmergencyFund(emergencyFund[0])}
          />
        </div>

        {/* Gráficos de ahorros */}
        <SavingsCharts savings={savings} />

        <div className="my-8" />

        {/* Filtros de ahorros */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="completed">Completados</TabsTrigger>
            <TabsTrigger value="investment">Inversiones</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de ahorros */}
        <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mis Ahorros</CardTitle>
                <CardDescription>Gestión de tus objetivos de ahorro</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSavings.length > 0 ? (
              <div className="space-y-4">
                {filteredSavings.map((saving) => (
                  <div key={saving.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{saving.nombre}</p>
                        <Badge variant={saving.status === 'active' ? 'default' : saving.status === 'completed' ? 'secondary' : 'outline'}>
                          {saving.status === 'active' ? 'Activo' : saving.status === 'completed' ? 'Completado' : 'Pausado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tipo: {saving.tipo.replace('_', ' ').toUpperCase()}
                        {saving.fecha_objetivo && ` • Objetivo: ${new Date(saving.fecha_objetivo).toLocaleDateString()}`}
                      </p>
                      {saving.descripcion && (
                        <p className="text-sm text-muted-foreground">{saving.descripcion}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1 mr-4">
                      <p className="font-bold">{formatCurrency(saving.monto_actual)}</p>
                      {saving.monto_objetivo && (
                        <p className="text-sm text-muted-foreground">
                          Objetivo: {formatCurrency(saving.monto_objetivo)}
                        </p>
                      )}
                      {saving.monto_objetivo && (
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min((saving.monto_actual / saving.monto_objetivo) * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEditSavings(saving)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteSavings(saving)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] w-full items-center justify-center rounded-md border-2 border-dashed">
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'No tienes ahorros registrados' : 'No hay ahorros en esta categoría'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <SavingsDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveSavings}
        savings={editingSavings}
      />

      <EmergencyFundDialog
        isOpen={isEmergencyFundDialogOpen}
        onOpenChange={setEmergencyFundDialogOpen}
        onSave={handleSaveEmergencyFund}
        emergencyFund={editingEmergencyFund}
      />

      <ContributionDialog
        isOpen={isContributionDialogOpen}
        onOpenChange={setContributionDialogOpen}
        onSave={handleSaveContribution}
        savings={savings}
        emergencyFund={emergencyFund}
      />

      <AlertDialog open={!!deletingSavings} onOpenChange={() => setDeletingSavings(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Ahorro</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el ahorro "{deletingSavings?.nombre}" del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingSavings(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}