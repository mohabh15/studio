'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { sessionManager } from '@/lib/services/SessionManager';
import type { SessionData } from '@/lib/types/auth';

interface SessionMonitorProps {
  showDetails?: boolean;
  warningThreshold?: number; // minutos antes de expiración para mostrar warning
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milisegundos
}

/**
 * SessionMonitor - Componente para monitoreo de sesión en tiempo real
 *
 * Características:
 * - Monitoreo en tiempo real del estado de la sesión
 * - Cleanup automático de recursos y timers
 * - Indicadores visuales del tiempo restante
 * - Configuración de umbrales de warning
 * - Información detallada de la sesión (opcional)
 * - Auto-refresh configurable
 */
export const SessionMonitor: React.FC<SessionMonitorProps> = ({
  showDetails = false,
  warningThreshold = 5,
  className = '',
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
}) => {
  const { user, sessionStatus, getCurrentUser, extendSession } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(!showDetails);
  const [isLoading, setIsLoading] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup automático
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Obtener datos de la sesión
  const fetchSessionData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const currentUser = await getCurrentUser();
      if (mountedRef.current) {
        setSessionData(currentUser);
      }
    } catch (error) {
      console.error('[SessionMonitor] Error obteniendo datos de sesión:', error);
    }
  }, [getCurrentUser]);

  // Calcular tiempo restante
  const calculateTimeRemaining = useCallback(() => {
    if (!sessionData) return 0;

    const now = Date.now();
    const sessionStart = sessionData.sessionStartTime;
    const lastActivity = sessionData.lastActivityTime;
    const sessionTimeout = 30 * 60 * 1000; // 30 minutos en milisegundos

    // Usar la actividad más reciente
    const referenceTime = Math.max(sessionStart, lastActivity);
    const elapsed = now - referenceTime;
    const remaining = Math.max(0, sessionTimeout - elapsed);

    return Math.floor(remaining / 1000 / 60); // Convertir a minutos
  }, [sessionData]);

  // Actualizar tiempo restante
  const updateTimeRemaining = useCallback(() => {
    if (!mountedRef.current) return;

    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);

    // Si la sesión está por expirar, mostrar warning
    if (remaining <= warningThreshold && remaining > 0) {
      console.warn(`[SessionMonitor] Sesión expira en ${remaining} minutos`);
    }
  }, [calculateTimeRemaining, warningThreshold]);

  // Configurar intervalos de actualización
  useEffect(() => {
    if (!autoRefresh || !user) return;

    // Actualizar inmediatamente
    fetchSessionData();
    updateTimeRemaining();

    // Configurar intervalos
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        fetchSessionData();
        updateTimeRemaining();
      }
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, autoRefresh, refreshInterval, fetchSessionData, updateTimeRemaining]);

  // Actualizar cuando cambie el estado de la sesión
  useEffect(() => {
    if (sessionStatus === 'authenticated' && user) {
      fetchSessionData();
    } else if (sessionStatus === 'unauthenticated') {
      setSessionData(null);
      setTimeRemaining(0);
    }
  }, [sessionStatus, user, fetchSessionData]);

  // Extender sesión
  const handleExtendSession = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await extendSession();
      await fetchSessionData(); // Refrescar datos
      console.log('[SessionMonitor] Sesión extendida exitosamente');
    } catch (error) {
      console.error('[SessionMonitor] Error extendiendo sesión:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Determinar el estado de la sesión
  const getSessionStatus = () => {
    if (!user || !sessionData) return 'inactive';

    if (timeRemaining <= 0) return 'expired';
    if (timeRemaining <= warningThreshold) return 'warning';
    return 'active';
  };

  // Obtener información para mostrar
  const getStatusInfo = () => {
    const status = getSessionStatus();

    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          text: 'Sesión activa',
          variant: 'default' as const,
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          text: `Expira en ${timeRemaining}min`,
          variant: 'secondary' as const,
        };
      case 'expired':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          text: 'Sesión expirada',
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          text: 'Sin sesión',
          variant: 'outline' as const,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Calcular progreso de la sesión (0-100%)
  const getSessionProgress = () => {
    if (!sessionData || timeRemaining <= 0) return 0;
    const sessionTimeout = 30; // 30 minutos
    const elapsed = sessionTimeout - timeRemaining;
    return Math.max(0, Math.min(100, (elapsed / sessionTimeout) * 100));
  };

  const sessionProgress = getSessionProgress();

  // Si no hay usuario, no mostrar nada
  if (!user) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`inline-block ${className}`}>
        <Card className="shadow-lg border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* Icono de estado */}
              <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
              </div>

              {/* Información principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={statusInfo.variant} className="text-xs">
                    {statusInfo.text}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVisible(!isVisible)}
                    className="h-6 w-6 p-0"
                  >
                    {isVisible ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Tiempo restante */}
                {isVisible && timeRemaining > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{timeRemaining} minutos restantes</span>
                    </div>

                    {/* Barra de progreso */}
                    <Progress
                      value={sessionProgress}
                      className="h-1"
                    />
                  </div>
                )}

                {/* Detalles adicionales */}
                {isVisible && showDetails && sessionData && (
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div>Email: {sessionData.email}</div>
                    <div>
                      Última actividad: {new Date(sessionData.lastActivityTime).toLocaleTimeString()}
                    </div>
                    <div>Método: {sessionData.authMethod}</div>
                  </div>
                )}
              </div>

              {/* Botón de extender sesión */}
              {isVisible && timeRemaining <= warningThreshold && timeRemaining > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExtendSession}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      {isLoading ? 'Extendiendo...' : 'Extender'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Extender la sesión por 30 minutos más</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};