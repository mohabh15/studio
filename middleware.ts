import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from './src/lib/firebase-admin';

async function verifyToken(request: NextRequest): Promise<boolean> {
  try {
    console.log('Verificando token...');
    // Obtener token de cookie o header
    let token = request.cookies.get('firebase-auth-token')?.value;
    console.log('Token de cookie:', token ? 'presente' : 'no presente');

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      console.log('Token de header:', token ? 'presente' : 'no presente');
    }

    if (!token) {
      console.log('No hay token, retornando false');
      return false;
    }

    // Verificar token con Firebase Admin
    console.log('Verificando token con Firebase Admin...');
    await adminAuth.verifyIdToken(token);
    console.log('Token válido');
    return true;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Middleware ejecutado para:', pathname);

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/signup'];
  const isPublicPath = publicPaths.includes(pathname);

  // Permitir acceso a rutas públicas
  if (isPublicPath) {
    console.log('Ruta pública, permitiendo acceso');
    return NextResponse.next();
  }

  // Verificar si el usuario está autenticado
  const isAuthenticated = await verifyToken(request);
  console.log('Usuario autenticado:', isAuthenticated);

  // Permitir el paso para todas las rutas, la verificación se hace client-side
  return NextResponse.next();
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