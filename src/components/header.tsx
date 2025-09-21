import { Button } from '@/components/ui/button';
import { PlusCircle, Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/hooks/use-i18n';
import { SidebarTrigger } from './ui/sidebar';

type HeaderProps = {
  onAddTransaction?: () => void;
};

export default function Header({ onAddTransaction }: HeaderProps) {
  const { t, setLocale, locale } = useI18n();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
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
