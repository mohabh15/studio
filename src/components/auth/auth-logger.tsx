'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bug, Trash2, Download, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AuthEvent, AuthError } from '@/lib/types/auth';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  event: AuthEvent | string;
  message: string;
  data?: any;
  source: string;
}

interface AuthLoggerProps {
  enabled?: boolean;
  maxEntries?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

/**
 * AuthLogger - Sistema de logging visual para debugging de autenticación
 *
 * Características:
 * - Logging visual en tiempo real de eventos de autenticación
 * - Cleanup automático de entradas antiguas
 * - Filtros por nivel y tipo de evento
 * - Exportación de logs
 * - Interfaz colapsable para ahorrar espacio
 * - Solo visible cuando está habilitado
 */
export const AuthLogger: React.FC<AuthLoggerProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  maxEntries = 50,
  position = 'top-right',
  className = '',
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Posición del logger
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
  };

  // No mostrar si no está habilitado
  if (!enabled) {
    return null;
  }

  // Función para agregar log
  const addLog = useCallback((
    level: LogEntry['level'],
    event: AuthEvent | string,
    message: string,
    data?: any,
    source: string = 'AuthLogger'
  ) => {
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      event,
      message,
      data,
      source,
    };

    setLogs(prevLogs => {
      const updatedLogs = [newEntry, ...prevLogs];
      // Mantener solo las últimas maxEntries
      return updatedLogs.slice(0, maxEntries);
    });
  }, [maxEntries]);

  // Función para limpiar logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Función para exportar logs
  const exportLogs = useCallback(() => {
    const filteredLogs = getFilteredLogs();
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auth-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Filtrar logs
  const getFilteredLogs = useCallback(() => {
    return logs.filter(log => {
      const levelMatch = filterLevel === 'all' || log.level === filterLevel;
      const eventMatch = filterEvent === 'all' || log.event === filterEvent;
      return levelMatch && eventMatch;
    });
  }, [logs, filterLevel, filterEvent]);

  // Auto-scroll al final cuando hay nuevos logs
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  // Cleanup automático de logs antiguos
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      setLogs(prevLogs => {
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutos

        // Remover logs de más de 5 minutos si excedemos maxEntries
        if (prevLogs.length >= maxEntries) {
          return prevLogs
            .filter(log => log.timestamp > fiveMinutesAgo)
            .slice(0, maxEntries);
        }

        return prevLogs;
      });
    }, 60000); // Verificar cada minuto

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [maxEntries]);

  // Interceptor para capturar eventos de autenticación
  useEffect(() => {
    // Capturar eventos del contexto de autenticación
    const originalConsole = { ...console };

    // Sobrescribir métodos de console para capturar logs de auth
    const logMethods = ['log', 'info', 'warn', 'error', 'debug'] as const;

    logMethods.forEach(method => {
      const originalMethod = console[method];
      console[method] = (...args: any[]) => {
        const message = args.join(' ');
        const isAuthLog = message.includes('[Auth') ||
                         message.includes('AuthProvider') ||
                         message.includes('AuthService') ||
                         message.includes('SessionManager') ||
                         message.includes('TokenManager');

        if (isAuthLog) {
          let level: LogEntry['level'] = 'info';
          if (method === 'warn') level = 'warn';
          if (method === 'error') level = 'error';
          if (method === 'debug') level = 'debug';

          addLog(level, 'console', message, args, 'Console');
        }

        // Llamar al método original
        originalMethod.apply(console, args);
      };
    });

    // Capturar errores no manejados
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('auth')) {
        addLog('error', 'unhandled-rejection', 'Error no manejado', event.reason, 'Global');
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('auth')) {
        addLog('error', 'global-error', event.message, event.error, 'Global');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      // Restaurar console original
      Object.assign(console, originalConsole);

      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);

      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [addLog]);

  // Exponer función global para logging manual
  useEffect(() => {
    (window as any).authLog = addLog;
    (window as any).clearAuthLogs = clearLogs;

    return () => {
      delete (window as any).authLog;
      delete (window as any).clearAuthLogs;
    };
  }, [addLog, clearLogs]);

  const filteredLogs = getFilteredLogs();
  const logCounts = {
    all: logs.length,
    error: logs.filter(l => l.level === 'error').length,
    warn: logs.filter(l => l.level === 'warn').length,
    info: logs.filter(l => l.level === 'info').length,
    debug: logs.filter(l => l.level === 'debug').length,
  };

  // Formatear timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  // Obtener color del badge según nivel
  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      <Card className="w-96 shadow-xl border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Auth Logger
              <Badge variant="outline" className="text-xs">
                {filteredLogs.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="h-6 w-6 p-0"
              >
                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Contadores de logs */}
          <div className="flex gap-1 text-xs">
            <Badge variant={getLevelColor('error')} className="text-xs">
              ERR: {logCounts.error}
            </Badge>
            <Badge variant={getLevelColor('warn')} className="text-xs">
              WARN: {logCounts.warn}
            </Badge>
            <Badge variant={getLevelColor('info')} className="text-xs">
              INFO: {logCounts.info}
            </Badge>
          </div>
        </CardHeader>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* Controles */}
              <div className="flex items-center gap-2 mb-3">
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    <SelectItem value="error">Errores</SelectItem>
                    <SelectItem value="warn">Warnings</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearLogs}
                    className="h-7 px-2"
                    title="Limpiar logs"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exportLogs}
                    className="h-7 px-2"
                    title="Exportar logs"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Área de logs */}
              <ScrollArea className="h-64" ref={scrollAreaRef}>
                <div className="space-y-1">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center text-muted-foreground text-xs py-8">
                      No hay logs para mostrar
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="text-xs p-2 rounded border bg-card/50 hover:bg-card transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getLevelColor(log.level)} className="text-xs">
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-muted-foreground font-mono">
                            {formatTime(log.timestamp)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.source}
                          </Badge>
                        </div>
                        <div className="font-medium text-foreground mb-1">
                          {log.message}
                        </div>
                        {log.data && (
                          <details className="text-muted-foreground">
                            <summary className="cursor-pointer text-xs opacity-70">
                              Datos adicionales
                            </summary>
                            <pre className="text-xs mt-1 p-1 bg-muted rounded overflow-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};