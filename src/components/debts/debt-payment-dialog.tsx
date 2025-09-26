'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Debt, DebtPayment } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';

const debtPaymentSchema = z.object({
  debt_id: z.string().min(1, 'Debes seleccionar una deuda'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  tipo: z.enum(['regular', 'extra']),
  description: z.string().optional(),
});

type DebtPaymentFormValues = z.infer<typeof debtPaymentSchema>;

type DebtPaymentDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (paymentData: Omit<DebtPayment, 'id'>) => void;
  debts: Debt[];
};

export default function DebtPaymentDialog({ isOpen, onOpenChange, onSave, debts }: DebtPaymentDialogProps) {
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DebtPaymentFormValues>({
    resolver: zodResolver(debtPaymentSchema),
    defaultValues: {
      debt_id: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      tipo: 'regular',
      description: '',
    },
  });

  const selectedDebtId = form.watch('debt_id');
  const selectedDebt = debts.find(debt => debt.id === selectedDebtId);

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        debt_id: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        tipo: 'regular',
        description: '',
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (values: DebtPaymentFormValues) => {
    setIsSubmitting(true);
    try {
      const paymentData: Omit<DebtPayment, 'id'> = {
        ...values,
        transaction_id: undefined, // Se asignará cuando se cree la transacción
      };
      await onSave(paymentData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving debt payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)} €`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago de Deuda</DialogTitle>
          <DialogDescription>
            Registra un pago realizado hacia una de tus deudas. Esto creará automáticamente una transacción de gasto.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="debt_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deuda</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una deuda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {debts.map((debt) => (
                        <SelectItem key={debt.id} value={debt.id}>
                          {debt.descripcion || debt.tipo.replace('_', ' ').toUpperCase()} - {formatCurrency(debt.monto_actual)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedDebt && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Deuda seleccionada:</p>
                <p className="text-sm text-muted-foreground">
                  Monto actual: {formatCurrency(selectedDebt.monto_actual)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Pago mínimo: {formatCurrency(selectedDebt.pagos_minimos)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto del Pago</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Pago Regular</SelectItem>
                        <SelectItem value="extra">Pago Extra</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del Pago</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade una descripción para este pago..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}