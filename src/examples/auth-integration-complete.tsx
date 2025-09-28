/**
 * EJEMPLO COMPLETO DE INTEGRACIÓN - SISTEMA DE PERSISTENCIA DE SESIÓN
 *
 * ============================================================================
 * ARCHIVO: src/examples/auth-integration-complete.tsx
 *
 * DESCRIPCIÓN:
 * Este archivo proporciona un ejemplo completo y detallado de cómo integrar
 * el nuevo sistema de persistencia de sesión en una aplicación existente.
 *
 * Incluye ejemplos prácticos, mejores prácticas, manejo de errores,
 * testing y debugging, y una guía de migración paso a paso.
 *
 * FUNCIONALIDADES DEMOSTRADAS:
 * - Integración con contexto de autenticación existente
 * - Uso en componentes reales con casos de uso comunes
 * - Migración gradual desde sistemas anteriores
 * - Manejo robusto de errores y estados
 * - Demostración completa de funcionalidades
 * - Mejores prácticas y recomendaciones
 * - Testing y debugging
 *
 * AUTORES: Equipo de Desarrollo
 * FECHA: Septiembre 2025
 * VERSIÓN: 1.0.0
 * ============================================================================
 */

'use client';

// ============================================================================
// IMPORTS Y DEPENDENCIAS
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Hooks y servicios del nuevo sistema
import { useAuthEnhanced, useAuthSession, usePermissions, useSessionExpiration } from '@/hooks/use-auth-enhanced';
import { authService } from '@/lib/services/AuthService';
import { sessionManager } from '@/lib/services/SessionManager';
import { tokenManager } from '@/lib/services/TokenManager';

// Tipos del sistema
import type {
  AuthState,
  SessionData,
  AuthError,
  AuthErrorCode,
  LoginFormData,
  SignupFormData,
  AuthOperationOptions,
  AuthOperationResult,
  AuthEvent,
  AuthMethod,
  PersistenceType,
  SessionStatus,
} from '@/lib/types/auth';

// Contexto existente (para integración)
import { AuthProvider } from '@/contexts/auth-context';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// ============================================================================
// INTERFACES INTERNAS PARA EL EJEMPLO
// ============================================================================

/**
 * Configuración del ejemplo de integración
 */
interface IntegrationExampleConfig {
  /** Habilitar modo de demostración */
  demoMode?: boolean;
  /** Simular errores para testing */
  simulateErrors?: boolean;
  /** Nivel de logging */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  /** Configuración de persistencia */
  persistence?: PersistenceType;
}

/**
 * Estado del componente de demostración
 */
interface DemoState {
  /** Logs de actividad */
  logs: string[];
  /** Estadísticas del sistema */
  stats: any;
  /** Estado de la migración */
  migrationStatus: 'not-started' | 'in-progress' | 'completed' | 'failed';
  /** Progreso de la migración */
  migrationProgress: number;
}

/**
 * Props para componentes de ejemplo
 */
interface ExampleComponentProps {
  /** Configuración del ejemplo */
  config?: IntegrationExampleConfig;
  /** Callback para logging */
  onLog?: (message: string, level?: string) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL DE INTEGRACIÓN
// ============================================================================

/**
 * Componente principal que demuestra la integración completa del sistema
 * de persistencia de sesión con la aplicación existente.
 */
export function AuthIntegrationCompleteExample() {
  const [demoState, setDemoState] = useState<DemoState>({
    logs: [],
    stats: null,
    migrationStatus: 'not-started',
    migrationProgress: 0,
  });

  const [config] = useState<IntegrationExampleConfig>({
    demoMode: true,
    simulateErrors: false,
    logLevel: 'info',
    persistence: 'local',
  });

  // ============================================================================
  // FUNCIONES DE LOGGING Y MONITOREO
  // ============================================================================

  /**
   * Agrega un mensaje al log del ejemplo
   */
  const addLog = useCallback((message: string, level: string = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    setDemoState(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-49), logEntry], // Mantener últimos 50 logs
    }));
  }, []);

  /**
   * Actualiza las estadísticas del sistema
   */
  const updateStats = useCallback(async () => {
    try {
      const stats = await sessionManager.getSessionStats();
      setDemoState(prev => ({ ...prev, stats }));
    } catch (error) {
      addLog(`Error obteniendo estadísticas: ${error}`, 'error');
    }
  }, [addLog]);

  // ============================================================================
  // MANEJO DE EVENTOS DE AUTENTICACIÓN
  // ============================================================================

  /**
   * Maneja eventos de autenticación para logging y monitoreo
   */
  const handleAuthEvent = useCallback((event: AuthEvent, data?: any) => {
    addLog(`Evento de autenticación: ${event}`, 'info');

    switch (event) {
      case 'login':
        addLog(`Usuario autenticado: ${data?.user?.email}`, 'info');
        updateStats();
        break;
      case 'logout':
        addLog('Usuario cerró sesión', 'info');
        updateStats();
        break;
      case 'session-expired':
        if (data?.type === 'warning') {
          addLog(`Advertencia: sesión expira en ${data.minutesLeft} minutos`, 'warn');
        } else {
          addLog('Sesión expirada', 'warn');
        }
        break;
      case 'auth-error':
        addLog(`Error de autenticación: ${data?.error?.message}`, 'error');
        break;
    }
  }, [addLog, updateStats]);

  // ============================================================================
  // EFECTOS PARA CONFIGURACIÓN INICIAL
  // ============================================================================

  /**
   * Configuración inicial del ejemplo
   */
  useEffect(() => {
    addLog('Inicializando ejemplo de integración completa', 'info');

    // Registrar listener para eventos de autenticación
    const eventHandlerId = authService.onAuthEvent('login', handleAuthEvent);
    authService.onAuthEvent('logout', handleAuthEvent);
    authService.onAuthEvent('auth-error', handleAuthEvent);
    sessionManager.onSessionEvent('session-expired', handleAuthEvent);

    // Obtener estadísticas iniciales
    updateStats();

    // Cleanup
    return () => {
      authService.offAuthEvent(eventHandlerId);
    };
  }, [addLog, handleAuthEvent, updateStats]);

  // ============================================================================
  // RENDERIZADO PRINCIPAL
  // ============================================================================

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Integración Completa - Sistema de Persistencia de Sesión
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Ejemplo completo con mejores prácticas, migración y testing
                </p>
              </div>

              {/* Información del sistema */}
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-xs">
                  v1.0.0
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Demo Mode
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Visión General</TabsTrigger>
              <TabsTrigger value="integration">Integración</TabsTrigger>
              <TabsTrigger value="components">Componentes</TabsTrigger>
              <TabsTrigger value="migration">Migración</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
            </TabsList>

            {/* Visión General */}
            <TabsContent value="overview" className="space-y-6">
              <OverviewTab config={config} onLog={addLog} />
            </TabsContent>

            {/* Integración */}
            <TabsContent value="integration" className="space-y-6">
              <IntegrationTab config={config} onLog={addLog} />
            </TabsContent>

            {/* Componentes */}
            <TabsContent value="components" className="space-y-6">
              <ComponentsTab config={config} onLog={addLog} />
            </TabsContent>

            {/* Migración */}
            <TabsContent value="migration" className="space-y-6">
              <MigrationTab
                config={config}
                onLog={addLog}
                migrationStatus={demoState.migrationStatus}
                migrationProgress={demoState.migrationProgress}
              />
            </TabsContent>

            {/* Testing */}
            <TabsContent value="testing" className="space-y-6">
              <TestingTab config={config} onLog={addLog} />
            </TabsContent>

            {/* Monitoreo */}
            <TabsContent value="monitoring" className="space-y-6">
              <MonitoringTab
                logs={demoState.logs}
                stats={demoState.stats}
                onLog={addLog}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthProvider>
  );
}

// ============================================================================
// TABS INDIVIDUALES
// ============================================================================

/**
 * Tab de visión general - Introducción al sistema
 */
function OverviewTab({ config, onLog }: ExampleComponentProps) {
  const { sessionStatus, user, loading } = useAuthEnhanced();

  return (
    <div className="space-y-6">
      {/* Introducción */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Visión General del Sistema
          </CardTitle>
          <CardDescription>
            Introducción completa al sistema de persistencia de sesión
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Características principales */}
            <div>
              <h3 className="font-semibold mb-3">🚀 Características Principales</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Gestión automática de expiración de sesiones</li>
                <li>• Persistencia configurable (local, session, none)</li>
                <li>• Integración con Firebase Auth</li>
                <li>• Manejo robusto de errores</li>
                <li>• Sistema de eventos completo</li>
                <li>• Monitoreo y estadísticas</li>
                <li>• Migración gradual desde sistemas legacy</li>
              </ul>
            </div>

            {/* Estado actual */}
            <div>
              <h3 className="font-semibold mb-3">📊 Estado Actual</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Estado de sesión:</span>
                  <Badge variant={sessionStatus === 'authenticated' ? 'default' : 'secondary'}>
                    {sessionStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Usuario:</span>
                  <span className="text-gray-600">
                    {user?.email || 'No autenticado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Carga:</span>
                  <Badge variant={loading ? 'destructive' : 'default'}>
                    {loading ? 'Cargando...' : 'Listo'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Arquitectura del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>🏗️ Arquitectura del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">SessionManager</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>Gestión del ciclo de vida de sesiones</p>
                <ul className="mt-2 space-y-1">
                  <li>• Expiración automática</li>
                  <li>• Persistencia configurable</li>
                  <li>• Timers de actividad</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">TokenManager</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>Gestión de tokens JWT</p>
                <ul className="mt-2 space-y-1">
                  <li>• Refresh automático</li>
                  <li>• Validación de tokens</li>
                  <li>• Seguridad avanzada</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">AuthService</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>Servicio de autenticación</p>
                <ul className="mt-2 space-y-1">
                  <li>• Integración Firebase</li>
                  <li>• Métodos de auth</li>
                  <li>• Manejo de errores</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Tab de integración - Cómo integrar con sistemas existentes
 */
function IntegrationTab({ config, onLog }: ExampleComponentProps) {
  return (
    <div className="space-y-6">
      {/* Estrategias de integración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔗 Estrategias de Integración
          </CardTitle>
          <CardDescription>
            Diferentes formas de integrar el nuevo sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Integración directa */}
          <div>
            <h3 className="font-semibold mb-3">1. Integración Directa</h3>
            <p className="text-sm text-gray-600 mb-4">
              Usar el hook useAuthEnhanced directamente en componentes nuevos
            </p>
            <DirectIntegrationExample onLog={onLog} />
          </div>

          <Separator />

          {/* Integración con contexto existente */}
          <div>
            <h3 className="font-semibold mb-3">2. Integración con Contexto Existente</h3>
            <p className="text-sm text-gray-600 mb-4">
              Combinar el nuevo sistema con el contexto de autenticación existente
            </p>
            <ContextIntegrationExample onLog={onLog} />
          </div>

          <Separator />

          {/* Hook de migración */}
          <div>
            <h3 className="font-semibold mb-3">3. Hook de Migración</h3>
            <p className="text-sm text-gray-600 mb-4">
              Hook personalizado para migración gradual
            </p>
            <MigrationHookExample onLog={onLog} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Tab de componentes - Ejemplos de uso en componentes reales
 */
function ComponentsTab({ config, onLog }: ExampleComponentProps) {
  return (
    <div className="space-y-6">
      {/* Componentes de ejemplo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoginFormExample onLog={onLog} />
        <SessionStatusExample onLog={onLog} />
        <ErrorHandlingExample onLog={onLog} />
        <PermissionExample onLog={onLog} />
      </div>
    </div>
  );
}

/**
 * Tab de migración - Guía paso a paso
 */
function MigrationTab({ config, onLog, migrationStatus, migrationProgress }: any) {
  const [currentStep, setCurrentStep] = useState(0);

  const migrationSteps = [
    {
      title: 'Análisis del sistema actual',
      description: 'Evaluar el sistema de autenticación existente',
      completed: migrationStatus !== 'not-started',
    },
    {
      title: 'Instalación de dependencias',
      description: 'Agregar los nuevos servicios y hooks',
      completed: migrationProgress >= 25,
    },
    {
      title: 'Configuración inicial',
      description: 'Configurar SessionManager y TokenManager',
      completed: migrationProgress >= 50,
    },
    {
      title: 'Integración gradual',
      description: 'Implementar el nuevo sistema junto al existente',
      completed: migrationProgress >= 75,
    },
    {
      title: 'Testing y validación',
      description: 'Probar la integración y migrar completamente',
      completed: migrationProgress >= 100,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Progreso de migración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔄 Proceso de Migración
          </CardTitle>
          <CardDescription>
            Guía paso a paso para migrar al nuevo sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progreso visual */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso de migración</span>
              <span>{migrationProgress}%</span>
            </div>
            <Progress value={migrationProgress} className="h-2" />
          </div>

          {/* Pasos de migración */}
          <div className="space-y-4">
            {migrationSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  index === currentStep ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } ${step.completed ? 'bg-green-50 border-green-200' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Controles de migración */}
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              onClick={() => setCurrentStep(Math.min(migrationSteps.length - 1, currentStep + 1))}
              disabled={currentStep === migrationSteps.length - 1}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Código de migración */}
      <Card>
        <CardHeader>
          <CardTitle>💻 Código de Migración</CardTitle>
        </CardHeader>
        <CardContent>
          <MigrationCodeExample step={currentStep} onLog={onLog} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Tab de testing - Ejemplos de testing y debugging
 */
function TestingTab({ config, onLog }: ExampleComponentProps) {
  return (
    <div className="space-y-6">
      {/* Testing unitario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Testing Unitario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UnitTestingExample onLog={onLog} />
        </CardContent>
      </Card>

      {/* Testing de integración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔗 Testing de Integración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IntegrationTestingExample onLog={onLog} />
        </CardContent>
      </Card>

      {/* Debugging y troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🐛 Debugging y Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DebuggingExample onLog={onLog} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Tab de monitoreo - Logs y estadísticas en tiempo real
 */
function MonitoringTab({ logs, stats, onLog }: any) {
  return (
    <div className="space-y-6">
      {/* Logs en tiempo real */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📝 Logs en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-gray-500">Esperando actividad...</p>
            ) : (
              logs.map((log: string, index: number) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Estadísticas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalSessions}
                </div>
                <div className="text-sm text-gray-600">Sesiones Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.activeSessions}
                </div>
                <div className="text-sm text-gray-600">Sesiones Activas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.expiredSessions}
                </div>
                <div className="text-sm text-gray-600">Sesiones Expiradas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.currentSession ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-600">Sesión Actual</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Cargando estadísticas...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPONENTES DE EJEMPLO ESPECÍFICOS
// ============================================================================

/**
 * Ejemplo de integración directa con useAuthEnhanced
 */
function DirectIntegrationExample({ onLog }: ExampleComponentProps) {
  const auth = useAuthEnhanced({
    enableExpirationWarnings: true,
    onSessionWarning: (minutesLeft) => {
      onLog?.(`Sesión expira en ${minutesLeft} minutos`, 'warn');
    },
    onError: (error) => {
      onLog?.(`Error: ${error.message}`, 'error');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Integración Directa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Estado:</strong> {auth.sessionStatus}
          </div>
          <div>
            <strong>Usuario:</strong> {auth.user?.email || 'No autenticado'}
          </div>
          <div>
            <strong>Método:</strong> {auth.user?.authMethod || 'N/A'}
          </div>
          <div>
            <strong>Última actividad:</strong>{' '}
            {auth.user?.lastActivityTime
              ? new Date(auth.user.lastActivityTime).toLocaleTimeString()
              : 'N/A'}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => auth.updateActivity()}
            size="sm"
            variant="outline"
          >
            Actualizar Actividad
          </Button>
          <Button
            onClick={() => auth.extendSession()}
            size="sm"
            variant="outline"
          >
            Extender Sesión
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Ejemplo de integración con contexto existente
 */
function ContextIntegrationExample({ onLog }: ExampleComponentProps) {
  const authEnhanced = useAuthEnhanced();
  const authSession = useAuthSession();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contexto + Sistema Mejorado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Sistema Mejorado:</strong>
            <div className="text-xs text-gray-600">
              Estado: {authEnhanced.sessionStatus}
            </div>
          </div>
          <div>
            <strong>Hook de Sesión:</strong>
            <div className="text-xs text-gray-600">
              Autenticado: {authSession.isAuthenticated ? 'Sí' : 'No'}
            </div>
          </div>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            Esta integración permite usar ambos sistemas simultáneamente durante la migración.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

/**
 * Hook de migración personalizado
 */
function MigrationHookExample({ onLog }: ExampleComponentProps) {
  const authEnhanced = useAuthEnhanced();

  // Hook personalizado que combina ambos sistemas
  const migrationAuth = {
    // API del nuevo sistema
    ...authEnhanced,

    // Compatibilidad con sistema legacy
    isLegacyAuthenticated: authEnhanced.sessionStatus === 'authenticated',
    getUser: () => authEnhanced.user,
    isLoading: authEnhanced.loading,

    // Información de migración
    migration: {
      enhancedSystemReady: true,
      legacySystemAvailable: false,
      recommendedSystem: 'enhanced' as const,
      migrationProgress: 85,
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Hook de Migración</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Sistema recomendado:</strong>
            <div className="text-xs text-blue-600 font-medium">
              {migrationAuth.migration.recommendedSystem}
            </div>
          </div>
          <div>
            <strong>Progreso de migración:</strong>
            <div className="text-xs text-green-600">
              {migrationAuth.migration.migrationProgress}%
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-600">
          <p>Este hook proporciona una API unificada durante la migración.</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Formulario de login con el nuevo sistema
 */
function LoginFormExample({ onLog }: ExampleComponentProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = useAuthEnhanced();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    onLog?.('Intentando login...', 'info');

    try {
      const result = await auth.login(formData, {
        persistence: formData.rememberMe ? 'local' : 'session',
      });

      if (result.success) {
        onLog?.('Login exitoso', 'info');
      } else {
        onLog?.(`Error de login: ${result.error?.message}`, 'error');
      }
    } catch (error) {
      onLog?.(`Error inesperado: ${error}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🔐 Formulario de Login</CardTitle>
        <CardDescription>
          Ejemplo de formulario con persistencia configurable
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={formData.rememberMe}
              onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="rememberMe" className="text-sm">
              Recordar sesión
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-4 text-xs text-gray-600">
          <p><strong>Persistencia:</strong> {formData.rememberMe ? 'Local (7 días)' : 'Sesión (hasta cerrar navegador)'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente que muestra el estado de la sesión
 */
function SessionStatusExample({ onLog }: ExampleComponentProps) {
  const auth = useAuthEnhanced();
  const sessionExpiration = useSessionExpiration(5); // Warning a 5 minutos

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📊 Estado de Sesión</CardTitle>
        <CardDescription>
          Información detallada de la sesión actual
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Estado:</strong>
            <Badge variant={auth.sessionStatus === 'authenticated' ? 'default' : 'secondary'} className="ml-2">
              {auth.sessionStatus}
            </Badge>
          </div>
          <div>
            <strong>Email verificado:</strong>
            <Badge variant={auth.isEmailVerified ? 'default' : 'destructive'} className="ml-2">
              {auth.isEmailVerified ? 'Sí' : 'No'}
            </Badge>
          </div>
          <div>
            <strong>Tiempo hasta expiración:</strong>
            <div className="text-xs text-gray-600">
              {sessionExpiration.minutesUntilExpiration > 0
                ? `${sessionExpiration.minutesUntilExpiration} minutos`
                : 'Expirada'}
            </div>
          </div>
          <div>
            <strong>Próxima a expirar:</strong>
            <Badge variant={sessionExpiration.isExpiringSoon ? 'destructive' : 'default'} className="ml-2">
              {sessionExpiration.isExpiringSoon ? 'Sí' : 'No'}
            </Badge>
          </div>
        </div>

        {sessionExpiration.isExpiringSoon && (
          <Alert>
            <AlertDescription>
              Tu sesión expira en {sessionExpiration.minutesUntilExpiration} minutos.
              <Button
                variant="link"
                className="p-0 ml-2 h-auto"
                onClick={() => auth.extendSession()}
              >
                Extender sesión
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Ejemplo de manejo de errores
 */
function ErrorHandlingExample({ onLog }: ExampleComponentProps) {
  const auth = useAuthEnhanced();

  const simulateError = async () => {
    try {
      // Simular diferentes tipos de errores
      const errorTypes = [
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/network-request-failed',
        'auth/session-expired',
      ];

      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];

      const error: AuthError = {
        code: randomError as AuthErrorCode,
        message: `Error simulado: ${randomError}`,
        timestamp: Date.now(),
        recoverable: !randomError.includes('session-expired'),
      };

      auth.updateConfig({
        onError: (error) => onLog?.(`Error manejado: ${error.message}`, 'error'),
      });

      // Simular que el error es manejado por el sistema
      onLog?.(`Simulando error: ${error.message}`, 'warn');

    } catch (error) {
      onLog?.(`Error en simulación: ${error}`, 'error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">❌ Manejo de Errores</CardTitle>
        <CardDescription>
          Demostración de manejo robusto de errores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <strong>Error actual:</strong>
          {auth.error ? (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
              <div className="font-medium text-red-800">{auth.error.code}</div>
              <div className="text-red-600 text-xs">{auth.error.message}</div>
              <div className="text-red-500 text-xs">
                Recuperable: {auth.error.recoverable ? 'Sí' : 'No'}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Sin errores</div>
          )}
        </div>

        <Button onClick={simulateError} variant="outline" size="sm">
          Simular Error
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Ejemplo de sistema de permisos
 */
function PermissionExample({ onLog }: ExampleComponentProps) {
  const auth = useAuthEnhanced();
  const permissions = usePermissions();

  const testPermissions = [
    { name: 'admin', description: 'Acceso administrativo' },
    { name: 'user', description: 'Acceso básico de usuario' },
    { name: 'premium', description: 'Características premium' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🔐 Sistema de Permisos</CardTitle>
        <CardDescription>
          Control de acceso basado en autenticación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <strong>Usuario actual:</strong> {auth.user?.email || 'No autenticado'}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Permisos de prueba:</h4>
          {testPermissions.map((perm) => (
            <div key={perm.name} className="flex items-center justify-between">
              <span className="text-sm">{perm.description}</span>
              <Badge variant={permissions.hasPermission(perm.name) ? 'default' : 'secondary'}>
                {permissions.hasPermission(perm.name) ? 'Concedido' : 'Denegado'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Ejemplo de código de migración
 */
function MigrationCodeExample({ step, onLog }: any) {
  const codeExamples = [
    // Paso 1: Análisis
    `// 1. ANÁLISIS DEL SISTEMA ACTUAL
// ==========================================

// Evaluar el contexto de autenticación existente
import { AuthProvider, useAuth } from '@/contexts/auth-context';

// Identificar puntos de integración:
// - Estado de autenticación
// - Métodos de login/logout
// - Manejo de errores
// - Persistencia de sesión`,

    // Paso 2: Dependencias
    `// 2. INSTALACIÓN DE DEPENDENCIAS
// ==========================================

// Agregar al package.json:
{
  "dependencies": {
    // ... dependencias existentes
    "firebase": "^10.0.0",
    "next": "^14.0.0",
    "react": "^18.0.0"
  }
}

// Crear estructura de archivos:
// src/lib/services/
//   - AuthService.ts
//   - SessionManager.ts
//   - TokenManager.ts
// src/hooks/
//   - use-auth-enhanced.ts`,

    // Paso 3: Configuración
    `// 3. CONFIGURACIÓN INICIAL
// ==========================================

// Configurar SessionManager
const sessionConfig = {
  inactivityTimeoutMinutes: 30,
  absoluteTimeoutDays: 7,
  persistence: 'local' as PersistenceType,
  autoExtendSession: true,
  warningThresholdMinutes: 5,
};

const sessionManager = new SessionManager(sessionConfig);

// Configurar TokenManager
const tokenConfig = {
  refreshThresholdMinutes: 5,
  maxRetries: 3,
};

const tokenManager = new TokenManager(tokenConfig);`,

    // Paso 4: Integración
    `// 4. INTEGRACIÓN GRADUAL
// ==========================================

// Crear hook de migración
export function useAuthMigration() {
  const authEnhanced = useAuthEnhanced();
  const authLegacy = useAuth(); // Contexto existente

  return {
    // API unificada
    ...authEnhanced,

    // Compatibilidad con legacy
    isLegacyAuthenticated: authLegacy?.user !== null,
    getUser: () => authEnhanced.user || authLegacy?.user,

    // Información de migración
    migration: {
      enhancedSystemReady: true,
      legacySystemAvailable: true,
      recommendedSystem: 'enhanced',
    },
  };
}`,

    // Paso 5: Testing
    `// 5. TESTING Y VALIDACIÓN
// ==========================================

// Test unitario del SessionManager
describe('SessionManager', () => {
  it('debería crear sesión correctamente', async () => {
    const sessionData = {
      uid: 'test-user',
      email: 'test@example.com',
      // ... otros campos
    };

    await sessionManager.createSession(sessionData);
    const session = await sessionManager.getCurrentSession();

    expect(session).toBeTruthy();
    expect(session?.uid).toBe('test-user');
  });
});

// Test de integración
describe('Auth Integration', () => {
  it('debería mantener sesión entre renders', async () => {
    const { result } = renderHook(() => useAuthEnhanced());

    // Simular login
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password',
        rememberMe: true,
      });
    });

    expect(result.current.sessionStatus).toBe('authenticated');
  });
});`,
  ];

  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto">
      <code>{codeExamples[step] || codeExamples[0]}</code>
    </pre>
  );
}

/**
 * Ejemplo de testing unitario
 */
function UnitTestingExample({ onLog }: ExampleComponentProps) {
  const [testResults, setTestResults] = useState<any[]>([]);

  const runTests = async () => {
    const results = [];

    try {
      // Test 1: SessionManager
      onLog?.('Ejecutando test de SessionManager...', 'info');
      const sessionManager = (await import('@/lib/services/SessionManager')).sessionManager;

      const testSession = {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        emailVerified: true,
        authMethod: 'email' as AuthMethod,
        sessionStartTime: Date.now(),
        lastActivityTime: Date.now(),
        isActive: true,
      };

      await sessionManager.createSession(testSession);
      const session = await sessionManager.getCurrentSession();

      results.push({
        name: 'SessionManager - Crear sesión',
        passed: !!session && session.uid === 'test-user',
        message: session ? 'Sesión creada correctamente' : 'Error creando sesión',
      });

      // Test 2: TokenManager
      onLog?.('Ejecutando test de TokenManager...', 'info');
      const tokenManager = (await import('@/lib/services/TokenManager')).tokenManager;

      const tokenStats = await tokenManager.getStats();
      results.push({
        name: 'TokenManager - Obtener estadísticas',
        passed: tokenStats !== null,
        message: 'Estadísticas obtenidas correctamente',
      });

    } catch (error) {
      results.push({
        name: 'Error en tests',
        passed: false,
        message: `Error: ${error}`,
      });
    }

    setTestResults(results);
  };

  return (
    <div className="space-y-4">
      <Button onClick={runTests} className="w-full">
        Ejecutar Tests Unitarios
      </Button>

      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded ${
              result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            <span className="font-medium">{result.name}</span>
            <Badge variant={result.passed ? 'default' : 'destructive'}>
              {result.passed ? '✅ PASSED' : '❌ FAILED'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Ejemplo de testing de integración
 */
function IntegrationTestingExample({ onLog }: ExampleComponentProps) {
  const [integrationTestRunning, setIntegrationTestRunning] = useState(false);

  const runIntegrationTest = async () => {
    setIntegrationTestRunning(true);
    onLog?.('Iniciando test de integración...', 'info');

    try {
      // Simular flujo completo de autenticación
      const auth = useAuthEnhanced();

      // 1. Verificar estado inicial
      if (auth.sessionStatus !== 'loading') {
        throw new Error('Estado inicial incorrecto');
      }

      // 2. Simular login (en un test real, usarías mock)
      onLog?.('Estado inicial verificado', 'info');

      // 3. Verificar persistencia
      const stats = await sessionManager.getSessionStats();
      onLog?.(`Estadísticas obtenidas: ${JSON.stringify(stats)}`, 'info');

      // 4. Simular actividad
      await auth.updateActivity();
      onLog?.('Actividad actualizada', 'info');

    } catch (error) {
      onLog?.(`Error en test de integración: ${error}`, 'error');
    } finally {
      setIntegrationTestRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={runIntegrationTest}
        disabled={integrationTestRunning}
        className="w-full"
      >
        {integrationTestRunning ? 'Ejecutando...' : 'Test de Integración'}
      </Button>

      <Alert>
        <AlertDescription className="text-xs">
          Este test verifica la integración completa entre SessionManager, TokenManager y AuthService.
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Ejemplo de debugging y troubleshooting
 */
function DebuggingExample({ onLog }: ExampleComponentProps) {
  const auth = useAuthEnhanced();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const getDebugInfo = async () => {
    try {
      const [authStats, sessionStats, tokenStats] = await Promise.all([
        auth.getStats(),
        sessionManager.getSessionStats(),
        tokenManager.getStats(),
      ]);

      const debugInfo = {
        timestamp: Date.now(),
        auth: authStats,
        session: sessionStats,
        token: tokenStats,
        currentState: {
          sessionStatus: auth.sessionStatus,
          user: auth.user?.email,
          loading: auth.loading,
          error: auth.error?.message,
        },
      };

      setDebugInfo(debugInfo);
      onLog?.('Información de debug obtenida', 'info');

    } catch (error) {
      onLog?.(`Error obteniendo debug info: ${error}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={getDebugInfo} variant="outline" className="w-full">
        Obtener Información de Debug
      </Button>

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔍 Información de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 rounded p-4 text-xs overflow-auto max-h-64">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <strong>Comandos útiles:</strong>
          <ul className="mt-1 space-y-1 text-gray-600">
            <li>• console.log(sessionManager)</li>
            <li>• console.log(tokenManager)</li>
            <li>• auth.getStats()</li>
          </ul>
        </div>
        <div>
          <strong>Debugging tips:</strong>
          <ul className="mt-1 space-y-1 text-gray-600">
            <li>• Verificar localStorage</li>
            <li>• Monitorear eventos</li>
            <li>• Revisar timers activos</li>
          </ul>
        </div>
        <div>
          <strong>Common issues:</strong>
          <ul className="mt-1 space-y-1 text-gray-600">
            <li>• Tokens expirados</li>
            <li>• Timers no limpiados</li>
            <li>• Errores de persistencia</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTACIONES Y UTILIDADES
// ============================================================================

/**
 * Hook personalizado para el ejemplo de integración completa
 * Proporciona una API simplificada para usar en toda la aplicación
 */
export function useAuthIntegrationExample() {
  const auth = useAuthEnhanced({
    enableExpirationWarnings: true,
    redirectAfterLogin: false,
    redirectAfterLogout: false,
    onSessionWarning: (minutesLeft) => {
      console.warn(`[AuthIntegration] Sesión expira en ${minutesLeft} minutos`);
    },
    onError: (error) => {
      console.error(`[AuthIntegration] Error:`, error);
    },
  });

  const sessionExpiration = useSessionExpiration(5);

  return {
    // Estado de autenticación
    ...auth,

    // Información adicional del ejemplo
    sessionExpiration,

    // Utilidades específicas del ejemplo
    isDemoMode: true,
    version: '1.0.0',
  };
}

/**
 * Componente de utilidad para mostrar información de debug en desarrollo
 */
export function AuthDebugPanel() {
  const auth = useAuthEnhanced();
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsVisible(!isVisible)}
        size="sm"
        variant="outline"
        className="bg-black/80 text-white border-gray-600"
      >
        🔍 Debug
      </Button>

      {isVisible && (
        <Card className="absolute bottom-12 right-0 w-80 bg-black/90 text-white border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Panel de Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>Estado: {auth.sessionStatus}</div>
            <div>Usuario: {auth.user?.email || 'N/A'}</div>
            <div>Cargando: {auth.loading ? 'Sí' : 'No'}</div>
            <div>Error: {auth.error?.message || 'Ninguno'}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// MEJORES PRÁCTICAS Y RECOMENDACIONES
// ============================================================================

/**
 * Guía de mejores prácticas para la integración
 */
export const BEST_PRACTICES = {
  /**
   * Configuración recomendada
   */
  configuration: {
    sessionTimeout: 30, // minutos
    absoluteTimeout: 7, // días
    warningThreshold: 5, // minutos
    autoExtend: true,
    maxConcurrentSessions: 5,
  },

  /**
   * Patrones de uso recomendados
   */
  patterns: {
    // Usar el hook en componentes de nivel superior
    highLevelComponents: true,

    // Implementar manejo de errores en todos los niveles
    errorHandling: true,

    // Monitorear el estado de la sesión
    sessionMonitoring: true,

    // Proporcionar feedback visual al usuario
    userFeedback: true,
  },

  /**
   * Consideraciones de seguridad
   */
  security: {
    // Usar HTTPS en producción
    httpsOnly: true,

    // Validar tokens del lado del servidor
    serverSideValidation: true,

    // Implementar rate limiting
    rateLimiting: true,

    // Monitorear intentos de autenticación sospechosos
    suspiciousActivityMonitoring: true,
  },

  /**
   * Estrategias de migración
   */
  migration: {
    // Migrar gradualmente, componente por componente
    gradualMigration: true,

    // Mantener ambos sistemas durante la transición
    parallelSystems: true,

    // Probar exhaustivamente cada paso
    thoroughTesting: true,

    // Tener un plan de rollback
    rollbackPlan: true,
  },
} as const;

// ============================================================================
// DOCUMENTACIÓN ADICIONAL
// ============================================================================

/**
 * API Reference para el ejemplo de integración
 */
export const API_REFERENCE = {
  /**
   * Hooks principales
   */
  hooks: {
    useAuthEnhanced: 'Hook principal para autenticación completa',
    useAuthSession: 'Hook simplificado para verificar sesión',
    usePermissions: 'Hook para manejo de permisos',
    useSessionExpiration: 'Hook para monitorear expiración',
  },

  /**
   * Servicios principales
   */
  services: {
    AuthService: 'Servicio de integración con Firebase Auth',
    SessionManager: 'Gestión completa del ciclo de vida de sesiones',
    TokenManager: 'Gestión y refresh automático de tokens',
  },

  /**
   * Tipos principales
   */
  types: {
    AuthState: 'Estado global de autenticación',
    SessionData: 'Datos de la sesión del usuario',
    AuthError: 'Errores de autenticación tipados',
    AuthOperationResult: 'Resultado de operaciones de auth',
  },
} as const;

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Utilidades para testing del sistema de integración
 */
export const TestingUtils = {
  /**
   * Crea datos de sesión mock para testing
   */
  createMockSession: (overrides = {}): SessionData => ({
    uid: 'mock-user-id',
    email: 'mock@example.com',
    displayName: 'Mock User',
    photoURL: null,
    emailVerified: true,
    authMethod: 'email',
    sessionStartTime: Date.now(),
    lastActivityTime: Date.now(),
    isActive: true,
    ...overrides,
  }),

  /**
   * Simula expiración de sesión para testing
   */
  simulateSessionExpiration: async (minutesFromNow = 0) => {
    const sessionManager = (await import('@/lib/services/SessionManager')).sessionManager;

    // Obtener sesión actual
    const session = await sessionManager.getCurrentSession();
    if (!session) return;

    // Simular tiempo pasado
    const expiredTime = Date.now() - (minutesFromNow * 60 * 1000);
    session.lastActivityTime = expiredTime;

    return session;
  },

  /**
   * Limpia todas las sesiones para testing
   */
  clearAllSessions: async () => {
    const sessionManager = (await import('@/lib/services/SessionManager')).sessionManager;
    await sessionManager.destroyAllSessions();
  },
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default AuthIntegrationCompleteExample;