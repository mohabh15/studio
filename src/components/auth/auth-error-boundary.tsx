'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AuthError, AuthErrorCode } from '@/lib/types/auth';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastErrorTime: number;
}

/**
 * AuthErrorBoundary - Componente para manejar errores de autenticación
 *
 * Características:
 * - SSR-safe: Compatible con server-side rendering
 * - Cleanup automático: Limpia recursos cuando se desmonta
 * - Retry automático: Permite reintentar operaciones fallidas
 * - Logging detallado: Registra errores para debugging
 * - UI amigable: Interfaz de usuario clara para errores
 */
export class AuthErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private cleanupFunctions: (() => void)[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Actualizar el estado para renderizar la UI de fallback
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error para debugging
    console.error('[AuthErrorBoundary] Error capturado:', error);
    console.error('[AuthErrorBoundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Callback personalizado para manejo de errores
    this.props.onError?.(error, errorInfo);

    // Limpiar recursos existentes
    this.cleanup();
  }

  componentWillUnmount() {
    this.cleanup();
  }

  private cleanup = () => {
    // Limpiar timeout si existe
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    // Ejecutar todas las funciones de cleanup registradas
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('[AuthErrorBoundary] Error en cleanup:', error);
      }
    });
    this.cleanupFunctions = [];
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      console.warn('[AuthErrorBoundary] Máximo número de reintentos alcanzado');
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Limpiar recursos antes del retry
    this.cleanup();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private isAuthError = (error: Error): boolean => {
    const authErrorCodes: AuthErrorCode[] = [
      'auth/user-not-found',
      'auth/wrong-password',
      'auth/invalid-email',
      'auth/user-disabled',
      'auth/email-already-in-use',
      'auth/weak-password',
      'auth/operation-not-allowed',
      'auth/requires-recent-login',
      'auth/network-request-failed',
      'auth/too-many-requests',
      'auth/unauthorized',
      'auth/session-expired',
      'auth/token-expired',
      'auth/persistence-error',
      'auth/configuration-error',
      'auth/unknown-error',
    ];

    return authErrorCodes.some(code =>
      error.message.includes(code) || error.name.includes(code)
    );
  };

  private getErrorMessage = (error: Error): string => {
    if (this.isAuthError(error)) {
      if (error.message.includes('auth/user-not-found')) {
        return 'Usuario no encontrado. Verifica tu email.';
      }
      if (error.message.includes('auth/wrong-password')) {
        return 'Contraseña incorrecta. Inténtalo de nuevo.';
      }
      if (error.message.includes('auth/invalid-email')) {
        return 'Email inválido. Verifica el formato.';
      }
      if (error.message.includes('auth/user-disabled')) {
        return 'Cuenta deshabilitada. Contacta al soporte.';
      }
      if (error.message.includes('auth/email-already-in-use')) {
        return 'Email ya registrado. Intenta iniciar sesión.';
      }
      if (error.message.includes('auth/weak-password')) {
        return 'Contraseña muy débil. Usa al menos 6 caracteres.';
      }
      if (error.message.includes('auth/too-many-requests')) {
        return 'Demasiados intentos. Espera unos minutos.';
      }
      if (error.message.includes('auth/network-request-failed')) {
        return 'Error de conexión. Verifica tu internet.';
      }
      if (error.message.includes('auth/session-expired')) {
        return 'Sesión expirada. Inicia sesión nuevamente.';
      }
      if (error.message.includes('auth/token-expired')) {
        return 'Token expirado. Inicia sesión nuevamente.';
      }
    }

    return 'Error inesperado en autenticación. Inténtalo de nuevo.';
  };

  private renderErrorUI = () => {
    const { error, retryCount } = this.state;
    const { fallback, showDetails = false } = this.props;

    if (fallback) {
      return fallback;
    }

    const errorMessage = error ? this.getErrorMessage(error) : 'Error desconocido';
    const canRetry = retryCount < 3;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Error de Autenticación</CardTitle>
            <CardDescription>
              Ha ocurrido un problema con la autenticación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            {showDetails && error && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Detalles técnicos
                </summary>
                <div className="mt-2 rounded bg-muted p-3 font-mono text-xs">
                  <div className="text-destructive font-semibold">
                    {error.name}: {error.message}
                  </div>
                  {error.stack && (
                    <pre className="mt-2 whitespace-pre-wrap text-xs opacity-70">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col gap-2">
              {canRetry && (
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar ({3 - retryCount} restantes)
                </Button>
              )}
              <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Ir al inicio
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Intento {retryCount + 1} de {Math.max(retryCount + 1, 3)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}