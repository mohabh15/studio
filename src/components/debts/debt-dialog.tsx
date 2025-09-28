'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';


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
   const { user } = useAuth();
   const [isSubmitting, setIsSubmitting] = useState(false);

   const debtSchema = z.object({
     direction: z.enum(['outgoing', 'incoming']),
     tipo: z.enum(['credit_card', 'personal_loan', 'mortgage', 'student_loan', 'car_loan', 'other']),
     monto: z.number().min(0.01, t('debt_dialog.validation.amount_required')),
     monto_actual: z.number().min(0, t('debt_dialog.validation.current_amount_negative')),
     tasa_interes: z.number().min(0, t('debt_dialog.validation.interest_rate_min')),
     pagos_minimos: z.number().min(0, t('debt_dialog.validation.minimum_payment_required')),
     fecha_vencimiento: z.string().min(1, t('debt_dialog.validation.due_date_required')),
     descripcion: z.string().optional(),
   }).refine((data) => {
     if (data.direction === 'outgoing') {
       return data.tasa_interes > 0;
     }
     return true;
   }, {
     message: t('debt_dialog.validation.interest_rate_required_for_outgoing'),
     path: ['tasa_interes'],
   }).refine((data) => {
     if (data.direction === 'outgoing') {
       return data.pagos_minimos >= 0.01;
     }
     return data.pagos_minimos >= 0;
   }, {
     message: t('debt_dialog.validation.minimum_payment_required_for_outgoing'),
     path: ['pagos_minimos'],
   });

   type DebtFormValues = z.infer<typeof debtSchema>;

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      direction: 'outgoing',
      tipo: 'credit_card',
      monto: 0,
      monto_actual: 0,
      tasa_interes: 0,
      pagos_minimos: 0,
      fecha_vencimiento: '',
      descripcion: '',
    },
  });

  const direction = useWatch({ control: form.control, name: 'direction' });

  useEffect(() => {
    if (debt) {
      form.reset({
        direction: (debt as any).direction || 'outgoing',
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
        direction: 'outgoing',
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
      const { direction, ...rest } = values;
      const debtData: Omit<Debt, 'id'> & { direction: string } = {
         ...rest,
         direction,
         userId: user?.uid || '',
         fecha_creacion: debt?.fecha_creacion || new Date().toISOString(),
       };
      await onSave(debtData as any);
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
            {debt ? t('debt_dialog.edit_title') : t('debt_dialog.add_title')}
          </DialogTitle>
          <DialogDescription>
            {debt
              ? t('debt_dialog.edit_description')
              : t('debt_dialog.add_description')
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
               control={form.control}
               name="direction"
               render={({ field }) => (
                 <FormItem className="space-y-3">
                   <FormLabel>{t('debt_dialog.debt_direction')}</FormLabel>
                   <FormControl>
                     <div className="flex gap-4">
                       <Card
                         className={cn(
                           "cursor-pointer p-4 transition-colors hover:bg-accent bg-background",
                           field.value === 'outgoing' ? "bg-accent" : ""
                         )}
                         onClick={() => field.onChange('outgoing')}
                       >
                         <div className="flex items-center gap-2">
                           <ArrowUp className="h-5 w-5 text-red-500" />
                           <span className="text-sm font-medium">Outgoing (Debo dinero)</span>
                         </div>
                       </Card>
                       <Card
                         className={cn(
                           "cursor-pointer p-4 transition-colors hover:bg-accent bg-background",
                           field.value === 'incoming' ? "bg-accent" : ""
                         )}
                         onClick={() => field.onChange('incoming')}
                       >
                         <div className="flex items-center gap-2">
                           <ArrowDown className="h-5 w-5 text-green-500" />
                           <span className="text-sm font-medium">Incoming (Me deben dinero)</span>
                         </div>
                       </Card>
                     </div>
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
                   <FormLabel>{t('debt_dialog.debt_type')}</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl>
                       <SelectTrigger>
                         <SelectValue placeholder={t('debt_dialog.select_debt_type')} />
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
                    <FormLabel>{t('debt_dialog.original_amount')}</FormLabel>
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
                    <FormLabel>{t('debt_dialog.current_amount')}</FormLabel>
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
              {direction === 'outgoing' && (
                <FormField
                  control={form.control}
                  name="tasa_interes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('debt_dialog.interest_rate')}</FormLabel>
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
              )}

              <FormField
                control={form.control}
                name="pagos_minimos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{direction === 'incoming' ? 'Cobros esperados' : t('debt_dialog.minimum_payments')}</FormLabel>
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
                  <FormLabel>{t('debt_dialog.due_date')}</FormLabel>
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
                  <FormLabel>{t('debt_dialog.description_optional')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('debt_dialog.description_placeholder')}
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
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('debt_dialog.saving') : (debt ? t('debt_dialog.update') : t('common.save'))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}