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

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = pathname === item.href;

    return (
      <Link
        href={item.href}
        prefetch={true}
        className={cn(
          'relative flex flex-col items-center justify-center flex-1 gap-1 py-2.5 px-1 transition-all duration-300 rounded-xl mx-0.5 sm:py-3 sm:gap-1.5 sm:px-2 sm:mx-1 group interactive-scale',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-primary'
        )}
      >

        {/* Icono con efectos mejorados */}
        <div className={cn(
          "relative p-1.5 rounded-lg transition-all duration-300",
          isActive
            ? "bg-primary/20 text-primary shadow-lg shadow-primary/30"
            : "group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          <item.icon className="h-6 w-6 sm:h-7 sm:w-7 relative z-10" />
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg blur-sm animate-in fade-in duration-300"></div>
          )}
        </div>

        <span className={cn(
          "text-xs font-medium text-center whitespace-pre-wrap leading-tight sm:text-sm transition-all duration-300",
          isActive
            ? "text-primary font-semibold"
            : "group-hover:text-primary/90"
        )}>
          {item.label}
        </span>

      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Fondo glass elegante mejorado */}
      <div className="absolute inset-0 glass-effect border-t border-border/30">
        <div className="h-full bg-gradient-to-t from-background/95 via-background/90 to-background/80 backdrop-blur-xl"></div>
      </div>

      {/* Navegación con efectos mejorados */}
      <nav className="relative mx-auto flex h-20 sm:h-24 w-full max-w-md items-center px-2 sm:px-4">
        {navItems.map(item => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Línea de separación superior elegante */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
    </div>
  );
}
