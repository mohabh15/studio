'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, Settings, Wallet, CreditCard } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useShowDebts } from '@/hooks/use-show-debts';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const { t } = useI18n();
  const { showDebts } = useShowDebts();
  const pathname = usePathname();

  const allNavItems = [
    { href: '/', label: t('nav.overview'), icon: Home },
    { href: '/transactions', label: t('nav.transactions'), icon: List },
    { href: '/debts', label: t('nav.debts'), icon: CreditCard, show: showDebts },
    { href: '/budgets', label: t('nav.budgets'), icon: Wallet },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const navItems = allNavItems.filter(item => item.show !== false);

  const NavLink = ({ item }: { item: typeof navItems[0] }) => (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center flex-1 gap-1 py-2 transition-colors sm:py-3',
        pathname === item.href
          ? 'text-primary'
          : 'text-muted-foreground hover:text-primary'
      )}
    >
      <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
      <span className="text-xs font-medium text-center whitespace-pre-wrap leading-tight sm:text-sm">{item.label}</span>
    </Link>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-20 sm:h-24 w-full max-w-md items-center px-4 sm:px-6">
        {navItems.map(item => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </div>
  );
}
