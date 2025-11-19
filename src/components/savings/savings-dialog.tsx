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
import { Savings, SavingsType } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { useAuth } from '@/hooks/use-auth';

type SavingsDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (savingsData: Omit<Savings, 'id'>) => void;
  savings?: Savings | null;
};

const savingsTypeLabels: Record<Exclude<SavingsType, 'emergency_fund'>, string> = {
  investment: 'Inversión',
  purchase_goal: 'Meta de Compra',
  vacation: 'Vacaciones',
  retirement: 'Jubilación',
  other: 'Otro',
};

const statusLabels = {
  active: 'Activo',
  completed: 'Completado',
  paused: 'Pausado',
};

export default function SavingsDialog({ isOpen, onOpenChange, onSave, savings }: SavingsDialogProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savingsSchema = z.object({
    tipo: z.enum(['investment', 'purchase_goal', 'vacation', 'retirement', 'other']),
    nombre: z.string().min(1, 'El nombre es requerido'),
    monto_actual: z.number().min(0, 'El monto actual debe ser mayor o igual a 0'),
    monto_objetivo: z.number().min(0, 'El monto objetivo debe ser mayor o igual a 0'),
    fecha_objetivo: z.string().optional().default(''),
    descripcion: z.string().optional().default(''),
    interes_anual: z.number().min(0, 'La tasa de interés debe ser mayor o igual a 0').max(100, 'La tasa de interés no puede ser mayor al 100%'),
    status: z.enum(['active', 'completed', 'paused']),
  });

  type SavingsFormValues = z.infer<typeof savingsSchema>;

  const form = useForm<SavingsFormValues>({
    resolver: zodResolver(savingsSchema),
    defaultValues: {
      tipo: 'investment',
      nombre: '',
      monto_actual: undefined,
      monto_objetivo: undefined,
      fecha_objetivo: '',
      descripcion: '',
      interes_anual: undefined,
      status: 'active',
    },
  });

  useEffect(() => {
    if (savings) {
      form.reset({
        tipo: savings.tipo === 'emergency_fund' ? 'investment' : savings.tipo,
        nombre: savings.nombre,
        monto_actual: savings.monto_actual,
        monto_objetivo: savings.monto_objetivo || 0,
        fecha_objetivo: savings.fecha_objetivo ? savings.fecha_objetivo.split('T')[0] : '',
        descripcion: savings.descripcion || '',
        interes_anual: savings.interes_anual || 0,
        status: savings.status,
      });
    } else {
      form.reset({
        tipo: 'investment',
        nombre: '',
        monto_actual: undefined,
        monto_objetivo: undefined,
        fecha_objetivo: '',
        descripcion: '',
        interes_anual: undefined,
        status: 'active',
      });
    }
  }, [savings, form]);

  const onSubmit = async (values: SavingsFormValues) => {
    if (!user?.uid) {
      console.error('Usuario no autenticado');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the savings data object
      const savingsData = {
        tipo: values.tipo,
        nombre: values.nombre.trim(),
        monto_actual: Number(values.monto_actual) || 0,
        monto_objetivo: values.monto_objetivo ? Number(values.monto_objetivo) : undefined,
        fecha_objetivo: values.fecha_objetivo || undefined,
        descripcion: values.descripcion?.trim() || undefined,
        interes_anual: values.interes_anual ? Number(values.interes_anual) : undefined,
        status: values.status,
        userId: user.uid,
        fecha_creacion: savings?.fecha_creacion || new Date().toISOString(),
      };

      // Filter out undefined values before sending to Firestore
      const filteredData = Object.fromEntries(
        Object.entries(savingsData).filter(([_, value]) => value !== undefined)
      ) as Omit<Savings, 'id'>;

      await onSave(filteredData);
      onOpenChange(false);
      form.reset(); // Clear form after successful save
    } catch (error) {
      console.error('Error saving savings:', error);
      // The error is already handled in the hook level and will be displayed via toast in the parent component
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
              {savings ? 'Editar Ahorro' : 'Añadir Ahorro'}
            </DialogTitle>
            <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
          <DialogDescription className="text-muted-foreground/80 leading-relaxed">
            {savings
              ? 'Modifica la información de tu ahorro existente'
              : 'Crea un nuevo ahorro para gestionar tus metas financieras'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Tipo de Ahorro</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass-effect hover-lift transition-all duration-300">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(savingsTypeLabels).map(([value, label]) => (
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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass-effect hover-lift transition-all duration-300">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
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
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Nombre del Ahorro</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Fondo de Emergencia, Vacaciones Europa..."
                      className="glass-effect hover-lift transition-all duration-300"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        onFocus={(e) => e.target.select()}
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
                    <FormLabel className="text-sm font-medium">Objetivo (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="glass-effect hover-lift transition-all duration-300"
                        onFocus={(e) => e.target.select()}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
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
                name="fecha_objetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Fecha Objetivo</FormLabel>
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
                name="interes_anual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Tasa Interés Anual (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="glass-effect hover-lift transition-all duration-300"
                        onFocus={(e) => e.target.select()}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el propósito de este ahorro..."
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
                {isSubmitting ? 'Guardando...' : (savings ? 'Actualizar' : 'Guardar')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}