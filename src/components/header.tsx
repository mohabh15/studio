import { Button } from '@/components/ui/button';
import { PlusCircle, Wallet, Settings, Languages } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/hooks/use-i18n';

type HeaderProps = {
  onAddTransaction: () => void;
};

export default function Header({ onAddTransaction }: HeaderProps) {
  const { t, setLocale, locale } = useI18n();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Wallet className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t('app.title')}
        </h1>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Button onClick={onAddTransaction} size="sm" variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('header.add_transaction')}
        </Button>
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">{t('header.settings')}</span>
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Languages className="h-5 w-5" />
              <span className="sr-only">{t('header.change_language')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setLocale('en')}
              disabled={locale === 'en'}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLocale('es')}
              disabled={locale === 'es'}
            >
              Español
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
