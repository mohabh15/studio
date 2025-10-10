'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, List, Settings, Wallet, CreditCard, PiggyBank, Menu, X, LogOut } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useShowDebts } from '@/hooks/use-show-debts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type BottomNavProps = {
  isSidebarOpen?: boolean;
  onSidebarToggle?: (isOpen: boolean) => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show?: boolean;
};

export default function BottomNav({ isSidebarOpen: externalSidebarOpen, onSidebarToggle }: BottomNavProps = {}) {
   const { t } = useI18n();
   const { showDebts } = useShowDebts();
   const pathname = usePathname();
   const isMobile = useIsMobile();
   const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
   const { user, logout } = useAuth();
   const { toast } = useToast();
   const router = useRouter();

  // Usar estado externo si está disponible, sino usar estado interno
  const isSidebarOpen = externalSidebarOpen !== undefined ? externalSidebarOpen : internalSidebarOpen;
  const setIsSidebarOpen = onSidebarToggle || setInternalSidebarOpen;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
      toast({
        title: t('auth.logout_success') || 'Sesión cerrada exitosamente',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('auth.logout_error') || 'Error al cerrar sesión',
      });
    }
  };

  const allNavItems = [
    { href: '/', label: t('nav.overview'), icon: Home },
    { href: '/transactions', label: t('nav.transactions'), icon: List },
    { href: '/debts', label: t('nav.debts'), icon: CreditCard, show: showDebts },
    { href: '/savings', label: t('nav.savings'), icon: PiggyBank },
    { href: '/budgets', label: t('nav.budgets'), icon: Wallet },
  ];

  const navItems = allNavItems.filter(item => item.show !== false);

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = pathname === item.href;

    return (
      <Link
        href={item.href}
        prefetch={true}
        className={cn(
          'relative flex flex-col items-center justify-center flex-1 gap-1 py-2.5 px-1 rounded-xl mx-0.5 sm:py-3 sm:gap-1.5 sm:px-2 sm:mx-1 group',
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

  // Componente para navegación móvil (igual que antes)
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
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

  // Para desktop, no renderizar nada (elementos movidos al header)
  return null;
}

// Componente para enlaces de navegación lateral
function SidebarNavLink({ item, isOpen }: { item: NavItem, isOpen: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      prefetch={true}
      className={cn(
        "relative flex items-center gap-3 pl-0 pr-3 py-3 rounded-xl transition-all duration-300 group",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-primary"
      )}
    >
      {/* Icono */}
      <div className={cn(
        "relative p-1.5 rounded-lg transition-all duration-300 flex-shrink-0",
        isActive
          ? "text-primary"
          : "group-hover:text-primary"
      )}>
        <item.icon className="h-6 w-6" />
      </div>

      {/* Texto */}
      <span className={cn(
        "font-medium text-sm transition-all duration-300 whitespace-nowrap",
        isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden",
        isActive
          ? "text-primary font-semibold"
          : "group-hover:text-primary/90"
      )}>
        {item.label}
      </span>
    </Link>
  );
}
