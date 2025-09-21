import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, Languages, Wallet, Home, List, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

type HeaderProps = {
  onAddTransaction?: () => void;
};

export default function Header({ onAddTransaction }: HeaderProps) {
  const { t, setLocale, locale } = useI18n();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/transactions', label: t('nav.transactions'), icon: List },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2 mr-6">
        <Wallet className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground hidden md:block">
          {t('app.title')}
        </h1>
      </Link>

      <nav className="flex-1">
        <ul className="flex items-center gap-4">
          {navItems.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {onAddTransaction && (
          <Button onClick={onAddTransaction} size="sm" variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('header.add_transaction')}
          </Button>
        )}
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
