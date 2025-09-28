/**
 * Script de Pruebas de Integración del Sistema de Persistencia de Sesión
 *
 * Este script realiza pruebas exhaustivas del sistema de autenticación completo,
 * incluyendo AuthService, TokenManager, SessionManager y su integración con Firebase.
 *
 * Funcionalidades de prueba:
 * - Pruebas unitarias de componentes individuales
 * - Pruebas de integración entre componentes
 * - Pruebas de flujo completo (login → persistencia → logout)
 * - Pruebas de manejo de errores y edge cases
 * - Pruebas de seguridad y validación
 * - Logging detallado para debugging
 * - Cleanup automático después de pruebas
 * - Métricas de rendimiento y estadísticas
 *
 * Uso:
 * npm run test:auth-integration
 * npx ts-node src/scripts/test-auth-integration.ts
 */

import type {
  AuthConfig,
  AuthState,
  AuthError,
  AuthErrorCode,
  SessionData,
  TokenData,
  LoginFormData,
  SignupFormData,
  AuthOperationResult,
  AuthMethod,
  PersistenceType,
  SessionStatus,
} from '../lib/types/auth';

import { authService } from '../lib/services/AuthService';
import { tokenManager } from '../lib/services/TokenManager';
import { sessionManager } from '../lib/services/SessionManager';

// ============================================================================
// CONFIGURACIÓN DEL SISTEMA DE PRUEBAS
// ============================================================================

interface TestConfig {
  /** Configuración de logging */
  logging: {
    /** Nivel de detalle del logging */
    level: 'debug' | 'info' | 'warn' | 'error';
    /** Indica si mostrar timestamps */
    showTimestamps: boolean;
    /** Indica si mostrar métricas de rendimiento */
    showPerformanceMetrics: boolean;
  };
  /** Configuración de timeouts */
  timeouts: {
    /** Timeout para operaciones individuales */
    operationTimeoutMs: number;
    /** Timeout para pruebas completas */
    testSuiteTimeoutMs: number;
    /** Delay entre pruebas */
    interTestDelayMs: number;
  };
  /** Configuración de reintentos */
  retries: {
    /** Número máximo de reintentos */
    maxRetries: number;
    /** Delay base para backoff */
    baseDelayMs: number;
  };
  /** Configuración de cleanup */
  cleanup: {
    /** Indica si limpiar automáticamente después de pruebas */
    autoCleanup: boolean;
    /** Indica si preservar datos de prueba */
    preserveTestData: boolean;
  };
}

interface TestResult {
  /** ID único de la prueba */
  testId: string;
  /** Nombre de la prueba */
  name: string;
  /** Categoría de la prueba */
  category: string;
  /** Indica si la prueba pasó */
  passed: boolean;
  /** Duración de la prueba en ms */
  duration: number;
  /** Mensaje de error si falló */
  error?: string;
  /** Datos adicionales de la prueba */
  data?: any;
  /** Timestamp de ejecución */
  timestamp: number;
}

interface TestSuite {
  /** Nombre de la suite de pruebas */
  name: string;
  /** Descripción de la suite */
  description: string;
  /** Categoría de pruebas */
  category: 'unit' | 'integration' | 'e2e' | 'security' | 'performance';
  /** Configuración específica de la suite */
  config?: Partial<TestConfig>;
  /** Lista de pruebas a ejecutar */
  tests: TestCase[];
  /** Setup previo a la suite */
  setup?: () => Promise<void>;
  /** Cleanup posterior a la suite */
  cleanup?: () => Promise<void>;
}

interface TestCase {
  /** ID único del caso de prueba */
  id: string;
  /** Nombre del caso de prueba */
  name: string;
  /** Descripción del caso de prueba */
  description: string;
  /** Función que ejecuta la prueba */
  testFn: () => Promise<TestResult>;
  /** Timeout específico para esta prueba */
  timeout?: number;
  /** Número de reintentos para esta prueba */
  retries?: number;
  /** Tags para categorización */
  tags?: string[];
}

// ============================================================================
// IMPLEMENTACIÓN DEL LOGGER DE PRUEBAS
// ============================================================================

class TestLogger {
  private config: TestConfig['logging'];
  private startTime: number;

  constructor(config: TestConfig['logging']) {
    this.config = config;
    this.startTime = Date.now();
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.config.showTimestamps
      ? `[${new Date().toISOString()}] `
      : '';

    const elapsed = this.config.showPerformanceMetrics
      ? `[+${Date.now() - this.startTime}ms] `
      : '';

    const prefix = `${timestamp}${elapsed}[${level.toUpperCase()}]`;

    if (data) {
      return `${prefix} ${message}`;
    }
    return `${prefix} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (this.config.level === 'debug') {
      console.debug(this.formatMessage('debug', message, data), data || '');
    }
  }

  info(message: string, data?: any): void {
    if (['debug', 'info'].includes(this.config.level)) {
      console.info(this.formatMessage('info', message, data), data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (['debug', 'info', 'warn'].includes(this.config.level)) {
      console.warn(this.formatMessage('warn', message, data), data || '');
    }
  }

  error(message: string, data?: any): void {
    console.error(this.formatMessage('error', message, data), data || '');
  }

  success(message: string, data?: any): void {
    console.log(`✅ ${this.formatMessage('success', message, data)}`, data || '');
  }

  failure(message: string, data?: any): void {
    console.error(`❌ ${this.formatMessage('failure', message, data)}`, data || '');
  }
}

// ============================================================================
// GESTIÓN DE RESULTADOS Y MÉTRICAS
// ============================================================================

class TestMetrics {
  private results: TestResult[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  addResult(result: TestResult): void {
    this.results.push(result);
  }

  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    duration: number;
    passRate: number;
    byCategory: Record<string, { total: number; passed: number; failed: number }>;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const duration = Date.now() - this.startTime;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    const byCategory: Record<string, any> = {};
    this.results.forEach(result => {
      if (!byCategory[result.category]) {
        byCategory[result.category] = { total: 0, passed: 0, failed: 0 };
      }
      byCategory[result.category].total++;
      if (result.passed) {
        byCategory[result.category].passed++;
      } else {
        byCategory[result.category].failed++;
      }
    });

    return { total, passed, failed, duration, passRate, byCategory };
  }

  getFailedTests(): TestResult[] {
    return this.results.filter(r => !r.passed);
  }

  getSlowTests(thresholdMs: number = 5000): TestResult[] {
    return this.results.filter(r => r.duration > thresholdMs);
  }
}

// ============================================================================
// FRAMEWORK DE EJECUCIÓN DE PRUEBAS
// ============================================================================

class TestRunner {
  private logger: TestLogger;
  private metrics: TestMetrics;
  private config: TestConfig;

  constructor(config: TestConfig) {
    this.config = config;
    this.logger = new TestLogger(config.logging);
    this.metrics = new TestMetrics();
  }

  /**
   * Ejecuta una suite de pruebas
   */
  async runSuite(suite: TestSuite): Promise<void> {
    const suiteConfig = { ...this.config, ...suite.config };
    const suiteLogger = new TestLogger(suiteConfig.logging);

    suiteLogger.info(`🚀 Iniciando suite: ${suite.name}`);
    suiteLogger.info(`📝 Descripción: ${suite.description}`);

    // Setup
    if (suite.setup) {
      try {
        suiteLogger.debug('Ejecutando setup de suite...');
        await suite.setup();
        suiteLogger.success('Setup de suite completado');
      } catch (error) {
        suiteLogger.error('Error en setup de suite', error);
        throw error;
      }
    }

    // Ejecutar pruebas
    for (const testCase of suite.tests) {
      await this.runTest(testCase, suiteLogger);
      if (suiteConfig.timeouts.interTestDelayMs > 0) {
        await this.delay(suiteConfig.timeouts.interTestDelayMs);
      }
    }

    // Cleanup
    if (suite.cleanup) {
      try {
        suiteLogger.debug('Ejecutando cleanup de suite...');
        await suite.cleanup();
        suiteLogger.success('Cleanup de suite completado');
      } catch (error) {
        suiteLogger.error('Error en cleanup de suite', error);
      }
    }

    suiteLogger.info(`✅ Suite completada: ${suite.name}`);
  }

  /**
   * Ejecuta un caso de prueba individual
   */
  private async runTest(testCase: TestCase, logger: TestLogger): Promise<void> {
    const startTime = Date.now();
    let attempts = 0;
    const maxRetries = testCase.retries || this.config.retries.maxRetries;

    logger.debug(`🔍 Ejecutando prueba: ${testCase.name}`);

    while (attempts <= maxRetries) {
      try {
        const result = await Promise.race([
          testCase.testFn(),
          this.createTimeoutPromise(testCase.timeout || this.config.timeouts.operationTimeoutMs)
        ]);

        result.duration = Date.now() - startTime;
        this.metrics.addResult(result);

        if (result.passed) {
          logger.success(`Prueba exitosa: ${testCase.name} (${result.duration}ms)`);
        } else {
          logger.failure(`Prueba fallida: ${testCase.name} - ${result.error}`);
        }

        return;

      } catch (error) {
        attempts++;

        if (attempts <= maxRetries) {
          const delay = this.config.retries.baseDelayMs * Math.pow(2, attempts - 1);
          logger.warn(`Reintento ${attempts}/${maxRetries} para: ${testCase.name}`, { delay });
          await this.delay(delay);
        } else {
          const duration = Date.now() - startTime;
          const result: TestResult = {
            testId: testCase.id,
            name: testCase.name,
            category: 'unknown',
            passed: false,
            duration,
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          };
          this.metrics.addResult(result);
          logger.error(`Prueba fallida después de ${maxRetries} reintentos: ${testCase.name}`, error);
        }
      }
    }
  }

  /**
   * Crea una promesa de timeout
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout después de ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Utilidad para delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene métricas de ejecución
   */
  getMetrics(): TestMetrics {
    return this.metrics;
  }
}

// ============================================================================
// HERRAMIENTAS DE TESTING Y MOCKS
// ============================================================================

class TestUtils {
  /**
   * Genera datos de prueba para login
   */
  static generateLoginData(overrides: Partial<LoginFormData> = {}): LoginFormData {
    return {
      email: 'test@example.com',
      password: 'testPassword123',
      rememberMe: true,
      ...overrides,
    };
  }

  /**
   * Genera datos de prueba para registro
   */
  static generateSignupData(overrides: Partial<SignupFormData> = {}): SignupFormData {
    return {
      email: `test${Date.now()}@example.com`,
      password: 'testPassword123',
      confirmPassword: 'testPassword123',
      displayName: 'Test User',
      acceptTerms: true,
      ...overrides,
    };
  }

  /**
   * Genera un ID único para pruebas
   */
  static generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simula un delay de red
   */
  static async simulateNetworkDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Simula diferentes condiciones de error
   */
  static simulateError(type: 'network' | 'timeout' | 'server' | 'auth'): Error {
    switch (type) {
      case 'network':
        return new Error('Network request failed');
      case 'timeout':
        return new Error('Request timeout');
      case 'server':
        return new Error('Internal server error');
      case 'auth':
        return new Error('Authentication failed');
      default:
        return new Error('Unknown error');
    }
  }

  /**
   * Valida la estructura de un objeto SessionData
   */
  static validateSessionData(data: any): boolean {
    try {
      return !!(
        data &&
        typeof data.uid === 'string' &&
        data.uid.length > 0 &&
        typeof data.sessionStartTime === 'number' &&
        typeof data.lastActivityTime === 'number' &&
        typeof data.isActive === 'boolean'
      );
    } catch {
      return false;
    }
  }

  /**
   * Valida la estructura de un objeto TokenData
   */
  static validateTokenData(data: any): boolean {
    try {
      return !!(
        data &&
        typeof data.accessToken === 'string' &&
        data.accessToken.length > 0 &&
        typeof data.expirationTime === 'number' &&
        data.expirationTime > Date.now()
      );
    } catch {
      return false;
    }
  }
}

// ============================================================================
// CASOS DE PRUEBA INDIVIDUALES
// ============================================================================

class AuthTestCases {

  /**
   * Pruebas unitarias para AuthService
   */
  static getAuthServiceTests(): TestCase[] {
    return [
      {
        id: 'auth-service-initialization',
        name: 'Inicialización del AuthService',
        description: 'Verifica que el AuthService se inicialice correctamente',
        testFn: async (): Promise<TestResult> => {
          try {
            const state = authService.getCurrentState();
            const isInitialized = state !== null;

            return {
              testId: 'auth-service-initialization',
              name: 'Inicialización del AuthService',
              category: 'unit',
              passed: isInitialized,
              duration: 0,
              timestamp: Date.now(),
              data: { state: !!state }
            };
          } catch (error) {
            return {
              testId: 'auth-service-initialization',
              name: 'Inicialización del AuthService',
              category: 'unit',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      },
      {
        id: 'auth-service-state-management',
        name: 'Gestión de Estado del AuthService',
        description: 'Verifica el manejo correcto del estado de autenticación',
        testFn: async (): Promise<TestResult> => {
          try {
            const initialState = authService.getCurrentState();

            // El estado debería tener las propiedades básicas
            const validStatuses = ['loading', 'authenticated', 'unauthenticated', 'expired'];
            const hasRequiredProperties = !!(
              initialState &&
              typeof initialState.loading === 'boolean' &&
              typeof initialState.isLoading === 'boolean' &&
              typeof initialState.sessionStatus === 'string' &&
              validStatuses.includes(initialState.sessionStatus)
            );

            return {
              testId: 'auth-service-state-management',
              name: 'Gestión de Estado del AuthService',
              category: 'unit',
              passed: hasRequiredProperties,
              duration: 0,
              timestamp: Date.now(),
              data: { state: initialState }
            };
          } catch (error) {
            return {
              testId: 'auth-service-state-management',
              name: 'Gestión de Estado del AuthService',
              category: 'unit',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      }
    ];
  }

  /**
   * Pruebas unitarias para TokenManager
   */
  static getTokenManagerTests(): TestCase[] {
    return [
      {
        id: 'token-manager-initialization',
        name: 'Inicialización del TokenManager',
        description: 'Verifica que el TokenManager se inicialice correctamente',
        testFn: async (): Promise<TestResult> => {
          try {
            const stats = await tokenManager.getStats();
            const isInitialized = stats !== null;

            return {
              testId: 'token-manager-initialization',
              name: 'Inicialización del TokenManager',
              category: 'unit',
              passed: isInitialized,
              duration: 0,
              timestamp: Date.now(),
              data: { stats }
            };
          } catch (error) {
            return {
              testId: 'token-manager-initialization',
              name: 'Inicialización del TokenManager',
              category: 'unit',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      },
      {
        id: 'token-manager-token-operations',
        name: 'Operaciones de Tokens',
        description: 'Verifica operaciones básicas de manejo de tokens',
        testFn: async (): Promise<TestResult> => {
          try {
            // Probar limpieza de tokens
            await tokenManager.clearTokens();
            const tokensAfterClear = await tokenManager.getTokens();

            // Probar obtención de estadísticas
            const stats = await tokenManager.getStats();

            const success = tokensAfterClear === null && stats !== null;

            return {
              testId: 'token-manager-token-operations',
              name: 'Operaciones de Tokens',
              category: 'unit',
              passed: success,
              duration: 0,
              timestamp: Date.now(),
              data: { tokensAfterClear, stats }
            };
          } catch (error) {
            return {
              testId: 'token-manager-token-operations',
              name: 'Operaciones de Tokens',
              category: 'unit',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      }
    ];
  }

  /**
   * Pruebas unitarias para SessionManager
   */
  static getSessionManagerTests(): TestCase[] {
    return [
      {
        id: 'session-manager-initialization',
        name: 'Inicialización del SessionManager',
        description: 'Verifica que el SessionManager se inicialice correctamente',
        testFn: async (): Promise<TestResult> => {
          try {
            const stats = await sessionManager.getSessionStats();
            const isInitialized = stats !== null;

            return {
              testId: 'session-manager-initialization',
              name: 'Inicialización del SessionManager',
              category: 'unit',
              passed: isInitialized,
              duration: 0,
              timestamp: Date.now(),
              data: { stats }
            };
          } catch (error) {
            return {
              testId: 'session-manager-initialization',
              name: 'Inicialización del SessionManager',
              category: 'unit',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      },
      {
        id: 'session-manager-session-operations',
        name: 'Operaciones de Sesión',
        description: 'Verifica operaciones básicas de manejo de sesiones',
        testFn: async (): Promise<TestResult> => {
          try {
            // Probar verificación de sesión
            const hasValidSession = await sessionManager.hasValidSession();
            const sessionStatus = await sessionManager.getSessionStatus();

            // Probar cleanup de sesiones expiradas
            await sessionManager.cleanupExpiredSessions();

            const success = typeof hasValidSession === 'boolean' &&
                           typeof sessionStatus === 'string';

            return {
              testId: 'session-manager-session-operations',
              name: 'Operaciones de Sesión',
              category: 'unit',
              passed: success,
              duration: 0,
              timestamp: Date.now(),
              data: { hasValidSession, sessionStatus }
            };
          } catch (error) {
            return {
              testId: 'session-manager-session-operations',
              name: 'Operaciones de Sesión',
              category: 'unit',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      }
    ];
  }

  /**
   * Pruebas de integración entre componentes
   */
  static getIntegrationTests(): TestCase[] {
    return [
      {
        id: 'integration-service-communication',
        name: 'Comunicación entre Servicios',
        description: 'Verifica la comunicación correcta entre AuthService, TokenManager y SessionManager',
        testFn: async (): Promise<TestResult> => {
          try {
            // Verificar que todos los servicios están inicializados
            const authState = authService.getCurrentState();
            const tokenStats = await tokenManager.getStats();
            const sessionStats = await sessionManager.getSessionStats();

            // Verificar que pueden obtener estado mutuamente
            const hasValidSession = await authService.hasValidSession();
            const currentUser = await authService.getCurrentUser();

            const success = authState !== null &&
                           tokenStats !== null &&
                           sessionStats !== null &&
                           typeof hasValidSession === 'boolean';

            return {
              testId: 'integration-service-communication',
              name: 'Comunicación entre Servicios',
              category: 'integration',
              passed: success,
              duration: 0,
              timestamp: Date.now(),
              data: {
                authState: !!authState,
                tokenStats: !!tokenStats,
                sessionStats: !!sessionStats,
                hasValidSession,
                currentUser
              }
            };
          } catch (error) {
            return {
              testId: 'integration-service-communication',
              name: 'Comunicación entre Servicios',
              category: 'integration',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      },
      {
        id: 'integration-state-synchronization',
        name: 'Sincronización de Estado',
        description: 'Verifica que los cambios de estado se propaguen correctamente entre componentes',
        testFn: async (): Promise<TestResult> => {
          try {
            // Obtener estado inicial
            const initialState = authService.getCurrentState();

            // Limpiar tokens y sesiones
            await tokenManager.clearTokens();
            await sessionManager.destroyAllSessions();

            // Verificar que el estado se actualiza
            const afterCleanupState = authService.getCurrentState();

            const success = initialState !== null &&
                           afterCleanupState !== null &&
                           afterCleanupState.sessionStatus === 'unauthenticated';

            return {
              testId: 'integration-state-synchronization',
              name: 'Sincronización de Estado',
              category: 'integration',
              passed: success,
              duration: 0,
              timestamp: Date.now(),
              data: {
                initialState: initialState?.sessionStatus,
                afterCleanupState: afterCleanupState?.sessionStatus
              }
            };
          } catch (error) {
            return {
              testId: 'integration-state-synchronization',
              name: 'Sincronización de Estado',
              category: 'integration',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      }
    ];
  }

  /**
   * Pruebas de flujo completo end-to-end
   */
  static getEndToEndTests(): TestCase[] {
    return [
      {
        id: 'e2e-complete-auth-flow',
        name: 'Flujo Completo de Autenticación',
        description: 'Prueba el flujo completo: inicialización → login → persistencia → logout',
        testFn: async (): Promise<TestResult> => {
          const startTime = Date.now();
          try {
            // 1. Verificar estado inicial
            const initialState = authService.getCurrentState();
            if (initialState?.sessionStatus !== 'unauthenticated') {
              throw new Error('Estado inicial no es unauthenticated');
            }

            // 2. Limpiar cualquier estado previo
            await tokenManager.clearTokens();
            await sessionManager.destroyAllSessions();

            // 3. Verificar que no hay sesión válida
            const hasValidSession = await authService.hasValidSession();
            if (hasValidSession) {
              throw new Error('Debería no haber sesión válida después del cleanup');
            }

            // 4. Simular flujo de login (sin Firebase real)
            const mockSessionData: SessionData = {
              uid: TestUtils.generateTestId(),
              email: 'test@example.com',
              displayName: 'Test User',
              photoURL: null,
              emailVerified: false,
              authMethod: 'email',
              sessionStartTime: Date.now(),
              lastActivityTime: Date.now(),
              isActive: true,
            };

            // 5. Crear sesión manualmente para testing
            await sessionManager.createSession(mockSessionData);

            // 6. Verificar que la sesión se creó correctamente
            const currentSession = await sessionManager.getCurrentSession();
            if (!currentSession || !TestUtils.validateSessionData(currentSession)) {
              throw new Error('Sesión no se creó correctamente');
            }

            // 7. Verificar que hay sesión válida
            const hasValidSessionAfter = await authService.hasValidSession();
            if (!hasValidSessionAfter) {
              throw new Error('No se detecta sesión válida después de crearla');
            }

            // 8. Simular actividad
            await sessionManager.updateActivity();

            // 9. Destruir sesión
            await sessionManager.destroyCurrentSession();

            // 10. Verificar cleanup
            const hasValidSessionAfterDestroy = await authService.hasValidSession();
            if (hasValidSessionAfterDestroy) {
              throw new Error('Sesión no se destruyó correctamente');
            }

            return {
              testId: 'e2e-complete-auth-flow',
              name: 'Flujo Completo de Autenticación',
              category: 'e2e',
              passed: true,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
              data: {
                initialState: initialState?.sessionStatus,
                sessionCreated: !!currentSession,
                sessionDestroyed: !hasValidSessionAfterDestroy
              }
            };
          } catch (error) {
            return {
              testId: 'e2e-complete-auth-flow',
              name: 'Flujo Completo de Autenticación',
              category: 'e2e',
              passed: false,
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      }
    ];
  }

  /**
   * Pruebas de manejo de errores
   */
  static getErrorHandlingTests(): TestCase[] {
    return [
      {
        id: 'error-handling-invalid-operations',
        name: 'Manejo de Operaciones Inválidas',
        description: 'Verifica el manejo correcto de operaciones inválidas',
        testFn: async (): Promise<TestResult> => {
          try {
            // Intentar obtener usuario cuando no hay sesión
            const currentUser = await authService.getCurrentUser();
            const hasValidSession = await authService.hasValidSession();

            // Estas operaciones deberían manejar correctamente el estado sin sesión
            const success = currentUser === null && hasValidSession === false;

            return {
              testId: 'error-handling-invalid-operations',
              name: 'Manejo de Operaciones Inválidas',
              category: 'unit',
              passed: success,
              duration: 0,
              timestamp: Date.now(),
              data: { currentUser, hasValidSession }
            };
          } catch (error) {
            return {
              testId: 'error-handling-invalid-operations',
              name: 'Manejo de Operaciones Inválidas',
              category: 'unit',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      },
      {
        id: 'error-handling-token-operations',
        name: 'Manejo de Errores de Token',
        description: 'Verifica el manejo de errores en operaciones de tokens',
        testFn: async (): Promise<TestResult> => {
          try {
            // Limpiar tokens
            await tokenManager.clearTokens();

            // Intentar obtener tokens que no existen
            const tokens = await tokenManager.getTokens();

            // Verificar que devuelve null correctamente
            const success = tokens === null;

            return {
              testId: 'error-handling-token-operations',
              name: 'Manejo de Errores de Token',
              category: 'unit',
              passed: success,
              duration: 0,
              timestamp: Date.now(),
              data: { tokens }
            };
          } catch (error) {
            return {
              testId: 'error-handling-token-operations',
              name: 'Manejo de Errores de Token',
              category: 'unit',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      }
    ];
  }

  /**
   * Pruebas de seguridad
   */
  static getSecurityTests(): TestCase[] {
    return [
      {
        id: 'security-session-isolation',
        name: 'Aislamiento de Sesión',
        description: 'Verifica que las sesiones estén correctamente aisladas',
        testFn: async (): Promise<TestResult> => {
          try {
            // Crear múltiples sesiones con diferentes UIDs
            const session1Data: SessionData = {
              uid: 'user1_' + TestUtils.generateTestId(),
              email: 'user1@example.com',
              displayName: 'User 1',
              photoURL: null,
              emailVerified: false,
              authMethod: 'email',
              sessionStartTime: Date.now(),
              lastActivityTime: Date.now(),
              isActive: true,
            };

            const session2Data: SessionData = {
              uid: 'user2_' + TestUtils.generateTestId(),
              email: 'user2@example.com',
              displayName: 'User 2',
              photoURL: null,
              emailVerified: false,
              authMethod: 'email',
              sessionStartTime: Date.now(),
              lastActivityTime: Date.now(),
              isActive: true,
            };

            // Crear sesiones
            await sessionManager.createSession(session1Data);
            await sessionManager.createSession(session2Data);

            // Verificar que solo hay una sesión actual
            const currentSession = await sessionManager.getCurrentSession();
            const success = currentSession !== null &&
                           (currentSession.uid === session1Data.uid || currentSession.uid === session2Data.uid);

            // Cleanup
            await sessionManager.destroyAllSessions();

            return {
              testId: 'security-session-isolation',
              name: 'Aislamiento de Sesión',
              category: 'security',
              passed: success,
              duration: 0,
              timestamp: Date.now(),
              data: { currentSession: currentSession?.uid }
            };
          } catch (error) {
            return {
              testId: 'security-session-isolation',
              name: 'Aislamiento de Sesión',
              category: 'security',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      },
      {
        id: 'security-data-sanitization',
        name: 'Sanitización de Datos',
        description: 'Verifica que los datos sensibles se manejen correctamente',
        testFn: async (): Promise<TestResult> => {
          try {
            // Verificar que los tokens se limpian correctamente
            await tokenManager.clearTokens();
            const tokensAfterClear = await tokenManager.getTokens();

            // Verificar que las sesiones se destruyen correctamente
            await sessionManager.destroyAllSessions();
            const sessionAfterDestroy = await sessionManager.getCurrentSession();

            const success = tokensAfterClear === null && sessionAfterDestroy === null;

            return {
              testId: 'security-data-sanitization',
              name: 'Sanitización de Datos',
              category: 'security',
              passed: success,
              duration: 0,
              timestamp: Date.now(),
              data: { tokensAfterClear, sessionAfterDestroy }
            };
          } catch (error) {
            return {
              testId: 'security-data-sanitization',
              name: 'Sanitización de Datos',
              category: 'security',
              passed: false,
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      }
    ];
  }

  /**
   * Pruebas de performance
   */
  static getPerformanceTests(): TestCase[] {
    return [
      {
        id: 'performance-service-initialization',
        name: 'Performance de Inicialización',
        description: 'Mide el tiempo de inicialización de los servicios',
        testFn: async (): Promise<TestResult> => {
          const startTime = Date.now();

          try {
            // Medir tiempo de operaciones básicas
            const authState = authService.getCurrentState();
            const tokenStats = await tokenManager.getStats();
            const sessionStats = await sessionManager.getSessionStats();

            const duration = Date.now() - startTime;
            const success = duration < 1000; // Debería ser menos de 1 segundo

            return {
              testId: 'performance-service-initialization',
              name: 'Performance de Inicialización',
              category: 'performance',
              passed: success,
              duration,
              timestamp: Date.now(),
              data: { duration, authState: !!authState, tokenStats: !!tokenStats, sessionStats: !!sessionStats }
            };
          } catch (error) {
            return {
              testId: 'performance-service-initialization',
              name: 'Performance de Inicialización',
              category: 'performance',
              passed: false,
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
            };
          }
        }
      }
    ];
  }
}

// ============================================================================
// SETUP Y CLEANUP GLOBAL
// ============================================================================

class TestSetup {
  /**
   * Setup global antes de todas las pruebas
   */
  static async globalSetup(): Promise<void> {
    // Limpiar cualquier estado previo
    await tokenManager.clearTokens();
    await sessionManager.destroyAllSessions();
  }

  /**
   * Cleanup global después de todas las pruebas
   */
  static async globalCleanup(): Promise<void> {
    try {
      // Limpiar todos los datos de prueba
      await tokenManager.clearTokens();
      await sessionManager.destroyAllSessions();

      // Destruir servicios si es necesario
      // await authService.destroy(); // Descomentar si existe el método
    } catch (error) {
      console.error('❌ Error en cleanup global:', error);
    }
  }
}

// ============================================================================
// CONFIGURACIÓN Y EJECUCIÓN PRINCIPAL
// ============================================================================

/**
 * Configuración por defecto para las pruebas
 */
const defaultTestConfig: TestConfig = {
  logging: {
    level: 'info',
    showTimestamps: true,
    showPerformanceMetrics: true,
  },
  timeouts: {
    operationTimeoutMs: 5000,
    testSuiteTimeoutMs: 30000,
    interTestDelayMs: 100,
  },
  retries: {
    maxRetries: 3,
    baseDelayMs: 1000,
  },
  cleanup: {
    autoCleanup: true,
    preserveTestData: false,
  },
};

/**
 * Función principal de ejecución
 */
async function runAuthIntegrationTests(): Promise<void> {
  const runner = new TestRunner(defaultTestConfig);

  try {
    // Setup global
    await TestSetup.globalSetup();

    // Definir suites de pruebas
    const testSuites: TestSuite[] = [
      {
        name: 'Pruebas Unitarias - AuthService',
        description: 'Pruebas del componente AuthService individualmente',
        category: 'unit',
        tests: AuthTestCases.getAuthServiceTests(),
      },
      {
        name: 'Pruebas Unitarias - TokenManager',
        description: 'Pruebas del componente TokenManager individualmente',
        category: 'unit',
        tests: AuthTestCases.getTokenManagerTests(),
      },
      {
        name: 'Pruebas Unitarias - SessionManager',
        description: 'Pruebas del componente SessionManager individualmente',
        category: 'unit',
        tests: AuthTestCases.getSessionManagerTests(),
      },
      {
        name: 'Pruebas de Integración',
        description: 'Pruebas de integración entre componentes',
        category: 'integration',
        tests: AuthTestCases.getIntegrationTests(),
      },
      {
        name: 'Pruebas End-to-End',
        description: 'Pruebas de flujo completo de autenticación',
        category: 'e2e',
        tests: AuthTestCases.getEndToEndTests(),
      },
      {
        name: 'Pruebas de Manejo de Errores',
        description: 'Pruebas de manejo de errores y casos edge',
        category: 'unit',
        tests: AuthTestCases.getErrorHandlingTests(),
      },
      {
        name: 'Pruebas de Seguridad',
        description: 'Pruebas de seguridad y validación',
        category: 'security',
        tests: AuthTestCases.getSecurityTests(),
      },
      {
        name: 'Pruebas de Performance',
        description: 'Pruebas de rendimiento y optimización',
        category: 'performance',
        tests: AuthTestCases.getPerformanceTests(),
      },
    ];

    // Ejecutar todas las suites
    for (const suite of testSuites) {
      await runner.runSuite(suite);
    }

    // Obtener métricas finales
    const metrics = runner.getMetrics();
    const summary = metrics.getSummary();

    // Cleanup global
    await TestSetup.globalCleanup();

  } catch (error) {
    console.error('❌ Error ejecutando pruebas:', error);
    await TestSetup.globalCleanup();
    process.exit(1);
  }
}

// ============================================================================
// EJECUCIÓN Y EXPORTACIONES
// ============================================================================

// Ejecutar pruebas si el script se ejecuta directamente
if (require.main === module) {
  runAuthIntegrationTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal en pruebas:', error);
      process.exit(1);
    });
}

// Exportar funciones para uso programático
export {
  runAuthIntegrationTests,
  TestRunner,
  TestLogger,
  TestUtils,
  AuthTestCases,
  defaultTestConfig,
};

export type {
  TestConfig,
  TestResult,
  TestSuite,
  TestCase,
};