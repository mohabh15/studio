'use client';

import { useState, useEffect } from 'react';
import { Debt, DebtPayment } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/hooks/use-auth';
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
} from "@/components/ui/alert-dialog"
import { PlusCircle, TrendingUp, DollarSign, Calendar, AlertTriangle, MoreHorizontal, Edit, Trash2, CreditCard, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import DebtDialog from '@/components/debts/debt-dialog';
import DebtPaymentDialog from '@/components/debts/debt-payment-dialog';
import DebtCharts from '@/components/debts/debt-charts';

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} €`;
};

export default function DebtsPage() {
   const { t } = useI18n();
   const { user, loading: authLoading } = useAuth();
   const [isClient, setIsClient] = useState(false);
   const userId = user?.uid;
   const { toast } = useToast();
   const {
     debts,
     debtsLoading,
     debtsError,
     addDebt,
     updateDebt,
     deleteDebt,
     addDebtPayment,
     addTransaction,
   } = useData();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (debtsError) {
      toast({
        title: "Error al cargar datos",
        description: "Algunos datos no pudieron cargarse. La aplicación sigue siendo funcional.",
        variant: "destructive",
      });
    }
  }, [debtsError, toast]);

  const handleSaveDebt = async (debtData: Omit<Debt, 'id'>) => {
    if (!userId) return;
    const debtWithUserId = { ...debtData, userId };
    if (editingDebt) {
      await updateDebt(editingDebt.id, debtWithUserId);
    } else {
      await addDebt(debtWithUserId);
    }
    setDialogOpen(false);
    setEditingDebt(null);
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setDialogOpen(true);
  };

  const handleDeleteDebt = (debt: Debt) => {
    setDeletingDebt(debt);
  };

  const confirmDelete = async () => {
    if (deletingDebt) {
      await deleteDebt(deletingDebt.id);
      setDeletingDebt(null);
    }
  };

  const handleSaveDebtPayment = async (paymentData: Omit<DebtPayment, 'id'>) => {
    if (!userId) return;
    try {
      // Crear el registro de pago
      const paymentWithUserId = { ...paymentData, userId };
      const paymentDoc = await addDebtPayment(paymentWithUserId);

      // Crear la transacción correspondiente
      const selectedDebt = debts.find(d => d.id === paymentData.debt_id);
      if (selectedDebt) {
        const isCollection = paymentData.tipo === 'collection';
        const transactionData = {
          type: isCollection ? 'income' as const : 'expense' as const,
          amount: paymentData.amount,
          date: paymentData.date,
          category: isCollection ? 'debt_collection' : 'debt',
          notes: `Pago de deuda [${selectedDebt.id}]: ${selectedDebt.descripcion || selectedDebt.tipo.replace('_', ' ').toUpperCase()}${paymentData.description ? ` - ${paymentData.description}` : ''}`,
          merchant: selectedDebt.descripcion || selectedDebt.tipo.replace('_', ' ').toUpperCase(),
          userId,
        };

        const transactionDoc = await addTransaction(transactionData);

        // Actualizar el pago con la referencia de la transacción
        // await updateDebtPayment(paymentDoc.id, { transaction_id: transactionDoc.id });

        // Actualizar el monto actual de la deuda
        const newAmount = Math.max(0, selectedDebt.monto_actual - paymentData.amount);
        const updateData: Partial<Debt> = { monto_actual: newAmount };
        if (newAmount === 0) {
          updateData.status = 'inactive';
        }
        await updateDebt(selectedDebt.id, updateData);
      }

      setPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error saving debt payment:', error);
    }
  };

  // Calcular métricas
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

  // Función para determinar la dirección de la deuda
  const getDebtDirection = (debt: Debt) => {
    if (debt.direction) return debt.direction;
    return (debt.tipo as string) === 'incoming' ? 'incoming' : 'outgoing';
  };

  // Calcular totales separados
  const totalOutgoing = debts.filter(d => getDebtDirection(d) === 'outgoing').reduce((sum, debt) => sum + debt.monto_actual, 0);
  const totalIncoming = debts.filter(d => getDebtDirection(d) === 'incoming').reduce((sum, debt) => sum + debt.monto_actual, 0);
  const filteredDebts = debts.filter(debt => {
    if (filter === 'all') {
      return debt.status !== 'inactive';
    } else if (filter === 'inactive') {
      return debt.status === 'inactive';
    } else {
      return debt.status !== 'inactive' && getDebtDirection(debt) === filter;
    }
  });

  if (authLoading || !isClient) {
    return <DashboardSkeleton />;
  }

  if (debtsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <AppLayout>
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8 animate-in fade-in duration-500">
        {/* Header modernizado */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 animate-in slide-in-from-left duration-500">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 bg-clip-text text-transparent animate-in fade-in duration-700">
              {t('debts_page.title')}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground/80">
              {t('debts_page.description')}
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row animate-in slide-in-from-right duration-500">
            <Button onClick={() => {
              setEditingDebt(null);
              setDialogOpen(true);
            }} className="h-8 px-3 text-sm md:h-9 md:px-3 md:text-sm md:order-2">
              <PlusCircle className="mr-1 h-4 w-4" />
              {t('debts_page.add_debt')}
            </Button>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(true)} className="h-8 px-3 text-sm md:h-9 md:px-3 md:text-sm md:order-1">
              <CreditCard className="mr-1 h-4 w-4" />
              {t('debts_page.register_payment')}
            </Button>
          </div>
        </div>

        {/* Métricas principales con animación */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '100ms' }}>
           <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary transform transition-all duration-300 hover:scale-[1.02]">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Total Deudas</CardTitle>
               <DollarSign className="h-4 w-4 text-red-500" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{formatCurrency(totalOutgoing)}</div>
               <p className="text-xs text-muted-foreground">Deudas que debo</p>
             </CardContent>
           </Card>

           <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary transform transition-all duration-300 hover:scale-[1.02]">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Total Por Cobrar</CardTitle>
               <DollarSign className="h-4 w-4 text-green-500" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{formatCurrency(totalIncoming)}</div>
               <p className="text-xs text-muted-foreground">Dinero que me deben</p>
             </CardContent>
           </Card>

           <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary transform transition-all duration-300 hover:scale-[1.02]">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">{t('debts_page.minimum_payments')}</CardTitle>
               <TrendingUp className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{formatCurrency(totalMinimumPayments)}</div>
               <p className="text-xs text-muted-foreground">{t('debts_page.monthly')}</p>
             </CardContent>
           </Card>

           <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary transform transition-all duration-300 hover:scale-[1.02]">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">{t('debts_page.upcoming_due_dates')}</CardTitle>
               <Calendar className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{upcomingPayments.length}</div>
               <p className="text-xs text-muted-foreground">{t('debts_page.in_30_days')}</p>
             </CardContent>
           </Card>
         </div>

        {/* Gráficos de deudas con animación */}
        <div className="animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '200ms' }}>
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <DebtCharts debts={debts} />
          </div>
        </div>

        {/* Filtro de deudas con animación */}
        <div className="animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '300ms' }}>
          <Tabs value={filter} onValueChange={setFilter} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="outgoing">Debo</TabsTrigger>
              <TabsTrigger value="incoming">Me Deben</TabsTrigger>
              <TabsTrigger value="inactive">{t('debts_page.inactive')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Lista de deudas con animación */}
        <div className="animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '400ms' }}>
          <Card className="glass-card depth-2 hover-lift interactive-scale glow-primary transform transition-all duration-300 hover:scale-[1.01]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('debts_page.all_debts')}</CardTitle>
                  <CardDescription>{t('debts_page.all_debts_description')}</CardDescription>
                </div>
                <Link href="/debts/projections">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {t('debts_page.view_projections')}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {filteredDebts.length > 0 ? (
                <div className="space-y-4">
                  {filteredDebts.map((debt) => (
                    <div key={debt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{debt.descripcion || t('debts_page.no_description')}</p>
                        <div className="flex items-center gap-2 mb-2">
                          {getDebtDirection(debt) === 'incoming' ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <ArrowUp className="w-3 h-3 mr-1" />Por Cobrar
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              <ArrowDown className="w-3 h-3 mr-1" />Debo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {`Tipo: ${debt.tipo.replace('_', ' ').toUpperCase()} • Tasa: ${debt.tasa_interes}% • Vence: ${new Date(debt.fecha_vencimiento).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="text-right space-y-1 mr-4">
                        <p className="font-bold">{formatCurrency(debt.monto_actual)}</p>
                        <p className="text-sm text-muted-foreground">
                          {`Mínimo: ${formatCurrency(debt.pagos_minimos)}`}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditDebt(debt)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>{t('common.edit')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteDebt(debt)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>{t('common.delete')}</span>
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
                    {filter === 'all' ? t('dashboard.debt_status.no_debts_description') : 'No hay deudas en esta categoría'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <DebtDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveDebt}
        debt={editingDebt}
      />

      <DebtPaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSave={handleSaveDebtPayment}
        debts={debts}
      />

      <AlertDialog open={!!deletingDebt} onOpenChange={() => setDeletingDebt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('debts_page.delete_debt_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {`Esta acción no se puede deshacer. Se eliminará permanentemente la deuda "${deletingDebt?.descripcion || t('debts_page.no_description')}" del sistema.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDebt(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}