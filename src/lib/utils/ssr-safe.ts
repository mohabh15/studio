/**
 * Utilidades SSR-safe para manejo seguro de APIs del navegador
 * Solución minimalista para corregir errores de SSR en SessionManager y TokenManager
 */

// ============================================================================
// DETECCIÓN DE ENTORNO
// ============================================================================

/**
 * Detecta si el código se está ejecutando en el navegador
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Detecta si el código se está ejecutando en el servidor (SSR)
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

// ============================================================================
// MANEJO SEGURO DE LOCALSTORAGE
// ============================================================================

/**
 * localStorage seguro que no falla en SSR
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (isServer()) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (isServer()) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silenciar errores en SSR
    }
  },

  removeItem: (key: string): void => {
    if (isServer()) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silenciar errores en SSR
    }
  },

  clear: (): void => {
    if (isServer()) return;
    try {
      localStorage.clear();
    } catch {
      // Silenciar errores en SSR
    }
  }
};

// ============================================================================
// MANEJO SEGURO DE SESSIONSTORAGE
// ============================================================================

/**
 * sessionStorage seguro que no falla en SSR
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (isServer()) return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (isServer()) return;
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Silenciar errores en SSR
    }
  },

  removeItem: (key: string): void => {
    if (isServer()) return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Silenciar errores en SSR
    }
  },

  clear: (): void => {
    if (isServer()) return;
    try {
      sessionStorage.clear();
    } catch {
      // Silenciar errores en SSR
    }
  }
};

// ============================================================================
// MANEJO SEGURO DE COOKIES
// ============================================================================

/**
 * Utilidades para manejo seguro de cookies
 */
export const safeCookieUtils = {
  /**
   * Obtiene el valor de una cookie
   */
  getCookie: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    try {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Configura una cookie de forma segura
   */
  setCookie: (name: string, value: string, options: any = {}): void => {
    if (typeof document === 'undefined') return;
    try {
      let cookieString = `${name}=${encodeURIComponent(value)}`;
      if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`;
      if (options.path) cookieString += `; path=${options.path}`;
      if (options.domain) cookieString += `; domain=${options.domain}`;
      if (options.secure) cookieString += '; secure';
      if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
      document.cookie = cookieString;
    } catch {
      // Silenciar errores en SSR
    }
  },

  /**
   * Elimina una cookie
   */
  deleteCookie: (name: string, path = '/', domain?: string): void => {
    if (typeof document === 'undefined') return;
    try {
      let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
      if (domain) cookieString += `; domain=${domain}`;
      document.cookie = cookieString;
    } catch {
      // Silenciar errores en SSR
    }
  }
};

// ============================================================================
// MANEJO SEGURO DE WINDOW.LOCATION
// ============================================================================

/**
 * Información segura sobre la ubicación actual
 */
export const safeLocation = {
  get protocol(): string {
    return isServer() ? 'http:' : window.location.protocol;
  },

  get hostname(): string {
    return isServer() ? 'localhost' : window.location.hostname;
  },

  get port(): string {
    return isServer() ? '3000' : window.location.port;
  },

  get href(): string {
    return isServer() ? 'http://localhost:3000' : window.location.href;
  }
};
