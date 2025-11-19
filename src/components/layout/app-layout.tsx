'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import type { Category, Transaction } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useShowDebts } from '@/hooks/use-show-debts';
import { useToast } from '@/hooks/use-toast';
import AddTransactionDialog from '../transactions/add-transaction-dialog';
import BottomNav from './bottom-nav';
import { Button } from '@/components/ui/button';
import { Plus, Wallet, Home, List, Settings, CreditCard, PiggyBank, LogOut } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const userId = user?.uid;
  const { addTransaction, categories } = useData();
  const { showDebts } = useShowDebts();
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();

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

  const handleTransactionAdded = async (newTx: Omit<Transaction, 'id'>) => {
    if (!userId) return;
    await addTransaction(newTx);
    setAddTransactionOpen(false);
  };
  
  return (
    <>
      <div className="flex h-screen w-full flex-col overflow-hidden">
        {/* Header with title - Tema oscuro elegante mejorado */}
        {user && (
          <header className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-background via-card/50 to-background px-3 py-3 sm:px-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Wallet className="h-6 w-6 text-primary flex-shrink-0 sm:h-7 sm:w-7" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-foreground truncate sm:text-xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                {t('app.title')}
              </h1>
            </div>
            {!isMobile && (
              <nav className="flex items-center gap-2">
                {navItems.map(item => (
                  <HeaderNavLink key={item.href} item={item} />
                ))}
              </nav>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user?.displayName || user?.email?.split('@')[0] || 'Usuario'}</span>
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
          </header>
        )}

       <div className="relative overflow-y-auto flex-1 pb-24 md:overflow-y-auto md:flex-1 md:pb-0">
          {/* Línea de separación visual elegante */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
          {children}
        </div>

        {/* Botón flotante para añadir transacción - con efectos elegantes mejorados */}
        {pathname !== '/savings' && pathname !== '/debts' && (
          <div className="fixed bottom-28 right-4 z-40 sm:bottom-24 sm:right-6">
            <div className="relative group">
              {/* Efectos de brillo sutil */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-blue-500/20 to-cyan-400/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Button
                onClick={() => setAddTransactionOpen(true)}
                size="icon"
                className="relative h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-2xl hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all duration-300 border border-blue-500/20 backdrop-blur-sm"
                disabled={!user}
              >
                <Plus className="h-8 w-8 sm:h-9 sm:w-9 text-white drop-shadow-sm" />
                <span className="sr-only">{t('header.add_transaction')}</span>
              </Button>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
      <AddTransactionDialog
        isOpen={isAddTransactionOpen}
        onOpenChange={setAddTransactionOpen}
        onTransactionAdded={handleTransactionAdded}
        categories={categories}
        userId={userId || ''}
      />
    </>
  );
}

// Componente para enlaces de navegación en el header
function HeaderNavLink({ item }: { item: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; show?: boolean; } }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
        isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
      )}
    >
      <item.icon className="h-5 w-5" />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}
