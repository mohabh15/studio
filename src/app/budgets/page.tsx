'use client';

import { useState, useEffect } from 'react';
import type { Category, Budget } from '@/lib/types';
import { useFirestoreBudgets, useFirestoreCategories } from '@/hooks/use-firestore';
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
import BudgetDialog from '@/components/budgets/budget-dialog';
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

const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)} €`;
};

export default function BudgetsPage() {
  const { t } = useI18n();
  const { selectedYear } = useSelectedYear();
  const [isClient, setIsClient] = useState(false);
  const { budgets: allBudgets, loading: budgetsLoading, addBudget, updateBudget, deleteBudget } = useFirestoreBudgets();
  const { categories, loading: categoriesLoading } = useFirestoreCategories();
  const budgets = allBudgets; // TODO: filter by year if budgets have year
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddBudget = () => {
    setEditingBudget(null);
    setDialogOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDeleteBudget = (budget: Budget) => {
    setDeletingBudget(budget);
  }

  const confirmDelete = async () => {
    if (deletingBudget) {
      await deleteBudget(deletingBudget.id);
      setDeletingBudget(null);
    }
  }

  const handleSaveBudget = async (budgetData: Omit<Budget, 'id'>) => {
    if (editingBudget) {
      // Edit
      await updateBudget(editingBudget.id, budgetData);
    } else {
      // Add
      await addBudget(budgetData);
    }
    setDialogOpen(false);
  };

  const findCategory = (id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  };

  if (!isClient || budgetsLoading || categoriesLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('budgets_page.title')}</h1>
            <p className="text-muted-foreground">{t('budgets_page.description')}</p>
          </div>
          <Button size="sm" onClick={handleAddBudget}>
            <PlusCircle className="mr-1 h-4 w-4" />
            {t('budgets_page.add_budget')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('budgets_page.all_budgets')}</CardTitle>
          </CardHeader>
          <CardContent>
            {budgets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.category')}</TableHead>
                    <TableHead className="text-right">{t('common.amount')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map(budget => {
                    const category = findCategory(budget.category);
                    const Icon = category ? getIcon(category.icon as any) : null;
                    return (
                      <TableRow key={budget.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                            <span className="font-medium">{category ? (() => {
                              const stripped = category.name.replace(/^categories\./, '');
                              const translated = t(`categories.${stripped}`);
                              return translated === `categories.${stripped}` ? stripped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
                            })() : t('common.uncategorized')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(budget.amount)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEditBudget(budget)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>{t('common.edit')}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteBudget(budget)} className="text-destructive hover:!bg-red-500 hover:!text-white">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{t('common.delete')}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
                <div className="flex h-[200px] w-full items-center justify-center rounded-md border-2 border-dashed">
                  <p className="text-muted-foreground">{t('budgets_page.no_budgets')}</p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BudgetDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveBudget}
        budget={editingBudget}
        categories={categories}
        existingBudgets={budgets}
      />
      
      <AlertDialog open={!!deletingBudget} onOpenChange={() => setDeletingBudget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('budgets_page.delete_dialog_title')}</AlertDialogTitle>
            <AlertDialogDescription>
             {t('budgets_page.delete_dialog_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingBudget(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
