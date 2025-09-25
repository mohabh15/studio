'use client';

import { useState, useEffect } from 'react';
import type { Category, TransactionType } from '@/lib/types';
import { useFirestoreCategories } from '@/hooks/use-firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Edit, MoreHorizontal, Languages, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getIcon } from '@/lib/utils';
import CategoryDialog from '@/components/settings/category-dialog';
import { useI18n } from '@/hooks/use-i18n';
import { useSelectedYear } from '@/hooks/use-selected-year';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import AppLayout from '@/components/layout/app-layout';
import { defaultCategories } from '@/lib/constants';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { t, setLocale, locale } = useI18n();
  const { selectedYear, updateSelectedYear } = useSelectedYear();
  const [isClient, setIsClient] = useState(false);
  const { categories, loading: categoriesLoading, addCategory, updateCategory, deleteCategory } = useFirestoreCategories();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
  }

  const confirmDelete = async () => {
    if (deletingCategory) {
      try {
        console.log('Deleting category:', deletingCategory.id);
        await deleteCategory(deletingCategory.id);
        console.log('Category deleted successfully');
        setDeletingCategory(null);
      } catch (error) {
        console.error('Error deleting category:', error);
        // You could show a toast here
      }
    }
  }

  const initializeDefaultCategories = async () => {
    try {
      for (const category of defaultCategories) {
        await addCategory(category);
      }
      toast({
        title: t('settings_page.categories_initialized_title'),
        description: t('settings_page.categories_initialized_desc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Error initializing categories',
        variant: 'destructive',
      });
    }
  }

  const deleteAllCategories = async () => {
    try {
      for (const category of categories) {
        await deleteCategory(category.id);
      }
      toast({
        title: t('settings_page.categories_deleted_title'),
        description: t('settings_page.categories_deleted_desc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Error deleting categories',
        variant: 'destructive',
      });
    }
  }

  const handleSaveCategory = async (categoryData: Omit<Category, 'id'>) => {
    // Si el nombre ya es una clave de traducción, lo usamos tal cual
    const nameKey = categoryData.name.startsWith('categories.')
      ? categoryData.name
      : `categories.${categoryData.name.toLowerCase().replace(/\s+/g, '_')}`;

    if (editingCategory) {
      // Edit - mantener el ID existente
      await updateCategory(editingCategory.id, { ...categoryData, name: nameKey });
    } else {
      // Add - usar el nombre sin el prefijo como ID
      const id = nameKey.replace('categories.', '');
      await addCategory({ ...categoryData, name: nameKey, id });
    }
    setDialogOpen(false);
  };

  const renderCategoryRows = (type: TransactionType) => {
    return categories
      .filter(c => c.type === type)
      .map(category => {
        const Icon = getIcon(category.icon as any);
        return (
          <TableRow key={category.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{
                  (() => {
                    const stripped = category.name.replace(/^categories\./, '');
                    const translated = t(`categories.${stripped}`);
                    return translated === `categories.${stripped}` ? stripped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
                  })()
                }</span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>{t('common.edit')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteCategory(category)} className="text-destructive hover:!bg-red-500 hover:!text-white">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>{t('common.delete')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        );
      });
  };

  if (!isClient || categoriesLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <AppLayout>
      <main className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('settings_page.title')}</h1>
          <p className="text-muted-foreground">{t('settings_page.description')}</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
                <CardTitle>{t('settings_page.language_title')}</CardTitle>
                <CardDescription>{t('settings_page.language_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>{locale === 'en' ? 'English' : 'Español'}</span>
                    <Languages className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  <DropdownMenuItem onClick={() => setLocale('en')} disabled={locale === 'en'}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocale('es')} disabled={locale === 'es'}>
                    Español
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings_page.year_title')}</CardTitle>
              <CardDescription>{t('settings_page.year_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedYear.toString()} onValueChange={(value) => updateSelectedYear(parseInt(value, 10))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('settings_page.select_year')} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('settings_page.expense_categories')}</CardTitle>
                <CardDescription>{t('settings_page.manage_expense_categories')}</CardDescription>
              </div>
              <div className="flex gap-2">
                {/* <Button variant="outline" className="h-10 flex-1" onClick={initializeDefaultCategories}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t('settings_page.initialize_categories')}
                </Button>
                <Button variant="destructive" className="h-10 flex-1" onClick={deleteAllCategories}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('settings_page.delete_all_categories')}
                </Button> */}
                <Button className="h-10 flex-1" onClick={handleAddCategory}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('settings_page.add_category')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('settings_page.category_name')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderCategoryRows('expense')}</TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings_page.income_categories')}</CardTitle>
              <CardDescription>{t('settings_page.manage_income_categories')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('settings_page.category_name')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderCategoryRows('income')}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      <CategoryDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveCategory}
        category={editingCategory}
      />
      
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings_page.delete_dialog_title')}</AlertDialogTitle>
            <AlertDialogDescription>
             {t('settings_page.delete_dialog_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCategory(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} type="button">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
