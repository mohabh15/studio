import { Button } from '@/components/ui/button';
import { PlusCircle, Wallet } from 'lucide-react';

type HeaderProps = {
  onAddTransaction: () => void;
};

export default function Header({ onAddTransaction }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          BudgetWise
        </h1>
      </div>
      <div className="ml-auto">
        <Button onClick={onAddTransaction} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>
    </header>
  );
}
