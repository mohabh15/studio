'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, List, Settings, Plus, Wallet, CreditCard } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useShowDebts } from '@/hooks/use-show-debts';
import { cn } from '@/lib/utils';

type BottomNavProps = {
  onAddTransaction?: () => void;
};

export default function BottomNav({ onAddTransaction }: BottomNavProps) {
  const { t } = useI18n();
  const { showDebts } = useShowDebts();
  const pathname = usePathname();

  const allNavItems = [
    { href: '/', label: t('nav.overview'), icon: Home },
    { href: '/transactions', label: t('nav.transactions'), icon: List },
    { href: '/debts', label: 'Deudas', icon: CreditCard, show: showDebts },
    { href: '/budgets', label: t('nav.budgets'), icon: Wallet },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const navItems = allNavItems.filter(item => item.show !== false);

  const NavLink = ({ item }: { item: typeof navItems[0] }) => (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center min-w-[60px] max-w-[80px] gap-0.5 py-1 px-1 transition-colors sm:min-w-[76px] sm:max-w-[96px] sm:px-2',
        pathname === item.href
          ? 'text-primary'
          : 'text-muted-foreground hover:text-primary'
      )}
    >
      <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
      <span className="text-xs font-medium text-center w-full whitespace-pre-wrap leading-tight">{item.label}</span>
    </Link>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 sm:h-20 max-w-sm sm:max-w-md items-center justify-between pl-2 pr-6">
        <div className="flex flex-1 items-center justify-around">
          {navItems.slice(0, 2).map(item => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {onAddTransaction && (
          <div className="relative -top-6 sm:-top-8">
            <Button
              onClick={onAddTransaction}
              size="icon"
              className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary shadow-lg hover:bg-primary/90"
            >
              <Plus className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="sr-only">{t('header.add_transaction')}</span>
            </Button>
          </div>
        )}

        <div className="flex flex-1 items-center justify-around">
          {navItems.slice(2).map(item => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>
    </div>
  );
}
