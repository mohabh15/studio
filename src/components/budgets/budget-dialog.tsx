'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import type { Budget, Category } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

type BudgetDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (budget: Omit<Budget, 'id'>) => void;
  budget: Budget | null;
  categories: Category[];
  existingBudgets: Budget[];
  userId: string;
};

export default function BudgetDialog({
  isOpen,
  onOpenChange,
  onSave,
  budget,
  categories,
  existingBudgets,
  userId,
}: BudgetDialogProps) {
  const { t } = useI18n();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: '',
      amount: 0,
    },
  });

  useEffect(() => {
    if (budget) {
      form.reset(budget);
    } else {
      form.reset({
        category: '',
        amount: 0,
      });
    }
  }, [budget, form, isOpen]);

  const onSubmit = (values: BudgetFormValues) => {
    onSave({ ...values, userId });
  };

  const availableCategories = categories.filter(c =>
    (budget ? c.id === budget.category : !existingBudgets.some(b => b.category === c.id))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {budget ? t('budget_dialog.edit_title') : t('budget_dialog.add_title')}
          </DialogTitle>
          <DialogDescription>
            {budget ? t('budget_dialog.edit_description') : t('budget_dialog.add_description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.category')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!budget}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('budget_dialog.select_category')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <ScrollArea className="h-72">
                        {availableCategories.map(cat => {
                          const Icon = getIcon(cat.icon as any);
                          const categoryName = (() => {
                            const stripped = cat.name.replace(/^categories\./, '');
                            const translated = t(`categories.${stripped}`);
                            return translated === `categories.${stripped}` ? stripped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
                          })();
                          const categoryType = cat.type === 'income' ? t('budget_dialog.category_type_income') : t('budget_dialog.category_type_expense');

                          return (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{categoryName}</span>
                                <span className="text-xs text-muted-foreground ml-auto">({categoryType})</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.amount')}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
