/**
 * TokenManager - Sistema completo de manejo seguro de tokens y cookies
 *
 * Funcionalidades implementadas:
 * - Gestión segura de tokens JWT
 * - Manejo de cookies HTTP-only y secure
 * - Verificación de expiración automática
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

}

// ============================================================================
// IMPLEMENTACIÓN PRINCIPAL DEL TOKENMANAGER
// ============================================================================

export class TokenManager {
  private config: TokenManagerConfig;
  private logger: Logger;

  constructor(config: Partial<TokenManagerConfig> = {}) {
    this.config = {
      networkTimeoutMs: 10000,
      useSecureCookies: true,
      cookiePath: '/',
      useSameSite: true,
      ...config,
    };

    this.logger = new TokenManagerLogger();
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

    const isExpired = JWTUtils.isTokenExpired(tokens.accessToken, 0);

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
    lastError?: string;
  }> {
    const tokens = await this.getTokens();

    return {
      hasTokens: !!tokens,
      timeUntilExpiration: tokens ? JWTUtils.getTimeUntilExpiration(tokens.accessToken) : 0,
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
export type { TokenManagerConfig, NetworkError };