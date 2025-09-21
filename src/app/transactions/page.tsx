'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Transaction, Category } from '@/lib/types';
import { sampleTransactions } from '@/lib/sample-data';
import { defaultCategories } from '@/lib/constants';
import AppLayout from '@/components/layout/app-layout';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import { useI18n } from '@/hooks/use-i18n';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { getIcon } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
};


export default function TransactionsPage() {
  const { t } = useI18n();
  const [isClient, setIsClient] = useState(false);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);

  useEffect(() => {
    setIsClient(true);
    if (localStorage.getItem('transactions') === null) {
      setTransactions(sampleTransactions);
    }
    if (localStorage.getItem('categories') === null) {
      setCategories(defaultCategories);
    }
  }, [setTransactions, setCategories]);
  
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const findCategory = (id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  };

  if (!isClient) {
    return <DashboardSkeleton />;
  }

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('transactions_page.title')}</h1>
          <p className="text-muted-foreground">{t('transactions_page.description')}</p>
        </div>

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
                              <p className="text-sm text-muted-foreground">{category?.name || 'Uncategorized'}</p>
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
