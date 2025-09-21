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
import { iconNames, getIcon } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { ScrollArea } from '../ui/scroll-area';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().min(1, 'Icon is required'),
  type: z.enum(['income', 'expense']),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

type CategoryDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (category: Omit<Category, 'id'>) => void;
  category: Category | null;
};

export default function CategoryDialog({
  isOpen,
  onOpenChange,
  onSave,
  category,
}: CategoryDialogProps) {
  const { t } = useI18n();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: '',
      type: 'expense',
    },
  });

  useEffect(() => {
    if (category) {
      form.reset(category);
    } else {
      form.reset({
        name: '',
        icon: '',
        type: 'expense',
      });
    }
  }, [category, form, isOpen]);

  const onSubmit = (values: CategoryFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? t('category_dialog.edit_title') : t('category_dialog.add_title')}
          </DialogTitle>
          <DialogDescription>
            {category ? t('category_dialog.edit_description') : t('category_dialog.add_description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('category_dialog.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('category_dialog.name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('category_dialog.icon')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('category_dialog.icon_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <ScrollArea className="h-72">
                        {iconNames.map(iconName => {
                          const Icon = getIcon(iconName as any);
                          return (
                            <SelectItem key={iconName} value={iconName}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{iconName}</span>
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('category_dialog.type')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">{t('common.expense')}</SelectItem>
                      <SelectItem value="income">{t('common.income')}</SelectItem>
                    </SelectContent>
                  </Select>
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
