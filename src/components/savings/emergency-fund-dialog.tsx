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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmergencyFund } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { useAuth } from '@/hooks/use-auth';

type EmergencyFundDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (emergencyFundData: Omit<EmergencyFund, 'id'>) => void;
  emergencyFund?: EmergencyFund | null;
};

const emergencyFundSchema = z.object({
  monto_actual: z.number().min(0, 'El monto actual debe ser mayor o igual a 0'),
  monto_objetivo: z.number().min(0, 'El monto objetivo debe ser mayor o igual a 0'),
  gastos_mensuales: z.number().min(0, 'Los gastos mensuales deben ser mayor o igual a 0'),
  meses_cobertura_actual: z.number().min(0, 'Los meses de cobertura deben ser mayor o igual a 0'),
});

type EmergencyFundFormValues = z.infer<typeof emergencyFundSchema>;

export default function EmergencyFundDialog({
  isOpen,
  onOpenChange,
  onSave,
  emergencyFund
}: EmergencyFundDialogProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmergencyFundFormValues>({
    resolver: zodResolver(emergencyFundSchema),
    defaultValues: {
      monto_actual: 0,
      monto_objetivo: 0,
      gastos_mensuales: 0,
      meses_cobertura_actual: 0,
    },
  });

  useEffect(() => {
    if (emergencyFund) {
      form.reset({
        monto_actual: emergencyFund.monto_actual,
        monto_objetivo: emergencyFund.monto_objetivo,
        gastos_mensuales: emergencyFund.gastos_mensuales,
        meses_cobertura_actual: emergencyFund.meses_cobertura_actual,
      });
    } else {
      form.reset({
        monto_actual: 0,
        monto_objetivo: 0,
        gastos_mensuales: 0,
        meses_cobertura_actual: 0,
      });
    }
  }, [emergencyFund, form]);

  const onSubmit = async (values: EmergencyFundFormValues) => {
    if (!user?.uid) {
      console.error('Usuario no autenticado');
      return;
    }

    setIsSubmitting(true);
    try {
      const emergencyFundData = {
        monto_actual: Number(values.monto_actual) || 0,
        monto_objetivo: Number(values.monto_objetivo) || 0,
        gastos_mensuales: Number(values.gastos_mensuales) || 0,
        meses_cobertura_actual: Number(values.meses_cobertura_actual) || 0,
        userId: user.uid,
        fecha_creacion: emergencyFund?.fecha_creacion || new Date().toISOString(),
      };

      await onSave(emergencyFundData);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving emergency fund:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-4 sm:p-6">
        <DialogHeader className="space-y-1 pb-2 border-b border-border/30">
          <div className="relative">
            <DialogTitle className="text-xl font-semibold">
              {emergencyFund ? 'Editar Fondo de Emergencia' : 'Configurar Fondo de Emergencia'}
            </DialogTitle>
            <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
          <DialogDescription className="text-muted-foreground/80 leading-relaxed">
            {emergencyFund
              ? 'Modifica la configuración de tu fondo de emergencia'
              : 'Configura tu fondo de emergencia para protegerte financieramente'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="monto_actual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Monto Actual (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="glass-effect hover-lift transition-all duration-300"
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
              name="monto_objetivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Monto Objetivo (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="glass-effect hover-lift transition-all duration-300"
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
              name="gastos_mensuales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Gastos Mensuales (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="glass-effect hover-lift transition-all duration-300"
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
              name="meses_cobertura_actual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Meses de Cobertura Actual</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      className="glass-effect hover-lift transition-all duration-300"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 border-t border-border/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="glass-effect hover-lift transition-all duration-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium"
              >
                {isSubmitting ? 'Guardando...' : (emergencyFund ? 'Actualizar' : 'Guardar')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}