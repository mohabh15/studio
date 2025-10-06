'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();

  // Validación del formulario
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof ForgotPasswordFormData, value: string) => {
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

    try {
      // Simular llamada a API para enviar email de recuperación
      // En una implementación real, esto llamaría a Firebase Auth o tu API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Marcar como exitoso y mostrar mensaje de confirmación
      setIsSuccess(true);
    } catch (err: any) {
      console.error('[ForgotPasswordPage] Error enviando email:', err);
      setValidationErrors({
        email: 'Error al enviar el email. Inténtalo nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Si el email se envió exitosamente, mostrar página de confirmación
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md glass-card depth-3 border-border/40">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-success/20 to-success/10 rounded-full flex items-center justify-center mb-4 border border-success/30">
              <svg
                className="w-8 h-8 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="relative">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">
                ¡Email enviado!
              </CardTitle>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-success to-success/80 rounded-full"></div>
            </div>
            <CardDescription className="text-muted-foreground/80 leading-relaxed">
              Revisa tu bandeja de entrada y carpeta de spam para las instrucciones de recuperación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p className="mb-4">
                Hemos enviado un email a <strong>{formData.email}</strong> con instrucciones para restablecer tu contraseña.
              </p>
              <p className="mb-6">
                Si no recibes el email en los próximos minutos, verifica tu carpeta de spam o{' '}
                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  inténtalo nuevamente
                </button>
                .
              </p>
            </div>
            <Button
              onClick={() => router.push('/login')}
              className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover-lift"
            >
              Volver al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md glass-card depth-3 border-border/40">
        <CardHeader className="space-y-4 pb-6">
          <div className="relative">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              Recuperar Contraseña
            </CardTitle>
            <div className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
          <CardDescription className="text-muted-foreground/80 leading-relaxed">
            Ingresa tu email para recibir instrucciones de recuperación de contraseña
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
                disabled={loading}
                autoComplete="email"
              />
              {validationErrors.email && (
                <p className="text-sm text-error flex items-center gap-1">
                  <span className="w-1 h-1 bg-error rounded-full"></span>
                  {validationErrors.email}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover-lift"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : (
                'Enviar instrucciones'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Recordaste tu contraseña?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}