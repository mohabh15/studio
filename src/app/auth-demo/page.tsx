'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthEnhanced, useAuthSession, usePermissions, useSessionExpiration } from '@/hooks/use-auth-enhanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Shield,
  Clock,
  User,
  LogOut,
  RefreshCw,
  Settings,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Info,
  Zap,
  Timer,
  Database,
  Activity,
  LogIn,
  UserPlus,
  Monitor,
  BookOpen,
  Code,
  Terminal,
  TestTube,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Página completa de demostración del sistema de persistencia de sesión
 * Incluye todas las funcionalidades para probar el sistema de autenticación
 */
export default function AuthDemoPage() {
  const [activeTab, setActiveTab] = useState('demo');
  const [showPasswords, setShowPasswords] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [sessionConfig, setSessionConfig] = useState({
    inactivityTimeout: 30,
    absoluteTimeout: 7,
    warningThreshold: 5,
    autoExtend: true,
  });
  const logRef = useRef<HTMLDivElement>(null);

  // Hooks de autenticación
  const auth = useAuthEnhanced({
    enableExpirationWarnings: true,
    onSessionWarning: (minutesLeft) => {
      addLogMessage(`⚠️ ADVERTENCIA: Sesión expira en ${minutesLeft} minutos`);
    },
    onSessionExpired: () => {
      addLogMessage('🔒 SESIÓN EXPIRADA: Sesión cerrada automáticamente');
    },
    onError: (error) => {
      addLogMessage(`❌ ERROR: ${error.message}`);
    },
  });

  const { isAuthenticated, sessionStatus } = useAuthSession();
  const { hasPermission, hasRole } = usePermissions();
  const { timeUntilExpiration, isExpiringSoon, minutesUntilExpiration } = useSessionExpiration(5);

  // Estado del formulario
  const [loginData, setLoginData] = useState({
    email: 'demo@example.com',
    password: 'demo123456',
    rememberMe: true
  });
  const [signupData, setSignupData] = useState({
    email: 'nuevo@example.com',
    password: 'nuevo123456',
    confirmPassword: 'nuevo123456'
  });

  // Función para agregar mensajes al log
  const addLogMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages(prev => [...prev, `[${timestamp}] ${message}`]);

    // Auto-scroll al final del log
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 100);
  };

  // Auto-refresh para mostrar cambios en tiempo real
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      auth.updateActivity().catch(console.error);
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, auth]);

  // Funciones de demostración
  const handleLogin = async () => {
    addLogMessage(`🔐 Intento de login: ${loginData.email}`);
    const result = await auth.login({
      email: loginData.email,
      password: loginData.password,
      rememberMe: loginData.rememberMe,
    });

    if (result.success) {
      addLogMessage('✅ Login exitoso');
    } else {
      addLogMessage(`❌ Error en login: ${result.error?.message}`);
    }
  };

  const handleSignup = async () => {
    if (signupData.password !== signupData.confirmPassword) {
      addLogMessage('❌ Error: Las contraseñas no coinciden');
      return;
    }

    addLogMessage(`👤 Intento de registro: ${signupData.email}`);
    const result = await auth.signup({
      email: signupData.email,
      password: signupData.password,
      confirmPassword: signupData.confirmPassword,
      acceptTerms: true,
    });

    if (result.success) {
      addLogMessage('✅ Registro exitoso');
    } else {
      addLogMessage(`❌ Error en registro: ${result.error?.message}`);
    }
  };

  const handleLogout = async () => {
    addLogMessage('🚪 Cerrando sesión...');
    const result = await auth.logout();
    if (result.success) {
      addLogMessage('✅ Logout exitoso');
    }
  };

  const handleRefresh = async () => {
    addLogMessage('🔄 Refrescando sesión...');
    const result = await auth.refreshSession();
    if (result.success) {
      addLogMessage('✅ Sesión refrescada');
    }
  };

  const handleExtendSession = async () => {
    addLogMessage('⏰ Extendiendo sesión...');
    const result = await auth.extendSession();
    if (result.success) {
      addLogMessage('✅ Sesión extendida');
    }
  };

  const handleSimulateExpiration = async () => {
    addLogMessage('⏱️ Simulando expiración de sesión...');
    // Cambiar configuración temporalmente para forzar expiración
    const originalTimeout = sessionConfig.inactivityTimeout;
    setSessionConfig(prev => ({ ...prev, inactivityTimeout: 0 }));

    setTimeout(() => {
      setSessionConfig(prev => ({ ...prev, inactivityTimeout: originalTimeout }));
      addLogMessage('✅ Simulación completada');
    }, 1000);
  };

  const clearLogs = () => {
    setLogMessages([]);
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'authenticated': return 'bg-green-500';
      case 'loading': return 'bg-yellow-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSessionStatusText = (status: string) => {
    switch (status) {
      case 'authenticated': return 'Autenticado';
      case 'loading': return 'Cargando...';
      case 'expired': return 'Expirado';
      default: return 'No autenticado';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-3 text-3xl">
              <Shield className="h-8 w-8 text-blue-600" />
              Demo del Sistema de Persistencia de Sesión
            </CardTitle>
            <CardDescription className="text-lg">
              Prueba completa del sistema de autenticación con persistencia, expiración automática y monitoreo en tiempo real
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Estado actual */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className={`w-4 h-4 rounded-full ${getSessionStatusColor(sessionStatus)}`} />
                <div>
                  <p className="font-medium">Estado de Sesión</p>
                  <p className="text-sm text-gray-600">{getSessionStatusText(sessionStatus)}</p>
                </div>
              </div>

              {isAuthenticated && (
                <>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Usuario</p>
                      <p className="text-sm text-gray-600">{auth.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <Timer className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Tiempo Restante</p>
                      <p className="text-sm text-gray-600">{minutesUntilExpiration} minutos</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Última Actividad</p>
                      <p className="text-sm text-gray-600">
                        {auth.user?.lastActivityTime ? new Date(auth.user.lastActivityTime).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur">
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Demo
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Documentación
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Tab de Demo */}
          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel de Autenticación */}
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Autenticación
                  </CardTitle>
                  <CardDescription>
                    Prueba las funcionalidades de login, registro y logout
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isAuthenticated ? (
                    <>
                      {/* Login Form */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Iniciar Sesión</h4>
                        <div className="space-y-3">
                          <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={loginData.email}
                            onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                          />
                          <div className="relative">
                            <input
                              type={showPasswords ? "text" : "password"}
                              placeholder="Contraseña"
                              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                              value={loginData.password}
                              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPasswords(!showPasswords)}
                            >
                              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="remember"
                              checked={loginData.rememberMe}
                              onCheckedChange={(checked) => setLoginData(prev => ({ ...prev, rememberMe: checked }))}
                            />
                            <Label htmlFor="remember">Recordarme</Label>
                          </div>
                          <Button onClick={handleLogin} className="w-full" disabled={auth.loading}>
                            {auth.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Iniciar Sesión
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Signup Form */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Registrarse</h4>
                        <div className="space-y-3">
                          <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={signupData.email}
                            onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                          />
                          <input
                            type={showPasswords ? "text" : "password"}
                            placeholder="Contraseña"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={signupData.password}
                            onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                          />
                          <input
                            type={showPasswords ? "text" : "password"}
                            placeholder="Confirmar contraseña"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          />
                          <Button onClick={handleSignup} variant="outline" className="w-full" disabled={auth.loading}>
                            {auth.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            <UserPlus className="h-4 w-4 mr-2" />
                            Registrarse
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Session Controls */
                    <div className="space-y-4">
                      <h4 className="font-medium">Controles de Sesión</h4>
                      <div className="space-y-3">
                        <Button onClick={handleRefresh} variant="outline" className="w-full">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refrescar Sesión
                        </Button>
                        <Button onClick={handleExtendSession} variant="outline" className="w-full">
                          <Timer className="h-4 w-4 mr-2" />
                          Extender Sesión
                        </Button>
                        <Button onClick={handleSimulateExpiration} variant="outline" className="w-full">
                          <Zap className="h-4 w-4 mr-2" />
                          Simular Expiración
                        </Button>
                        <Button onClick={handleLogout} variant="destructive" className="w-full">
                          <LogOut className="h-4 w-4 mr-2" />
                          Cerrar Sesión
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Panel de Información */}
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Información de Sesión
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {auth.user && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <strong>UID:</strong>
                        <p className="text-sm text-gray-600 break-all">{auth.user.uid}</p>
                      </div>
                      <div>
                        <strong>Email:</strong>
                        <p className="text-sm text-gray-600">{auth.user.email}</p>
                      </div>
                      <div>
                        <strong>Método:</strong>
                        <p className="text-sm text-gray-600">{auth.user.authMethod}</p>
                      </div>
                      <div>
                        <strong>Inicio de sesión:</strong>
                        <p className="text-sm text-gray-600">
                          {auth.user.sessionStartTime ? new Date(auth.user.sessionStartTime).toLocaleTimeString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Estados */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Estado de carga:</span>
                      <Badge variant={auth.loading ? 'default' : 'secondary'}>
                        {auth.loading ? 'Cargando...' : 'Inactivo'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Email verificado:</span>
                      <Badge variant={auth.isEmailVerified ? 'default' : 'secondary'}>
                        {auth.isEmailVerified ? 'Verificado' : 'No verificado'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Próximo a expirar:</span>
                      <Badge variant={isExpiringSoon ? 'destructive' : 'default'}>
                        {isExpiringSoon ? 'Sí' : 'No'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Permisos "admin":</span>
                      <Badge variant={hasPermission('admin') ? 'default' : 'secondary'}>
                        {hasPermission('admin') ? 'Concedido' : 'Denegado'}
                      </Badge>
                    </div>
                  </div>

                  {/* Progreso de expiración */}
                  {isAuthenticated && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tiempo hasta expiración</span>
                        <span>{Math.floor(timeUntilExpiration / 60)}:{(timeUntilExpiration % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <Progress
                        value={(timeUntilExpiration / (30 * 60)) * 100}
                        className={cn('h-3', isExpiringSoon && 'bg-orange-100')}
                      />
                    </div>
                  )}

                  {/* Error display */}
                  {auth.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Error:</strong> {auth.error.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab de Configuración */}
          <TabsContent value="config" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración de Sesión
                </CardTitle>
                <CardDescription>
                  Configura los parámetros del sistema de persistencia de sesión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="inactivity-timeout">Timeout por inactividad (minutos)</Label>
                      <input
                        id="inactivity-timeout"
                        type="number"
                        className="w-full p-2 border rounded"
                        value={sessionConfig.inactivityTimeout}
                        onChange={(e) => setSessionConfig(prev => ({
                          ...prev,
                          inactivityTimeout: parseInt(e.target.value) || 30
                        }))}
                        min="1"
                        max="1440"
                      />
                    </div>

                    <div>
                      <Label htmlFor="absolute-timeout">Timeout absoluto (días)</Label>
                      <input
                        id="absolute-timeout"
                        type="number"
                        className="w-full p-2 border rounded"
                        value={sessionConfig.absoluteTimeout}
                        onChange={(e) => setSessionConfig(prev => ({
                          ...prev,
                          absoluteTimeout: parseInt(e.target.value) || 7
                        }))}
                        min="1"
                        max="30"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="warning-threshold">Umbral de advertencia (minutos)</Label>
                      <input
                        id="warning-threshold"
                        type="number"
                        className="w-full p-2 border rounded"
                        value={sessionConfig.warningThreshold}
                        onChange={(e) => setSessionConfig(prev => ({
                          ...prev,
                          warningThreshold: parseInt(e.target.value) || 5
                        }))}
                        min="1"
                        max="60"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-extend"
                        checked={sessionConfig.autoExtend}
                        onCheckedChange={(checked) => setSessionConfig(prev => ({ ...prev, autoExtend: checked }))}
                      />
                      <Label htmlFor="auto-extend">Extensión automática</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      // Aplicar nueva configuración
                      auth.updateConfig({
                        enableExpirationWarnings: sessionConfig.warningThreshold > 0,
                        onSessionWarning: (minutesLeft) => {
                          addLogMessage(`⚠️ Nueva configuración: Sesión expira en ${minutesLeft} minutos`);
                        }
                      });
                      addLogMessage('✅ Configuración actualizada');
                    }}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Aplicar Configuración
                  </Button>

                  <Button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Monitor */}
          <TabsContent value="monitor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Métricas en Tiempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{minutesUntilExpiration}</div>
                      <div className="text-sm text-gray-600">Minutos restantes</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{isExpiringSoon ? 'Sí' : 'No'}</div>
                      <div className="text-sm text-gray-600">Próximo a expirar</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Progreso de sesión</span>
                      <span>{Math.floor((timeUntilExpiration / (30 * 60)) * 100)}%</span>
                    </div>
                    <Progress
                      value={(timeUntilExpiration / (30 * 60)) * 100}
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Estadísticas del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={async () => {
                      const stats = await auth.getStats();
                      addLogMessage('📊 Estadísticas obtenidas');
                      console.log('Estadísticas:', stats);
                    }}
                    className="w-full"
                  >
                    Obtener Estadísticas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab de Documentación */}
          <TabsContent value="docs" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Guía de Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose max-w-none">
                  <h3>🚀 Inicio Rápido</h3>
                  <ol>
                    <li>Completa el formulario de login con las credenciales de demostración</li>
                    <li>Activa la opción "Recordarme" para probar la persistencia</li>
                    <li>Observa cómo se mantiene la sesión entre recargas de página</li>
                    <li>Prueba los controles de extensión y refresco de sesión</li>
                  </ol>

                  <h3>⚙️ Funcionalidades</h3>
                  <ul>
                    <li><strong>Persistencia:</strong> La sesión se mantiene en localStorage</li>
                    <li><strong>Expiración automática:</strong> Sesión expira por inactividad o tiempo absoluto</li>
                    <li><strong>Monitoreo:</strong> Seguimiento en tiempo real del estado de la sesión</li>
                    <li><strong>Logging:</strong> Registro visual de todas las operaciones</li>
                  </ul>

                  <h3>🔧 Configuración</h3>
                  <p>En la pestaña de configuración puedes ajustar:</p>
                  <ul>
                    <li>Timeout por inactividad (30 minutos por defecto)</li>
                    <li>Timeout absoluto (7 días por defecto)</li>
                    <li>Umbral de advertencia (5 minutos por defecto)</li>
                    <li>Extensión automática de sesión</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Logs */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Registro de Actividad
                </CardTitle>
                <CardDescription>
                  Registro en tiempo real de todas las operaciones del sistema de autenticación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Button onClick={clearLogs} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpiar Logs
                  </Button>
                  <Badge variant="outline">
                    {logMessages.length} entradas
                  </Badge>
                </div>

                <div
                  ref={logRef}
                  className="bg-gray-900 text-gray-100 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm"
                >
                  {logMessages.length === 0 ? (
                    <p className="text-gray-500">No hay logs registrados...</p>
                  ) : (
                    logMessages.map((message, index) => (
                      <div key={index} className="mb-1">
                        {message}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}