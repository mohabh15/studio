'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type Transaction } from '@/lib/types';
import { findCategory } from '@/lib/constants';
import { format } from 'date-fns';

type RecentTransactionsProps = {
  transactions: Transaction[];
};

const formatCurrency = (amount: number, type: 'income' | 'expense') => {
    const sign = type === 'income' ? '+' : '-';
    return `${sign} ${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)}`;
};

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your 5 most recent transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentTransactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Details</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => {
                const category = findCategory(tx.category);
                const Icon = category?.icon;
                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {Icon && (
                          <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-muted sm:flex">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{category?.name || 'Transaction'}</p>
                          <p className="text-sm text-muted-foreground">{tx.merchant || tx.notes}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{format(new Date(tx.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === 'income' ? 'text-green-500' : 'text-foreground'
                      }`}
                    >
                      {formatCurrency(tx.amount, tx.type)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
            No transactions yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
