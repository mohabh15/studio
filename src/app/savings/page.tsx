'use client';

import { useI18n } from '@/hooks/use-i18n';
import AppLayout from '@/components/layout/app-layout';

export default function SavingsPage() {
  const { t } = useI18n();

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('savings.title') || 'Ahorro'}
          </h1>
          <p className="text-muted-foreground">
            {t('savings.description') || 'Gestión de ahorros e inversiones'}
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[400px] p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Pantalla de ahorro
            </h2>
            <p className="text-muted-foreground">
              Próximamente
            </p>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}