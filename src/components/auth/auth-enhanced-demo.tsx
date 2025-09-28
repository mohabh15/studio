'use client';

import React, { useState } from 'react';
import { useAuthEnhanced, useAuthSession, usePermissions, useSessionExpiration } from '@/hooks/use-auth-enhanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Clock, User, LogOut, RefreshCw } from 'lucide-react';

/**
 * Componente de demostración del hook useAuthEnhanced
 * Muestra todas las funcionalidades del sistema de autenticación mejorado
 */
export function AuthEnhancedDemo() {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showStats, setShowStats] = useState(false);

  // Hook principal con todas las funcionalidades
  const auth = useAuthEnhanced({
    enableExpirationWarnings: true,
    onSessionWarning: (minutesLeft) => {
      console.log(`⚠️ Sesión expira en ${minutesLeft} minutos`);
    },
    onSessionExpired: () => {
      console.log('🔒 Sesión expirada');
    },
    onError: (error) => {
      console.error('❌ Error de autenticación:', error);
    },
  });

  // Hooks auxiliares
  const { isAuthenticated, sessionStatus } = useAuthSession();
  const { hasPermission, hasRole } = usePermissions();
  const { timeUntilExpiration, isExpiringSoon, minutesUntilExpiration } = useSessionExpiration(5);

  const handleLogin = async () => {
    const result = await auth.login({
      email: loginData.email,
      password: loginData.password,
      rememberMe: true,
    });

    if (result.success) {
      console.log('✅ Login exitoso');
    } else {
      console.error('❌ Error en login:', result.error);
    }
  };

  const handleLogout = async () => {
    const result = await auth.logout();
    if (result.success) {
      console.log('✅ Logout exitoso');
    }
  };

  const handleRefresh = async () => {
    const result = await auth.refreshSession();
    if (result.success) {
      console.log('✅ Sesión refrescada');
    }
  };

  const handleExtendSession = async () => {
    const result = await auth.extendSession();
    if (result.success) {
      console.log('✅ Sesión extendida');
    }
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Demo del Sistema de Autenticación Mejorado
          </CardTitle>
          <CardDescription>
            Demostración completa del hook useAuthEnhanced con todas sus funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado de la sesión */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getSessionStatusColor(sessionStatus)}`} />
              <span className="font-medium">{getSessionStatusText(sessionStatus)}</span>
            </div>

            {isAuthenticated && (
              <Badge variant="outline" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {auth.user?.email}
              </Badge>
            )}

            {isExpiringSoon && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expira en {minutesUntilExpiration} min
              </Badge>
            )}
          </div>

          {/* Información del usuario */}
          {auth.user && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <strong>UID:</strong> {auth.user.uid}
              </div>
              <div>
                <strong>Email:</strong> {auth.user.email}
              </div>
              <div>
                <strong>Método:</strong> {auth.user.authMethod}
              </div>
              <div>
                <strong>Última actividad:</strong> {new Date(auth.user.lastActivityTime).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Estados de carga y error */}
          {auth.loading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Procesando operación de autenticación...
              </AlertDescription>
            </Alert>
          )}

          {auth.error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {auth.error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Controles de autenticación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isAuthenticated ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Login</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 border rounded"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    className="w-full p-2 border rounded"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <Button onClick={handleLogin} className="w-full" disabled={auth.loading}>
                    {auth.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Iniciar Sesión
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Controles de Sesión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleRefresh} variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refrescar Sesión
                  </Button>
                  <Button onClick={handleExtendSession} variant="outline" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Extender Sesión
                  </Button>
                  <Button onClick={handleLogout} variant="destructive" className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Información de permisos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permisos y Roles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span>Permiso "admin":</span>
                  <Badge variant={hasPermission('admin') ? 'default' : 'secondary'}>
                    {hasPermission('admin') ? 'Concedido' : 'Denegado'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Rol "user":</span>
                  <Badge variant={hasRole('user') ? 'default' : 'secondary'}>
                    {hasRole('user') ? 'Sí' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Autenticado:</span>
                  <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                    {isAuthenticated ? 'Sí' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información de expiración */}
          {isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Expiración</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Tiempo hasta expiración:</strong> {minutesUntilExpiration} minutos
                  </div>
                  <div>
                    <strong>Próximo a expirar:</strong>
                    <Badge variant={isExpiringSoon ? 'destructive' : 'default'} className="ml-2">
                      {isExpiringSoon ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas del sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estadísticas del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  auth.getStats().then(stats => {
                    console.log('📊 Estadísticas del sistema:', stats);
                  });
                  setShowStats(!showStats);
                }}
                variant="outline"
              >
                {showStats ? 'Ocultar' : 'Mostrar'} Estadísticas
              </Button>

              {showStats && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify({
                      sessionStatus: auth.sessionStatus,
                      hasUser: !!auth.user,
                      loading: auth.loading,
                      error: auth.error?.message || null,
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Componente simplificado para usar en producción
 */
export function AuthStatus() {
  const { user, sessionStatus, logout } = useAuthEnhanced();
  const isAuthenticated = sessionStatus === 'authenticated';

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4" />
        <span>{user?.email}</span>
      </div>
      <Badge variant="outline">{sessionStatus}</Badge>
      <Button onClick={() => logout()} size="sm" variant="outline">
        <LogOut className="h-4 w-4 mr-2" />
        Salir
      </Button>
    </div>
  );
}