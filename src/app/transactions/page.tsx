'use client';

import { useState, useEffect } from 'react';
import { Transaction, Category } from '@/lib/types';
import { useFirestoreTransactions, useFirestoreCategories } from '@/hooks/use-firestore';
import AppLayout from '@/components/layout/app-layout';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import { useI18n } from '@/hooks/use-i18n';
import { useSelectedYear } from '@/hooks/use-selected-year';
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
import { CalendarIcon, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
};


export default function TransactionsPage() {
  const { t } = useI18n();
  const { selectedYear } = useSelectedYear();
  const [isClient, setIsClient] = useState(false);
  const { transactions: allTransactions, loading: transactionsLoading } = useFirestoreTransactions();
  const { categories, loading: categoriesLoading } = useFirestoreCategories();
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    fromDate: undefined as Date | undefined,
    toDate: undefined as Date | undefined,
    minAmount: '',
    maxAmount: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  if (!isClient || transactionsLoading || categoriesLoading) {
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
            {t('filters')}
          </Button>
        </div>

        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent>
            <Card>
              <CardHeader>
                <CardTitle>{t('filters')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label htmlFor="category-filter">{t('filter_by_category')}</Label>
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
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
                    <Label htmlFor="type-filter">{t('filter_by_type')}</Label>
                    <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('filter_by_type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">{t('common.income')}</SelectItem>
                        <SelectItem value="expense">{t('common.expense')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('filter_by_date')}</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !filters.fromDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.fromDate ? format(filters.fromDate, 'PPP') : t('from_date')}
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
                              'w-full justify-start text-left font-normal',
                              !filters.toDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.toDate ? format(filters.toDate, 'PPP') : t('to_date')}
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
                    <Label>{t('filter_by_amount')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t('min_amount')}
                        value={filters.minAmount}
                        onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder={t('max_amount')}
                        value={filters.maxAmount}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={clearFilters} variant="outline">
                    {t('clear_filters')}
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
      </main>
    </AppLayout>
  );
}
