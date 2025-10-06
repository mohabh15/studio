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
    return `${new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)} €`;
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
     <Card className="glass-card depth-3 hover-lift">
       <CardHeader className="pb-4">
         <CardTitle className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
           {t('dashboard.recent_transactions.title')}
         </CardTitle>
         <CardDescription className="text-muted-foreground/80">
           {t('dashboard.recent_transactions.description')}
         </CardDescription>
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
              {recentTransactions.map((tx, index) => {
                const category = findCategory(tx.category);
                const Icon = category ? getIcon(category.icon as keyof typeof LucideIcons) : LucideIcons.Package;
                return (
                  <TableRow
                    key={tx.id}
                    className={`group transition-all duration-200 hover:bg-muted/50 hover:shadow-sm ${index % 2 === 0 ? 'bg-muted/20' : ''}`}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-110 ${
                          tx.type === 'income'
                            ? 'bg-success/20 group-hover:bg-success/30'
                            : 'bg-error/20 group-hover:bg-error/30'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            tx.type === 'income' ? 'text-success' : 'text-error'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {tx.merchant || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground/80">{category ? (() => {
                            const stripped = category.name.replace(/^categories\./, '');
                            const translated = t(`categories.${stripped}`);
                            return translated === `categories.${stripped}` ? stripped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
                          })() : t('common.uncategorized')}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-4">
                      <span className="text-sm text-muted-foreground/80 font-medium">
                        {format(new Date(tx.date), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Badge
                        variant={tx.type === 'income' ? 'success' : 'error'}
                        className={`font-semibold transition-all duration-200 group-hover:scale-105 ${
                          tx.type === 'income'
                            ? 'shadow-success/30 shadow-sm'
                            : 'shadow-error/30 shadow-sm'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex h-[250px] w-full items-center justify-center rounded-xl border-2 border-dashed border-border/50 glass-effect">
            <div className="text-center">
              <p className="text-muted-foreground/80 mb-2">
                {t('dashboard.recent_transactions.no_transactions')}
              </p>
              <div className="text-4xl opacity-50">💳</div>
            </div>
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
