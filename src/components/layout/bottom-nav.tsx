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

  // Componente para navegación móvil (igual que antes)
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
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

  // Componente para navegación desktop (barra lateral)
  return (
    <>
      {/* Barra lateral para desktop */}
      <div className={cn(
        "fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out hidden md:block",
        isSidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Fondo glass elegante mejorado */}
        <div className="absolute inset-0 glass-effect border-r border-border/30">
          <div className="h-full bg-gradient-to-r from-background/95 via-background/90 to-background/80 backdrop-blur-xl"></div>
        </div>

        {/* Navegación lateral */}
        <nav className="relative h-full flex flex-col pl-2 pr-4 pt-4">
          {/* Botón para mostrar/esconder la barra lateral - arriba dentro de la barra */}
          {!isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="self-start p-2 mb-8 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-background transition-all duration-200"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <div className="space-y-2 flex-1">
            {navItems.map(item => (
              <SidebarNavLink key={item.href} item={item} isOpen={isSidebarOpen} />
            ))}
          </div>

          {/* Dropdown de perfil de usuario - abajo del todo */}
          <div className="mt-8 mb-4 pt-3 border-t border-border/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn(
                  "relative w-full py-2 pl-0 pr-3 rounded-xl transition-all duration-300 group cursor-pointer justify-start"
                )}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "ml-3 font-medium text-sm transition-all duration-300 whitespace-nowrap overflow-hidden",
                    isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}>
                    {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('nav.settings') || 'Configuración'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout') || 'Cerrar sesión'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* Línea de separación derecha elegante */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent"></div>
      </div>

    </>
  );
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
