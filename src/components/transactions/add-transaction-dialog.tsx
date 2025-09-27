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

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      date: new Date(),
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        type: 'expense',
        amount: 0,
        date: new Date(),
        category: '',
        merchant: '',
        notes: '',
      });
      setActiveType('expense');
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
      <DialogContent className="sm:max-w-[480px] p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>{t('add_transaction_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('add_transaction_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="relative mt-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById('receipt-upload')?.click()}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('add_transaction_dialog.scanning')}...
              </>
            ) : (
              <>
                <ScanLine className="mr-2 h-4 w-4" />
                {t('add_transaction_dialog.scan_receipt')}
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

        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <span className="relative bg-background px-2 text-xs uppercase text-muted-foreground">
            {t('add_transaction_dialog.or_manual')}
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={activeType === 'expense' ? 'default' : 'outline'}
                className={activeType === 'expense' ? 'bg-red-500 hover:bg-red-600 text-white' : 'hover:bg-red-500'}
                onClick={() => setActiveType('expense')}
              >
                {t('common.expense')}
              </Button>
              <Button
                type="button"
                variant={activeType === 'income' ? 'default' : 'outline'}
                onClick={() => setActiveType('income')}
              >
                {t('common.income')}
              </Button>
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('add_transaction_dialog.amount')}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('add_transaction_dialog.date')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>{t('add_transaction_dialog.pick_a_date')}</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
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
                    <FormLabel>{t('add_transaction_dialog.category')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('add_transaction_dialog.select_category')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
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
                  <FormLabel>{t('add_transaction_dialog.merchant')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('add_transaction_dialog.merchant_placeholder')} {...field} />
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
                  <FormLabel>{t('add_transaction_dialog.notes')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('add_transaction_dialog.notes_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">{t('add_transaction_dialog.save_transaction')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
