'use client';

import React from 'react';
import { useAuthEnhanced } from '@/hooks/use-auth-enhanced';
import { AuthProvider } from '@/contexts/auth-context';
import { AuthEnhancedDemo, AuthStatus } from './auth-enhanced-demo';

/**
 * Ejemplo de integración del hook useAuthEnhanced con el contexto existente
 *
 * Este componente muestra cómo se puede usar el nuevo hook junto con
 * el contexto de autenticación existente para una migración gradual.
 */
export function AuthIntegrationExample() {
  return (
    <AuthProvider>
      <AuthEnhancedIntegration />
    </AuthProvider>
  );
}

/**
 * Componente que integra ambos sistemas de autenticación
 */
function AuthEnhancedIntegration() {
  // Usar el hook mejorado
  const authEnhanced = useAuthEnhanced({
    enableExpirationWarnings: true,
    redirectAfterLogin: false, // Deshabilitar redirección automática para demo
    redirectAfterLogout: false,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con información de ambos sistemas */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Integración de Sistemas de Autenticación
            </h1>

            {/* Información de ambos sistemas */}
            <div className="flex items-center gap-6">
              {/* Sistema mejorado */}
              <div className="text-sm">
                <div className="font-medium">Sistema Mejorado</div>
                <div className="text-gray-500">
                  Estado: {authEnhanced.sessionStatus}
                </div>
              </div>

              {/* Componente de estado */}
              <AuthStatus />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <AuthEnhancedDemo />
        </div>
      </main>
    </div>
  );
}

/**
 * Hook personalizado que combina ambos sistemas
 * Útil durante la migración del contexto antiguo al nuevo
 */
export function useAuthMigration() {
  // Hook mejorado (nuevo sistema)
  const authEnhanced = useAuthEnhanced();

  // Aquí podrías integrar con el contexto existente si es necesario
  // const authContext = useAuth(); // Contexto existente

  return {
    // API unificada que combina ambos sistemas
    ...authEnhanced,

    // Métodos de compatibilidad para migración gradual
    isLegacyAuthenticated: authEnhanced.sessionStatus === 'authenticated',
    getUser: () => authEnhanced.user,
    isLoading: authEnhanced.loading,

    // Información sobre la migración
    migration: {
      enhancedSystemReady: true,
      legacySystemAvailable: false, // Cambiar cuando integres el contexto legacy
      recommendedSystem: 'enhanced' as const,
    },
  };
}

/**
 * Componente que usa el hook de migración
 */
export function MigratedAuthComponent() {
  const auth = useAuthMigration();

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Componente Migrado</h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Estado:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              auth.isLegacyAuthenticated
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {auth.sessionStatus}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Usuario:</span>
            <span className="text-sm text-gray-600">
              {auth.user?.email || 'No autenticado'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Sistema recomendado:</span>
            <span className="text-sm font-medium text-blue-600">
              {auth.migration.recommendedSystem}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button
            onClick={() => auth.logout()}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}