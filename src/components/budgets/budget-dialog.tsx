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
      <DialogContent className="sm:max-w-[425px] glass-card depth-3">
        <DialogHeader className="space-y-3 pb-4 border-b border-border/30">
          <div className="relative">
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              {budget ? t('budget_dialog.edit_title') : t('budget_dialog.add_title')}
            </DialogTitle>
            <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
          <DialogDescription className="text-muted-foreground/80 leading-relaxed">
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
                  <FormLabel className="text-sm font-medium text-foreground/90">{t('common.category')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!budget}>
                    <FormControl>
                      <SelectTrigger className="glass-effect hover-lift transition-all duration-300 hover:bg-background/80 hover:border-primary/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder={t('budget_dialog.select_category')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glass-card depth-2 border-border/40">
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
                            <SelectItem
                              key={cat.id}
                              value={cat.id}
                              className="hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200"
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-primary" />
                                <span className="font-medium">{categoryName}</span>
                                <span className="text-xs text-muted-foreground/70 ml-auto">({categoryType})</span>
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
                   <FormLabel className="text-sm font-medium text-foreground/90">{t('common.amount')}</FormLabel>
                   <FormControl>
                     <Input
                       type="number"
                       placeholder="0.00"
                       className="glass-effect hover-lift transition-all duration-300 focus:bg-background/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                       {...field}
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
            <DialogFooter className="pt-4 border-t border-border/30">
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium px-6 py-2 h-10 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover-lift"
              >
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
