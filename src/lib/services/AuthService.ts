/**
 * AuthService - Servicio principal de autenticación
 *
 * Funcionalidades implementadas:
 * - Integración completa con TokenManager y SessionManager
 * - Compatibilidad con Firebase Auth existente
 * - Gestión unificada de autenticación y sesiones
 * - Verificación automática de sesiones y refresh de tokens
 * - Manejo robusto de errores y logging
 * - Métodos para obtener estado actual de autenticación
 * - Configuración y inicialización centralizada
 * - Utilidades y helpers para operaciones comunes
 */

import type {
  AuthConfig,
  AuthState,
  AuthError,
  AuthErrorCode,
  SessionData,
  TokenData,
  LoginFormData,
  SignupFormData,
  AuthOperationOptions,
  AuthOperationResult,
  AuthEvent,
  AuthEventHandler,
  AuthMethod,
  PersistenceType,
  SessionStatus,
} from '../types/auth';

import { tokenManager } from './TokenManager';
import { sessionManager } from './SessionManager';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  Auth as FirebaseAuth,
  UserCredential,
} from 'firebase/auth';
import { auth } from '../firebase';

// ============================================================================
// INTERFACES Y TIPOS INTERNOS
// ============================================================================

interface AuthServiceConfig extends AuthConfig {
  /** Configuración específica del servicio */
  service: {
    /** Indica si se debe sincronizar automáticamente con Firebase */
    autoSyncWithFirebase: boolean;
    /** Indica si se debe verificar la sesión en cada operación */
    verifySessionOnOperations: boolean;
    /** Tiempo de espera para operaciones en milisegundos */
    operationTimeoutMs: number;
    /** Número máximo de reintentos para operaciones */
    maxRetries: number;
  };
}

interface AuthServiceEvents {
  /** Evento emitido cuando cambia el estado de autenticación */
  onStateChange: (state: AuthState) => void;
  /** Evento emitido cuando ocurre un error */
  onError: (error: AuthError) => void;
  /** Evento emitido antes de que expire la sesión */
  onSessionWarning: (minutesLeft: number) => void;
  /** Evento emitido cuando expira la sesión */
  onSessionExpired: () => void;
}

interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

// ============================================================================
// IMPLEMENTACIÓN DEL LOGGER
// ============================================================================

class AuthServiceLogger implements Logger {
  private prefix = '[AuthService]';

  info(message: string, data?: any): void {
    console.info(`${this.prefix} ${message}`, data || '');
  }

  warn(message: string, data?: any): void {
    console.warn(`${this.prefix} ⚠️ ${message}`, data || '');
  }

  error(message: string, data?: any): void {
    console.error(`${this.prefix} ❌ ${message}`, data || '');
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${this.prefix} 🔍 ${message}`, data || '');
    }
  }
}

// ============================================================================
// GESTIÓN DE ERRORES
// ============================================================================

/**
 * Crea un error de autenticación tipado
 */
function createAuthError(
  code: AuthErrorCode,
  message: string,
  recoverable: boolean = true,
  email?: string,
  attempts?: number
): AuthError {
  return {
    code,
    message,
    email,
    timestamp: Date.now(),
    recoverable,
    attempts,
  };
}

/**
 * Convierte errores de Firebase a errores de AuthService
 */
function convertFirebaseError(error: any): AuthError {
  const firebaseErrorMap: Record<string, AuthErrorCode> = {
    'auth/user-not-found': 'auth/user-not-found',
    'auth/wrong-password': 'auth/wrong-password',
    'auth/invalid-email': 'auth/invalid-email',
    'auth/user-disabled': 'auth/user-disabled',
    'auth/email-already-in-use': 'auth/email-already-in-use',
    'auth/weak-password': 'auth/weak-password',
    'auth/operation-not-allowed': 'auth/operation-not-allowed',
    'auth/requires-recent-login': 'auth/requires-recent-login',
    'auth/network-request-failed': 'auth/network-request-failed',
    'auth/too-many-requests': 'auth/too-many-requests',
  };

  const errorCode = firebaseErrorMap[error.code] || 'auth/unknown-error';
  const message = error.message || 'Error desconocido de autenticación';

  return createAuthError(errorCode, message, true);
}

// ============================================================================
// GESTIÓN DE PERSISTENCIA
// ============================================================================

/**
 * Convierte PersistenceType a Firebase persistence
 */
function mapPersistenceType(persistence: PersistenceType) {
  switch (persistence) {
    case 'local':
      return browserLocalPersistence;
    case 'session':
      return browserSessionPersistence;
    case 'none':
      return browserSessionPersistence; // Firebase no tiene 'none', usar session
    default:
      return browserSessionPersistence;
  }
}

// ============================================================================
// IMPLEMENTACIÓN PRINCIPAL DEL AUTHSERVICE
// ============================================================================

export class AuthService {
  private config: AuthServiceConfig;
  private logger: Logger;
  private firebaseAuth: FirebaseAuth;
  private eventHandlers: Map<string, AuthEventHandler> = new Map();
  private stateChangeListeners: Map<string, (state: AuthState) => void> = new Map();
  private currentState: AuthState;
  private isInitialized = false;
  private firebaseUnsubscribe: (() => void) | null = null;

  constructor(config: Partial<AuthServiceConfig> = {}) {
    this.config = {
      defaultPersistence: 'local',
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
      service: {
        autoSyncWithFirebase: true,
        verifySessionOnOperations: true,
        operationTimeoutMs: 10000,
        maxRetries: 3,
        ...config.service,
      },
      ...config,
    };

    this.logger = new AuthServiceLogger();
    this.firebaseAuth = auth;
    this.currentState = this.getInitialState();

    this.initialize();
  }

  // ============================================================================
  // INICIALIZACIÓN Y CONFIGURACIÓN
  // ============================================================================

  /**
   * Inicializa el servicio de autenticación
   */
  private async initialize(): Promise<void> {
    try {

      // Configurar TokenManager
      tokenManager.updateConfig({
        networkTimeoutMs: this.config.service.operationTimeoutMs,
      });

      // Configurar SessionManager (siempre sin timeout)
      sessionManager.updateConfig({
        inactivityTimeoutMinutes: 0, // Sin timeout
        absoluteTimeoutDays: 0, // Sin timeout absoluto
        checkIntervalMinutes: 1,
        maxConcurrentSessions: 5,
        autoExtendSession: false, // No extender automáticamente
        warningThresholdMinutes: 0, // Sin warnings
        persistence: this.config.defaultPersistence,
      });

      // Configurar listeners de Firebase
      this.setupFirebaseListeners();

      // Configurar listeners de SessionManager
      this.setupSessionManagerListeners();

      // Verificar si hay sesión existente
      await this.checkExistingSession();

      this.isInitialized = true;

    } catch (error) {
      this.logger.error('Error inicializando AuthService', error);
      throw createAuthError('auth/configuration-error', 'Error inicializando servicio de autenticación', false);
    }
  }

  /**
   * Configura los listeners de Firebase Auth
   */
  private setupFirebaseListeners(): void {
    this.firebaseUnsubscribe = onAuthStateChanged(this.firebaseAuth, async (firebaseUser) => {
      try {
        this.logger.debug('Cambio en estado de Firebase Auth', {
          uid: firebaseUser?.uid,
          email: firebaseUser?.email,
        });

        if (firebaseUser) {
          // Usuario autenticado en Firebase
          await this.handleFirebaseUserAuthenticated(firebaseUser);
        } else {
          // Usuario no autenticado en Firebase
          await this.handleFirebaseUserUnauthenticated();
        }

        // Notificar cambio de estado
        this.notifyStateChange();

      } catch (error) {
        this.logger.error('Error manejando cambio de estado Firebase', error);
        this.handleError(createAuthError('auth/unknown-error', 'Error procesando cambio de autenticación', true));
      }
    });
  }

  /**
   * Configura los listeners del SessionManager
   */
  private setupSessionManagerListeners(): void {
    // Listener para eventos de sesión
    sessionManager.onSessionEvent('session-expired', (event, data) => {
      if (event === 'session-expired') {
        if (data?.type === 'warning') {
          this.notifyEventHandlers('session-expired', data);
        } else {
          this.handleSessionExpired();
        }
      }
    });

    // Listener para otros eventos de sesión
    sessionManager.onSessionEvent('login', (event, data) => {
      this.notifyEventHandlers(event, data);
    });

    sessionManager.onSessionEvent('logout', (event, data) => {
      this.notifyEventHandlers(event, data);
    });
  }

  /**
   * Verifica si hay una sesión existente al inicializar
   */
  private async checkExistingSession(): Promise<void> {
    try {
      const hasValidSession = await sessionManager.hasValidSession();
      const hasValidTokens = await tokenManager.hasValidSession();

      if (hasValidSession && hasValidTokens) {
        const sessionData = await sessionManager.getCurrentSession();
        if (sessionData) {
          this.currentState = {
            ...this.currentState,
            user: sessionData,
            sessionStatus: 'authenticated',
            loading: false,
          };
        }
      } else {
        this.currentState = {
          ...this.currentState,
          loading: false,
        };
      }
    } catch (error) {
      this.logger.error('Error verificando sesión existente', error);
    }
  }

  /**
   * Obtiene el estado inicial
   */
  private getInitialState(): AuthState {
    return {
      user: null,
      loading: true,
      isLoading: false,
      error: null,
      sessionStatus: 'loading',
      persistence: this.config.defaultPersistence,
      isEmailVerified: false,
      isVerifyingEmail: false,
    };
  }

  // ============================================================================
  // MANEJO DE ESTADO DE FIREBASE
  // ============================================================================

  /**
   * Maneja cuando un usuario se autentica en Firebase
   */
  private async handleFirebaseUserAuthenticated(firebaseUser: User): Promise<void> {
    try {
      // Crear SessionData desde Firebase User
      const sessionData: SessionData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        authMethod: this.detectAuthMethod(firebaseUser),
        sessionStartTime: Date.now(),
        lastActivityTime: Date.now(),
        isActive: true,
      };

      // Sincronizar con SessionManager
      await sessionManager.syncWithFirebase(firebaseUser);

      // Actualizar estado actual
      this.currentState = {
        ...this.currentState,
        user: sessionData,
        sessionStatus: 'authenticated',
        isEmailVerified: firebaseUser.emailVerified,
        loading: false,
        isLoading: false,
        error: null,
      };

      this.logger.info('Usuario autenticado en Firebase', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      });

    } catch (error) {
      this.logger.error('Error manejando usuario autenticado', error);
      throw error;
    }
  }

  /**
   * Maneja cuando un usuario se desautentica en Firebase
   */
  private async handleFirebaseUserUnauthenticated(): Promise<void> {
    try {
      // Limpiar sesión y tokens
      await sessionManager.destroyCurrentSession();
      await tokenManager.clearTokens();

      // Actualizar estado
      this.currentState = {
        ...this.currentState,
        user: null,
        sessionStatus: 'unauthenticated',
        isEmailVerified: false,
        loading: false,
        isLoading: false,
        error: null,
      };


    } catch (error) {
      this.logger.error('Error manejando usuario desautenticado', error);
    }
  }

  // ============================================================================
  // MÉTODOS PRINCIPALES DE AUTENTICACIÓN
  // ============================================================================

  /**
   * Inicia sesión con email y contraseña
   */
  async login(
    formData: LoginFormData,
    options: AuthOperationOptions = {}
  ): Promise<AuthOperationResult> {
    const startTime = Date.now();

    try {
      this.setLoading(true);

      // Verificar sesión si está habilitado
      if (this.config.service.verifySessionOnOperations) {
        const hasValidSession = await this.hasValidSession();
        if (hasValidSession) {
          this.logger.warn('Ya hay una sesión válida activa');
          return {
            success: false,
            error: createAuthError('auth/unauthorized', 'Ya hay una sesión activa', false),
          };
        }
      }

      // Configurar persistencia
      const persistence = options.persistence || this.config.defaultPersistence;
      await setPersistence(this.firebaseAuth, mapPersistenceType(persistence));

      // Realizar login con Firebase
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.firebaseAuth,
        formData.email,
        formData.password
      );

      // Obtener tokens
      const tokenData = await this.getFirebaseTokens(userCredential.user);

      // Guardar tokens
      await tokenManager.saveTokens(tokenData, persistence);

      // Crear sesión
      const sessionData = await this.createSessionFromFirebaseUser(userCredential.user);
      await sessionManager.createSession(sessionData);

      // Actualizar estado
      this.currentState = {
        ...this.currentState,
        user: sessionData,
        sessionStatus: 'authenticated',
        isEmailVerified: userCredential.user.emailVerified,
        loading: false,
        isLoading: false,
        error: null,
      };

      this.logger.info('Login exitoso', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        duration: Date.now() - startTime,
      });

      // Emitir evento
      this.notifyEventHandlers('login', { user: sessionData });

      return {
        success: true,
        user: sessionData,
        message: 'Login exitoso',
      };

    } catch (error: any) {
      const authError = convertFirebaseError(error);
      this.handleError(authError);

      this.logger.error('Error en login', {
        email: formData.email,
        error: authError,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        error: authError,
      };
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async signup(
    formData: SignupFormData,
    options: AuthOperationOptions = {}
  ): Promise<AuthOperationResult> {
    const startTime = Date.now();

    try {
      this.setLoading(true);

      // Configurar persistencia
      const persistence = options.persistence || this.config.defaultPersistence;
      await setPersistence(this.firebaseAuth, mapPersistenceType(persistence));

      // Crear usuario con Firebase
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.firebaseAuth,
        formData.email,
        formData.password
      );

      // Si se requiere verificación de email, enviarla
      if (this.config.requireEmailVerification) {
        await sendEmailVerification(userCredential.user);
      }

      // Obtener tokens
      const tokenData = await this.getFirebaseTokens(userCredential.user);

      // Guardar tokens
      await tokenManager.saveTokens(tokenData, persistence);

      // Crear sesión
      const sessionData = await this.createSessionFromFirebaseUser(userCredential.user);
      await sessionManager.createSession(sessionData);

      // Actualizar estado
      this.currentState = {
        ...this.currentState,
        user: sessionData,
        sessionStatus: 'authenticated',
        isEmailVerified: userCredential.user.emailVerified,
        loading: false,
        isLoading: false,
        error: null,
      };

      this.logger.info('Registro exitoso', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        duration: Date.now() - startTime,
      });

      // Emitir evento
      this.notifyEventHandlers('signup', { user: sessionData });

      return {
        success: true,
        user: sessionData,
        message: 'Registro exitoso',
      };

    } catch (error: any) {
      const authError = convertFirebaseError(error);
      this.handleError(authError);

      this.logger.error('Error en registro', {
        email: formData.email,
        error: authError,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        error: authError,
      };
    }
  }

  /**
   * Inicia sesión con Google
   */
  async loginWithGoogle(options: AuthOperationOptions = {}): Promise<AuthOperationResult> {
    const startTime = Date.now();

    try {
      this.setLoading(true);

      // Verificar sesión si está habilitado
      if (this.config.service.verifySessionOnOperations) {
        const hasValidSession = await this.hasValidSession();
        if (hasValidSession) {
          this.logger.warn('Ya hay una sesión válida activa');
          return {
            success: false,
            error: createAuthError('auth/unauthorized', 'Ya hay una sesión activa', false),
          };
        }
      }

      // Configurar persistencia
      const persistence = options.persistence || this.config.defaultPersistence;
      await setPersistence(this.firebaseAuth, mapPersistenceType(persistence));

      // Configurar scopes de Google si están definidos
      if (this.config.socialProviders.google.scopes) {
        const provider = new GoogleAuthProvider();
        this.config.socialProviders.google.scopes.forEach(scope => {
          provider.addScope(scope);
        });
      }

      // Realizar login con Google
      const userCredential: UserCredential = await signInWithPopup(
        this.firebaseAuth,
        new GoogleAuthProvider()
      );

      // Obtener tokens
      const tokenData = await this.getFirebaseTokens(userCredential.user);

      // Guardar tokens
      await tokenManager.saveTokens(tokenData, persistence);

      // Crear sesión
      const sessionData = await this.createSessionFromFirebaseUser(userCredential.user);
      await sessionManager.createSession(sessionData);

      // Actualizar estado
      this.currentState = {
        ...this.currentState,
        user: sessionData,
        sessionStatus: 'authenticated',
        isEmailVerified: userCredential.user.emailVerified,
        loading: false,
        isLoading: false,
        error: null,
      };

      this.logger.info('Login con Google exitoso', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        duration: Date.now() - startTime,
      });

      // Emitir evento
      this.notifyEventHandlers('login', { user: sessionData, method: 'google' });

      return {
        success: true,
        user: sessionData,
        message: 'Login con Google exitoso',
      };

    } catch (error: any) {
      const authError = convertFirebaseError(error);
      this.handleError(authError);

      this.logger.error('Error en login con Google', {
        error: authError,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        error: authError,
      };
    }
  }

  /**
   * Cierra la sesión actual
   */
  async logout(options: AuthOperationOptions = {}): Promise<AuthOperationResult> {
    const startTime = Date.now();

    try {
      this.setLoading(true);

      // Cerrar sesión en Firebase
      await signOut(this.firebaseAuth);

      // Limpiar tokens y sesión
      await tokenManager.clearTokens();
      await sessionManager.destroyCurrentSession();

      // Actualizar estado
      this.currentState = {
        ...this.currentState,
        user: null,
        sessionStatus: 'unauthenticated',
        isEmailVerified: false,
        loading: false,
        isLoading: false,
        error: null,
      };


      // Emitir evento
      this.notifyEventHandlers('logout');

      return {
        success: true,
        message: 'Logout exitoso',
      };

    } catch (error: any) {
      const authError = createAuthError('auth/unknown-error', 'Error cerrando sesión', true);
      this.handleError(authError);

      this.logger.error('Error en logout', {
        error: authError,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        error: authError,
      };
    }
  }

  // ============================================================================
  // MÉTODOS DE VERIFICACIÓN Y SESIÓN
  // ============================================================================

  /**
   * Verifica si hay una sesión válida
   */
  async hasValidSession(): Promise<boolean> {
    try {
      const sessionValid = await sessionManager.hasValidSession();
      const tokensValid = await tokenManager.hasValidSession();

      const isValid = sessionValid && tokensValid;

      this.logger.debug('Verificación de sesión válida', {
        sessionValid,
        tokensValid,
        overall: isValid,
      });

      return isValid;
    } catch (error) {
      this.logger.error('Error verificando sesión válida', error);
      return false;
    }
  }

  /**
   * Obtiene el estado actual de autenticación
   */
  getCurrentState(): AuthState {
    return { ...this.currentState };
  }

  /**
   * Obtiene el usuario actual
   */
  async getCurrentUser(): Promise<SessionData | null> {
    try {
      const session = await sessionManager.getCurrentSession();
      return session;
    } catch (error) {
      this.logger.error('Error obteniendo usuario actual', error);
      return null;
    }
  }

  /**
   * Obtiene el estado de la sesión
   */
  async getSessionStatus(): Promise<SessionStatus> {
    try {
      return await sessionManager.getSessionStatus();
    } catch (error) {
      this.logger.error('Error obteniendo estado de sesión', error);
      return 'unauthenticated';
    }
  }

  /**
   * Actualiza la actividad de la sesión
   */
  async updateActivity(): Promise<void> {
    try {
      await sessionManager.updateActivity();
    } catch (error) {
      this.logger.error('Error actualizando actividad', error);
    }
  }

  /**
   * Extiende la sesión actual
   */
  async extendSession(): Promise<AuthOperationResult> {
    try {
      await sessionManager.extendSession();
      return { success: true, message: 'Sesión extendida' };
    } catch (error: any) {
      const authError = createAuthError('auth/session-expired', 'Error extendiendo sesión', false);
      this.handleError(authError);
      return { success: false, error: authError };
    }
  }

  // ============================================================================
  // MÉTODOS DE VERIFICACIÓN DE EMAIL
  // ============================================================================

  /**
   * Envía email de verificación
   */
  async sendEmailVerification(): Promise<AuthOperationResult> {
    try {
      const user = this.firebaseAuth.currentUser;
      if (!user) {
        throw createAuthError('auth/requires-recent-login', 'Usuario no autenticado', false);
      }

      await sendEmailVerification(user);

      return {
        success: true,
        message: 'Email de verificación enviado',
      };
    } catch (error: any) {
      const authError = convertFirebaseError(error);
      this.handleError(authError);
      return { success: false, error: authError };
    }
  }

  /**
   * Envía email de reset de contraseña
   */
  async sendPasswordResetEmail(email: string): Promise<AuthOperationResult> {
    try {
      await sendPasswordResetEmail(this.firebaseAuth, email);

      return {
        success: true,
        message: 'Email de reset de contraseña enviado',
      };
    } catch (error: any) {
      const authError = convertFirebaseError(error);
      this.handleError(authError);
      return { success: false, error: authError };
    }
  }

  /**
   * Confirma reset de contraseña
   */
  async confirmPasswordReset(code: string, newPassword: string): Promise<AuthOperationResult> {
    try {
      await confirmPasswordReset(this.firebaseAuth, code, newPassword);

      return {
        success: true,
        message: 'Contraseña reseteada exitosamente',
      };
    } catch (error: any) {
      const authError = convertFirebaseError(error);
      this.handleError(authError);
      return { success: false, error: authError };
    }
  }

  // ============================================================================
  // MÉTODOS DE UTILIDAD
  // ============================================================================

  /**
   * Obtiene tokens de Firebase
   */
  private async getFirebaseTokens(user: User): Promise<TokenData> {
    try {
      const idToken = await user.getIdToken();
      const refreshToken = (user as any).refreshToken || '';

      return {
        accessToken: idToken,
        refreshToken,
        expirationTime: Date.now() + (60 * 60 * 1000), // 1 hora
        issuedAtTime: Date.now(),
        tokenType: 'Bearer',
      };
    } catch (error) {
      this.logger.error('Error obteniendo tokens de Firebase', error);
      throw createAuthError('auth/token-expired', 'Error obteniendo tokens', false);
    }
  }

  /**
   * Crea SessionData desde Firebase User
   */
  private async createSessionFromFirebaseUser(user: User): Promise<SessionData> {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      authMethod: this.detectAuthMethod(user),
      sessionStartTime: Date.now(),
      lastActivityTime: Date.now(),
      isActive: true,
    };
  }

  /**
   * Detecta el método de autenticación usado
   */
  private detectAuthMethod(user: User): AuthMethod {
    if (user.isAnonymous) return 'anonymous';
    if (user.providerData && user.providerData.some(p => p.providerId === 'google.com')) {
      return 'google';
    }
    return 'email';
  }

  /**
   * Maneja errores
   */
  private handleError(error: AuthError): void {
    this.currentState = {
      ...this.currentState,
      error,
      loading: false,
      isLoading: false,
    };

    this.notifyEventHandlers('auth-error', { error });
    this.logger.error('Error de autenticación', error);
  }

  /**
   * Maneja expiración de sesión
   */
  private async handleSessionExpired(): Promise<void> {
    try {
      this.logger.warn('Sesión expirada, cerrando sesión');

      // Cerrar sesión
      await this.logout();

      // Notificar
      this.notifyEventHandlers('session-expired');

    } catch (error) {
      this.logger.error('Error manejando expiración de sesión', error);
    }
  }

  /**
   * Establece el estado de carga
   */
  private setLoading(loading: boolean): void {
    this.currentState = {
      ...this.currentState,
      loading,
      isLoading: loading,
    };
  }

  /**
   * Notifica cambio de estado
   */
  private notifyStateChange(): void {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        this.logger.error('Error en listener de cambio de estado', error);
      }
    });
  }

  /**
   * Notifica handlers de eventos
   */
  private notifyEventHandlers(event: AuthEvent, data?: any): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event, data);
      } catch (error) {
        this.logger.error('Error en event handler', { event, error });
      }
    });
  }

  // ============================================================================
  // MÉTODOS DE GESTIÓN DE EVENTOS
  // ============================================================================

  /**
   * Registra un handler para eventos de autenticación
   */
  onAuthEvent(event: AuthEvent, handler: AuthEventHandler): string {
    const handlerId = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.eventHandlers.set(handlerId, handler);

    return handlerId;
  }

  /**
   * Elimina un handler de eventos
   */
  offAuthEvent(handlerId: string): void {
    this.eventHandlers.delete(handlerId);
  }

  /**
   * Registra un listener para cambios de estado
   */
  onStateChange(listener: (state: AuthState) => void): string {
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.stateChangeListeners.set(listenerId, listener);

    return listenerId;
  }

  /**
   * Elimina un listener de cambios de estado
   */
  offStateChange(listenerId: string): void {
    this.stateChangeListeners.delete(listenerId);
  }

  // ============================================================================
  // CONFIGURACIÓN Y DESTRUCCIÓN
  // ============================================================================

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<AuthServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtiene estadísticas del servicio
   */
  async getStats(): Promise<{
    isInitialized: boolean;
    sessionStatus: SessionStatus;
    hasValidSession: boolean;
    tokenStats: any;
    sessionStats: any;
  }> {
    const sessionStatus = await this.getSessionStatus();
    const hasValidSession = await this.hasValidSession();
    const tokenStats = await tokenManager.getStats();
    const sessionStats = await sessionManager.getSessionStats();

    return {
      isInitialized: this.isInitialized,
      sessionStatus,
      hasValidSession,
      tokenStats,
      sessionStats,
    };
  }

  /**
   * Limpia el servicio
   */
  async destroy(): Promise<void> {
    try {

      // Limpiar listeners
      if (this.firebaseUnsubscribe) {
        this.firebaseUnsubscribe();
        this.firebaseUnsubscribe = null;
      }

      // Limpiar event handlers
      this.eventHandlers.clear();
      this.stateChangeListeners.clear();

      // Destruir managers
      tokenManager.destroy();
      sessionManager.destroy();

      // Resetear estado
      this.currentState = this.getInitialState();
      this.isInitialized = false;


    } catch (error) {
      this.logger.error('Error destruyendo AuthService', error);
    }
  }
}

// ============================================================================
// INSTANCIA POR DEFECTO
// ============================================================================

/**
 * Instancia por defecto del AuthService
 */
export const authService = new AuthService();

// ============================================================================
// EXPORTACIONES ADICIONALES
// ============================================================================

export type { AuthServiceConfig, AuthServiceEvents };
export { createAuthError, convertFirebaseError };