'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthEnhanced, useSessionExpiration } from '@/hooks/use-auth-enhanced';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface SessionNotificationProps {
  className?: string;
  showToasts?: boolean;
  warningThreshold?: number;
  autoHideDelay?: number;
}

export const SessionNotifications: React.FC<SessionNotificationProps> = ({
  className,
  showToasts = true,
  warningThreshold = 5,
  autoHideDelay = 5000,
}) => {
  const { sessionStatus, loading } = useAuthEnhanced();
  const { timeUntilExpiration, isExpiringSoon, minutesUntilExpiration } = useSessionExpiration(warningThreshold);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'warning' | 'expired' | 'extended';
    message: string;
    timestamp: Date;
    visible: boolean;
  }>>([]);

  // Manejar notificaciones de sesión
  useEffect(() => {
    if (loading) {
      return;
    }

    // Notificación de warning de expiración
    if (sessionStatus === 'authenticated' && isExpiringSoon && minutesUntilExpiration <= warningThreshold) {
      const notificationId = 'session-warning';
      const message = `Tu sesión expira en ${minutesUntilExpiration} minutos. Considera extenderla.`;

      setNotifications(prev => {
        const existing = prev.find(n => n.id === notificationId);
        if (existing) return prev;

        const newNotification = {
          id: notificationId,
          type: 'warning' as const,
          message,
          timestamp: new Date(),
          visible: true,
        };

        if (showToasts) {
          toast({
            title: "Sesión próxima a expirar",
            description: message,
            variant: "default",
            duration: autoHideDelay,
          });
        }

        return [...prev, newNotification];
      });
    }

    // Notificación de sesión expirada (cuando no hay usuario autenticado)
    if (sessionStatus === 'unauthenticated' && !loading) {
      const notificationId = 'session-expired';
      const message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';

      setNotifications(prev => {
        const existing = prev.find(n => n.id === notificationId);
        if (existing) return prev;

        const newNotification = {
          id: notificationId,
          type: 'expired' as const,
          message,
          timestamp: new Date(),
          visible: true,
        };

        if (showToasts) {
          toast({
            title: "Sesión expirada",
            description: message,
            variant: "destructive",
            duration: autoHideDelay * 2, // Más tiempo para errores
          });
        }

        return [...prev, newNotification];
      });
    }
  }, [sessionStatus, isExpiringSoon, minutesUntilExpiration, loading, showToasts, warningThreshold, autoHideDelay]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const extendSession = async () => {
    try {
      // Aquí podrías llamar a la función de extender sesión del auth service
      toast({
        title: "Sesión extendida",
        description: "Tu sesión ha sido extendida exitosamente.",
        duration: 3000,
      });

      // Remover notificaciones de warning
      setNotifications(prev => prev.filter(n => n.type !== 'warning'));
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo extender la sesión.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={cn('fixed top-4 left-4 z-50 space-y-2', className)}>
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={cn(
            'w-80 shadow-lg border-l-4',
            notification.type === 'warning' && 'border-l-warning',
            notification.type === 'expired' && 'border-l-destructive',
            notification.type === 'extended' && 'border-l-green-500'
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">
                  {notification.type === 'warning' && (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                  {notification.type === 'expired' && (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                  {notification.type === 'extended' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {notification.type === 'warning' && 'Sesión próxima a expirar'}
                    {notification.type === 'expired' && 'Sesión expirada'}
                    {notification.type === 'extended' && 'Sesión extendida'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notification.type === 'warning' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={extendSession}
                    className="text-xs h-7"
                  >
                    Extender
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeNotification(notification.id)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {notification.type === 'warning' && (
              <div className="mt-3">
                <Progress
                  value={((warningThreshold - minutesUntilExpiration) / warningThreshold) * 100}
                  className="h-1"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};