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
import { Debt, DebtType } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';

const debtSchema = z.object({
  tipo: z.enum(['credit_card', 'personal_loan', 'mortgage', 'student_loan', 'car_loan', 'other']),
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  monto_actual: z.number().min(0, 'El monto actual no puede ser negativo'),
  tasa_interes: z.number().min(0, 'La tasa de interés debe ser mayor o igual a 0'),
  pagos_minimos: z.number().min(0.01, 'Los pagos mínimos deben ser mayores a 0'),
  fecha_vencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  descripcion: z.string().optional(),
});

type DebtFormValues = z.infer<typeof debtSchema>;

type DebtDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (debtData: Omit<Debt, 'id'>) => void;
  debt?: Debt | null;
};

const debtTypeLabels: Record<DebtType, string> = {
  credit_card: 'Tarjeta de Crédito',
  personal_loan: 'Préstamo Personal',
  mortgage: 'Hipoteca',
  student_loan: 'Préstamo Estudiantil',
  car_loan: 'Préstamo de Auto',
  other: 'Otro',
};

export default function DebtDialog({ isOpen, onOpenChange, onSave, debt }: DebtDialogProps) {
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      tipo: 'credit_card',
      monto: 0,
      monto_actual: 0,
      tasa_interes: 0,
      pagos_minimos: 0,
      fecha_vencimiento: '',
      descripcion: '',
    },
  });

  useEffect(() => {
    if (debt) {
      form.reset({
        tipo: debt.tipo,
        monto: debt.monto,
        monto_actual: debt.monto_actual,
        tasa_interes: debt.tasa_interes,
        pagos_minimos: debt.pagos_minimos,
        fecha_vencimiento: debt.fecha_vencimiento.split('T')[0], // Convertir a formato YYYY-MM-DD
        descripcion: debt.descripcion || '',
      });
    } else {
      form.reset({
        tipo: 'credit_card',
        monto: 0,
        monto_actual: 0,
        tasa_interes: 0,
        pagos_minimos: 0,
        fecha_vencimiento: '',
        descripcion: '',
      });
    }
  }, [debt, form]);

  const onSubmit = async (values: DebtFormValues) => {
    setIsSubmitting(true);
    try {
      const debtData: Omit<Debt, 'id'> = {
        ...values,
        fecha_creacion: debt?.fecha_creacion || new Date().toISOString(),
      };
      await onSave(debtData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving debt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {debt ? 'Editar Deuda' : 'Añadir Nueva Deuda'}
          </DialogTitle>
          <DialogDescription>
            {debt
              ? 'Modifica los detalles de tu deuda existente.'
              : 'Añade una nueva deuda para hacer seguimiento de tus pagos.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Deuda</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de deuda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(debtTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Original</FormLabel>
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
                name="monto_actual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Actual</FormLabel>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tasa_interes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa de Interés (%)</FormLabel>
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
                name="pagos_minimos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagos Mínimos</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="fecha_vencimiento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Vencimiento</FormLabel>
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
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade una descripción para esta deuda..."
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
                {isSubmitting ? 'Guardando...' : (debt ? 'Actualizar' : 'Guardar')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}