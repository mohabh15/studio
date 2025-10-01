/**
 * SessionManager - Sistema completo de gestión de sesiones y expiración automática
 *
 * Funcionalidades implementadas:
 * - Gestión completa del ciclo de vida de sesiones
 * - Manejo de expiración por inactividad (30 minutos)
 * - Implementación de expiración por tiempo absoluto (7 días)
 * - Sistema de timers de actividad
 * - Métodos para verificar y actualizar sesiones
 * - Sistema de logging para debugging
 * - Manejo robusto de errores y edge cases
 * - Métodos para integración con Firebase
 */

import type {
  SessionData,
  AuthError,
  AuthErrorCode,
  PersistenceType,
  AuthEvent,
  AuthEventHandler,
  AuthState,
  SessionStatus
} from '../types/auth';

import { safeLocalStorage } from '../utils/ssr-safe';

// ============================================================================
// INTERFACES Y TIPOS INTERNOS
// ============================================================================

interface SessionManagerConfig {
  /** Tiempo de expiración por inactividad en minutos */
  inactivityTimeoutMinutes: number;
  /** Tiempo de expiración absoluto en días */
  absoluteTimeoutDays: number;
  /** Intervalo de verificación de sesiones en minutos */
  checkIntervalMinutes: number;
  /** Número máximo de sesiones simultáneas */
  maxConcurrentSessions: number;
  /** Indica si se debe extender la sesión automáticamente */
  autoExtendSession: boolean;
  /** Tiempo en minutos antes de expirar para mostrar warning */
  warningThresholdMinutes: number;
  /** Configuración de persistencia */
  persistence: PersistenceType;
}

interface SessionMetadata {
  /** ID único de la sesión */
  sessionId: string;
  /** Timestamp de creación de la sesión */
  createdAt: number;
  /** Timestamp de última actividad */
  lastActivityAt: number;
  /** IP del usuario */
  userAgent?: string;
  /** IP del usuario */
  ipAddress?: string;
  /** Device info */
  deviceInfo?: string;
  /** Indica si la sesión está activa */
  isActive: boolean;
  /** Indica si hay una extensión automática pendiente */
  autoExtendPending: boolean;
}

interface SessionWarningCallback {
  (minutesLeft: number, sessionData: SessionData): void;
}

interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

interface SessionError extends Error {
  code: 'SESSION_EXPIRED' | 'SESSION_INVALID' | 'SESSION_LIMIT_EXCEEDED' | 'PERSISTENCE_ERROR';
  sessionId?: string;
  recoverable: boolean;
}

/**
 * Crea un SessionError correctamente tipado
 */
function createSessionError(
  message: string,
  code: SessionError['code'],
  recoverable: boolean = false,
  sessionId?: string
): SessionError {
  const error = new Error(message) as SessionError;
  error.name = 'SessionError';
  error.code = code;
  error.recoverable = recoverable;
  error.sessionId = sessionId;
  return error;
}

// ============================================================================
// IMPLEMENTACIÓN DEL LOGGER
// ============================================================================

class SessionManagerLogger implements Logger {
  private prefix = '[SessionManager]';

  info(message: string, data?: any): void {
    // Logging disabled
  }

  warn(message: string, data?: any): void {
    // Logging disabled
  }

  error(message: string, data?: any): void {
    // Logging disabled
  }

  debug(message: string, data?: any): void {
    // Logging disabled
  }
}

// ============================================================================
// GESTIÓN DE METADATOS DE SESIÓN
// ============================================================================

class SessionMetadataManager {
  private static instance: SessionMetadataManager;
  private metadata: Map<string, SessionMetadata> = new Map();
  private logger: Logger;

  private constructor() {
    this.logger = new SessionManagerLogger();
  }

  static getInstance(): SessionMetadataManager {
    if (!SessionMetadataManager.instance) {
      SessionMetadataManager.instance = new SessionMetadataManager();
    }
    return SessionMetadataManager.instance;
  }

  createSession(sessionId: string, userAgent?: string, ipAddress?: string): SessionMetadata {
    const metadata: SessionMetadata = {
      sessionId,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      userAgent,
      ipAddress,
      deviceInfo: this.getDeviceInfo(),
      isActive: true,
      autoExtendPending: false,
    };

    this.metadata.set(sessionId, metadata);
    this.logger.debug('Sesión creada', { sessionId, metadata });
    return metadata;
  }

  updateActivity(sessionId: string): void {
    const metadata = this.metadata.get(sessionId);
    if (metadata) {
      metadata.lastActivityAt = Date.now();
      this.logger.debug('Actividad de sesión actualizada', { sessionId });
    }
  }

  getMetadata(sessionId: string): SessionMetadata | null {
    return this.metadata.get(sessionId) || null;
  }

  removeSession(sessionId: string): void {
    this.metadata.delete(sessionId);
    this.logger.debug('Sesión eliminada', { sessionId });
  }

  getAllActiveSessions(): SessionMetadata[] {
    return Array.from(this.metadata.values()).filter(m => m.isActive);
  }

  private getDeviceInfo(): string {
    if (typeof window !== 'undefined') {
      return `${navigator.platform} - ${navigator.userAgent}`;
    }
    return 'Server-side session';
  }
}

// ============================================================================
// GESTIÓN DE TIMERS DE ACTIVIDAD
// ============================================================================

class ActivityTimerManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private warningTimers: Map<string, NodeJS.Timeout> = new Map();
  private logger: Logger;

  constructor(private config: SessionManagerConfig, private loggerBase: Logger) {
    this.logger = loggerBase;
  }

  startActivityTimer(
    sessionId: string,
    sessionData: SessionData,
    onExpire: (sessionId: string) => void,
    onWarning?: SessionWarningCallback
  ): void {
    // Si no hay timeout configurado, no iniciar timers
    if (this.config.inactivityTimeoutMinutes <= 0) {
      this.logger.debug('No se inicia timer - sesiones sin expiración configuradas', { sessionId });
      return;
    }

    this.stopActivityTimer(sessionId);

    const now = Date.now();
    const inactivityTimeout = this.config.inactivityTimeoutMinutes * 60 * 1000;
    const warningThreshold = this.config.warningThresholdMinutes * 60 * 1000;

    // Timer de expiración por inactividad
    const expireTime = now + inactivityTimeout;
    const expireTimer = setTimeout(() => {
      this.logger.warn('Sesión expirada por inactividad', { sessionId });
      onExpire(sessionId);
    }, inactivityTimeout);

    this.timers.set(sessionId, expireTimer);

    // Timer de warning si está configurado
    if (onWarning && warningThreshold < inactivityTimeout && this.config.warningThresholdMinutes > 0) {
      const warningTimeMs = expireTime - warningThreshold;
      const warningTimer = setTimeout(() => {
        const minutesLeft = Math.floor((expireTime - Date.now()) / (60 * 1000));
        onWarning(minutesLeft, sessionData);
      }, warningTimeMs);

      this.warningTimers.set(sessionId, warningTimer);
    }

    this.logger.debug('Timer de actividad iniciado', {
      sessionId,
      expiresAt: new Date(expireTime),
      warningAt: onWarning ? new Date(expireTime - warningThreshold) : null,
    });
  }

  stopActivityTimer(sessionId: string): void {
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(sessionId);
    }

    const warningTimer = this.warningTimers.get(sessionId);
    if (warningTimer) {
      clearTimeout(warningTimer);
      this.warningTimers.delete(sessionId);
    }
  }

  resetActivityTimer(
    sessionId: string,
    sessionData: SessionData,
    onExpire: (sessionId: string) => void,
    onWarning?: SessionWarningCallback
  ): void {
    this.startActivityTimer(sessionId, sessionData, onExpire, onWarning);
  }

  getTimeUntilExpiration(sessionId: string): number {
    // Esta es una simplificación - en una implementación real necesitarías
    // rastrear los tiempos de expiración
    return this.config.inactivityTimeoutMinutes * 60 * 1000;
  }
}

// ============================================================================
// GESTIÓN DE PERSISTENCIA DE SESIÓN
// ============================================================================

class SessionPersistenceManager {
  private logger: Logger;
  private readonly STORAGE_KEY = 'app_sessions';
  private readonly METADATA_KEY = 'session_metadata';

  constructor(private loggerBase: Logger, private config: SessionManagerConfig) {
    this.logger = loggerBase;
  }

  async saveSession(sessionData: SessionData, metadata: SessionMetadata): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      sessions.set(sessionData.uid, {
        sessionData,
        metadata,
        savedAt: Date.now(),
      });

      const sessionsArray = Array.from(sessions.entries());
      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionsArray));

      this.logger.debug('Sesión guardada', { uid: sessionData.uid, sessionId: metadata.sessionId });
    } catch (error) {
      this.logger.error('Error guardando sesión', error);
      throw createSessionError('Error de persistencia', 'PERSISTENCE_ERROR', true);
    }
  }

  async getSession(uid: string): Promise<{ sessionData: SessionData; metadata: SessionMetadata } | null> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.get(uid) || null;
    } catch (error) {
      this.logger.error('Error obteniendo sesión', error);
      return null;
    }
  }

  async getAllSessions(): Promise<Map<string, { sessionData: SessionData; metadata: SessionMetadata; savedAt: number }>> {
    try {
      const stored = safeLocalStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return new Map();
      }

      const sessionsArray: [string, { sessionData: SessionData; metadata: SessionMetadata; savedAt: number }][] = JSON.parse(stored);
      return new Map(sessionsArray);
    } catch (error) {
      this.logger.error('Error obteniendo todas las sesiones', error);
      return new Map();
    }
  }

  async removeSession(uid: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      sessions.delete(uid);

      const sessionsArray = Array.from(sessions.entries());
      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionsArray));

      this.logger.debug('Sesión eliminada de persistencia', { uid });
    } catch (error) {
      this.logger.error('Error eliminando sesión', error);
    }
  }

  async clearAllSessions(): Promise<void> {
    try {
      safeLocalStorage.removeItem(this.STORAGE_KEY);
      this.logger.info('Todas las sesiones eliminadas de persistencia');
    } catch (error) {
      this.logger.error('Error limpiando sesiones', error);
    }
  }

  async isSessionExpired(sessionData: SessionData, metadata: SessionMetadata): Promise<boolean> {
    // Si ambos timeouts son 0, la sesión nunca caduca
    if (this.config.inactivityTimeoutMinutes === 0 && this.config.absoluteTimeoutDays === 0) {
      return false;
    }

    const now = Date.now();

    // Verificar expiración absoluta solo si está configurada
    if (this.config.absoluteTimeoutDays > 0) {
      const absoluteTimeout = this.config.absoluteTimeoutDays * 24 * 60 * 60 * 1000;
      const sessionAge = now - metadata.createdAt;
      if (sessionAge > absoluteTimeout) {
        this.logger.debug('Sesión expirada por tiempo absoluto', {
          sessionId: metadata.sessionId,
          age: sessionAge,
          maxAge: absoluteTimeout,
        });
        return true;
      }
    }

    // Verificar expiración por inactividad solo si está configurada
    if (this.config.inactivityTimeoutMinutes > 0) {
      const inactivityTimeout = this.config.inactivityTimeoutMinutes * 60 * 1000;
      const timeSinceLastActivity = now - metadata.lastActivityAt;
      if (timeSinceLastActivity > inactivityTimeout) {
        this.logger.debug('Sesión expirada por inactividad', {
          sessionId: metadata.sessionId,
          timeSinceActivity: timeSinceLastActivity,
          maxInactivity: inactivityTimeout,
        });
        return true;
      }
    }

    return false;
  }
}

// ============================================================================
// IMPLEMENTACIÓN PRINCIPAL DEL SESSIONMANAGER
// ============================================================================

export class SessionManager {
  private config: SessionManagerConfig;
  private logger: Logger;
  private metadataManager: SessionMetadataManager;
  private timerManager: ActivityTimerManager;
  private persistenceManager: SessionPersistenceManager;
  private eventHandlers: Map<string, AuthEventHandler> = new Map();
  private currentSession: { sessionData: SessionData; metadata: SessionMetadata } | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  constructor(config: Partial<SessionManagerConfig> = {}) {
    this.config = {
      inactivityTimeoutMinutes: 0, // Sin expiración por defecto
      absoluteTimeoutDays: 0, // Sin expiración absoluta por defecto
      checkIntervalMinutes: 1,
      maxConcurrentSessions: 5,
      autoExtendSession: false, // No extender automáticamente por defecto
      warningThresholdMinutes: 0, // Sin warnings por defecto
      persistence: 'local',
      ...config,
    };

    this.logger = new SessionManagerLogger();
    this.metadataManager = SessionMetadataManager.getInstance();
    this.timerManager = new ActivityTimerManager(this.config, this.logger);
    this.persistenceManager = new SessionPersistenceManager(this.logger, this.config);

    this.initializeEventSystem();
    this.startPeriodicCheck();
    this.restoreSession();

    this.logger.info('SessionManager inicializado', {
      inactivityTimeout: this.config.inactivityTimeoutMinutes,
      absoluteTimeout: this.config.absoluteTimeoutDays,
    });
  }

  // ============================================================================
  // GESTIÓN DEL CICLO DE VIDA DE SESIÓN
  // ============================================================================

  /**
   * Crea una nueva sesión
   */
  async createSession(sessionData: SessionData, userAgent?: string, ipAddress?: string): Promise<void> {
    if (this.isDestroyed) {
      throw createSessionError('SessionManager destruido', 'SESSION_INVALID', false);
    }

    try {
      // Verificar límite de sesiones concurrentes
      await this.checkConcurrentSessions(sessionData.uid);

      const sessionId = this.generateSessionId();
      const metadata = this.metadataManager.createSession(sessionId, userAgent, ipAddress);

      const fullSessionData: SessionData = {
        ...sessionData,
        sessionStartTime: Date.now(),
        lastActivityTime: Date.now(),
        isActive: true,
      };

      this.currentSession = {
        sessionData: fullSessionData,
        metadata,
      };

      // Guardar en persistencia
      await this.persistenceManager.saveSession(fullSessionData, metadata);

      // Iniciar timer de actividad
      this.timerManager.startActivityTimer(
        sessionId,
        fullSessionData,
        (expiredSessionId) => this.handleSessionExpired(expiredSessionId),
        this.config.autoExtendSession ? (minutesLeft) => this.handleSessionWarning(minutesLeft, fullSessionData) : undefined
      );

      this.emitEvent('login', { sessionData: fullSessionData, metadata });
      this.logger.info('Sesión creada exitosamente', { sessionId, uid: sessionData.uid });

    } catch (error) {
      this.logger.error('Error creando sesión', error);
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw createSessionError('Error creando sesión', 'SESSION_INVALID', true);
    }
  }

  /**
   * Actualiza la actividad de la sesión actual
   */
  async updateActivity(): Promise<void> {
    if (!this.currentSession || this.isDestroyed) {
      return;
    }

    try {
      const { sessionData, metadata } = this.currentSession;

      // Actualizar timestamp de actividad
      const updatedSessionData: SessionData = {
        ...sessionData,
        lastActivityTime: Date.now(),
      };

      metadata.lastActivityAt = Date.now();

      this.currentSession = {
        sessionData: updatedSessionData,
        metadata,
      };

      // Actualizar en persistencia
      await this.persistenceManager.saveSession(updatedSessionData, metadata);

      // Reiniciar timer de actividad
      this.timerManager.resetActivityTimer(
        metadata.sessionId,
        updatedSessionData,
        (sessionId) => this.handleSessionExpired(sessionId),
        this.config.autoExtendSession ? (minutesLeft) => this.handleSessionWarning(minutesLeft, updatedSessionData) : undefined
      );

      this.logger.debug('Actividad de sesión actualizada', { sessionId: metadata.sessionId });

    } catch (error) {
      this.logger.error('Error actualizando actividad', error);
    }
  }

  /**
   * Obtiene la sesión actual
   */
  async getCurrentSession(): Promise<SessionData | null> {
    if (!this.currentSession) {
      return null;
    }

    const { sessionData, metadata } = this.currentSession;

    // Verificar si la sesión está expirada
    const isExpired = await this.persistenceManager.isSessionExpired(sessionData, metadata);
    if (isExpired) {
      await this.destroyCurrentSession();
      return null;
    }

    return sessionData;
  }

  /**
   * Verifica si hay una sesión válida
   */
  async hasValidSession(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null && session.isActive;
  }

  /**
   * Obtiene el estado de la sesión
   */
  async getSessionStatus(): Promise<SessionStatus> {
    if (this.isDestroyed) {
      return 'unauthenticated';
    }

    const session = await this.getCurrentSession();

    if (!session) {
      return 'unauthenticated';
    }

    if (!session.isActive) {
      return 'expired';
    }

    return 'authenticated';
  }

  /**
   * Extiende la sesión actual
   */
  async extendSession(): Promise<void> {
    if (!this.currentSession || this.isDestroyed) {
      throw createSessionError('No hay sesión para extender', 'SESSION_INVALID', false);
    }

    try {
      const { sessionData, metadata } = this.currentSession;

      // Actualizar timestamp de actividad
      const extendedSessionData: SessionData = {
        ...sessionData,
        lastActivityTime: Date.now(),
      };

      metadata.lastActivityAt = Date.now();
      metadata.autoExtendPending = false;

      this.currentSession = {
        sessionData: extendedSessionData,
        metadata,
      };

      // Guardar cambios
      await this.persistenceManager.saveSession(extendedSessionData, metadata);

      // Reiniciar timer
      this.timerManager.resetActivityTimer(
        metadata.sessionId,
        extendedSessionData,
        (sessionId) => this.handleSessionExpired(sessionId),
        this.config.autoExtendSession ? (minutesLeft) => this.handleSessionWarning(minutesLeft, extendedSessionData) : undefined
      );

      this.logger.info('Sesión extendida', { sessionId: metadata.sessionId });

    } catch (error) {
      this.logger.error('Error extendiendo sesión', error);
      throw error;
    }
  }

  /**
   * Destruye la sesión actual
   */
  async destroyCurrentSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      const { metadata } = this.currentSession;

      // Detener timer
      this.timerManager.stopActivityTimer(metadata.sessionId);

      // Eliminar de persistencia
      if (this.currentSession.sessionData.uid) {
        await this.persistenceManager.removeSession(this.currentSession.sessionData.uid);
      }

      // Eliminar metadatos
      this.metadataManager.removeSession(metadata.sessionId);

      // Limpiar sesión actual
      this.currentSession = null;

      this.emitEvent('logout');
      this.logger.info('Sesión actual destruida', { sessionId: metadata.sessionId });

    } catch (error) {
      this.logger.error('Error destruyendo sesión actual', error);
    }
  }

  /**
   * Destruye todas las sesiones
   */
  async destroyAllSessions(): Promise<void> {
    try {
      // Detener todos los timers
      const activeSessions = this.metadataManager.getAllActiveSessions();
      activeSessions.forEach(session => {
        this.timerManager.stopActivityTimer(session.sessionId);
      });

      // Limpiar persistencia
      await this.persistenceManager.clearAllSessions();

      // Limpiar metadatos
      activeSessions.forEach(session => {
        this.metadataManager.removeSession(session.sessionId);
      });

      // Limpiar sesión actual
      this.currentSession = null;

      this.emitEvent('logout');
      this.logger.info('Todas las sesiones destruidas');

    } catch (error) {
      this.logger.error('Error destruyendo todas las sesiones', error);
    }
  }

  // ============================================================================
  // VERIFICACIÓN Y VALIDACIÓN
  // ============================================================================

  /**
   * Verifica y limpia sesiones expiradas
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const sessions = await this.persistenceManager.getAllSessions();
      const expiredSessionIds: string[] = [];

      for (const [uid, sessionData] of sessions) {
        const isExpired = await this.persistenceManager.isSessionExpired(
          sessionData.sessionData,
          sessionData.metadata
        );

        if (isExpired) {
          expiredSessionIds.push(sessionData.metadata.sessionId);
          sessions.delete(uid);
        }
      }

      // Eliminar sesiones expiradas
      expiredSessionIds.forEach(sessionId => {
        this.metadataManager.removeSession(sessionId);
        this.timerManager.stopActivityTimer(sessionId);
      });

      // Actualizar persistencia
      const sessionsArray = Array.from(sessions.entries());
      safeLocalStorage.setItem('app_sessions', JSON.stringify(sessionsArray));

      if (expiredSessionIds.length > 0) {
        this.logger.info('Sesiones expiradas limpiadas', { count: expiredSessionIds.length });
      }

    } catch (error) {
      this.logger.error('Error limpiando sesiones expiradas', error);
    }
  }

  /**
   * Actualiza la configuración del SessionManager
   */
  updateConfig(newConfig: Partial<SessionManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Configuración de SessionManager actualizada', newConfig);

    // Si hay una sesión actual, reiniciar el timer con la nueva configuración
    if (this.currentSession) {
      const { sessionData, metadata } = this.currentSession;
      this.timerManager.resetActivityTimer(
        metadata.sessionId,
        sessionData,
        (sessionId) => this.handleSessionExpired(sessionId),
        this.config.autoExtendSession ? (minutesLeft) => this.handleSessionWarning(minutesLeft, sessionData) : undefined
      );
    }
  }

  /**
   * Obtiene estadísticas de sesiones
   */
  async getSessionStats(): Promise<{
    currentSession: boolean;
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  }> {
    try {
      const sessions = await this.persistenceManager.getAllSessions();
      const allMetadata = this.metadataManager.getAllActiveSessions();

      let expiredCount = 0;
      for (const [uid, sessionData] of sessions) {
        const isExpired = await this.persistenceManager.isSessionExpired(
          sessionData.sessionData,
          sessionData.metadata
        );
        if (isExpired) {
          expiredCount++;
        }
      }

      return {
        currentSession: !!this.currentSession,
        totalSessions: sessions.size,
        activeSessions: allMetadata.length,
        expiredSessions: expiredCount,
      };
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas de sesiones', error);
      return {
        currentSession: false,
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
      };
    }
  }

  // ============================================================================
  // INTEGRACIÓN CON FIREBASE
  // ============================================================================

  /**
   * Sincroniza con Firebase Auth
   */
  async syncWithFirebase(user: any): Promise<void> {
    if (!user || this.isDestroyed) {
      return;
    }

    try {
      const sessionData: SessionData = {
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

      // Si no hay sesión actual, crear una nueva
      if (!this.currentSession) {
        await this.createSession(sessionData);
      } else {
        // Actualizar sesión existente
        this.currentSession.sessionData = { ...this.currentSession.sessionData, ...sessionData };
        await this.persistenceManager.saveSession(this.currentSession.sessionData, this.currentSession.metadata);
      }

      this.logger.debug('Sesión sincronizada con Firebase', { uid: user.uid });

    } catch (error) {
      this.logger.error('Error sincronizando con Firebase', error);
    }
  }

  /**
   * Detecta el método de autenticación usado
   */
  private detectAuthMethod(user: any): 'email' | 'google' | 'anonymous' {
    if (user.isAnonymous) return 'anonymous';
    if (user.providerData && user.providerData.some((p: any) => p.providerId === 'google.com')) {
      return 'google';
    }
    return 'email';
  }

  // ============================================================================
  // MANEJO DE EVENTOS
  // ============================================================================

  /**
   * Registra un handler para eventos de sesión
   */
  onSessionEvent(event: AuthEvent, handler: AuthEventHandler): string {
    const handlerId = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.eventHandlers.set(handlerId, handler);

    this.logger.debug('Event handler registrado', { event, handlerId });
    return handlerId;
  }

  /**
   * Elimina un handler de eventos
   */
  offSessionEvent(handlerId: string): void {
    this.eventHandlers.delete(handlerId);
    this.logger.debug('Event handler eliminado', { handlerId });
  }

  /**
   * Emite un evento a todos los handlers
   */
  private emitEvent(event: AuthEvent, data?: any): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event, data);
      } catch (error) {
        this.logger.error('Error en event handler', { event, error });
      }
    });
  }

  // ============================================================================
  // MÉTODOS INTERNOS
  // ============================================================================

  /**
   * Genera un ID único para la sesión
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verifica el límite de sesiones concurrentes
   */
  private async checkConcurrentSessions(uid: string): Promise<void> {
    const sessions = await this.persistenceManager.getAllSessions();
    const userSessions = Array.from(sessions.values()).filter(s => s.sessionData.uid === uid);

    if (userSessions.length >= this.config.maxConcurrentSessions) {
      throw createSessionError(
        'Límite de sesiones concurrentes excedido',
        'SESSION_LIMIT_EXCEEDED',
        false
      );
    }
  }

  /**
   * Maneja la expiración de sesión
   */
  private async handleSessionExpired(sessionId: string): Promise<void> {
    try {
      const metadata = this.metadataManager.getMetadata(sessionId);
      if (!metadata) {
        return;
      }

      metadata.isActive = false;

      // Si es la sesión actual, destruirla
      if (this.currentSession && this.currentSession.metadata.sessionId === sessionId) {
        await this.destroyCurrentSession();
      } else {
        // Eliminar de persistencia si no es la sesión actual
        const sessions = await this.persistenceManager.getAllSessions();
        for (const [uid, sessionData] of sessions) {
          if (sessionData.metadata.sessionId === sessionId) {
            sessions.delete(uid);
            break;
          }
        }

        const sessionsArray = Array.from(sessions.entries());
        safeLocalStorage.setItem('app_sessions', JSON.stringify(sessionsArray));

        this.metadataManager.removeSession(sessionId);
      }

      this.emitEvent('session-expired', { sessionId });
      this.logger.info('Sesión expirada manejada', { sessionId });

    } catch (error) {
      this.logger.error('Error manejando expiración de sesión', error);
    }
  }

  /**
   * Maneja el warning de expiración
   */
  private handleSessionWarning(minutesLeft: number, sessionData: SessionData): void {
    // Si no hay timeout configurado, no mostrar warnings
    if (this.config.inactivityTimeoutMinutes <= 0) {
      return;
    }

    this.logger.warn('Sesión próxima a expirar', {
      minutesLeft,
      uid: sessionData.uid,
    });

    this.emitEvent('session-expired', {
      type: 'warning',
      minutesLeft,
      sessionData,
    });
  }

  /**
   * Inicializa el sistema de eventos
   */
  private initializeEventSystem(): void {
    // Eventos de actividad del usuario
    if (typeof window !== 'undefined') {
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

      activityEvents.forEach(event => {
        let throttleTimer: NodeJS.Timeout;

        window.addEventListener(event, () => {
          if (!throttleTimer) {
            throttleTimer = setTimeout(() => {
              this.updateActivity().catch(error => {
                this.logger.error('Error actualizando actividad por evento', error);
              });
              throttleTimer = null as any;
            }, 1000); // Throttle a 1 segundo
          }
        }, true);
      });
    }
  }

  /**
   * Inicia la verificación periódica de sesiones
   */
  private startPeriodicCheck(): void {
    // Si no hay timeout configurado, no iniciar verificación periódica
    if (this.config.inactivityTimeoutMinutes <= 0) {
      this.logger.debug('No se inicia verificación periódica - sesiones sin expiración configuradas');
      return;
    }

    this.checkInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();

        // Verificar si la sesión actual está próxima a expirar
        if (this.currentSession && this.config.autoExtendSession) {
          const { sessionData, metadata } = this.currentSession;
          const isExpired = await this.persistenceManager.isSessionExpired(sessionData, metadata);

          if (isExpired) {
            await this.handleSessionExpired(metadata.sessionId);
          }
        }
      } catch (error) {
        this.logger.error('Error en verificación periódica', error);
      }
    }, this.config.checkIntervalMinutes * 60 * 1000);
  }

  /**
   * Restaura la sesión desde persistencia
   */
  private async restoreSession(): Promise<void> {
    try {
      // Obtener sesiones guardadas
      const sessions = await this.persistenceManager.getAllSessions();

      if (sessions.size === 0) {
        return;
      }

      // Buscar la sesión más reciente
      let latestSession: { sessionData: SessionData; metadata: SessionMetadata; savedAt: number } | null = null;

      for (const session of sessions.values()) {
        if (!latestSession || session.savedAt > latestSession.savedAt) {
          latestSession = session;
        }
      }

      if (latestSession) {
        const { sessionData, metadata } = latestSession;

        // Verificar si la sesión no está expirada
        const isExpired = await this.persistenceManager.isSessionExpired(sessionData, metadata);

        if (!isExpired) {
          this.currentSession = {
            sessionData,
            metadata,
          };

          // Reiniciar timer de actividad
          this.timerManager.startActivityTimer(
            metadata.sessionId,
            sessionData,
            (sessionId) => this.handleSessionExpired(sessionId),
            this.config.autoExtendSession ? (minutesLeft) => this.handleSessionWarning(minutesLeft, sessionData) : undefined
          );

          this.logger.info('Sesión restaurada', { sessionId: metadata.sessionId });
        } else {
          // Eliminar sesión expirada
          await this.persistenceManager.removeSession(sessionData.uid);
          this.metadataManager.removeSession(metadata.sessionId);
        }
      }
    } catch (error) {
      this.logger.error('Error restaurando sesión', error);
    }
  }

  /**
   * Limpieza al destruir la instancia
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    try {
      // Detener intervalos
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      // Detener todos los timers
      const activeSessions = this.metadataManager.getAllActiveSessions();
      activeSessions.forEach(session => {
        this.timerManager.stopActivityTimer(session.sessionId);
      });

      // Limpiar sesión actual
      this.currentSession = null;

      // Limpiar event handlers
      this.eventHandlers.clear();

      this.isDestroyed = true;

      this.logger.info('SessionManager destruido');

    } catch (error) {
      this.logger.error('Error destruyendo SessionManager', error);
    }
  }
}

// ============================================================================
// INSTANCIA POR DEFECTO
// ============================================================================

/**
 * Instancia por defecto del SessionManager
 */
export const sessionManager = new SessionManager();

// ============================================================================
// EXPORTACIONES ADICIONALES
// ============================================================================

export {
  SessionMetadataManager,
  ActivityTimerManager,
  SessionPersistenceManager
};

export type {
  SessionManagerConfig,
  SessionMetadata,
  SessionWarningCallback,
  SessionError
};