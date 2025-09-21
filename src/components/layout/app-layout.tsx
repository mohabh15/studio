'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Wallet, Home, List, Settings } from 'lucide-react';
import Header from '../header';
import AddTransactionDialog from '../transactions/add-transaction-dialog';
import { useI18n } from '@/hooks/use-i18n';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Category, Transaction } from '@/lib/types';
import { defaultCategories } from '@/lib/constants';

type AppLayoutProps = {
  children: React.ReactNode;
  onAddTransaction?: () => void;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', defaultCategories);

  const handleTransactionAdded = (newTx: Omit<Transaction, 'id'>) => {
    const fullTx = { ...newTx, id: new Date().toISOString() };
    setTransactions(prev => [fullTx, ...prev]);
    setAddTransactionOpen(false);
  };
  
  const navItems = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/transactions', label: t('nav.transactions'), icon: List },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {t('app.title')}
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header onAddTransaction={() => setAddTransactionOpen(true)} />
        {children}
      </SidebarInset>
      <AddTransactionDialog
        isOpen={isAddTransactionOpen}
        onOpenChange={setAddTransactionOpen}
        onTransactionAdded={handleTransactionAdded}
        categories={categories}
      />
    </>
  );
}
