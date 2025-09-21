'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, List, Settings, Plus, Wallet } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

type BottomNavProps = {
  onAddTransaction?: () => void;
};

export default function BottomNav({ onAddTransaction }: BottomNavProps) {
  const { t } = useI18n();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: t('nav.overview'), icon: Home },
    { href: '/transactions', label: t('nav.transactions'), icon: List },
    { href: '/budgets', label: t('nav.budgets'), icon: Wallet },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-20 max-w-md items-center">
        <div className="flex flex-1 items-center justify-around">
          {navItems.slice(0, 2).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 transition-colors',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {onAddTransaction && (
          <div className="relative -top-8">
            <Button
              onClick={onAddTransaction}
              size="icon"
              className="h-16 w-16 rounded-full bg-primary shadow-lg hover:bg-primary/90"
            >
              <Plus className="h-8 w-8" />
              <span className="sr-only">{t('header.add_transaction')}</span>
            </Button>
          </div>
        )}

        <div className="flex flex-1 items-center justify-around">
          {navItems.slice(2).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 transition-colors',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
