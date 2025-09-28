# Hook useAuthEnhanced

## Descripción

`useAuthEnhanced` es un hook personalizado de React que proporciona una interfaz completa y avanzada para la gestión de autenticación con persistencia segura de sesiones. Está construido sobre el sistema de autenticación existente y añade funcionalidades avanzadas como:

- **Gestión completa del estado de autenticación**
- **Manejo automático de expiración de sesiones**
- **Notificaciones de warning antes de expiración**
- **Integración con TokenManager y SessionManager**
- **Cleanup automático de timers y listeners**
- **Métodos de utilidad para permisos**
- **Manejo robusto de errores**

## Instalación

El hook ya está disponible en el proyecto. Solo necesitas importarlo:

```typescript
import { useAuthEnhanced } from '@/hooks/use-auth-enhanced';
```

## Uso Básico

### Hook Principal

```typescript
import { useAuthEnhanced } from '@/hooks/use-auth-enhanced';

function MyComponent() {
  const auth = useAuthEnhanced({
    enableExpirationWarnings: true,
    onSessionWarning: (minutesLeft) => {
      console.log(`Sesión expira en ${minutesLeft} minutos`);
    },
    onSessionExpired: () => {
      console.log('Sesión expirada');
    },
  });

  const handleLogin = async () => {
    const result = await auth.login({
      email: 'user@example.com',
      password: 'password',
      rememberMe: true,
    });

    if (result.success) {
      console.log('Login exitoso');
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    <div>
      <p>Estado: {auth.sessionStatus}</p>
      <p>Usuario: {auth.user?.email || 'No autenticado'}</p>
      <button onClick={handleLogin}>Iniciar Sesión</button>
      <button onClick={() => auth.logout()}>Cerrar Sesión</button>
    </div>
  );
}
```

### Hooks Auxiliares

#### useAuthSession

Proporciona información simplificada sobre la sesión:

```typescript
import { useAuthSession } from '@/hooks/use-auth-enhanced';

function SessionInfo() {
  const { isAuthenticated, isLoading, user, sessionStatus } = useAuthSession();

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <p>Autenticado: {isAuthenticated ? 'Sí' : 'No'}</p>
      <p>Usuario: {user?.email}</p>
    </div>
  );
}
```

#### usePermissions

Para verificar permisos y roles:

```typescript
import { usePermissions } from '@/hooks/use-auth-enhanced';

function PermissionCheck() {
  const { hasPermission, hasRole, user } = usePermissions();

  return (
    <div>
      <p>Permiso admin: {hasPermission('admin') ? 'Sí' : 'No'}</p>
      <p>Rol user: {hasRole('user') ? 'Sí' : 'No'}</p>
    </div>
  );
}
```

#### useSessionExpiration

Para monitorear la expiración de la sesión:

```typescript
import { useSessionExpiration } from '@/hooks/use-auth-enhanced';

function ExpirationWarning() {
  const { timeUntilExpiration, isExpiringSoon, minutesUntilExpiration } = useSessionExpiration(5);

  if (!isExpiringSoon) return null;

  return (
    <div className="alert alert-warning">
      Tu sesión expira en {minutesUntilExpiration} minutos
    </div>
  );
}
```

## API Reference

### useAuthEnhanced(config?)

#### Parámetros

- `config` (opcional): Objeto de configuración

```typescript
interface UseAuthEnhancedConfig {
  redirectAfterLogin?: boolean;           // Redirección automática después del login
  redirectAfterLogout?: boolean;          // Redirección automática después del logout
  loginRedirectUrl?: string;              // URL personalizada después del login
  logoutRedirectUrl?: string;             // URL personalizada después del logout
  enableExpirationWarnings?: boolean;     // Habilitar notificaciones de expiración
  onSessionWarning?: (minutesLeft: number) => void;  // Callback warning de expiración
  onSessionExpired?: () => void;          // Callback cuando expira la sesión
  onError?: (error: AuthError) => void;   // Callback para errores
}
```

#### Valor de Retorno

```typescript
interface UseAuthEnhancedReturn {
  // Estado de autenticación
  user: SessionData | null;
  loading: boolean;
  isLoading: boolean;
  error: AuthError | null;
  sessionStatus: SessionStatus;
  persistence: PersistenceType;
  isEmailVerified: boolean;
  isVerifyingEmail: boolean;

  // Métodos de autenticación
  login: (formData: LoginFormData, options?: AuthOperationOptions) => Promise<AuthOperationResult>;
  signup: (formData: SignupFormData, options?: AuthOperationOptions) => Promise<AuthOperationResult>;
  loginWithGoogle: (options?: AuthOperationOptions) => Promise<AuthOperationResult>;
  logout: (options?: AuthOperationOptions) => Promise<AuthOperationResult>;

  // Métodos de sesión
  refreshSession: () => Promise<AuthOperationResult>;
  extendSession: () => Promise<AuthOperationResult>;
  updateActivity: () => Promise<void>;

  // Métodos de verificación de email
  sendEmailVerification: () => Promise<AuthOperationResult>;
  sendPasswordResetEmail: (email: string) => Promise<AuthOperationResult>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<AuthOperationResult>;

  // Métodos de utilidad
  hasPermission: (permission: string) => boolean;
  isSessionExpiringSoon: (thresholdMinutes?: number) => Promise<boolean>;
  getTimeUntilExpiration: () => Promise<number>;

  // Métodos de configuración
  updateConfig: (config: Partial<UseAuthEnhancedConfig>) => void;

  // Estadísticas y debugging
  getStats: () => Promise<{
    authService: any;
    sessionManager: any;
    tokenManager: any;
  }>;
}
```

## Ejemplos Avanzados

### Componente con Manejo de Errores

```typescript
function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const auth = useAuthEnhanced({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await auth.login(formData);

    if (result.success) {
      toast.success('Login exitoso');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        disabled={auth.loading}
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        disabled={auth.loading}
      />
      <button type="submit" disabled={auth.loading}>
        {auth.loading ? 'Cargando...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
```

### Componente con Monitoreo de Sesión

```typescript
function SessionMonitor() {
  const auth = useAuthEnhanced();
  const { timeUntilExpiration, isExpiringSoon } = useSessionExpiration(10);

  useEffect(() => {
    if (isExpiringSoon) {
      // Mostrar modal de warning
      setShowExpirationWarning(true);
    }
  }, [isExpiringSoon]);

  const handleExtendSession = async () => {
    const result = await auth.extendSession();
    if (result.success) {
      setShowExpirationWarning(false);
    }
  };

  return (
    <div>
      {isExpiringSoon && (
        <div className="session-warning">
          <p>Tu sesión expira en {Math.floor(timeUntilExpiration / 60)} minutos</p>
          <button onClick={handleExtendSession}>
            Extender Sesión
          </button>
        </div>
      )}
    </div>
  );
}
```

### Integración con React Query

```typescript
function ProtectedData() {
  const auth = useAuthEnhanced();

  const { data, isLoading } = useQuery({
    queryKey: ['protected-data'],
    queryFn: fetchProtectedData,
    enabled: auth.sessionStatus === 'authenticated',
  });

  if (auth.sessionStatus !== 'authenticated') {
    return <div>Debes iniciar sesión</div>;
  }

  return (
    <div>
      {isLoading ? 'Cargando...' : JSON.stringify(data)}
    </div>
  );
}
```

## Migración desde el Contexto Existente

### Paso 1: Reemplazar el import

```typescript
// Antes
import { useAuth } from '@/contexts/auth-context';

// Después
import { useAuthEnhanced } from '@/hooks/use-auth-enhanced';
```

### Paso 2: Actualizar el uso

```typescript
// Antes
const { user, loading, login, logout } = useAuth();

// Después
const auth = useAuthEnhanced();
const { user, loading, login, logout } = auth;
```

### Paso 3: Aprovechar las nuevas funcionalidades

```typescript
const auth = useAuthEnhanced({
  enableExpirationWarnings: true,
  onSessionWarning: (minutesLeft) => {
    // Tu lógica de warning
  },
});

// Nuevas funcionalidades disponibles
await auth.refreshSession();
await auth.extendSession();
const hasPermission = auth.hasPermission('admin');
const isExpiring = await auth.isSessionExpiringSoon(5);
```

## Hooks Auxiliares

### useAuthSession

Proporciona una interfaz simplificada:

```typescript
const {
  isAuthenticated,  // boolean
  isLoading,        // boolean
  user,            // SessionData | null
  sessionStatus    // SessionStatus
} = useAuthSession();
```

### usePermissions

Para manejo de permisos:

```typescript
const {
  hasPermission,    // (permission: string) => boolean
  hasRole,         // (role: string) => boolean
  user             // SessionData | null
} = usePermissions();
```

### useSessionExpiration

Para monitoreo de expiración:

```typescript
const {
  timeUntilExpiration,    // number (minutos)
  isExpiringSoon,        // boolean
  minutesUntilExpiration  // number (minutos)
} = useSessionExpiration(warningThresholdMinutes);
```

## Configuración Avanzada

### Configuración Personalizada

```typescript
const auth = useAuthEnhanced({
  redirectAfterLogin: true,
  loginRedirectUrl: '/dashboard',
  enableExpirationWarnings: true,
  onSessionWarning: (minutesLeft) => {
    // Mostrar notificación
    showNotification(`Sesión expira en ${minutesLeft} minutos`);
  },
  onSessionExpired: () => {
    // Redirigir al login
    router.push('/login');
  },
  onError: (error) => {
    // Log de errores
    console.error('Auth error:', error);
  },
});
```

### Hooks Específicos para Casos de Uso

```typescript
// Para componentes que solo necesitan verificar autenticación
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { sessionStatus } = useAuthSession();

  if (sessionStatus === 'loading') return <LoadingSpinner />;
  if (sessionStatus !== 'authenticated') return <LoginPrompt />;

  return <>{children}</>;
}

// Para componentes que necesitan permisos específicos
function AdminPanel() {
  const { hasPermission } = usePermissions();

  if (!hasPermission('admin')) {
    return <AccessDenied />;
  }

  return <AdminContent />;
}
```

## Troubleshooting

### Problemas Comunes

1. **Error: "useAuthEnhanced must be used within an AuthProvider"**
   - Solución: Asegúrate de que el componente esté envuelto con `<AuthProvider>`

2. **La sesión no se mantiene después de recargar**
   - Verifica que `persistence` esté configurado correctamente
   - Revisa la configuración del `SessionManager`

3. **Los tokens no se refrescan automáticamente**
   - Verifica que `TokenManager` esté configurado correctamente
   - Revisa la configuración de `refreshThresholdMinutes`

4. **Errores de tipos TypeScript**
   - Asegúrate de importar los tipos correctos
   - Verifica que estás usando las interfaces correctas

### Debugging

```typescript
// Obtener estadísticas del sistema
const stats = await auth.getStats();
console.log('Auth stats:', stats);

// Verificar estado actual
console.log('Current state:', {
  user: auth.user,
  sessionStatus: auth.sessionStatus,
  loading: auth.loading,
  error: auth.error,
});
```

## Mejores Prácticas

1. **Usa los hooks auxiliares** para casos de uso específicos
2. **Configura los callbacks de warning y error** para una mejor UX
3. **Maneja los estados de loading** en tu UI
4. **Usa los métodos de utilidad** para verificar permisos
5. **Implementa cleanup** en componentes que usen timers
6. **Considera la persistencia** apropiada para tu caso de uso

## Soporte

Para más información o problemas, consulta:
- La documentación de `AuthService`
- La documentación de `SessionManager`
- La documentación de `TokenManager`
- Los ejemplos en `/components/auth/`