'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import type { Budget, Category, RedistributionTarget } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { validateRedistributionTargets } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';

const redistributionTargetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  percentage: z.coerce.number().min(0.1).max(100, 'Percentage must be between 0.1 and 100'),
});

const surplusStrategySchema = z.object({
  type: z.enum(['redistribute', 'save', 'invest', 'ignore', 'rollover']).optional(),
  redistributionTargets: z.array(redistributionTargetSchema).optional(),
}).refine((data) => {
  if (data.type === 'redistribute') {
    return data.redistributionTargets && data.redistributionTargets.length > 0 && validateRedistributionTargets(data.redistributionTargets);
  }
  return true;
}, {
  message: 'Redistribution targets must sum to 100% and each must be greater than 0',
  path: ['redistributionTargets'],
});

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  surplusStrategy: surplusStrategySchema.optional(),
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
      amount: undefined,
      surplusStrategy: {
        type: 'rollover',
        redistributionTargets: [],
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'surplusStrategy.redistributionTargets',
  });

  useEffect(() => {
    if (budget) {
      form.reset({
        category: budget.category,
        amount: budget.amount,
        surplusStrategy: budget.surplusStrategy || {
          type: undefined,
          redistributionTargets: [],
        },
      });
    } else {
      form.reset({
        category: '',
        amount: undefined,
        surplusStrategy: {
          type: undefined,
          redistributionTargets: [],
        },
      });
    }
  }, [budget, form, isOpen]);

  const onSubmit = (values: BudgetFormValues) => {
    const surplusStrategy = values.surplusStrategy?.type ? values.surplusStrategy as any : undefined;
    onSave({ category: values.category, amount: values.amount, surplusStrategy, userId });
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
                       onFocus={(e) => e.target.select()}
                       {...field}
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
            <FormField
              control={form.control}
              name="surplusStrategy.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/90">{t('budget_dialog.surplus_strategy')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="glass-effect hover-lift transition-all duration-300 hover:bg-background/80 hover:border-primary/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder={t('budget_dialog.select_strategy')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glass-card depth-2 border-border/40">
                      <SelectItem value="rollover">{t('budget_dialog.strategy_rollover')}</SelectItem>
                      <SelectItem value="ignore">{t('budget_dialog.strategy_ignore')}</SelectItem>
                      <SelectItem value="redistribute">{t('budget_dialog.strategy_redistribute')}</SelectItem>
                      <SelectItem value="save">{t('budget_dialog.strategy_save')}</SelectItem>
                      <SelectItem value="invest">{t('budget_dialog.strategy_invest')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('surplusStrategy.type') === 'redistribute' && (
              <div className="space-y-4">
                <FormLabel className="text-sm font-medium text-foreground/90">{t('budget_dialog.redistribution_targets')}</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end">
                    <FormField
                      control={form.control}
                      name={`surplusStrategy.redistributionTargets.${index}.categoryId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">{t('common.category')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="glass-effect">
                                <SelectValue placeholder={t('budget_dialog.select_category')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(cat => {
                                const Icon = getIcon(cat.icon as any);
                                const categoryName = (() => {
                                  const stripped = cat.name.replace(/^categories\./, '');
                                  const translated = t(`categories.${stripped}`);
                                  return translated === `categories.${stripped}` ? stripped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
                                })();
                                return (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4 text-primary" />
                                      <span className="font-medium">{categoryName}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`surplusStrategy.redistributionTargets.${index}.percentage`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormLabel className="text-xs">{t('common.percentage')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="glass-effect"
                              onFocus={(e) => e.target.select()}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      className="mb-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ categoryId: '', percentage: undefined })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('budget_dialog.add_target')}
                </Button>
              </div>
            )}
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
