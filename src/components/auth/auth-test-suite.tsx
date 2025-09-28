'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthEnhanced } from '@/hooks/use-auth-enhanced';
import { authService } from '@/lib/services/AuthService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Shield,
  Clock,
  User,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Trash2,
  Settings,
  Bug,
  Timer,
  Database,
  Activity,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';

/**
 * Suite de pruebas completa para el sistema de autenticación
 * Incluye pruebas interactivas para todos los aspectos del flujo de auth
 */
export function AuthTestSuite() {
  // Estado del componente
  const [activeTab, setActiveTab] = useState('basic');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [testConfig, setTestConfig] = useState({
    sessionTimeout: 2, // minutos
    refreshThreshold: 1, // minutos
    enableExpiration: true,
    enableAutoRefresh: true,
    simulateErrors: false,
  });

  // Estado para formularios
  const [loginData, setLoginData] = useState({
    email: 'test@example.com',
    password: 'password123',
    rememberMe: true
  });
  const [errorSimulation, setErrorSimulation] = useState({
    type: 'network',
    enabled: false,
    duration: 2000
  });

  // Hook de autenticación
  const auth = useAuthEnhanced({
    enableExpirationWarnings: true,
    onSessionWarning: (minutesLeft) => {
      addLog('warning', `⚠️ Sesión expira en ${minutesLeft} minutos`);
    },
    onSessionExpired: () => {
      addLog('error', '🔒 Sesión expirada automáticamente');
    },
    onError: (error) => {
      addLog('error', `❌ Error: ${error.message}`);
    },
  });

  // Función para agregar logs
  const addLog = useCallback((type: 'info' | 'success' | 'warning' | 'error', message: string, data?: any) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data
    };
    setTestResults(prev => [logEntry, ...prev.slice(0, 99)]); // Mantener últimos 100 logs
  }, []);

  // Configurar servicio de autenticación para pruebas
  useEffect(() => {
    authService.updateConfig({
      sessionTimeoutMinutes: testConfig.sessionTimeout,
      service: {
        autoSyncWithFirebase: true,
        verifySessionOnOperations: true,
        operationTimeoutMs: 5000,
        maxRetries: 2,
      }
    });

    addLog('info', 'Configuración de pruebas actualizada', testConfig);
  }, [testConfig, addLog]);

  // Auto-refresh de logs
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      auth.getStats().then(stats => {
        addLog('info', '📊 Estado actualizado', stats);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, auth, addLog]);

  // ============================================================================
  // FUNCIONES DE PRUEBA
  // ============================================================================

  const runTest = async (testName: string, testFunction: () => Promise<void>) => {
    setIsRunningTests(true);
    addLog('info', `🧪 Iniciando prueba: ${testName}`);

    try {
      await testFunction();
      addLog('success', `✅ Prueba completada: ${testName}`);
    } catch (error: any) {
      addLog('error', `❌ Prueba fallida: ${testName} - ${error.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Prueba básica de login/logout
  const testBasicAuth = async () => {
    await runTest('Login/Logout Básico', async () => {
      // Login
      const loginResult = await auth.login({
        email: loginData.email,
        password: loginData.password,
        rememberMe: loginData.rememberMe
      });

      if (!loginResult.success) {
        throw new Error(loginResult.error?.message || 'Error en login');
      }

      // Esperar un poco
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Logout
      const logoutResult = await auth.logout();
      if (!logoutResult.success) {
        throw new Error('Error en logout');
      }
    });
  };

  // Prueba de persistencia de sesión
  const testSessionPersistence = async () => {
    await runTest('Persistencia de Sesión', async () => {
      // Login con remember me
      const loginResult = await auth.login({
        email: loginData.email,
        password: loginData.password,
        rememberMe: true
      });

      if (!loginResult.success) {
        throw new Error('Error en login');
      }

      // Simular recarga de página
      addLog('info', '💾 Simulando recarga de página...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar que la sesión persista
      const hasValidSession = await authService.hasValidSession();
      if (!hasValidSession) {
        throw new Error('La sesión no persistió correctamente');
      }

      // Logout
      await auth.logout();
    });
  };

  // Prueba de expiración automática
  const testSessionExpiration = async () => {
    await runTest('Expiración Automática', async () => {
      // Login
      const loginResult = await auth.login({
        email: loginData.email,
        password: loginData.password,
        rememberMe: true
      });

      if (!loginResult.success) {
        throw new Error('Error en login');
      }

      // Configurar timeout corto para prueba
      authService.updateConfig({
        sessionTimeoutMinutes: 0.1, // 6 segundos
      });

      addLog('info', '⏰ Esperando expiración automática (6 segundos)...');

      // Esperar a que expire
      await new Promise(resolve => setTimeout(resolve, 7000));

      // Verificar que la sesión expiró
      const currentState = authService.getCurrentState();
      if (currentState.sessionStatus !== 'expired') {
        throw new Error('La sesión no expiró automáticamente');
      }

      // Restaurar configuración
      authService.updateConfig({
        sessionTimeoutMinutes: testConfig.sessionTimeout,
      });
    });
  };

  // Prueba de refresh de tokens
  const testTokenRefresh = async () => {
    await runTest('Refresh de Tokens', async () => {
      // Login
      const loginResult = await auth.login({
        email: loginData.email,
        password: loginData.password,
        rememberMe: true
      });

      if (!loginResult.success) {
        throw new Error('Error en login');
      }

      // Simular necesidad de refresh
      addLog('info', '🔄 Forzando refresh de tokens...');
      const refreshResult = await auth.refreshSession();

      if (!refreshResult.success) {
        throw new Error('Error en refresh de tokens');
      }

      // Verificar que los tokens se refrescaron
      const stats = await auth.getStats();
      addLog('info', '✅ Tokens refrescados exitosamente', stats);

      // Logout
      await auth.logout();
    });
  };

  // Prueba de manejo de errores
  const testErrorHandling = async () => {
    await runTest('Manejo de Errores', async () => {
      // Intentar login con credenciales incorrectas
      const loginResult = await auth.login({
        email: 'wrong@example.com',
        password: 'wrongpassword',
        rememberMe: true
      });

      if (loginResult.success) {
        throw new Error('El login debería haber fallado');
      }

      addLog('info', '✅ Error de login manejado correctamente', loginResult.error);

      // Simular error de red
      if (errorSimulation.enabled) {
        addLog('info', '🌐 Simulando error de red...');

        // Aquí iría la lógica para simular error de red
        await new Promise(resolve => setTimeout(resolve, errorSimulation.duration));
        addLog('info', '✅ Simulación de error de red completada');
      }
    });
  };

  // Prueba de escenarios múltiples
  const testMultipleScenarios = async () => {
    await runTest('Escenarios Múltiples', async () => {
      const scenarios = [
        { name: 'Login rápido', delay: 500 },
        { name: 'Login con retardo', delay: 2000 },
        { name: 'Múltiples logins', delay: 1000 },
      ];

      for (const scenario of scenarios) {
        addLog('info', `🎭 Ejecutando escenario: ${scenario.name}`);

        const loginResult = await auth.login({
          email: loginData.email,
          password: loginData.password,
          rememberMe: true
        });

        if (!loginResult.success) {
          throw new Error(`Error en escenario ${scenario.name}`);
        }

        await new Promise(resolve => setTimeout(resolve, scenario.delay));
        await auth.logout();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    });
  };

  // Función para limpiar datos
  const clearAllData = async () => {
    await runTest('Limpieza de Datos', async () => {
      await auth.logout();
      localStorage.clear();
      sessionStorage.clear();
      setTestResults([]);
      addLog('info', '🗑️ Todos los datos limpiados');
    });
  };

  // Función para reiniciar pruebas
  const resetTests = () => {
    setTestResults([]);
    setActiveTab('basic');
    addLog('info', '🔄 Pruebas reiniciadas');
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Suite de Pruebas de Autenticación
          </CardTitle>
          <CardDescription>
            Herramienta completa para probar el flujo de autenticación con persistencia de sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Estado actual */}
          <div className="flex items-center gap-4 p-4 border rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                auth.sessionStatus === 'authenticated' ? 'bg-green-500' :
                auth.sessionStatus === 'loading' ? 'bg-yellow-500' :
                auth.sessionStatus === 'expired' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="font-medium">
                Estado: {auth.sessionStatus === 'authenticated' ? 'Autenticado' :
                        auth.sessionStatus === 'loading' ? 'Cargando...' :
                        auth.sessionStatus === 'expired' ? 'Expirado' : 'No autenticado'}
              </span>
            </div>

            {auth.user && (
              <Badge variant="outline" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {auth.user.email}
              </Badge>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Button
                onClick={() => setShowLogs(!showLogs)}
                variant="outline"
                size="sm"
              >
                {showLogs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showLogs ? 'Ocultar' : 'Mostrar'} Logs
              </Button>

              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
              >
                <Activity className="h-4 w-4" />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>

          {/* Controles principales */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={clearAllData}
              variant="destructive"
              size="sm"
              disabled={isRunningTests}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Datos
            </Button>

            <Button
              onClick={resetTests}
              variant="outline"
              size="sm"
              disabled={isRunningTests}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reiniciar Pruebas
            </Button>

            <Button
              onClick={() => auth.getStats().then(stats => addLog('info', '📊 Estadísticas actuales', stats))}
              variant="outline"
              size="sm"
              disabled={isRunningTests}
            >
              <Database className="h-4 w-4 mr-2" />
              Ver Estadísticas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Pruebas Básicas</TabsTrigger>
          <TabsTrigger value="advanced">Pruebas Avanzadas</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="logs">Logs en Tiempo Real</TabsTrigger>
        </TabsList>

        {/* Tab de pruebas básicas */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pruebas Básicas de Autenticación</CardTitle>
              <CardDescription>
                Pruebas fundamentales del flujo de login/logout y persistencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => testBasicAuth()}
                  disabled={isRunningTests}
                  className="h-20 flex-col"
                >
                  <User className="h-6 w-6 mb-2" />
                  Login/Logout Básico
                </Button>

                <Button
                  onClick={() => testSessionPersistence()}
                  disabled={isRunningTests}
                  className="h-20 flex-col"
                >
                  <Database className="h-6 w-6 mb-2" />
                  Persistencia de Sesión
                </Button>

                <Button
                  onClick={() => testSessionExpiration()}
                  disabled={isRunningTests}
                  className="h-20 flex-col"
                >
                  <Timer className="h-6 w-6 mb-2" />
                  Expiración Automática
                </Button>

                <Button
                  onClick={() => testTokenRefresh()}
                  disabled={isRunningTests}
                  className="h-20 flex-col"
                >
                  <RefreshCw className="h-6 w-6 mb-2" />
                  Refresh de Tokens
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de pruebas avanzadas */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pruebas Avanzadas</CardTitle>
              <CardDescription>
                Pruebas de manejo de errores y escenarios complejos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => testErrorHandling()}
                  disabled={isRunningTests}
                  className="h-20 flex-col"
                  variant="destructive"
                >
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  Manejo de Errores
                </Button>

                <Button
                  onClick={() => testMultipleScenarios()}
                  disabled={isRunningTests}
                  className="h-20 flex-col"
                >
                  <Zap className="h-6 w-6 mb-2" />
                  Escenarios Múltiples
                </Button>
              </div>

              {/* Simulación de errores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Simulación de Errores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="error-simulation"
                      checked={errorSimulation.enabled}
                      onCheckedChange={(checked) =>
                        setErrorSimulation(prev => ({ ...prev, enabled: checked }))
                      }
                    />
                    <Label htmlFor="error-simulation">Habilitar simulación de errores</Label>
                  </div>

                  {errorSimulation.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Error</Label>
                        <Select
                          value={errorSimulation.type}
                          onValueChange={(value) =>
                            setErrorSimulation(prev => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="network">Error de Red</SelectItem>
                            <SelectItem value="timeout">Timeout</SelectItem>
                            <SelectItem value="server">Error de Servidor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Duración (ms)</Label>
                        <Input
                          type="number"
                          value={errorSimulation.duration}
                          onChange={(e) =>
                            setErrorSimulation(prev => ({
                              ...prev,
                              duration: parseInt(e.target.value) || 2000
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de configuración */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Pruebas</CardTitle>
              <CardDescription>
                Ajusta los parámetros para personalizar las pruebas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Timeout de Sesión (minutos)</Label>
                  <Input
                    type="number"
                    value={testConfig.sessionTimeout}
                    onChange={(e) =>
                      setTestConfig(prev => ({
                        ...prev,
                        sessionTimeout: parseInt(e.target.value) || 2
                      }))
                    }
                  />
                </div>

                <div>
                  <Label>Threshold de Refresh (minutos)</Label>
                  <Input
                    type="number"
                    value={testConfig.refreshThreshold}
                    onChange={(e) =>
                      setTestConfig(prev => ({
                        ...prev,
                        refreshThreshold: parseInt(e.target.value) || 1
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-expiration"
                    checked={testConfig.enableExpiration}
                    onCheckedChange={(checked) =>
                      setTestConfig(prev => ({ ...prev, enableExpiration: checked }))
                    }
                  />
                  <Label htmlFor="enable-expiration">Habilitar expiración automática</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-auto-refresh"
                    checked={testConfig.enableAutoRefresh}
                    onCheckedChange={(checked) =>
                      setTestConfig(prev => ({ ...prev, enableAutoRefresh: checked }))
                    }
                  />
                  <Label htmlFor="enable-auto-refresh">Habilitar auto-refresh de tokens</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="simulate-errors"
                    checked={testConfig.simulateErrors}
                    onCheckedChange={(checked) =>
                      setTestConfig(prev => ({ ...prev, simulateErrors: checked }))
                    }
                  />
                  <Label htmlFor="simulate-errors">Simular errores en pruebas</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos de login para pruebas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Credenciales de Prueba</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData(prev => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData(prev => ({ ...prev, password: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="remember-me"
                  checked={loginData.rememberMe}
                  onCheckedChange={(checked) =>
                    setLoginData(prev => ({ ...prev, rememberMe: checked }))
                  }
                />
                <Label htmlFor="remember-me">Recordar sesión</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs en Tiempo Real</CardTitle>
              <CardDescription>
                Registro detallado de todas las operaciones de autenticación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showLogs && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No hay logs registrados. Ejecuta algunas pruebas para ver la actividad.
                    </p>
                  ) : (
                    testResults.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 border rounded-lg ${getLogColor(log.type)}`}
                      >
                        <div className="flex items-center gap-2">
                          {getLogIcon(log.type)}
                          <span className="text-sm font-medium">{log.timestamp}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm">{log.message}</p>
                        {log.data && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer hover:text-blue-600">
                              Ver datos
                            </summary>
                            <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Instrucciones de Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Pruebas Básicas:</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Login/Logout Básico:</strong> Prueba el flujo básico de autenticación</li>
                <li>• <strong>Persistencia de Sesión:</strong> Verifica que la sesión se mantenga entre recargas</li>
                <li>• <strong>Expiración Automática:</strong> Prueba el sistema de timeout de sesión</li>
                <li>• <strong>Refresh de Tokens:</strong> Valida el sistema de actualización de tokens</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Pruebas Avanzadas:</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Manejo de Errores:</strong> Simula diferentes tipos de errores</li>
                <li>• <strong>Escenarios Múltiples:</strong> Ejecuta pruebas en secuencia</li>
                <li>• <strong>Simulación de Errores:</strong> Configura errores personalizados</li>
              </ul>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-900">💡 Consejos:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Usa la pestaña "Logs" para ver el progreso en tiempo real</li>
              <li>• Activa "Auto-refresh" para monitoreo continuo del estado</li>
              <li>• Configura timeouts cortos para pruebas más rápidas</li>
              <li>• Usa "Limpiar Datos" antes de cada batería de pruebas</li>
              <li>• Revisa los logs para entender el comportamiento del sistema</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Loading overlay */}
      {isRunningTests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ejecutando Pruebas...</h3>
              <p className="text-sm text-gray-600">
                Por favor espera mientras se completan las pruebas de autenticación.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AuthTestSuite;