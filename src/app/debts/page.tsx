'use client';

import { useState, useEffect } from 'react';
import { Debt, DebtPayment } from '@/lib/types';
import { useFirestoreDebts, useFirestoreDebtPayments, useFirestoreTransactions } from '@/hooks/use-firestore';
import AppLayout from '@/components/layout/app-layout';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import { useI18n } from '@/hooks/use-i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { PlusCircle, TrendingUp, DollarSign, Calendar, AlertTriangle, MoreHorizontal, Edit, Trash2, CreditCard } from 'lucide-react';
import DebtDialog from '@/components/debts/debt-dialog';
import DebtPaymentDialog from '@/components/debts/debt-payment-dialog';
import DebtCharts from '@/components/debts/debt-charts';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function DebtsPage() {
  const { t } = useI18n();
  const [isClient, setIsClient] = useState(false);
  const { debts, loading: debtsLoading, addDebt, updateDebt, deleteDebt } = useFirestoreDebts();
  const { addDebtPayment } = useFirestoreDebtPayments();
  const { addTransaction } = useFirestoreTransactions();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSaveDebt = async (debtData: Omit<Debt, 'id'>) => {
    if (editingDebt) {
      await updateDebt(editingDebt.id, debtData);
    } else {
      await addDebt(debtData);
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
    try {
      // Crear el registro de pago
      const paymentDoc = await addDebtPayment(paymentData);

      // Crear la transacción correspondiente (gasto)
      const selectedDebt = debts.find(d => d.id === paymentData.debt_id);
      if (selectedDebt) {
        const transactionData = {
          type: 'expense' as const,
          amount: paymentData.amount,
          date: paymentData.date,
          category: 'debt', // Categoría especial para pagos de deudas
          notes: `Pago de deuda [${selectedDebt.id}]: ${selectedDebt.descripcion || selectedDebt.tipo.replace('_', ' ').toUpperCase()}${paymentData.description ? ` - ${paymentData.description}` : ''}`,
          merchant: selectedDebt.descripcion || selectedDebt.tipo.replace('_', ' ').toUpperCase(),
        };

        const transactionDoc = await addTransaction(transactionData);

        // Actualizar el pago con la referencia de la transacción
        // await updateDebtPayment(paymentDoc.id, { transaction_id: transactionDoc.id });

        // Actualizar el monto actual de la deuda
        const newAmount = Math.max(0, selectedDebt.monto_actual - paymentData.amount);
        await updateDebt(selectedDebt.id, { monto_actual: newAmount });
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

  if (!isClient || debtsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Deudas</h1>
            <p className="text-muted-foreground">Controla y administra todas tus deudas financieras</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPaymentDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Registrar Pago
            </Button>
            <Button size="sm" onClick={() => {
              setEditingDebt(null);
              setDialogOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Deuda
            </Button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalDebt)}</div>
              <p className="text-xs text-muted-foreground">
                {debts.length} deuda{debts.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Mínimos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMinimumPayments)}</div>
              <p className="text-xs text-muted-foreground">mensuales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa Promedio</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageInterestRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">interés anual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos Vencimientos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingPayments.length}</div>
              <p className="text-xs text-muted-foreground">en 30 días</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de deudas */}
        <DebtCharts debts={debts} />

        <div className="my-8" />

        {/* Lista de deudas */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Deudas</CardTitle>
            <CardDescription>Lista completa de tus deudas activas</CardDescription>
          </CardHeader>
          <CardContent>
            {debts.length > 0 ? (
              <div className="space-y-4">
                {debts.map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{debt.descripcion || 'Sin descripción'}</p>
                      <p className="text-sm text-muted-foreground">
                        Tipo: {debt.tipo.replace('_', ' ').toUpperCase()} •
                        Tasa: {debt.tasa_interes}% •
                        Vence: {new Date(debt.fecha_vencimiento).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right space-y-1 mr-4">
                      <p className="font-bold">{formatCurrency(debt.monto_actual)}</p>
                      <p className="text-sm text-muted-foreground">
                        Mínimo: {formatCurrency(debt.pagos_minimos)}
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
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteDebt(debt)} className="text-destructive">
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
                <p className="text-muted-foreground">No tienes deudas registradas</p>
              </div>
            )}
          </CardContent>
        </Card>
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
            <AlertDialogTitle>¿Eliminar deuda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la deuda
              "{deletingDebt?.descripcion || 'Sin descripción'}" del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDebt(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}