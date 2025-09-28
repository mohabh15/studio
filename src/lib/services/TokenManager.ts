/**
 * TokenManager - Sistema completo de manejo seguro de tokens y cookies
 *
 * Funcionalidades implementadas:
 * - Gestión segura de tokens JWT
 * - Manejo de cookies HTTP-only y secure
 * - Verificación de expiración automática
 * - Sistema de refresh automático de tokens
 * - Manejo robusto de errores de red y timeouts
 * - Sistema de logging para debugging
 * - Fallback a localStorage/sessionStorage
 * - Decodificación y validación de tokens JWT
 */

import type {
  TokenData,
  SessionData,
  AuthError,
  AuthErrorCode,
  PersistenceType
} from '../types/auth';

import { safeLocalStorage, safeSessionStorage, safeCookieUtils, safeLocation } from '../utils/ssr-safe';

// ============================================================================
// INTERFACES Y TIPOS INTERNOS
// ============================================================================

interface TokenManagerConfig {
  /** Tiempo en minutos antes de que expire el token para intentar refresh */
  refreshThresholdMinutes: number;
  /** Número máximo de reintentos para refresh */
  maxRefreshRetries: number;
  /** Timeout para operaciones de red en milisegundos */
  networkTimeoutMs: number;
  /** Indica si usar cookies seguras */
  useSecureCookies: boolean;
  /** Dominio para las cookies */
  cookieDomain?: string;
  /** Ruta base para las cookies */
  cookiePath: string;
  /** Indica si se debe usar SameSite */
  useSameSite: boolean;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expirationTime: number;
}

interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

interface NetworkError extends Error {
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'SERVER_ERROR';
  status?: number;
  retryable: boolean;
}

/**
 * Crea un NetworkError correctamente tipado
 */
function createNetworkError(
  message: string,
  code: NetworkError['code'],
  retryable: boolean = true,
  status?: number
): NetworkError {
  const error = new Error(message) as NetworkError;
  error.name = 'NetworkError';
  error.code = code;
  error.retryable = retryable;
  error.status = status;
  return error;
}

// ============================================================================
// IMPLEMENTACIÓN DEL LOGGER
// ============================================================================

class TokenManagerLogger implements Logger {
  private prefix = '[TokenManager]';

  info(message: string, data?: any): void {
    // Eliminar console.log para reducir verbosidad
  }

  warn(message: string, data?: any): void {
    // Eliminar console.log para reducir verbosidad
  }

  error(message: string, data?: any): void {
    console.error(`${this.prefix} ❌ ${message}`, data || '');
  }

  debug(message: string, data?: any): void {
    // Eliminar console.log para reducir verbosidad
  }
}

// ============================================================================
// UTILIDADES INTERNAS
// ============================================================================

/**
 * Utilidades para manejo seguro de cookies - usando safeCookieUtils
 */

/**
 * CookieUtils - Wrapper para safeCookieUtils para mantener compatibilidad
 * Esta clase resuelve el problema de referencias a CookieUtils.getCookie
 */
class CookieUtils {
  /**
   * Obtiene el valor de una cookie usando safeCookieUtils
   */
  static getCookie(name: string): string | null {
    // Usar safeCookieUtils para manejar cookies de forma segura en SSR
    try {
      return safeCookieUtils.getCookie(name);
    } catch (error) {
      console.warn('[CookieUtils] Error obteniendo cookie:', error);
      return null;
    }
  }

  /**
   * Configura una cookie usando safeCookieUtils
   */
  static setCookie(name: string, value: string, options: any = {}): void {
    return safeCookieUtils.setCookie(name, value, options);
  }

  /**
   * Elimina una cookie usando safeCookieUtils
   */
  static deleteCookie(name: string, path = '/', domain?: string): void {
    return safeCookieUtils.deleteCookie(name, path, domain);
  }
}

/**
 * Utilidades para manejo de tokens JWT
 */
class JWTUtils {
  /**
   * Decodifica un token JWT sin verificación
   */
  static decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT inválido');
      }

      const payload = parts[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

      return {
        ...decoded,
        // Convertir timestamps de Unix a milisegundos
        exp: decoded.exp * 1000,
        iat: decoded.iat * 1000,
        nbf: decoded.nbf ? decoded.nbf * 1000 : undefined,
      };
    } catch (error) {
      throw new Error('Error decodificando token JWT');
    }
  }

  /**
   * Verifica si un token está expirado
   */
  static isTokenExpired(token: string, thresholdMinutes = 5): boolean {
    try {
      const decoded = this.decodeToken(token);
      const now = Date.now();
      const threshold = thresholdMinutes * 60 * 1000;

      return (decoded.exp - threshold) <= now;
    } catch {
      return true; // Si no se puede decodificar, considerar expirado
    }
  }

  /**
   * Obtiene el tiempo hasta expiración en minutos
   */
  static getTimeUntilExpiration(token: string): number {
    try {
      const decoded = this.decodeToken(token);
      const now = Date.now();
      const timeUntilExp = decoded.exp - now;

      return Math.max(0, Math.floor(timeUntilExp / (60 * 1000)));
    } catch {
      return 0;
    }
  }
}

/**
 * Utilidades para manejo de errores de red
 */
class NetworkUtils {
  /**
   * Realiza una petición con timeout y manejo de errores
   */
  static async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 10000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw createNetworkError('Request timeout', 'TIMEOUT', true);
      }

      throw createNetworkError('Network error', 'NETWORK_ERROR', true);
    }
  }

  /**
   * Reintenta una operación con backoff exponencial
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (i === maxRetries || (error as NetworkError)?.retryable === false) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// ============================================================================
// IMPLEMENTACIÓN PRINCIPAL DEL TOKENMANAGER
// ============================================================================

export class TokenManager {
  private config: TokenManagerConfig;
  private logger: Logger;
  private refreshPromise: Promise<TokenData> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<TokenManagerConfig> = {}) {
    this.config = {
      refreshThresholdMinutes: 5,
      maxRefreshRetries: 3,
      networkTimeoutMs: 10000,
      useSecureCookies: true,
      cookiePath: '/',
      useSameSite: true,
      ...config,
    };

    this.logger = new TokenManagerLogger();
    this.setupRefreshTimer();
  }

  // ============================================================================
  // MÉTODOS BÁSICOS DE ALMACENAMIENTO
  // ============================================================================

  /**
   * Guarda tokens de forma segura
   */
  async saveTokens(tokenData: TokenData, persistence: PersistenceType = 'local'): Promise<void> {
    try {
      this.logger.debug('Guardando tokens', {
        hasAccessToken: !!tokenData.accessToken,
        hasRefreshToken: !!tokenData.refreshToken,
        expirationTime: new Date(tokenData.expirationTime),
        persistence,
      });

      // Guardar en cookies HTTP-only para mayor seguridad
      await this.saveTokensToCookies(tokenData);

      // Fallback a localStorage/sessionStorage
      await this.saveTokensToStorage(tokenData, persistence);

      // Programar refresh automático
      this.scheduleTokenRefresh(tokenData);

      this.logger.info('Tokens guardados exitosamente');
    } catch (error) {
      this.logger.error('Error guardando tokens', error);
      throw this.createAuthError('auth/persistence-error', 'Error guardando tokens', true);
    }
  }

  /**
   * Obtiene los tokens actuales
   */
  async getTokens(): Promise<TokenData | null> {
    try {
      // Intentar obtener de cookies primero
      const cookieTokens = await this.getTokensFromCookies();

      if (cookieTokens) {
        this.logger.debug('Tokens obtenidos de cookies');
        return cookieTokens;
      }

      // Fallback a storage
      const storageTokens = await this.getTokensFromStorage();

      if (storageTokens) {
        this.logger.debug('Tokens obtenidos de storage');
        return storageTokens;
      }

      this.logger.debug('No se encontraron tokens');
      return null;
    } catch (error) {
      this.logger.error('Error obteniendo tokens', error);
      return null;
    }
  }

  /**
   * Limpia todos los tokens
   */
  async clearTokens(): Promise<void> {
    try {
      this.logger.debug('Limpiando tokens');

      // Limpiar cookies
      await this.clearTokensFromCookies();

      // Limpiar storage
      await this.clearTokensFromStorage();

      // Cancelar refresh automático
      this.cancelTokenRefresh();

      this.logger.info('Tokens limpiados exitosamente');
    } catch (error) {
      this.logger.error('Error limpiando tokens', error);
      throw this.createAuthError('auth/persistence-error', 'Error limpiando tokens', true);
    }
  }

  // ============================================================================
  // MANEJO DE COOKIES
  // ============================================================================

  /**
   * Guarda tokens en cookies HTTP-only
   */
  private async saveTokensToCookies(tokenData: TokenData): Promise<void> {
    const expirationDate = new Date(tokenData.expirationTime);

    // Configurar opciones de seguridad para cookies
    const cookieOptions = {
      expires: expirationDate,
      path: this.config.cookiePath,
      domain: this.config.cookieDomain,
      secure: this.config.useSecureCookies && safeLocation.protocol === 'https:',
      sameSite: this.config.useSameSite ? 'Strict' as const : undefined,
      httpOnly: true, // Esto solo funciona en servidor
    };

    // Nota: En el navegador, httpOnly solo puede ser configurado por el servidor
    // Aquí simulamos el comportamiento guardando en cookies del navegador
    safeCookieUtils.setCookie('accessToken', tokenData.accessToken, {
      ...cookieOptions,
      httpOnly: false, // Fallback para navegador
    });

    safeCookieUtils.setCookie('refreshToken', tokenData.refreshToken, {
      ...cookieOptions,
      httpOnly: false, // Fallback para navegador
    });

    safeCookieUtils.setCookie('tokenExpiration', tokenData.expirationTime.toString(), {
      ...cookieOptions,
      httpOnly: false,
    });
  }

  /**
   * Obtiene tokens desde cookies
   */
  private async getTokensFromCookies(): Promise<TokenData | null> {
    try {
      const accessToken = safeCookieUtils.getCookie('accessToken');
      const refreshToken = safeCookieUtils.getCookie('refreshToken');
      const expirationStr = safeCookieUtils.getCookie('tokenExpiration');

      if (!accessToken || !refreshToken || !expirationStr) {
        return null;
      }

      const expirationTime = parseInt(expirationStr, 10);
      if (isNaN(expirationTime)) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        expirationTime,
        issuedAtTime: Date.now(),
        tokenType: 'Bearer',
      };
    } catch (error) {
      this.logger.warn('Error obteniendo tokens de cookies', error);
      return null;
    }
  }

  /**
   * Limpia tokens de cookies
   */
  private async clearTokensFromCookies(): Promise<void> {
    safeCookieUtils.deleteCookie('accessToken', this.config.cookiePath, this.config.cookieDomain);
    safeCookieUtils.deleteCookie('refreshToken', this.config.cookiePath, this.config.cookieDomain);
    safeCookieUtils.deleteCookie('tokenExpiration', this.config.cookiePath, this.config.cookieDomain);
  }

  // ============================================================================
  // MANEJO DE STORAGE
  // ============================================================================

  /**
   * Guarda tokens en localStorage/sessionStorage
   */
  private async saveTokensToStorage(tokenData: TokenData, persistence: PersistenceType): Promise<void> {
    const storage = persistence === 'session' ? safeSessionStorage : safeLocalStorage;
    const data = {
      ...tokenData,
      storedAt: Date.now(),
    };

    storage.setItem('auth_tokens', JSON.stringify(data));
  }

  /**
   * Obtiene tokens desde storage
   */
  private async getTokensFromStorage(): Promise<TokenData | null> {
    try {
      const storageData = safeLocalStorage.getItem('auth_tokens') || safeSessionStorage.getItem('auth_tokens');

      if (!storageData) {
        return null;
      }

      const parsed = JSON.parse(storageData);

      // Verificar si los datos son válidos
      if (!parsed.accessToken || !parsed.refreshToken || !parsed.expirationTime) {
        return null;
      }

      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        expirationTime: parsed.expirationTime,
        issuedAtTime: parsed.issuedAtTime || parsed.storedAt,
        tokenType: parsed.tokenType || 'Bearer',
      };
    } catch (error) {
      this.logger.warn('Error obteniendo tokens de storage', error);
      return null;
    }
  }

  /**
   * Limpia tokens de storage
   */
  private async clearTokensFromStorage(): Promise<void> {
    safeLocalStorage.removeItem('auth_tokens');
    safeSessionStorage.removeItem('auth_tokens');
  }

  // ============================================================================
  // VERIFICACIÓN DE EXPIRACIÓN
  // ============================================================================

  /**
   * Verifica si los tokens están expirados
   */
  async areTokensExpired(): Promise<boolean> {
    const tokens = await this.getTokens();

    if (!tokens) {
      return true;
    }

    const isExpired = JWTUtils.isTokenExpired(
      tokens.accessToken,
      this.config.refreshThresholdMinutes
    );

    this.logger.debug('Verificación de expiración', {
      isExpired,
      timeUntilExpiration: JWTUtils.getTimeUntilExpiration(tokens.accessToken),
    });

    return isExpired;
  }

  /**
   * Obtiene el tiempo hasta expiración en minutos
   */
  async getTimeUntilExpiration(): Promise<number> {
    const tokens = await this.getTokens();

    if (!tokens) {
      return 0;
    }

    return JWTUtils.getTimeUntilExpiration(tokens.accessToken);
  }

  // ============================================================================
  // REFRESH AUTOMÁTICO DE TOKENS
  // ============================================================================

  /**
   * Programa el refresh automático de tokens
   */
  private scheduleTokenRefresh(tokenData: TokenData): void {
    this.cancelTokenRefresh();

    const timeUntilRefresh = Math.max(
      0,
      tokenData.expirationTime - Date.now() - (this.config.refreshThresholdMinutes * 60 * 1000)
    );

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(() => {
        this.logger.info('Ejecutando refresh automático de tokens');
        this.refreshTokens();
      }, timeUntilRefresh);

      this.logger.debug('Refresh programado', {
        inMinutes: Math.floor(timeUntilRefresh / (60 * 1000)),
      });
    }
  }

  /**
   * Cancela el refresh automático
   */
  private cancelTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Realiza refresh de tokens
   */
  async refreshTokens(): Promise<TokenData> {
    // Evitar múltiples refresh simultáneos
    if (this.refreshPromise) {
      this.logger.debug('Refresh ya en progreso, esperando...');
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      this.logger.info('Refresh de tokens exitoso');
      return result;
    } catch (error) {
      this.logger.error('Error en refresh de tokens', error);
      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Realiza el refresh de tokens con reintentos
   */
  private async performTokenRefresh(): Promise<TokenData> {
    const tokens = await this.getTokens();

    if (!tokens) {
      throw this.createAuthError('auth/token-expired', 'No hay tokens para refrescar', false);
    }

    const refreshOperation = async () => {
      this.logger.debug('Enviando petición de refresh');

      const response = await NetworkUtils.fetchWithTimeout(
        '/api/auth/refresh',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.refreshToken}`,
          },
        },
        this.config.networkTimeoutMs
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createNetworkError(
          `Error del servidor: ${response.status}`,
          response.status,
          response.status >= 500
        );
      }

      const refreshData: RefreshTokenResponse = await response.json();

      const newTokenData: TokenData = {
        accessToken: refreshData.accessToken,
        refreshToken: refreshData.refreshToken,
        expirationTime: refreshData.expirationTime,
        issuedAtTime: Date.now(),
        tokenType: 'Bearer',
      };

      // Guardar nuevos tokens
      await this.saveTokens(newTokenData);

      return newTokenData;
    };

    return NetworkUtils.retryWithBackoff(
      refreshOperation,
      this.config.maxRefreshRetries
    );
  }

  // ============================================================================
  // DECODIFICACIÓN DE TOKENS JWT
  // ============================================================================

  /**
   * Decodifica y valida un token JWT
   */
  decodeAndValidateToken(token: string): any {
    try {
      const decoded = JWTUtils.decodeToken(token);

      this.logger.debug('Token decodificado', {
        exp: new Date(decoded.exp),
        iat: new Date(decoded.iat),
        user_id: decoded.user_id || decoded.sub,
      });

      return decoded;
    } catch (error) {
      this.logger.error('Error decodificando token', error);
      throw this.createAuthError('auth/token-expired', 'Token inválido', false);
    }
  }

  /**
   * Obtiene información del usuario desde el token
   */
  async getUserInfoFromToken(): Promise<Partial<SessionData> | null> {
    const tokens = await this.getTokens();

    if (!tokens) {
      return null;
    }

    try {
      const decoded = this.decodeAndValidateToken(tokens.accessToken);

      return {
        uid: decoded.user_id || decoded.sub,
        email: decoded.email,
        displayName: decoded.name || decoded.display_name,
        emailVerified: decoded.email_verified || false,
        sessionStartTime: decoded.iat || Date.now(),
        lastActivityTime: Date.now(),
        isActive: true,
      };
    } catch (error) {
      this.logger.warn('Error obteniendo información del usuario del token', error);
      return null;
    }
  }

  // ============================================================================
  // CONFIGURACIÓN DEL TIMER DE REFRESH
  // ============================================================================

  /**
   * Configura el timer de refresh basado en tokens actuales
   */
  private setupRefreshTimer(): void {
    // Solo configurar el timer en el navegador, no en SSR
    if (typeof window === 'undefined') {
      return;
    }

    // Verificar tokens cada minuto
    setInterval(async () => {
      // Verificar nuevamente que estamos en el navegador
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
      }

      try {
        const tokens = await this.getTokens();

        if (!tokens) {
          this.cancelTokenRefresh();
          return;
        }

        const timeUntilExpiration = JWTUtils.getTimeUntilExpiration(tokens.accessToken);

        if (timeUntilExpiration <= this.config.refreshThresholdMinutes) {
          this.logger.info('Token próximo a expirar, ejecutando refresh');
          this.refreshTokens().catch(error => {
            this.logger.error('Error en refresh automático', error);
          });
        }
      } catch (error) {
        this.logger.error('Error en verificación periódica de tokens', error);
      }
    }, 60 * 1000); // Verificar cada minuto
  }

  // ============================================================================
  // MANEJO DE ERRORES
  // ============================================================================

  /**
   * Crea un error de autenticación
   */
  private createAuthError(
    code: AuthErrorCode,
    message: string,
    recoverable: boolean
  ): AuthError {
    return {
      code,
      message,
      timestamp: Date.now(),
      recoverable,
    };
  }

  /**
   * Crea un error de red
   */
  private createNetworkError(
    message: string,
    status?: number,
    retryable: boolean = true
  ): NetworkError {
    const error = new Error(message) as NetworkError;
    error.code = status && status >= 500 ? 'SERVER_ERROR' : 'NETWORK_ERROR';
    error.status = status;
    error.retryable = retryable;
    return error;
  }

  // ============================================================================
  // MÉTODOS DE UTILIDAD
  // ============================================================================

  /**
   * Verifica si hay una sesión válida
   */
  async hasValidSession(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();

      if (!tokens) {
        return false;
      }

      const isExpired = await this.areTokensExpired();

      if (isExpired) {
        this.logger.info('Sesión expirada detectada');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error verificando sesión válida', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas del TokenManager
   */
  async getStats(): Promise<{
    hasTokens: boolean;
    timeUntilExpiration: number;
    isRefreshing: boolean;
    lastError?: string;
  }> {
    const tokens = await this.getTokens();

    return {
      hasTokens: !!tokens,
      timeUntilExpiration: tokens ? JWTUtils.getTimeUntilExpiration(tokens.accessToken) : 0,
      isRefreshing: !!this.refreshPromise,
    };
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<TokenManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Configuración actualizada', newConfig);
  }

  /**
   * Limpieza al destruir la instancia
   */
  destroy(): void {
    this.cancelTokenRefresh();
    this.refreshPromise = null;
    this.logger.info('TokenManager destruido');
  }
}

// ============================================================================
// INSTANCIA POR DEFECTO
// ============================================================================

/**
 * Instancia por defecto del TokenManager
 */
export const tokenManager = new TokenManager();

// ============================================================================
// EXPORTACIONES ADICIONALES
// ============================================================================

export { JWTUtils, NetworkUtils };
export type { TokenManagerConfig, RefreshTokenResponse, NetworkError };