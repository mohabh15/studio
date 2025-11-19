'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { scanReceiptAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, TransactionType, Category } from '@/lib/types';
import { Calendar as CalendarIcon, Loader2, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useI18n } from '@/hooks/use-i18n';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.date(),
  category: z.string().min(1, 'Please select a category'),
  merchant: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

type AddTransactionDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTransactionAdded: (transaction: Omit<Transaction, 'id'>) => void;
  categories: Category[];
  userId: string;
};

export default function AddTransactionDialog({
  isOpen,
  onOpenChange,
  onTransactionAdded,
  categories,
  userId,
}: AddTransactionDialogProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [isScanning, setIsScanning] = useState(false);
  const [activeType, setActiveType] = useState<TransactionType>('expense');
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: undefined,
      date: new Date(),
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        type: 'expense',
        amount: undefined,
        date: new Date(),
        category: '',
        merchant: '',
        notes: '',
      });
      setActiveType('expense');
      setDatePopoverOpen(false);
    }
  }, [isOpen, form]);

  useEffect(() => {
    form.setValue('type', activeType);
  }, [activeType, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const photoDataUri = reader.result as string;
      const result = await scanReceiptAction({ photoDataUri });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: t('add_transaction_dialog.scan_failed_title'),
          description: result.error,
        });
      } else if (result.success) {
        const { amount, date, merchantName } = result.success;
        form.setValue('amount', parseFloat(amount) || 0);
        form.setValue('merchant', merchantName);
        if (date && !isNaN(new Date(date).getTime())) {
          // The AI may return a date with timezone, we need to adjust it to be local.
          const localDate = new Date(date);
          const adjustedDate = new Date(localDate.valueOf() + localDate.getTimezoneOffset() * 60 * 1000);
          form.setValue('date', adjustedDate);
        }
        toast({
          title: t('add_transaction_dialog.scan_successful_title'),
          description: t('add_transaction_dialog.scan_successful_desc'),
        });
      }
      setIsScanning(false);
    };
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('add_transaction_dialog.read_file_error'),
      });
      setIsScanning(false);
    };
  };

  const onSubmit = (values: TransactionFormValues) => {
    onTransactionAdded({
      ...values,
      date: values.date.toISOString(),
      userId,
    });
  };

  const filteredCategories = categories.filter(c => c.type === activeType);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-4 sm:p-6 glass-card depth-3">
        <DialogHeader className="space-y-2 pb-2 border-b border-border/30">
          <div className="relative">
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              {t('add_transaction_dialog.title')}
            </DialogTitle>
            <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
          <DialogDescription className="text-muted-foreground/80 leading-relaxed">
            {t('add_transaction_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="relative mt-2">
          <Button
            variant="outline"
            className="w-full h-10 glass-effect hover-lift interactive-scale border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300"
            onClick={() => document.getElementById('receipt-upload')?.click()}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                <span className="text-primary font-medium">{t('add_transaction_dialog.scanning')}...</span>
              </>
            ) : (
              <>
                <ScanLine className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium">{t('add_transaction_dialog.scan_receipt')}</span>
              </>
            )}
          </Button>
          <input
            id="receipt-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/40" />
          </div>
          <span className="relative bg-card/90 backdrop-blur-sm px-3 py-1 text-xs uppercase text-muted-foreground/80 font-medium rounded-full border border-border/30">
            {t('add_transaction_dialog.or_manual')}
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={activeType === 'expense' ? 'default' : 'outline'}
                className={cn(
                  "h-9 transition-all duration-300 hover-lift interactive-scale font-medium",
                  activeType === 'expense'
                    ? 'bg-gradient-to-r from-error to-error/80 hover:from-error/90 hover:to-error/70 text-white shadow-lg shadow-error/25 border-0'
                    : 'glass-effect border-error/30 hover:border-error/50 hover:bg-error/5 text-error hover:text-error'
                )}
                onClick={() => setActiveType('expense')}
              >
                <span className="drop-shadow-sm">{t('common.expense')}</span>
              </Button>
              <Button
                type="button"
                variant={activeType === 'income' ? 'default' : 'outline'}
                className={cn(
                  "h-9 transition-all duration-300 hover-lift interactive-scale font-medium",
                  activeType === 'income'
                    ? 'bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-white shadow-lg shadow-success/25 border-0'
                    : 'glass-effect border-success/30 hover:border-success/50 hover:bg-success/5 text-success hover:text-success'
                )}
                onClick={() => setActiveType('income')}
              >
                <span className="drop-shadow-sm">{t('common.income')}</span>
              </Button>
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/90">{t('add_transaction_dialog.amount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="glass-effect hover-lift transition-all duration-300 focus:bg-background/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                      onFocus={(e) => e.target.select()}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/90">{t('add_transaction_dialog.date')}</FormLabel>
                    <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal glass-effect hover-lift transition-all duration-300 hover:bg-background/80 hover:border-primary/50',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              <span className="text-foreground">{format(field.value, 'PPP')}</span>
                            ) : (
                              <span className="text-muted-foreground/70">{t('add_transaction_dialog.pick_a_date')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-70 text-primary" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass-card depth-2 border-border/40 z-[9999]" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setTimeout(() => setDatePopoverOpen(false), 100);
                          }}
                          disabled={(date) => date < new Date('1900-01-01')}
                          initialFocus={typeof window !== 'undefined' && !/Safari/.test(navigator.userAgent)}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/90">{t('add_transaction_dialog.category')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass-effect hover-lift transition-all duration-300 hover:bg-background/80 hover:border-primary/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder={t('add_transaction_dialog.select_category')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-card depth-2 border-border/40">
                        {filteredCategories.map(cat => (
                          <SelectItem
                            key={cat.id}
                            value={cat.id}
                            className="hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200"
                          >
                            {(() => {
                              const stripped = cat.name.replace(/^categories\./, '');
                              const translated = t(`categories.${stripped}`);
                              return translated === `categories.${stripped}` ? stripped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
                            })()}
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
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/90">{t('add_transaction_dialog.merchant')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('add_transaction_dialog.merchant_placeholder')}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/90">{t('add_transaction_dialog.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('add_transaction_dialog.notes_placeholder')}
                      className="glass-effect hover-lift transition-all duration-300 focus:bg-background/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 min-h-[60px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2 border-t border-border/30">
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium px-4 py-2 h-9 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover-lift"
              >
                {t('add_transaction_dialog.save_transaction')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

