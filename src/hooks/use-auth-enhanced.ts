'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { authService } from '@/lib/services/AuthService';
import { sessionManager } from '@/lib/services/SessionManager';
import { tokenManager } from '@/lib/services/TokenManager';

// ============================================================================
// INTERFACES INTERNAS
// ============================================================================

interface UseAuthEnhancedConfig {
  /** Redirección automática después del login */
  redirectAfterLogin?: boolean;
  /** Redirección automática después del logout */
  redirectAfterLogout?: boolean;
  /** URL personalizada después del login */
  loginRedirectUrl?: string;
  /** URL personalizada después del logout */
  logoutRedirectUrl?: string;
  /** Habilitar notificaciones de expiración */
  enableExpirationWarnings?: boolean;
  /** Callback cuando la sesión está próxima a expirar */
  onSessionWarning?: (minutesLeft: number) => void;
  /** Callback cuando la sesión expira */
  onSessionExpired?: () => void;
  /** Callback para errores de autenticación */
  onError?: (error: AuthError) => void;
}

interface UseAuthEnhancedReturn extends AuthState {
  // Métodos de autenticación
  login: (formData: LoginFormData, options?: AuthOperationOptions) => Promise<AuthOperationResult>;
  signup: (formData: SignupFormData, options?: AuthOperationOptions) => Promise<AuthOperationResult>;
  loginWithGoogle: (options?: AuthOperationOptions) => Promise<AuthOperationResult>;
  logout: (options?: AuthOperationOptions) => Promise<AuthOperationResult>;

  // Métodos de sesión
  refreshSession: () => Promise<AuthOperationResult>;
  extendSession: () => Promise<AuthOperationResult>;
  updateActivity: () => Promise<void>;

  // Métodos de verificación de email
  sendEmailVerification: () => Promise<AuthOperationResult>;
  sendPasswordResetEmail: (email: string) => Promise<AuthOperationResult>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<AuthOperationResult>;

  // Métodos de utilidad
  hasPermission: (permission: string) => boolean;
  isSessionExpiringSoon: (thresholdMinutes?: number) => Promise<boolean>;
  getTimeUntilExpiration: () => Promise<number>;

  // Métodos de configuración
  updateConfig: (config: Partial<UseAuthEnhancedConfig>) => void;

  // Estadísticas y debugging
  getStats: () => Promise<{
    authService: any;
    sessionManager: any;
    tokenManager: any;
  }>;
}

// ============================================================================
// IMPLEMENTACIÓN DEL HOOK
// ============================================================================

export function useAuthEnhanced(config: UseAuthEnhancedConfig = {}): UseAuthEnhancedReturn {
  const router = useRouter();

  // Estado interno del hook
  const [authState, setAuthState] = useState<AuthState>(() => ({
    user: null,
    loading: true,
    isLoading: false,
    error: null,
    sessionStatus: 'loading',
    persistence: 'local',
    isEmailVerified: false,
    isVerifyingEmail: false,
  }));

  // Referencias para cleanup
  const eventHandlerRef = useRef<string | null>(null);
  const stateChangeListenerRef = useRef<string | null>(null);
  const sessionWarningHandlerRef = useRef<string | null>(null);
  const sessionExpiredHandlerRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Configuración del hook
  const hookConfig = useRef<UseAuthEnhancedConfig>({
    redirectAfterLogin: true,
    redirectAfterLogout: true,
    loginRedirectUrl: '/dashboard',
    logoutRedirectUrl: '/login',
    enableExpirationWarnings: true,
    ...config,
  });

  // ============================================================================
  // MÉTODOS DE ACTUALIZACIÓN DE ESTADO
  // ============================================================================

  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    if (!mountedRef.current) return;

    setAuthState(prevState => ({
      ...prevState,
      ...updates,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    updateAuthState({ loading, isLoading: loading });
  }, [updateAuthState]);

  const setError = useCallback((error: AuthError | null) => {
    updateAuthState({ error });
  }, [updateAuthState]);

  // ============================================================================
  // MANEJO DE EVENTOS
  // ============================================================================

  const handleAuthEvent = useCallback((event: AuthEvent, data?: any) => {
    if (!mountedRef.current) return;

    switch (event) {
      case 'login':
        if (data?.user) {
          updateAuthState({
            user: data.user,
            sessionStatus: 'authenticated',
            error: null,
            loading: false,
            isLoading: false,
          });

          if (hookConfig.current.redirectAfterLogin) {
            const redirectUrl = hookConfig.current.loginRedirectUrl || '/dashboard';
            router.push(redirectUrl);
          }
        }
        break;

      case 'logout':
        updateAuthState({
          user: null,
          sessionStatus: 'unauthenticated',
          error: null,
          loading: false,
          isLoading: false,
          isEmailVerified: false,
        });

        if (hookConfig.current.redirectAfterLogout) {
          const redirectUrl = hookConfig.current.logoutRedirectUrl || '/login';
          router.push(redirectUrl);
        }
        break;

      case 'auth-error':
        if (data?.error) {
          setError(data.error);
          hookConfig.current.onError?.(data.error);
        }
        break;

      case 'session-expired':
        if (data?.type === 'warning') {
          const minutesLeft = data.minutesLeft;
          hookConfig.current.onSessionWarning?.(minutesLeft);

          updateAuthState({
            sessionStatus: 'expired',
          });
        } else {
          updateAuthState({
            user: null,
            sessionStatus: 'expired',
            error: null,
          });

          hookConfig.current.onSessionExpired?.();
        }
        break;
    }
  }, [updateAuthState, setError, router]);

  const handleStateChange = useCallback((state: AuthState) => {
    if (!mountedRef.current) return;

    setAuthState(state);
  }, []);

  // ============================================================================
  // CONFIGURACIÓN DE LISTENERS
  // ============================================================================

  const setupEventListeners = useCallback(() => {
    // Limpiar listeners anteriores
    cleanupEventListeners();

    // Registrar nuevos listeners
    eventHandlerRef.current = authService.onAuthEvent('login', handleAuthEvent);
    authService.onAuthEvent('logout', handleAuthEvent);
    authService.onAuthEvent('signup', handleAuthEvent);
    authService.onAuthEvent('auth-error', handleAuthEvent);

    stateChangeListenerRef.current = authService.onStateChange(handleStateChange);

    // Listeners específicos de sesión
    sessionWarningHandlerRef.current = sessionManager.onSessionEvent('session-expired', handleAuthEvent);
    sessionExpiredHandlerRef.current = sessionManager.onSessionEvent('session-expired', handleAuthEvent);

  }, [handleAuthEvent, handleStateChange]);

  const cleanupEventListeners = useCallback(() => {
    if (eventHandlerRef.current) {
      authService.offAuthEvent(eventHandlerRef.current);
      eventHandlerRef.current = null;
    }

    if (stateChangeListenerRef.current) {
      authService.offStateChange(stateChangeListenerRef.current);
      stateChangeListenerRef.current = null;
    }

    if (sessionWarningHandlerRef.current) {
      sessionManager.offSessionEvent(sessionWarningHandlerRef.current);
      sessionWarningHandlerRef.current = null;
    }

    if (sessionExpiredHandlerRef.current) {
      sessionManager.offSessionEvent(sessionExpiredHandlerRef.current);
      sessionExpiredHandlerRef.current = null;
    }
  }, []);

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  useEffect(() => {
    let isInitialLoad = true;

    const initializeAuth = async () => {
      try {
        // Configurar listeners
        setupEventListeners();

        // Obtener estado actual
        const currentState = authService.getCurrentState();
        const hasValidSession = await authService.hasValidSession();

        if (hasValidSession && currentState.user) {
          updateAuthState({
            ...currentState,
            loading: false,
          });
        } else {
          updateAuthState({
            ...currentState,
            loading: false,
            sessionStatus: 'unauthenticated',
          });
        }

        isInitialLoad = false;
      } catch (error) {
        console.error('[useAuthEnhanced] Error en inicialización:', error);
        updateAuthState({
          loading: false,
          sessionStatus: 'unauthenticated',
          error: {
            code: 'auth/configuration-error' as AuthErrorCode,
            message: 'Error inicializando autenticación',
            timestamp: Date.now(),
            recoverable: true,
          },
        });
      }
    };

    initializeAuth();

    // Cleanup en desmontaje
    return () => {
      mountedRef.current = false;
      cleanupEventListeners();
    };
  }, [setupEventListeners, cleanupEventListeners, updateAuthState]);

  // ============================================================================
  // MÉTODOS DE AUTENTICACIÓN
  // ============================================================================

  const login = useCallback(async (
    formData: LoginFormData,
    options: AuthOperationOptions = {}
  ): Promise<AuthOperationResult> => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.login(formData, options);

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'auth/unknown-error' as AuthErrorCode,
        message: 'Error inesperado en login',
        timestamp: Date.now(),
        recoverable: true,
      };
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const signup = useCallback(async (
    formData: SignupFormData,
    options: AuthOperationOptions = {}
  ): Promise<AuthOperationResult> => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signup(formData, options);

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'auth/unknown-error' as AuthErrorCode,
        message: 'Error inesperado en registro',
        timestamp: Date.now(),
        recoverable: true,
      };
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const loginWithGoogle = useCallback(async (
    options: AuthOperationOptions = {}
  ): Promise<AuthOperationResult> => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.loginWithGoogle(options);

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'auth/unknown-error' as AuthErrorCode,
        message: 'Error inesperado en login con Google',
        timestamp: Date.now(),
        recoverable: true,
      };
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const logout = useCallback(async (
    options: AuthOperationOptions = {}
  ): Promise<AuthOperationResult> => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.logout(options);
      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'auth/unknown-error' as AuthErrorCode,
        message: 'Error inesperado en logout',
        timestamp: Date.now(),
        recoverable: true,
      };
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // ============================================================================
  // MÉTODOS DE SESIÓN
  // ============================================================================

  const refreshSession = useCallback(async (): Promise<AuthOperationResult> => {
    try {
      setLoading(true);
      setError(null);

      // Actualizar actividad de sesión
      await sessionManager.updateActivity();

      return { success: true, message: 'Sesión refrescada' };
    } catch (error) {
      const authError: AuthError = {
        code: 'auth/session-expired' as AuthErrorCode,
        message: 'Error refrescando sesión',
        timestamp: Date.now(),
        recoverable: false,
      };
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const extendSession = useCallback(async (): Promise<AuthOperationResult> => {
    try {
      await sessionManager.extendSession();
      return { success: true, message: 'Sesión extendida' };
    } catch (error) {
      const authError: AuthError = {
        code: 'auth/session-expired' as AuthErrorCode,
        message: 'Error extendiendo sesión',
        timestamp: Date.now(),
        recoverable: false,
      };
      setError(authError);
      return { success: false, error: authError };
    }
  }, [setError]);

  const updateActivity = useCallback(async (): Promise<void> => {
    try {
      await sessionManager.updateActivity();
    } catch (error) {
      console.warn('[useAuthEnhanced] Error actualizando actividad:', error);
    }
  }, []);

  // ============================================================================
  // MÉTODOS DE VERIFICACIÓN DE EMAIL
  // ============================================================================

  const sendEmailVerification = useCallback(async (): Promise<AuthOperationResult> => {
    try {
      setLoading(true);
      updateAuthState({ isVerifyingEmail: true });

      const result = await authService.sendEmailVerification();
      return result;
    } finally {
      setLoading(false);
      updateAuthState({ isVerifyingEmail: false });
    }
  }, [setLoading, updateAuthState]);

  const sendPasswordResetEmail = useCallback(async (email: string): Promise<AuthOperationResult> => {
    try {
      const result = await authService.sendPasswordResetEmail(email);
      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'auth/unknown-error' as AuthErrorCode,
        message: 'Error enviando email de reset',
        timestamp: Date.now(),
        recoverable: true,
      };
      return { success: false, error: authError };
    }
  }, []);

  const confirmPasswordReset = useCallback(async (
    code: string,
    newPassword: string
  ): Promise<AuthOperationResult> => {
    try {
      const result = await authService.confirmPasswordReset(code, newPassword);
      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'auth/unknown-error' as AuthErrorCode,
        message: 'Error confirmando reset de contraseña',
        timestamp: Date.now(),
        recoverable: true,
      };
      return { success: false, error: authError };
    }
  }, []);

  // ============================================================================
  // MÉTODOS DE UTILIDAD
  // ============================================================================

  const hasPermission = useCallback((permission: string): boolean => {
    if (!authState.user) return false;

    // Implementar lógica de permisos basada en claims del token
    // Por ahora, retornamos true si el usuario está autenticado
    return authState.sessionStatus === 'authenticated';
  }, [authState.user, authState.sessionStatus]);

  const isSessionExpiringSoon = useCallback(async (thresholdMinutes: number = 5): Promise<boolean> => {
    try {
      const timeUntilExpiration = await tokenManager.getTimeUntilExpiration();
      return timeUntilExpiration <= thresholdMinutes;
    } catch {
      return true;
    }
  }, []);

  const getTimeUntilExpiration = useCallback(async (): Promise<number> => {
    try {
      return await tokenManager.getTimeUntilExpiration();
    } catch {
      return 0;
    }
  }, []);

  // ============================================================================
  // CONFIGURACIÓN
  // ============================================================================

  const updateConfig = useCallback((newConfig: Partial<UseAuthEnhancedConfig>) => {
    hookConfig.current = { ...hookConfig.current, ...newConfig };
  }, []);

  // ============================================================================
  // ESTADÍSTICAS Y DEBUGGING
  // ============================================================================

  const getStats = useCallback(async () => {
    try {
      const [authStats, sessionStats, tokenStats] = await Promise.all([
        authService.getStats(),
        sessionManager.getSessionStats(),
        tokenManager.getStats(),
      ]);

      return {
        authService: authStats,
        sessionManager: sessionStats,
        tokenManager: tokenStats,
      };
    } catch (error) {
      console.error('[useAuthEnhanced] Error obteniendo estadísticas:', error);
      return {
        authService: {},
        sessionManager: {},
        tokenManager: {},
      };
    }
  }, []);

  // ============================================================================
  // VALOR DE RETORNO
  // ============================================================================

  return {
    // Estado de autenticación
    ...authState,

    // Métodos de autenticación
    login,
    signup,
    loginWithGoogle,
    logout,

    // Métodos de sesión
    refreshSession,
    extendSession,
    updateActivity,

    // Métodos de verificación de email
    sendEmailVerification,
    sendPasswordResetEmail,
    confirmPasswordReset,

    // Métodos de utilidad
    hasPermission,
    isSessionExpiringSoon,
    getTimeUntilExpiration,

    // Métodos de configuración
    updateConfig,

    // Estadísticas y debugging
    getStats,
  };
}

// ============================================================================
// HOOKS ADICIONALES DE UTILIDAD
// ============================================================================

/**
 * Hook para verificar si el usuario tiene una sesión activa
 */
export function useAuthSession() {
  const { sessionStatus, user, loading } = useAuthEnhanced();

  return {
    isAuthenticated: sessionStatus === 'authenticated',
    isLoading: loading,
    user,
    sessionStatus,
  };
}

/**
 * Hook para verificar permisos específicos
 */
export function usePermissions() {
  const { hasPermission, user } = useAuthEnhanced();

  const checkPermission = useCallback((permission: string) => {
    return hasPermission(permission);
  }, [hasPermission]);

  const hasRole = useCallback((role: string) => {
    // Implementar lógica de roles basada en claims del usuario
    return user?.authMethod === 'email'; // Ejemplo simple
  }, [user]);

  return {
    hasPermission: checkPermission,
    hasRole,
    user,
  };
}

/**
 * Hook para monitorear la expiración de sesión
 */
export function useSessionExpiration(warningThresholdMinutes: number = 5) {
  const { isSessionExpiringSoon, getTimeUntilExpiration, sessionStatus } = useAuthEnhanced();
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<number>(0);
  const [isExpiringSoon, setIsExpiringSoon] = useState<boolean>(false);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') {
      setTimeUntilExpiration(0);
      setIsExpiringSoon(false);
      return;
    }

    const checkExpiration = async () => {
      const time = await getTimeUntilExpiration();
      const expiring = await isSessionExpiringSoon(warningThresholdMinutes);

      setTimeUntilExpiration(time);
      setIsExpiringSoon(expiring);
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [sessionStatus, getTimeUntilExpiration, warningThresholdMinutes]);

  return {
    timeUntilExpiration,
    isExpiringSoon,
    minutesUntilExpiration: Math.floor(timeUntilExpiration / 60),
  };
}