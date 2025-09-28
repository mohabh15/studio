import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from './src/lib/firebase-admin';
import { sessionManager } from './src/lib/services/SessionManager';
import { tokenManager } from './src/lib/services/TokenManager';
import type { SessionData, AuthError } from './src/lib/types/auth';

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const ROUTE_CONFIG = {
  // Rutas públicas que no requieren autenticación
  publicRoutes: ['/login', '/signup', '/forgot-password', '/reset-password'] as string[],
  // Rutas de autenticación (login, signup, etc.)
  authRoutes: ['/login', '/signup', '/forgot-password', '/reset-password'] as string[],
  // Rutas protegidas que requieren autenticación
  protectedRoutes: ['/dashboard', '/transactions', '/budgets', '/debts', '/settings'] as string[],
  // Rutas API que requieren autenticación especial
  protectedApiRoutes: ['/api/auth/user', '/api/transactions', '/api/budgets', '/api/debts'] as string[],
  // Rutas estáticas y recursos públicos
  staticRoutes: ['/favicon.ico', '/icono.png', '/_next', '/api/health'] as string[],
};

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://firebase.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com;",
} as const;

// ============================================================================
// CLASE DE LOGGER PARA MIDDLEWARE
// ============================================================================

class MiddlewareLogger {
  private prefix = '[AuthMiddleware]';

  info(message: string, data?: any): void {
    console.info(`${this.prefix} ℹ️ ${message}`, data || '');
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

const logger = new MiddlewareLogger();

// ============================================================================
// UTILIDADES PARA RUTAS
// ============================================================================

/**
 * Determina el tipo de ruta y sus requerimientos de autenticación
 */
function getRouteContext(pathname: string): {
  isPublicRoute: boolean;
  isAuthRoute: boolean;
  isProtectedRoute: boolean;
  isApiRoute: boolean;
  isStaticRoute: boolean;
  requiresAuth: boolean;
} {
  const isApiRoute = pathname.startsWith('/api/');
  const isStaticRoute = ROUTE_CONFIG.staticRoutes.some(route =>
    pathname.startsWith(route) || pathname.includes(route)
  );

  const isPublicRoute = ROUTE_CONFIG.publicRoutes.includes(pathname);
  const isAuthRoute = ROUTE_CONFIG.authRoutes.includes(pathname);
  const isProtectedRoute = ROUTE_CONFIG.protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  const requiresAuth = !isPublicRoute && !isStaticRoute && (isProtectedRoute || isApiRoute);

  return {
    isPublicRoute,
    isAuthRoute,
    isProtectedRoute,
    isApiRoute,
    isStaticRoute,
    requiresAuth,
  };
}

/**
 * Verifica si una ruta API requiere autenticación
 */
function isProtectedApiRoute(pathname: string): boolean {
  return ROUTE_CONFIG.protectedApiRoutes.some(route => pathname.startsWith(route));
}

// ============================================================================
// VERIFICACIÓN DE TOKENS Y SESIÓN
// ============================================================================

/**
 * Verifica token usando Firebase Admin
 */
async function verifyFirebaseToken(token: string): Promise<any> {
  try {
    logger.debug('Verificando token con Firebase Admin', { tokenLength: token.length });
    const decodedToken = await adminAuth.verifyIdToken(token);
    logger.debug('Token verificado exitosamente', { uid: decodedToken.uid });
    return decodedToken;
  } catch (error) {
    logger.error('Error verificando token con Firebase', error);
    throw error;
  }
}

/**
 * Obtiene token desde la request (cookies o headers)
 */
function extractToken(request: NextRequest): string | null {
  // Intentar obtener de cookie primero
  let token = request.cookies.get('firebase-auth-token')?.value ||
              request.cookies.get('accessToken')?.value;

  if (token) {
    logger.debug('Token obtenido de cookies');
    return token;
  }

  // Fallback a header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    logger.debug('Token obtenido de header Authorization');
    return token;
  }

  logger.debug('No se encontró token en la request');
  return null;
}

/**
 * Verifica la sesión usando SessionManager
 */
async function verifySession(request: NextRequest): Promise<{
  isValid: boolean;
  sessionData?: SessionData;
  error?: AuthError;
}> {
  try {
    logger.debug('Verificando sesión con SessionManager');

    // Verificar si hay una sesión válida
    const hasValidSession = await sessionManager.hasValidSession();

    if (!hasValidSession) {
      logger.debug('No hay sesión válida en SessionManager');
      return { isValid: false };
    }

    // Obtener datos de la sesión actual
    const sessionData = await sessionManager.getCurrentSession();

    if (!sessionData) {
      logger.debug('No se pudo obtener sesión actual');
      return { isValid: false };
    }

    // Verificar expiración de la sesión
    const sessionStatus = await sessionManager.getSessionStatus();
    if (sessionStatus === 'expired') {
      logger.warn('Sesión expirada detectada', { uid: sessionData.uid });
      return {
        isValid: false,
        error: {
          code: 'auth/session-expired',
          message: 'La sesión ha expirado',
          timestamp: Date.now(),
          recoverable: true,
        }
      };
    }

    logger.debug('Sesión válida verificada', {
      uid: sessionData.uid,
      status: sessionStatus
    });

    return { isValid: true, sessionData };
  } catch (error) {
    logger.error('Error verificando sesión', error);
    return {
      isValid: false,
      error: {
        code: 'auth/session-expired',
        message: 'Error verificando sesión',
        timestamp: Date.now(),
        recoverable: true,
      }
    };
  }
}

/**
 * Verifica tokens usando TokenManager
 */
async function verifyTokens(request: NextRequest): Promise<{
  isValid: boolean;
  tokenData?: any;
  error?: AuthError;
}> {
  try {
    logger.debug('Verificando tokens con TokenManager');

    // Verificar si los tokens están expirados
    const areTokensExpired = await tokenManager.areTokensExpired();

    if (areTokensExpired) {
      logger.debug('Tokens expirados detectados');
      return {
        isValid: false,
        error: {
          code: 'auth/token-expired',
          message: 'Los tokens han expirado',
          timestamp: Date.now(),
          recoverable: true,
        }
      };
    }

    // Obtener información del usuario desde el token
    const userInfo = await tokenManager.getUserInfoFromToken();

    if (!userInfo) {
      logger.debug('No se pudo obtener información del usuario del token');
      return { isValid: false };
    }

    logger.debug('Tokens válidos verificados', { uid: userInfo.uid });
    return { isValid: true, tokenData: userInfo };
  } catch (error) {
    logger.error('Error verificando tokens', error);
    return {
      isValid: false,
      error: {
        code: 'auth/token-expired',
        message: 'Error verificando tokens',
        timestamp: Date.now(),
        recoverable: true,
      }
    };
  }
}

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  logger.info('Middleware ejecutado', {
    pathname,
    method,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
  });

  // Obtener contexto de la ruta
  const routeContext = getRouteContext(pathname);

  logger.debug('Contexto de ruta determinado', {
    pathname,
    ...routeContext,
  });

  // Crear response base con headers de seguridad
  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Manejar rutas estáticas y recursos públicos
  if (routeContext.isStaticRoute) {
    logger.debug('Ruta estática, permitiendo acceso', { pathname });
    return response;
  }

  // Manejar rutas públicas
  if (routeContext.isPublicRoute) {
    logger.debug('Ruta pública, permitiendo acceso', { pathname });

    // Si el usuario ya está autenticado y trata de acceder a login/signup,
    // redirigir al dashboard. PERO permitir acceso a forgot-password y reset-password
    // incluso para usuarios autenticados
    if (pathname === '/login' || pathname === '/signup') {
      try {
        const sessionResult = await verifySession(request);
        if (sessionResult.isValid && sessionResult.sessionData) {
          logger.info('Usuario autenticado intentando acceder a login/signup, redirigiendo', {
            from: pathname,
            uid: sessionResult.sessionData.uid,
          });

          const dashboardUrl = new URL('/dashboard', request.url);
          return NextResponse.redirect(dashboardUrl);
        }
      } catch (error) {
        logger.warn('Error verificando sesión para redirección', error);
      }
    }

    return response;
  }

  // Verificar autenticación para rutas protegidas
  if (routeContext.requiresAuth) {
    logger.debug('Ruta requiere autenticación, verificando', { pathname });

    try {
      // Verificar tokens primero
      const tokenResult = await verifyTokens(request);

      if (!tokenResult.isValid) {
        logger.warn('Tokens inválidos o expirados', {
          pathname,
          error: tokenResult.error?.message
        });

        // Si es una ruta API, devolver error 401
        if (routeContext.isApiRoute) {
          return NextResponse.json(
            {
              error: 'No autorizado',
              code: tokenResult.error?.code || 'auth/token-expired',
              message: tokenResult.error?.message || 'Token inválido o expirado',
            },
            { status: 401 }
          );
        }

        // Para rutas web, redirigir al login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Verificar sesión con SessionManager
      const sessionResult = await verifySession(request);

      if (!sessionResult.isValid) {
        logger.warn('Sesión inválida o expirada', {
          pathname,
          error: sessionResult.error?.message
        });

        // Si es una ruta API, devolver error 401
        if (routeContext.isApiRoute) {
          return NextResponse.json(
            {
              error: 'Sesión expirada',
              code: sessionResult.error?.code || 'auth/session-expired',
              message: sessionResult.error?.message || 'Sesión inválida o expirada',
            },
            { status: 401 }
          );
        }

        // Para rutas web, redirigir al login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        loginUrl.searchParams.set('reason', 'session_expired');
        return NextResponse.redirect(loginUrl);
      }

      // Verificar token con Firebase Admin para rutas API críticas
      if (isProtectedApiRoute(pathname)) {
        const token = extractToken(request);

        if (token) {
          try {
            const decodedToken = await verifyFirebaseToken(token);

            // Agregar información del usuario a los headers para uso downstream
            response.headers.set('x-user-id', decodedToken.uid);
            response.headers.set('x-user-email', decodedToken.email || '');

            logger.debug('Token Firebase verificado para API', {
              uid: decodedToken.uid,
              pathname
            });
          } catch (error) {
            logger.error('Error verificando token Firebase para API', error);

            if (routeContext.isApiRoute) {
              return NextResponse.json(
                {
                  error: 'Token inválido',
                  code: 'auth/token-expired',
                  message: 'No se pudo verificar el token',
                },
                { status: 401 }
              );
            }
          }
        }
      }

      // Actualizar actividad de la sesión
      try {
        await sessionManager.updateActivity();
        logger.debug('Actividad de sesión actualizada', { pathname });
      } catch (error) {
        logger.warn('Error actualizando actividad de sesión', error);
      }

      logger.info('Acceso autorizado', {
        pathname,
        uid: sessionResult.sessionData?.uid,
        method,
      });

    } catch (error) {
      logger.error('Error inesperado en middleware', error);

      // En caso de error inesperado, denegar acceso
      if (routeContext.isApiRoute) {
        return NextResponse.json(
          {
            error: 'Error interno del servidor',
            code: 'auth/unknown-error',
            message: 'Error verificando autenticación',
          },
          { status: 500 }
        );
      }

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'server_error');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Agregar headers de seguridad adicionales para todas las respuestas
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  logger.debug('Middleware completado exitosamente', { pathname });
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};