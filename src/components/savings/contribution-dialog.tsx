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
import { SavingsContribution, Savings, EmergencyFund } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { useAuth } from '@/hooks/use-auth';

type ContributionDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (contributionData: Omit<SavingsContribution, 'id'>) => void;
  savings: Savings[];
  emergencyFund: EmergencyFund[];
};

const contributionTypeLabels = {
  regular: 'Regular',
  extra: 'Extra',
};

export default function ContributionDialog({
  isOpen,
  onOpenChange,
  onSave,
  savings,
  emergencyFund,
}: ContributionDialogProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contributionSchema = z.object({
    savings_id: z.string().min(1, 'Debes seleccionar un destino'),
    amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
    date: z.string().min(1, 'La fecha es requerida'),
    description: z.string().optional().default(''),
    tipo: z.enum(['regular', 'extra']),
  });

  type ContributionFormValues = z.infer<typeof contributionSchema>;

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      savings_id: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      tipo: 'regular',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        savings_id: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        tipo: 'regular',
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (values: ContributionFormValues) => {
    if (!user?.uid) {
      console.error('Usuario no autenticado');
      return;
    }

    setIsSubmitting(true);
    try {
      const contributionData = {
        savings_id: values.savings_id,
        amount: Number(values.amount),
        date: new Date(values.date).toISOString(),
        description: values.description?.trim() || undefined,
        tipo: values.tipo,
        userId: user.uid,
      };

      // Filter out undefined values before sending to Firestore
      const filteredData = Object.fromEntries(
        Object.entries(contributionData).filter(([_, value]) => value !== undefined)
      ) as Omit<SavingsContribution, 'id'>;

      await onSave(filteredData);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving contribution:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const savingsOptions = [
    ...savings.map(saving => ({
      id: saving.id,
      label: `${saving.nombre} (${saving.tipo.replace('_', ' ').toUpperCase()})`,
    })),
    ...(emergencyFund.length > 0 ? [{
      id: 'emergency_fund',
      label: 'Fondo de Emergencia',
    }] : []),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-4 sm:p-6">
        <DialogHeader className="space-y-1 pb-2 border-b border-border/30">
          <div className="relative">
            <DialogTitle className="text-xl font-semibold">
              Añadir Contribución
            </DialogTitle>
            <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
          <DialogDescription className="text-muted-foreground/80 leading-relaxed">
            Añade una contribución a uno de tus ahorros o al fondo de emergencia
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="savings_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Destino de la Contribución</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="glass-effect hover-lift transition-all duration-300">
                        <SelectValue placeholder="Seleccionar destino" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {savingsOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Monto (€)</FormLabel>
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
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Tipo de Contribución</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass-effect hover-lift transition-all duration-300">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(contributionTypeLabels).map(([value, label]) => (
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
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Fecha</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="glass-effect hover-lift transition-all duration-300"
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
                  <FormLabel className="text-sm font-medium">Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe esta contribución..."
                      className="glass-effect hover-lift transition-all duration-300 min-h-[80px] resize-none"
                      {...field}
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
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}