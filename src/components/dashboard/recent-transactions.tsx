'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Transaction, type Category } from '@/lib/types';
import { format } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import { getIcon } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
};

export default function RecentTransactions({ transactions, categories }: RecentTransactionsProps) {
  const { t } = useI18n();

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const findCategory = (id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recent_transactions.title')}</CardTitle>
        <CardDescription>{t('dashboard.recent_transactions.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {recentTransactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.recent_transactions.details')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('dashboard.recent_transactions.date')}</TableHead>
                <TableHead className="text-right">{t('dashboard.recent_transactions.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => {
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
            <p className="text-muted-foreground">{t('dashboard.recent_transactions.no_transactions')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type RecentTransactionsProps = {
  transactions: Transaction[];
  categories: Category[];
};
