'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LoginFormData, AuthError } from '@/lib/types/auth';

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginProgress, setLoginProgress] = useState(0);
  const [sessionStatus, setSessionStatus] = useState<string>('');

  const {
    login,
    signInWithGoogle,
    sessionStatus: authSessionStatus,
    error: authError,
    hasValidSession,
    getSessionStatus
  } = useAuth();
  const router = useRouter();

  // Logging para debugging
  useEffect(() => {
  }, [authSessionStatus]);

  // Verificar si ya hay sesión válida y redirigir
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const hasSession = await hasValidSession();
        const status = await getSessionStatus();

        if (hasSession && status === 'authenticated') {
          router.push('/');
          return;
        }

        setSessionStatus(status);
      } catch (error) {
        console.error('[LoginPage] Error verificando sesión:', error);
      }
    };

    checkExistingSession();
  }, [hasValidSession, getSessionStatus, router]);

  // Validación de formularios mejorada
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejo de errores mejorado
  const getErrorMessage = (error: AuthError | null): string => {
    if (!error) return '';

    console.error('[LoginPage] Error de autenticación:', error);

    switch (error.code) {
      case 'auth/user-not-found':
        return 'No se encontró una cuenta con este email';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Inténtalo más tarde';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu internet';
      case 'auth/session-expired':
        return 'Tu sesión ha expirado. Inicia sesión nuevamente';
      default:
        return error.message || 'Error al iniciar sesión';
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setLoginProgress(0);

    // Simular progreso de login
    const progressInterval = setInterval(() => {
      setLoginProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    try {
      await login(formData.email, formData.password);
      setLoginProgress(100);
      router.push('/');
    } catch (err: any) {
      console.error('[LoginPage] Error en login:', err);
      setLoginProgress(0);
      clearInterval(progressInterval);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setLoginProgress(0);

    const progressInterval = setInterval(() => {
      setLoginProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 15;
      });
    }, 150);

    try {
      await signInWithGoogle();
      setLoginProgress(100);
      router.push('/');
    } catch (err: any) {
      console.error('[LoginPage] Error en login con Google:', err);
      setLoginProgress(0);
      clearInterval(progressInterval);
    } finally {
      setGoogleLoading(false);
    }
  };

  const currentError = getErrorMessage(authError);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md glass-card depth-3 border-border/40">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="relative">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
                Iniciar Sesión
              </CardTitle>
              <div className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
          </div>
          <CardDescription className="text-muted-foreground/80 leading-relaxed">
            Ingresa tus credenciales para acceder a tu cuenta financiera
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/90">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={cn(
                  "glass-effect hover-lift transition-all duration-300 focus:bg-background/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                  validationErrors.email ? 'border-error/60 bg-error/5' : ''
                )}
                placeholder="tu@email.com"
                disabled={loading || googleLoading}
              />
              {validationErrors.email && (
                <p className="text-sm text-error flex items-center gap-1">
                  <span className="w-1 h-1 bg-error rounded-full"></span>
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/90">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={cn(
                  "glass-effect hover-lift transition-all duration-300 focus:bg-background/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                  validationErrors.password ? 'border-error/60 bg-error/5' : ''
                )}
                placeholder="••••••••"
                disabled={loading || googleLoading}
              />
              {validationErrors.password && (
                <p className="text-sm text-error flex items-center gap-1">
                  <span className="w-1 h-1 bg-error rounded-full"></span>
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Opción de "Recordarme" */}
            <div className="flex items-center space-x-3 p-3 glass-card depth-1 border border-border/40 rounded-lg">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => handleInputChange('rememberMe', !!checked)}
                disabled={loading || googleLoading}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="rememberMe" className="text-sm font-medium leading-none text-foreground/90 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Recordarme (mantener sesión activa)
              </Label>
            </div>

            {/* Indicador de progreso */}
            {(loading || googleLoading) && (
              <div className="space-y-2">
                <Progress value={loginProgress} className="w-full" />
                <p className="text-sm text-center text-gray-600">
                  {loading ? 'Iniciando sesión...' : 'Conectando con Google...'}
                </p>
              </div>
            )}

            {/* Manejo de errores mejorado */}
            {currentError && (
              <Alert variant="destructive">
                <AlertDescription>{currentError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover-lift"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 glass-effect hover-lift transition-all duration-300 hover:bg-background/80 hover:border-border/60 border-border/40"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-primary font-medium">Conectando...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Image
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google logo"
                  width={20}
                  height={20}
                  className="flex-shrink-0"
                />
                <span className="font-medium">Continuar con Google</span>
              </div>
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                Regístrate
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              ¿Olvidaste tu contraseña?{' '}
              <Link href="/forgot-password" className="text-blue-500 hover:underline">
                Recupérala aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}