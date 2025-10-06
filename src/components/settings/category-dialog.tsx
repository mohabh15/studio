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
import { commonIconNames, getIcon } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { Category } from '@/lib/types';
import { useI18n } from '@/hooks/use-i18n';
import { ScrollArea } from '../ui/scroll-area';

const categorySchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  icon: z.string().min(1, { message: 'Icon is required' }),
  type: z.enum(['income', 'expense']),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

type CategoryDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (category: Omit<Category, 'id'>) => void;
  category: Category | null;
  userId: string;
};

export default function CategoryDialog({
  isOpen,
  onOpenChange,
  onSave,
  category,
  userId,
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
      // Si el nombre es una clave de traducción (empieza con 'categories.'), 
      // extraemos el nombre base
      const name = category.name.startsWith('categories.') 
        ? category.name.replace('categories.', '')
        : category.name;
      
      form.reset({
        ...category,
        name
      });
    } else {
      form.reset({
        name: '',
        icon: '',
        type: 'expense',
      });
    }
  }, [category, form, isOpen]);

  const onSubmit = (values: CategoryFormValues) => {
    // Crear un ID para la categoría basado en el nombre (solo para nuevas categorías)
    const categoryId = values.name.toLowerCase().replace(/\s+/g, '_');

    // Asegurarse de que el nombre use el formato de traducción
    const processedValues = {
      ...values,
      name: `categories.${categoryId}`,
      userId
    };

    onSave(processedValues);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-card depth-3">
        <DialogHeader className="space-y-3 pb-4 border-b border-border/30">
          <div className="relative">
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              {category ? t('category_dialog.edit_title') : t('category_dialog.add_title')}
            </DialogTitle>
            <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
          <DialogDescription className="text-muted-foreground/80 leading-relaxed">
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
                  <FormLabel className="text-sm font-medium text-foreground/90">{t('category_dialog.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('category_dialog.name_placeholder')}
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
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/90">{t('category_dialog.icon')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="glass-effect hover-lift transition-all duration-300 hover:bg-background/80 hover:border-primary/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder={t('category_dialog.icon_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glass-card depth-2 border-border/40">
                      <ScrollArea className="h-72">
                        {commonIconNames.map(iconName => {
                          const Icon = getIcon(iconName as keyof typeof LucideIcons);
                          return (
                            <SelectItem
                              key={iconName}
                              value={iconName}
                              className="hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200"
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-primary" />
                                <span className="font-medium">{iconName}</span>
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
                  <FormLabel className="text-sm font-medium text-foreground/90">{t('category_dialog.type')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="glass-effect hover-lift transition-all duration-300 hover:bg-background/80 hover:border-primary/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glass-card depth-2 border-border/40">
                      <SelectItem value="expense" className="hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200">
                        <span className="font-medium text-error">{t('common.expense')}</span>
                      </SelectItem>
                      <SelectItem value="income" className="hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200">
                        <span className="font-medium text-success">{t('common.income')}</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
