/**
 * Sistema de tipos de datos para persistencia de sesión segura
 * Compatible con Firebase Auth y el contexto de autenticación existente
 */

// ============================================================================
// TIPOS BÁSICOS DE AUTENTICACIÓN
// ============================================================================

/**
 * Tipos de métodos de autenticación disponibles
 */
export type AuthMethod = 'email' | 'google' | 'anonymous';

/**
 * Tipos de persistencia de sesión
 */
export type PersistenceType = 'local' | 'session' | 'none';

/**
 * Estados posibles de la sesión de usuario
 */
export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'expired';

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

/**
 * Datos de la sesión del usuario
 * Contiene información sobre la sesión actual y su estado
 */
export interface SessionData {
  /** ID único del usuario en Firebase Auth */
  uid: string;
  /** Email del usuario (puede ser null para autenticación social) */
  email: string | null;
  /** Nombre para mostrar del usuario */
  displayName: string | null;
  /** URL de la foto de perfil del usuario */
  photoURL: string | null;
  /** Email verificado */
  emailVerified: boolean;
  /** Método de autenticación utilizado */
  authMethod: AuthMethod;
  /** Timestamp de creación de la sesión */
  sessionStartTime: number;
  /** Timestamp de última actividad */
  lastActivityTime: number;
  /** Indica si la sesión está activa */
  isActive: boolean;
  /** Token de acceso actual (para operaciones de API) */
  accessToken?: string;
  /** Token de refresh (si está disponible) */
  refreshToken?: string;
}

/**
 * Datos del token de autenticación
 * Información sobre los tokens JWT de Firebase
 */
export interface TokenData {
  /** Token de acceso JWT */
  accessToken: string;
  /** Token de refresh */
  refreshToken: string;
  /** Timestamp de expiración del token (en segundos desde epoch) */
  expirationTime: number;
  /** Timestamp de emisión del token */
  issuedAtTime: number;
  /** Tipo de token (generalmente 'Bearer') */
  tokenType: string;
  /** Claims personalizados del token */
  claims?: Record<string, any>;
}

/**
 * Estado global de autenticación
 * Maneja toda la información del estado de auth en la aplicación
 */
export interface AuthState {
  /** Usuario actual (compatible con Firebase User) */
  user: SessionData | null;
  /** Estado de carga de la autenticación */
  loading: boolean;
  /** Indica si hay una operación de autenticación en progreso */
  isLoading: boolean;
  /** Error de autenticación actual (si existe) */
  error: AuthError | null;
  /** Estado de la sesión */
  sessionStatus: SessionStatus;
  /** Configuración de persistencia actual */
  persistence: PersistenceType;
  /** Indica si el email está verificado */
  isEmailVerified: boolean;
  /** Indica si hay una operación de verificación de email en progreso */
  isVerifyingEmail: boolean;
}

/**
 * Configuración de autenticación
 * Opciones y configuración para el sistema de autenticación
 */
export interface AuthConfig {
  /** Tipo de persistencia por defecto */
  defaultPersistence: PersistenceType;
  /** Tiempo de vida de la sesión en minutos (opcional, si no se especifica las sesiones no expiran) */
  sessionTimeoutMinutes?: number;
  /** Indica si se requiere verificación de email */
  requireEmailVerification: boolean;
  /** URLs de redirección después del login/logout */
  redirectUrls: {
    /** URL después del login exitoso */
    afterLogin: string;
    /** URL después del logout */
    afterLogout: string;
    /** URL para verificación de email */
    emailVerification: string;
  };
  /** Configuración de proveedores sociales */
  socialProviders: {
    /** Configuración de Google Auth */
    google: {
      enabled: boolean;
      clientId?: string;
      scopes?: string[];
    };
  };
  /** Configuración de seguridad */
  security: {
    /** Máximo número de intentos de login fallidos */
    maxLoginAttempts: number;
    /** Tiempo de bloqueo después de intentos fallidos (minutos) */
    lockoutDurationMinutes: number;
    /** Indica si se debe usar reCAPTCHA */
    enableRecaptcha: boolean;
  };
}

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

/**
 * Tipos de errores de autenticación
 */
export type AuthErrorCode =
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/invalid-email'
  | 'auth/user-disabled'
  | 'auth/email-already-in-use'
  | 'auth/weak-password'
  | 'auth/operation-not-allowed'
  | 'auth/requires-recent-login'
  | 'auth/network-request-failed'
  | 'auth/too-many-requests'
  | 'auth/unauthorized'
  | 'auth/session-expired'
  | 'auth/token-expired'
  | 'auth/persistence-error'
  | 'auth/configuration-error'
  | 'auth/unknown-error';

/**
 * Error de autenticación personalizado
 * Extiende el error estándar con información específica de auth
 */
export interface AuthError {
  /** Código único del error */
  code: AuthErrorCode;
  /** Mensaje descriptivo del error */
  message: string;
  /** Email del usuario (si está disponible) */
  email?: string;
  /** Timestamp cuando ocurrió el error */
  timestamp: number;
  /** Indica si el error es recuperable */
  recoverable: boolean;
  /** Número de intentos fallidos (para rate limiting) */
  attempts?: number;
}

// ============================================================================
// FORMULARIOS Y VALIDACIÓN
// ============================================================================

/**
 * Datos del formulario de login
 */
export interface LoginFormData {
  /** Email del usuario */
  email: string;
  /** Contraseña del usuario */
  password: string;
  /** Indica si el usuario quiere recordar la sesión */
  rememberMe: boolean;
  /** Token de reCAPTCHA (si está habilitado) */
  recaptchaToken?: string;
}

/**
 * Datos del formulario de registro
 */
export interface SignupFormData {
  /** Email del usuario */
  email: string;
  /** Contraseña del usuario */
  password: string;
  /** Confirmación de contraseña */
  confirmPassword: string;
  /** Nombre para mostrar (opcional) */
  displayName?: string;
  /** Aceptación de términos y condiciones */
  acceptTerms: boolean;
  /** Token de reCAPTCHA (si está habilitado) */
  recaptchaToken?: string;
}

/**
 * Validación de formularios
 */
export interface FormValidation {
  /** Indica si el formulario es válido */
  isValid: boolean;
  /** Errores de validación por campo */
  errors: Record<string, string>;
  /** Mensaje de error general */
  message?: string;
}

// ============================================================================
// EVENTOS Y CALLBACKS
// ============================================================================

/**
 * Eventos de autenticación
 */
export type AuthEvent =
  | 'login'
  | 'logout'
  | 'signup'
  | 'email-verification-sent'
  | 'email-verified'
  | 'password-reset-sent'
  | 'session-expired'
  | 'auth-error';

/**
 * Callback para manejar eventos de autenticación
 */
export type AuthEventHandler = (event: AuthEvent, data?: any) => void;

/**
 * Listener para cambios en el estado de autenticación
 */
export interface AuthStateListener {
  /** ID único del listener */
  id: string;
  /** Callback a ejecutar */
  callback: (state: AuthState) => void;
  /** Indica si el listener está activo */
  active: boolean;
}

// ============================================================================
// MIDDLEWARE Y PROTECCIÓN DE RUTAS
// ============================================================================

/**
 * Configuración de protección de rutas
 */
export interface RouteProtectionConfig {
  /** Rutas que requieren autenticación */
  protectedRoutes: string[];
  /** Rutas públicas (no requieren autenticación) */
  publicRoutes: string[];
  /** Rutas de autenticación (login, signup, etc.) */
  authRoutes: string[];
  /** Redirección por defecto para usuarios no autenticados */
  defaultRedirect: string;
}

/**
 * Información sobre la ruta actual para middleware
 */
export interface RouteContext {
  /** Ruta actual */
  pathname: string;
  /** Indica si la ruta requiere autenticación */
  requiresAuth: boolean;
  /** Indica si es una ruta de autenticación */
  isAuthRoute: boolean;
  /** Indica si es una ruta pública */
  isPublicRoute: boolean;
}

// ============================================================================
// INTEGRACIÓN CON FIREBASE
// ============================================================================

/**
 * Extensión de tipos de Firebase para compatibilidad
 * Compatible con firebase/auth User interface
 */
export interface FirebaseUserExtension {
  /** ID único del usuario */
  uid: string;
  /** Email del usuario */
  email: string | null;
  /** Nombre para mostrar */
  displayName: string | null;
  /** URL de foto de perfil */
  photoURL: string | null;
  /** Email verificado */
  emailVerified: boolean;
  /** Metadata del usuario */
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  /** Claims personalizados */
  customClaims?: Record<string, any>;
}

/**
 * Información adicional del usuario en Firestore
 */
export interface UserProfile {
  /** ID del usuario (igual al uid de Firebase) */
  userId: string;
  /** Email del usuario */
  email: string;
  /** Nombre para mostrar */
  displayName?: string;
  /** Biografía del usuario */
  bio?: string;
  /** Preferencias del usuario */
  preferences: {
    /** Tema preferido (light/dark) */
    theme: 'light' | 'dark' | 'system';
    /** Idioma preferido */
    language: string;
    /** Moneda preferida */
    currency: string;
    /** Zona horaria */
    timezone: string;
  };
  /** Configuración de privacidad */
  privacy: {
    /** Perfil público */
    isPublic: boolean;
    /** Mostrar estadísticas */
    showStats: boolean;
  };
  /** Timestamp de creación */
  createdAt: string;
  /** Timestamp de última actualización */
  updatedAt: string;
}

// ============================================================================
// UTILIDADES Y HELPERS
// ============================================================================

/**
 * Opciones para operaciones de autenticación
 */
export interface AuthOperationOptions {
  /** Persistencia a usar para esta operación */
  persistence?: PersistenceType;
  /** Indica si se debe redirigir después de la operación */
  redirect?: boolean;
  /** URL de redirección personalizada */
  redirectUrl?: string;
  /** Callback personalizado después de la operación */
  callback?: () => void;
}

/**
 * Resultado de operaciones de autenticación
 */
export interface AuthOperationResult {
  /** Indica si la operación fue exitosa */
  success: boolean;
  /** Datos del usuario si la operación fue exitosa */
  user?: SessionData;
  /** Error si la operación falló */
  error?: AuthError;
  /** Mensaje adicional */
  message?: string;
}

/**
 * Estadísticas de uso de autenticación
 */
export interface AuthUsageStats {
  /** Número total de sesiones activas */
  activeSessions: number;
  /** Número de logins en las últimas 24 horas */
  loginsLast24h: number;
  /** Número de registros en las últimas 24 horas */
  signupsLast24h: number;
  /** Método de autenticación más usado */
  mostUsedAuthMethod: AuthMethod;
  /** Timestamp de última actualización de estadísticas */
  lastUpdated: number;
}