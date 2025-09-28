'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { authService } from '@/lib/services/AuthService';
import { sessionManager } from '@/lib/services/SessionManager';
import { tokenManager } from '@/lib/services/TokenManager';
import type {
  AuthState,
  SessionData,
  AuthOperationResult,
  LoginFormData,
  SignupFormData,
  AuthOperationOptions,
  AuthEvent,
  AuthError,
  PersistenceType,
} from '@/lib/types/auth';

interface AuthContextType {
  // Estado actual (compatible con Firebase User)
  user: User | null;
  loading: boolean;

  // Métodos de autenticación existentes (mantenidos para compatibilidad)
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  // Nuevos métodos avanzados
  getCurrentUser: () => Promise<SessionData | null>;
  hasValidSession: () => Promise<boolean>;
  updateActivity: () => Promise<void>;
  extendSession: () => Promise<void>;
  getSessionStatus: () => Promise<string>;

  // Estado avanzado
  sessionStatus: string;
  error: AuthError | null;
  isEmailVerified: boolean;

  // Configuración
  updateConfig: (config: any) => void;
  getStats: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isLoading: false,
    error: null,
    sessionStatus: 'loading',
    persistence: 'local',
    isEmailVerified: false,
    isVerifyingEmail: false,
  });

  const router = useRouter();
  const pathname = usePathname();

  // ============================================================================
  // INICIALIZACIÓN Y VERIFICACIÓN DE SESIÓN
  // ============================================================================

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthProvider] Inicializando AuthProvider...');

        // Configurar AuthService con configuración avanzada
        authService.updateConfig({
          defaultPersistence: 'local',
          sessionTimeoutMinutes: 30,
          requireEmailVerification: false,
          redirectUrls: {
            afterLogin: '/dashboard',
            afterLogout: '/login',
            emailVerification: '/verify-email',
          },
          socialProviders: {
            google: {
              enabled: true,
              scopes: ['email', 'profile'],
            },
          },
          security: {
            maxLoginAttempts: 5,
            lockoutDurationMinutes: 15,
            enableRecaptcha: false,
          },
        });

        // Configurar listeners de eventos
        setupEventListeners();

        // Verificar sesión existente
        await checkExistingSession();

        if (mounted) {
          console.log('[AuthProvider] AuthProvider inicializado exitosamente');
        }
      } catch (error) {
        console.error('[AuthProvider] Error inicializando AuthProvider:', error);
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: {
              code: 'auth/configuration-error',
              message: 'Error inicializando autenticación',
              timestamp: Date.now(),
              recoverable: true,
            },
          }));
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================================
  // CONFIGURACIÓN DE EVENT LISTENERS
  // ============================================================================

  const setupEventListeners = useCallback(() => {
    // Listener para cambios de estado del AuthService
    const stateChangeHandler = authService.onStateChange((newState: AuthState) => {
      console.log('[AuthProvider] Cambio de estado de autenticación:', newState.sessionStatus);
      setAuthState(newState);

      // Actualizar usuario para compatibilidad con Firebase
      if (newState.user) {
        // Convertir SessionData a User para compatibilidad
        const firebaseUser = convertSessionDataToFirebaseUser(newState.user);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }

      setLoading(newState.loading);
    });

    // Listener para eventos de sesión
    const sessionExpiredHandler = sessionManager.onSessionEvent('session-expired', (event, data) => {
      console.log('[AuthProvider] Evento de sesión:', event, data);

      if (event === 'session-expired' && data?.type === 'warning') {
        // Mostrar notificación de warning
        console.warn(`[AuthProvider] Sesión expira en ${data.minutesLeft} minutos`);
        // Aquí podrías mostrar una notificación al usuario
      } else if (event === 'session-expired') {
        // Sesión expirada, redirigir a login
        console.log('[AuthProvider] Sesión expirada, redirigiendo a login');
        router.push('/login');
      }
    });

    // Cleanup function
    return () => {
      authService.offStateChange(stateChangeHandler);
      sessionManager.offSessionEvent(sessionExpiredHandler);
    };
  }, [router]);

  // ============================================================================
  // VERIFICACIÓN DE SESIÓN EXISTENTE
  // ============================================================================

  const checkExistingSession = async () => {
    try {
      console.log('[AuthProvider] Verificando sesión existente...');

      // Verificar si hay sesión válida en los servicios
      const hasValidSession = await authService.hasValidSession();
      const sessionStatus = await authService.getSessionStatus();

      console.log('[AuthProvider] Estado de sesión:', { hasValidSession, sessionStatus });

      if (hasValidSession && sessionStatus === 'authenticated') {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          console.log('[AuthProvider] Sesión válida encontrada:', currentUser.email);
          // El estado se actualizará a través del listener
          return;
        }
      }

      // No hay sesión válida
      console.log('[AuthProvider] No se encontró sesión válida');
      setAuthState(prev => ({
        ...prev,
        loading: false,
        sessionStatus: 'unauthenticated',
      }));

    } catch (error) {
      console.error('[AuthProvider] Error verificando sesión existente:', error);
    }
  };

  // ============================================================================
  // REDIRECCIÓN BASADA EN ESTADO DE AUTENTICACIÓN
  // ============================================================================

  useEffect(() => {
    if (!loading && !user && !['/login', '/signup', '/forgot-password'].includes(pathname)) {
      console.log('[AuthProvider] Usuario no autenticado, redirigiendo a login');
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  // ============================================================================
  // MÉTODOS DE AUTENTICACIÓN (COMPATIBILIDAD)
  // ============================================================================

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('[AuthProvider] Iniciando login:', email);

      const result: AuthOperationResult = await authService.login({
        email,
        password,
        rememberMe: true,
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Error en login');
      }

      console.log('[AuthProvider] Login exitoso:', result.user?.email);

    } catch (error: any) {
      console.error('[AuthProvider] Error en login:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string): Promise<void> => {
    try {
      console.log('[AuthProvider] Iniciando registro:', email);

      const result: AuthOperationResult = await authService.signup({
        email,
        password,
        confirmPassword: password,
        acceptTerms: true,
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Error en registro');
      }

      console.log('[AuthProvider] Registro exitoso:', result.user?.email);

    } catch (error: any) {
      console.error('[AuthProvider] Error en registro:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      console.log('[AuthProvider] Iniciando login con Google');

      const result: AuthOperationResult = await authService.loginWithGoogle();

      if (!result.success) {
        throw new Error(result.error?.message || 'Error en login con Google');
      }

      console.log('[AuthProvider] Login con Google exitoso:', result.user?.email);

    } catch (error: any) {
      console.error('[AuthProvider] Error en login con Google:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('[AuthProvider] Iniciando logout');

      const result: AuthOperationResult = await authService.logout();

      if (!result.success) {
        throw new Error(result.error?.message || 'Error en logout');
      }

      console.log('[AuthProvider] Logout exitoso');

    } catch (error: any) {
      console.error('[AuthProvider] Error en logout:', error);
      throw error;
    }
  };

  // ============================================================================
  // NUEVOS MÉTODOS AVANZADOS
  // ============================================================================

  const getCurrentUser = async (): Promise<SessionData | null> => {
    try {
      return await authService.getCurrentUser();
    } catch (error) {
      console.error('[AuthProvider] Error obteniendo usuario actual:', error);
      return null;
    }
  };

  const hasValidSession = async (): Promise<boolean> => {
    try {
      return await authService.hasValidSession();
    } catch (error) {
      console.error('[AuthProvider] Error verificando sesión válida:', error);
      return false;
    }
  };

  const updateActivity = async (): Promise<void> => {
    try {
      await authService.updateActivity();
      console.log('[AuthProvider] Actividad actualizada');
    } catch (error) {
      console.error('[AuthProvider] Error actualizando actividad:', error);
    }
  };

  const extendSession = async (): Promise<void> => {
    try {
      const result = await authService.extendSession();
      if (result.success) {
        console.log('[AuthProvider] Sesión extendida exitosamente');
      } else {
        throw new Error(result.error?.message || 'Error extendiendo sesión');
      }
    } catch (error) {
      console.error('[AuthProvider] Error extendiendo sesión:', error);
      throw error;
    }
  };

  const getSessionStatus = async (): Promise<string> => {
    try {
      return await authService.getSessionStatus();
    } catch (error) {
      console.error('[AuthProvider] Error obteniendo estado de sesión:', error);
      return 'unauthenticated';
    }
  };

  const updateConfig = (config: any): void => {
    try {
      authService.updateConfig(config);
      console.log('[AuthProvider] Configuración actualizada');
    } catch (error) {
      console.error('[AuthProvider] Error actualizando configuración:', error);
    }
  };

  const getStats = async (): Promise<any> => {
    try {
      return await authService.getStats();
    } catch (error) {
      console.error('[AuthProvider] Error obteniendo estadísticas:', error);
      return null;
    }
  };

  // ============================================================================
  // UTILITIES INTERNAS
  // ============================================================================

  const convertSessionDataToFirebaseUser = (sessionData: SessionData): User | null => {
    // Esta es una conversión simplificada para compatibilidad
    // En una implementación real, podrías necesitar más campos
    if (!sessionData) return null;

    // Crear un objeto mock que sea compatible con la interfaz User de Firebase
    const mockUser = {
      uid: sessionData.uid,
      email: sessionData.email,
      displayName: sessionData.displayName,
      photoURL: sessionData.photoURL,
      emailVerified: sessionData.emailVerified,
      isAnonymous: false,
      metadata: {
        creationTime: new Date(sessionData.sessionStartTime).toISOString(),
        lastSignInTime: new Date(sessionData.lastActivityTime).toISOString(),
      },
      providerData: sessionData.authMethod === 'google' ? [{
        providerId: 'google.com',
        uid: sessionData.uid,
        displayName: sessionData.displayName,
        email: sessionData.email,
        photoURL: sessionData.photoURL,
      }] : [],
      refreshToken: sessionData.refreshToken || '',
      tenantId: null,
      phoneNumber: null,
      providerId: sessionData.authMethod === 'google' ? 'google.com' : 'password',
    } as User;

    return mockUser;
  };

  // ============================================================================
  // VALOR DEL CONTEXTO
  // ============================================================================

  const value: AuthContextType = {
    // Estado básico (compatibilidad)
    user,
    loading,

    // Métodos existentes (compatibilidad)
    login,
    signup,
    signInWithGoogle,
    logout,

    // Nuevos métodos avanzados
    getCurrentUser,
    hasValidSession,
    updateActivity,
    extendSession,
    getSessionStatus,

    // Estado avanzado
    sessionStatus: authState.sessionStatus,
    error: authState.error,
    isEmailVerified: authState.isEmailVerified,

    // Configuración y utilidades
    updateConfig,
    getStats,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};