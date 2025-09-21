'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { defaultCategories } from '@/lib/constants';
import type { Category, TransactionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Edit, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getIcon } from '@/lib/utils';
import CategoryDialog from '@/components/settings/category-dialog';
import { useI18n } from '@/hooks/use-i18n';
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

export default function SettingsPage() {
  const { t } = useI18n();
  const [isClient, setIsClient] = useState(false);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (localStorage.getItem('categories') === null) {
      setCategories(defaultCategories);
    }
  }, [setCategories]);

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

  const confirmDelete = () => {
    if (deletingCategory) {
      setCategories(prev => prev.filter(c => c.id !== deletingCategory.id));
      setDeletingCategory(null);
    }
  }

  const handleSaveCategory = (categoryData: Omit<Category, 'id'>) => {
    if (editingCategory) {
      // Edit
      setCategories(prev =>
        prev.map(c => (c.id === editingCategory.id ? { ...categoryData, id: c.id } : c))
      );
    } else {
      // Add
      setCategories(prev => [...prev, { ...categoryData, id: new Date().toISOString() }]);
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
                <span className="font-medium">{category.name}</span>
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
                  <DropdownMenuItem onClick={() => handleDeleteCategory(category)} className="text-destructive">
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

  if (!isClient) {
    return <DashboardSkeleton />;
  }

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('settings_page.title')}</h1>
          <p className="text-muted-foreground">{t('settings_page.description')}</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('settings_page.expense_categories')}</CardTitle>
                <CardDescription>{t('settings_page.manage_expense_categories')}</CardDescription>
              </div>
              <Button size="sm" onClick={handleAddCategory}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('settings_page.add_category')}
              </Button>
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
            <AlertDialogAction onClick={confirmDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
