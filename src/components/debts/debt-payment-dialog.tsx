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
import { useAuth } from '@/hooks/use-auth';

type DebtPaymentDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (paymentData: Omit<DebtPayment, 'id'>) => void;
  debts: Debt[];
};

export default function DebtPaymentDialog({ isOpen, onOpenChange, onSave, debts }: DebtPaymentDialogProps) {
    const { t } = useI18n();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

   const debtPaymentSchema = z.object({
     debt_id: z.string().min(1, t('debt_payment_dialog.validation.debt_required')),
     amount: z.number().min(0.01, t('debt_payment_dialog.validation.amount_required')),
     date: z.string().min(1, t('debt_payment_dialog.validation.date_required')),
     tipo: z.enum(['regular', 'extra', 'collection']),
     description: z.string().optional(),
   });

   type DebtPaymentFormValues = z.infer<typeof debtPaymentSchema>;

   const form = useForm<DebtPaymentFormValues>({
     resolver: zodResolver(debtPaymentSchema),
    defaultValues: {
      debt_id: '',
      amount: undefined,
      date: new Date().toISOString().split('T')[0],
      tipo: 'regular',
      description: '',
    },
  });

  const selectedDebtId = form.watch('debt_id');
  const selectedDebt = debts.find(debt => debt.id === selectedDebtId);
  const selectedTipo = form.watch('tipo');

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        debt_id: '',
        amount: undefined,
        date: new Date().toISOString().split('T')[0],
        tipo: 'regular',
        description: '',
      });
    }
  }, [isOpen, form]);

  useEffect(() => {
    if (selectedDebt) {
      const isIncoming = selectedDebt.direction === 'incoming';
      form.setValue('tipo', isIncoming ? 'collection' : 'regular');
      if (isIncoming) {
        form.setValue('amount', selectedDebt.monto_actual);
      }
    }
  }, [selectedDebt, form]);

  const onSubmit = async (values: DebtPaymentFormValues) => {
    setIsSubmitting(true);
    try {
      const paymentData: Omit<DebtPayment, 'id'> = {
         ...values,
         userId: user?.uid || '',
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
      <DialogContent className="sm:max-w-[425px] glass-card depth-3">
        <DialogHeader className="space-y-3 pb-4 border-b border-border/30">
          <div className="relative">
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              {t('debt_payment_dialog.title')}
            </DialogTitle>
            <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
          <DialogDescription className="text-muted-foreground/80 leading-relaxed">
            {t('debt_payment_dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="debt_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/90">{t('debt_payment_dialog.debt_label')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="glass-effect hover-lift transition-all duration-300 hover:bg-background/80 hover:border-primary/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder={t('debt_payment_dialog.select_debt')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glass-card depth-2 border-border/40">
                      {debts.map((debt) => (
                        <SelectItem
                          key={debt.id}
                          value={debt.id}
                          className="hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200"
                        >
                          <span className="font-medium">{debt.descripcion || debt.tipo.replace('_', ' ').toUpperCase()} - {formatCurrency(debt.monto_actual)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedDebt && (
              <div className="p-4 glass-card depth-1 border border-border/40 rounded-lg">
                <p className="text-sm font-medium text-primary mb-2">{t('debt_payment_dialog.debt_info')}</p>
                <div className="space-y-1">
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">Monto actual:</span> <span className="font-medium">{formatCurrency(selectedDebt.monto_actual)}</span>
                  </p>
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">Pago mínimo:</span> <span className="font-medium">{formatCurrency(selectedDebt.pagos_minimos)}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/90">
                      {selectedTipo === 'collection' ? t('debt_payment_dialog.collection_amount') : t('debt_payment_dialog.payment_amount')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="glass-effect hover-lift transition-all duration-300 focus:bg-background/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
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
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/90">
                      {selectedTipo === 'collection' ? t('debt_payment_dialog.collection_type') : t('debt_payment_dialog.payment_type')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass-effect hover-lift transition-all duration-300 hover:bg-background/80 hover:border-primary/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-card depth-2 border-border/40">
                        {selectedDebt?.direction === 'incoming' ? (
                          <SelectItem value="collection" className="hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200">
                            <span className="font-medium">Cobro</span>
                          </SelectItem>
                        ) : (
                          <>
                            <SelectItem value="regular" className="hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200">
                              <span className="font-medium">{t('debt_payment_dialog.regular_payment')}</span>
                            </SelectItem>
                            <SelectItem value="extra" className="hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200">
                              <span className="font-medium">{t('debt_payment_dialog.extra_payment')}</span>
                            </SelectItem>
                          </>
                        )}
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
                  <FormLabel className="text-sm font-medium text-foreground/90">
                    {selectedTipo === 'collection' ? t('debt_payment_dialog.collection_date') : t('debt_payment_dialog.payment_date')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="glass-effect hover-lift transition-all duration-300 focus:bg-background/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
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
                  <FormLabel className="text-sm font-medium text-foreground/90">
                    {selectedTipo === 'collection' ? t('debt_payment_dialog.collection_description') : t('debt_payment_dialog.description_optional')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('debt_payment_dialog.description_placeholder')}
                      className="glass-effect hover-lift transition-all duration-300 focus:bg-background/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none"
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
                className="glass-effect hover-lift transition-all duration-300 hover:bg-background/80 hover:border-border/60"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium px-6 py-2 h-10 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover-lift"
              >
                {isSubmitting ? t('debt_payment_dialog.registering') : (selectedTipo === 'collection' ? 'Registrar cobro' : t('debt_payment_dialog.register_payment'))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}