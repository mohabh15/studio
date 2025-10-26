'use client';

import { useState, useEffect } from 'react';
import { Transaction, Category } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/app-layout';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import { useI18n } from '@/hooks/use-i18n';
import { useSelectedYear } from '@/hooks/use-selected-year';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { getIcon } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)} €`;
};


export default function TransactionsPage() {
   const { t } = useI18n();
   const { user, loading: authLoading } = useAuth();
   const { selectedYear } = useSelectedYear();
   const [isClient, setIsClient] = useState(false);
   const userId = user?.uid;
   const { toast } = useToast();
   const {
     transactions: allTransactions,
     categories,
     transactionsLoading,
     categoriesLoading,
     transactionsError,
     categoriesError,
     updateTransaction,
     deleteTransaction,
   } = useData();
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    fromDate: undefined as Date | undefined,
    toDate: undefined as Date | undefined,
    minAmount: '',
    maxAmount: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasError = transactionsError || categoriesError;

  useEffect(() => {
    if (hasError) {
      toast({
        title: "Error al cargar datos",
        description: "Algunos datos no pudieron cargarse. La aplicación sigue siendo funcional.",
        variant: "destructive",
      });
    }
  }, [hasError, toast]);

  const transactions = allTransactions.filter(tx => new Date(tx.date).getFullYear() === selectedYear);
  const filteredTransactions = transactions.filter(tx => {
    if (filters.category && tx.category !== filters.category) return false;
    if (filters.type && tx.type !== filters.type) return false;
    if (filters.fromDate && new Date(tx.date) < filters.fromDate) return false;
    if (filters.toDate && new Date(tx.date) > filters.toDate) return false;
    if (filters.minAmount && tx.amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && tx.amount > parseFloat(filters.maxAmount)) return false;
    return true;
  });
  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const findCategory = (id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      type: '',
      fromDate: undefined,
      toDate: undefined,
      minAmount: '',
      maxAmount: '',
    });
  };

  const isFiltersActive = () => {
    return filters.category || filters.type || filters.fromDate || filters.toDate || filters.minAmount || filters.maxAmount;
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const confirmDelete = async () => {
    if (deletingTransaction) {
      try {
        console.log('Deleting transaction:', deletingTransaction.id);
        await deleteTransaction(deletingTransaction.id);
        console.log('Transaction deleted successfully');
        setDeletingTransaction(null);
        toast({
          title: t('transaction_deleted_title'),
          description: t('transaction_deleted_desc'),
        });
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast({
          title: t('common.error'),
          description: 'Error deleting transaction',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSaveEdit = async (formData: any) => {
    if (editingTransaction) {
      try {
        const updates = {
          type: formData.type,
          amount: parseFloat(formData.amount),
          date: formData.date.toISOString(),
          category: formData.category,
          merchant: formData.merchant || null,
          notes: formData.notes || null,
        };
        await updateTransaction(editingTransaction.id, updates);
        setIsEditDialogOpen(false);
        setEditingTransaction(null);
        toast({
          title: t('transaction_updated_title'),
          description: t('transaction_updated_desc'),
        });
      } catch (error) {
        console.error('Error updating transaction:', error);
        toast({
          title: t('common.error'),
          description: 'Error updating transaction',
          variant: 'destructive',
        });
      }
    }
  };

  if (authLoading || !isClient) {
    return <DashboardSkeleton />;
  }

  if (transactionsLoading || categoriesLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('transactions_page.title')}</h1>
            <p className="text-muted-foreground">{t('transactions_page.description')}</p>
          </div>
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {t('transactions_page.show_filters')}
          </Button>
        </div>

        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent>
            <Card className="mb-4 glass-card depth-2 hover-lift interactive-scale glow-primary">
              <CardHeader>
                <CardTitle>{t('transactions_page.filter_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label htmlFor="category-filter">{t('settings_page.filter_by_category')}</Label>
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('transactions_page.select_category')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
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
                  </div>
                  <div>
                    <Label htmlFor="type-filter">{t('settings_page.filter_by_type')}</Label>
                    <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('transactions_page.select_type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">{t('common.income')}</SelectItem>
                        <SelectItem value="expense">{t('common.expense')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('settings_page.filter_by_date')}</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal rounded-md bg-background text-sm hover:bg-background/80 hover:border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                              !filters.fromDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.fromDate ? format(filters.fromDate, 'PPP') : t('settings_page.from_date')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.fromDate}
                            onSelect={(date) => setFilters(prev => ({ ...prev, fromDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal rounded-md bg-background text-sm hover:bg-background/80 hover:border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                              !filters.toDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.toDate ? format(filters.toDate, 'PPP') : t('settings_page.to_date')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.toDate}
                            onSelect={(date) => setFilters(prev => ({ ...prev, toDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div>
                    <Label>{t('settings_page.filter_by_amount')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t('settings_page.min_amount')}
                        value={filters.minAmount}
                        onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                        className="rounded-md bg-background text-sm hover:border-border hover:bg-background/80 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      <Input
                        type="number"
                        placeholder={t('settings_page.max_amount')}
                        value={filters.maxAmount}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                        className="rounded-md bg-background text-sm hover:border-border hover:bg-background/80 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={clearFilters} variant="outline">
                    {t('settings_page.clear_filters')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Card>
          <CardHeader>
            <CardTitle>{t('transactions_page.all_transactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.recent_transactions.details')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('dashboard.recent_transactions.date')}</TableHead>
                    <TableHead className="text-right">{t('dashboard.recent_transactions.amount')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.map((tx) => {
                    const category = findCategory(tx.category);
                    const Icon = category ? getIcon(category.icon as keyof typeof LucideIcons) : LucideIcons.Package;
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{tx.merchant || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">{category ? (() => {
                                const stripped = category.name.replace(/^categories\./, '');
                                const translated = t(`categories.${stripped}`);
                                return translated === `categories.${stripped}` ? stripped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
                              })() : t('common.uncategorized')}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{format(new Date(tx.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right font-medium">
                          <Badge variant={tx.type === 'income' ? 'default' : 'secondary'} className={tx.type === 'income' ? 'bg-green-500/20 text-green-500' : ''}>
                            {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEditTransaction(tx)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>{t('common.edit')}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteTransaction(tx)} className="text-destructive">
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
                <p className="text-muted-foreground">{t('transactions_page.no_transactions')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Transaction Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('edit_transaction_title')}</DialogTitle>
              <DialogDescription>{t('edit_transaction_description')}</DialogDescription>
            </DialogHeader>
            {editingTransaction && (
              <EditTransactionForm
                transaction={editingTransaction}
                categories={categories}
                onSave={handleSaveEdit}
                onCancel={() => setIsEditDialogOpen(false)}
                t={t}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('delete_transaction_title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('delete_transaction_description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingTransaction(null)}>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} type="button">{t('common.delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AppLayout>
  );
}

// Edit Transaction Form Component
function EditTransactionForm({ transaction, categories, onSave, onCancel, t }: {
  transaction: Transaction;
  categories: Category[];
  onSave: (data: any) => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  const [formData, setFormData] = useState({
    type: transaction.type,
    amount: transaction.amount.toString(),
    date: new Date(transaction.date),
    category: transaction.category,
    merchant: transaction.merchant || '',
    notes: transaction.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-type">{t('add_transaction_dialog.type')}</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'income' | 'expense' }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">{t('common.income')}</SelectItem>
            <SelectItem value="expense">{t('common.expense')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="edit-amount">{t('add_transaction_dialog.amount')}</Label>
        <Input
          id="edit-amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label>{t('add_transaction_dialog.date')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !formData.date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.date ? format(formData.date, 'PPP') : t('add_transaction_dialog.pick_a_date')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.date}
              onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="edit-category">{t('add_transaction_dialog.category')}</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
          <SelectTrigger>
            <SelectValue placeholder={t('add_transaction_dialog.select_category')} />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
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
      </div>

      <div>
        <Label htmlFor="edit-merchant">{t('add_transaction_dialog.merchant')}</Label>
        <Input
          id="edit-merchant"
          value={formData.merchant}
          onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
          placeholder={t('add_transaction_dialog.merchant_placeholder')}
        />
      </div>

      <div>
        <Label htmlFor="edit-notes">{t('add_transaction_dialog.notes')}</Label>
        <Textarea
          id="edit-notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder={t('add_transaction_dialog.notes_placeholder')}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">{t('common.save')}</Button>
      </DialogFooter>
    </form>
  );
}
