'use client';

import React, { useState } from 'react';
import { useAuthEnhanced } from '@/hooks/use-auth-enhanced';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LogOut,
  Loader2,
  User,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import type { AuthOperationOptions, SessionStatus } from '@/lib/types/auth';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface LogoutButtonProps {
  /** Texto del botón */
  buttonText?: string;
  /** Variante del botón */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Tamaño del botón */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Clases CSS adicionales */
  className?: string;
  /** Icono personalizado para el botón */
  icon?: React.ReactNode;
  /** Mostrar confirmación antes del logout */
  showConfirmation?: boolean;
  /** Título del diálogo de confirmación */
  confirmationTitle?: string;
  /** Descripción del diálogo de confirmación */
  confirmationDescription?: string;
  /** Callback ejecutado antes del logout */
  onLogoutStart?: () => void;
  /** Callback ejecutado después del logout exitoso */
  onLogoutSuccess?: () => void;
  /** Callback ejecutado si el logout falla */
  onLogoutError?: (error: any) => void;
  /** Opciones adicionales para la operación de logout */
  logoutOptions?: AuthOperationOptions;
  /** Mostrar indicador de estado de sesión */
  showSessionStatus?: boolean;
  /** Mostrar información del usuario actual */
  showUserInfo?: boolean;
  /** Callback personalizado para el logout */
  customLogout?: () => Promise<void>;
  /** Deshabilitar el botón */
  disabled?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente de botón de logout manual con integración completa del sistema de persistencia de sesión
 *
 * Características:
 * - Botón de logout con confirmación
 * - Integración con useAuthEnhanced
 * - Manejo de estados de carga
 * - Opciones de personalización
 * - Logout seguro con limpieza completa
 * - Indicador visual de estado de sesión
 * - Feedback al usuario durante el proceso
 * - Manejo de errores graceful
 */
export function LogoutButton({
  buttonText = 'Cerrar Sesión',
  variant = 'outline',
  size = 'default',
  className = '',
  icon = <LogOut className="h-4 w-4" />,
  showConfirmation = true,
  confirmationTitle = 'Confirmar Logout',
  confirmationDescription = '¿Estás seguro de que deseas cerrar tu sesión? Se cerrarán todas las sesiones activas y deberás iniciar sesión nuevamente.',
  onLogoutStart,
  onLogoutSuccess,
  onLogoutError,
  logoutOptions,
  showSessionStatus = true,
  showUserInfo = true,
  customLogout,
  disabled = false,
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Hook de autenticación
  const { logout, user, sessionStatus, loading } = useAuthEnhanced();

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  const getSessionStatusColor = (status: SessionStatus): string => {
    switch (status) {
      case 'authenticated':
        return 'bg-green-500';
      case 'loading':
        return 'bg-yellow-500';
      case 'expired':
        return 'bg-red-500';
      case 'unauthenticated':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSessionStatusText = (status: SessionStatus): string => {
    switch (status) {
      case 'authenticated':
        return 'Autenticado';
      case 'loading':
        return 'Cargando...';
      case 'expired':
        return 'Sesión Expirada';
      case 'unauthenticated':
        return 'No Autenticado';
      default:
        return 'Desconocido';
    }
  };

  const getSessionStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case 'authenticated':
        return <CheckCircle className="h-3 w-3" />;
      case 'loading':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'expired':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  // ============================================================================
  // MANEJADOR DE LOGOUT
  // ============================================================================

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setLogoutError(null);

      // Callback antes del logout
      onLogoutStart?.();

      // Ejecutar logout personalizado o usar el del hook
      if (customLogout) {
        await customLogout();
      } else {
        const result = await logout(logoutOptions);

        if (!result.success) {
          throw new Error(result.error?.message || 'Error durante el logout');
        }
      }

      // Mostrar mensaje de éxito temporal
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Callback de éxito
      onLogoutSuccess?.();

    } catch (error: any) {
      console.error('Error durante logout:', error);
      const errorMessage = error?.message || 'Error inesperado durante el logout';
      setLogoutError(errorMessage);

      // Callback de error
      onLogoutError?.(error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  // Si no hay usuario autenticado, no mostrar el botón
  if (!user || sessionStatus !== 'authenticated') {
    return null;
  }

  // Contenido del botón
  const buttonContent = (
    <>
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        icon && <span className="mr-2">{icon}</span>
      )}
      {isLoggingOut ? 'Cerrando sesión...' : buttonText}
    </>
  );

  // Si no se requiere confirmación, usar botón directo
  if (!showConfirmation) {
    return (
      <div className="space-y-2">
        {/* Información de usuario y estado */}
        {(showUserInfo || showSessionStatus) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {showUserInfo && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{user.email}</span>
              </div>
            )}
            {showSessionStatus && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs"
              >
                {getSessionStatusIcon(sessionStatus)}
                {getSessionStatusText(sessionStatus)}
              </Badge>
            )}
          </div>
        )}

        {/* Mensajes de error o éxito */}
        {logoutError && (
          <Alert variant="destructive" className="text-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{logoutError}</AlertDescription>
          </Alert>
        )}

        {showSuccessMessage && (
          <Alert className="text-sm">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Sesión cerrada exitosamente</AlertDescription>
          </Alert>
        )}

        {/* Botón de logout */}
        <Button
          onClick={handleLogout}
          variant={variant}
          size={size}
          className={className}
          disabled={disabled || isLoggingOut || loading}
        >
          {buttonContent}
        </Button>
      </div>
    );
  }

  // Con confirmación - usar AlertDialog
  return (
    <div className="space-y-2">
      {/* Información de usuario y estado */}
      {(showUserInfo || showSessionStatus) && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {showUserInfo && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{user.email}</span>
            </div>
          )}
          {showSessionStatus && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              {getSessionStatusIcon(sessionStatus)}
              {getSessionStatusText(sessionStatus)}
            </Badge>
          )}
        </div>
      )}

      {/* Mensajes de error o éxito */}
      {logoutError && (
        <Alert variant="destructive" className="text-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{logoutError}</AlertDescription>
        </Alert>
      )}

      {showSuccessMessage && (
        <Alert className="text-sm">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Sesión cerrada exitosamente</AlertDescription>
        </Alert>
      )}

      {/* Diálogo de confirmación */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            disabled={disabled || isLoggingOut || loading}
          >
            {buttonContent}
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {confirmationTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Información adicional en el diálogo */}
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Sesión actual: {user.email}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                Última actividad: {new Date(user.lastActivityTime).toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  <strong>Nota:</strong> Se cerrarán todas las sesiones activas en todos los dispositivos.
                </span>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cerrando sesión...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// COMPONENTES ADICIONALES DE UTILIDAD
// ============================================================================

/**
 * Versión compacta del botón de logout
 * Ideal para usar en headers o barras de navegación
 */
export function CompactLogoutButton(props: Omit<LogoutButtonProps, 'showUserInfo' | 'showSessionStatus'>) {
  return (
    <LogoutButton
      {...props}
      showUserInfo={false}
      showSessionStatus={false}
      size="sm"
      variant="ghost"
    />
  );
}

/**
 * Versión del botón de logout con información completa
 * Muestra toda la información del usuario y estado de sesión
 */
export function DetailedLogoutButton(props: LogoutButtonProps) {
  return (
    <LogoutButton
      {...props}
      showUserInfo={true}
      showSessionStatus={true}
    />
  );
}

/**
 * Hook personalizado para usar el componente de logout
 * Proporciona estado y funciones para manejar el logout
 */
export function useLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout, user, sessionStatus } = useAuthEnhanced();

  const performLogout = async (options?: AuthOperationOptions) => {
    try {
      setIsLoggingOut(true);
      setError(null);

      const result = await logout(options);

      if (!result.success) {
        throw new Error(result.error?.message || 'Error durante el logout');
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Error inesperado durante el logout';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    performLogout,
    isLoggingOut,
    error,
    user,
    sessionStatus,
    isAuthenticated: sessionStatus === 'authenticated',
  };
}