import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, PlusCircle } from 'lucide-react';

export default function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              BudgetWise
            </h1>
          </div>
          <div className="ml-auto">
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-6" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col gap-4 xl:col-span-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    <TableHead className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableHead>
                                    <TableHead className="text-right"><Skeleton className="h-5 w-20" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-full" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="grid gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <Skeleton className="h-3 w-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
