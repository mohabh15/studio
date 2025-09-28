import { Debt } from './types';

export type PaymentStrategy = 'avalanche' | 'snowball' | 'combined';
export type CollectionStrategy = 'aggressive' | 'conservative';

export interface ProjectionResult {
  strategy?: PaymentStrategy;
  collectionStrategy?: CollectionStrategy;
  monthsToPayOff: number;
  totalPaid: number;
  totalInterest: number;
  monthlyPayment: number;
  payoffDate: Date;
  monthlyBreakdown: Array<{
    month: number;
    totalPayment: number;
    principalPayment: number;
    interestPayment: number;
    remainingBalance: number;
  }>;
  expectedCollection?: number; // Para incoming debts
  probability?: number; // Probabilidad de cobro
}

export interface DebtProjectionInput {
  debts: Debt[];
  extraPayment?: number; // Pago extra mensual adicional
  strategy?: PaymentStrategy;
  isIncoming?: boolean; // true para proyecciones de cobro (incoming debts)
  collectionStrategy?: CollectionStrategy;
  probability?: number; // Probabilidad base de cobro (0-1)
}

/**
 * Calcula proyecciones de pago de deudas usando la estrategia "Avalanche"
 * (paga primero las deudas con mayor interés)
 */
function calculateAvalancheProjection(debts: Debt[], extraPayment = 0): ProjectionResult {
  const sortedDebts = [...debts].sort((a, b) => b.tasa_interes - a.tasa_interes);
  return calculateProjection(sortedDebts, extraPayment, 'avalanche');
}

/**
 * Calcula proyecciones de pago de deudas usando la estrategia "Snowball"
 * (paga primero las deudas más pequeñas)
 */
function calculateSnowballProjection(debts: Debt[], extraPayment = 0): ProjectionResult {
  const sortedDebts = [...debts].sort((a, b) => a.monto_actual - b.monto_actual);
  return calculateProjection(sortedDebts, extraPayment, 'snowball');
}

/**
 * Calcula proyecciones usando una estrategia combinada
 * (equilibra entre interés y tamaño de deuda)
 */
function calculateCombinedProjection(debts: Debt[], extraPayment = 0): ProjectionResult {
  // Estrategia combinada: ordena por una puntuación que combina interés y tamaño
  const sortedDebts = [...debts].sort((a, b) => {
    const scoreA = (a.tasa_interes * 0.7) + ((a.monto / Math.max(...debts.map(d => d.monto))) * 0.3);
    const scoreB = (b.tasa_interes * 0.7) + ((b.monto / Math.max(...debts.map(d => d.monto))) * 0.3);
    return scoreB - scoreA;
  });
  return calculateProjection(sortedDebts, extraPayment, 'combined');
}

/**
 * Función principal para calcular proyecciones de pago
 */
function calculateProjection(debts: Debt[], extraPayment: number, strategy: PaymentStrategy): ProjectionResult {
  if (debts.length === 0) {
    return {
      strategy,
      monthsToPayOff: 0,
      totalPaid: 0,
      totalInterest: 0,
      monthlyPayment: 0,
      payoffDate: new Date(),
      monthlyBreakdown: [],
    };
  }

  const monthlyBreakdown: ProjectionResult['monthlyBreakdown'] = [];
  let totalPaid = 0;
  let totalInterest = 0;
  let month = 0;
  let remainingDebts = debts.map(debt => ({ ...debt, remaining: debt.monto_actual }));

  while (remainingDebts.some(debt => debt.remaining > 0) && month < 600) { // Máximo 50 años
    month++;
    let monthlyTotalPayment = extraPayment;
    let monthlyPrincipal = 0;
    let monthlyInterest = 0;

    // Calcular pagos mínimos para todas las deudas activas
    const activeDebts = remainingDebts.filter(debt => debt.remaining > 0);

    for (const debt of activeDebts) {
      const monthlyInterestPayment = (debt.remaining * debt.tasa_interes) / 100 / 12;
      monthlyInterest += monthlyInterestPayment;

      let principalPayment = debt.pagos_minimos - monthlyInterestPayment;

      // Si el pago mínimo es menor que el interés, al menos paga el interés
      if (principalPayment < 0) {
        principalPayment = 0;
      }

      // Aplicar pago a esta deuda
      const actualPrincipalPayment = Math.min(principalPayment, debt.remaining);
      debt.remaining -= actualPrincipalPayment;
      monthlyPrincipal += actualPrincipalPayment;
      monthlyTotalPayment += debt.pagos_minimos;
    }

    // Si hay deudas pagadas completamente, redistribuir sus pagos
    const paidOffDebts = remainingDebts.filter(debt => debt.remaining <= 0);
    for (const paidDebt of paidOffDebts) {
      // Redistribuir el pago mínimo de la deuda pagada a las demás deudas
      const redistributionAmount = paidDebt.pagos_minimos / activeDebts.length;
      for (const activeDebt of activeDebts) {
        if (activeDebt.id !== paidDebt.id && activeDebt.remaining > 0) {
          const interestPayment = (activeDebt.remaining * activeDebt.tasa_interes) / 100 / 12;
          const additionalPrincipal = Math.max(0, redistributionAmount - interestPayment);
          const actualAdditional = Math.min(additionalPrincipal, activeDebt.remaining);
          activeDebt.remaining -= actualAdditional;
          monthlyPrincipal += actualAdditional;
        }
      }
    }

    totalPaid += monthlyTotalPayment;
    totalInterest += monthlyInterest;

    monthlyBreakdown.push({
      month,
      totalPayment: monthlyTotalPayment,
      principalPayment: monthlyPrincipal,
      interestPayment: monthlyInterest,
      remainingBalance: remainingDebts.reduce((sum, debt) => sum + Math.max(0, debt.remaining), 0),
    });

    // Si todas las deudas están pagadas, salir del loop
    if (remainingDebts.every(debt => debt.remaining <= 0)) {
      break;
    }
  }

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + month);

  return {
    strategy,
    monthsToPayOff: month,
    totalPaid,
    totalInterest,
    monthlyPayment: debts.reduce((sum, debt) => sum + debt.pagos_minimos, 0) + extraPayment,
    payoffDate,
    monthlyBreakdown,
  };
}

/**
 * Calcula proyecciones para todas las estrategias disponibles
 */
export function calculateDebtProjections(input: DebtProjectionInput): ProjectionResult[] {
  const { debts, extraPayment = 0, strategy, isIncoming = false, collectionStrategy, probability } = input;

  if (isIncoming) {
    return calculateCollectionProjections({ debts, collectionStrategy, probability });
  }

  if (strategy) {
    switch (strategy) {
      case 'avalanche':
        return [calculateAvalancheProjection(debts, extraPayment)];
      case 'snowball':
        return [calculateSnowballProjection(debts, extraPayment)];
      case 'combined':
        return [calculateCombinedProjection(debts, extraPayment)];
      default:
        return [calculateAvalancheProjection(debts, extraPayment)];
    }
  }

  // Calcular todas las estrategias
  return [
    calculateAvalancheProjection(debts, extraPayment),
    calculateSnowballProjection(debts, extraPayment),
    calculateCombinedProjection(debts, extraPayment),
  ];
}

/**
 * Obtiene el nombre legible de una estrategia
 */
export function getStrategyName(strategy: PaymentStrategy): string {
  switch (strategy) {
    case 'avalanche':
      return 'Avalancha (Mayor Interés Primero)';
    case 'snowball':
      return 'Bola de Nieve (Menor Monto Primero)';
    case 'combined':
      return 'Combinada (Balance Optimizado)';
    default:
      return 'Desconocida';
  }
}

/**
 * Obtiene la descripción de una estrategia
 */
export function getStrategyDescription(strategy: PaymentStrategy): string {
  switch (strategy) {
    case 'avalanche':
      return 'Enfocado en minimizar intereses totales pagados. Recomendado para maximizar ahorro financiero.';
    case 'snowball':
      return 'Enfocado en momentum psicológico. Recomendado para mantener motivación.';
    case 'combined':
      return 'Equilibra intereses y momentum psicológico para un enfoque balanceado.';
    default:
      return '';
  }
}

/**
 * Calcula la probabilidad de cobro basada en el tipo de deuda
 */
function getCollectionProbability(debtType: string): number {
  switch (debtType) {
    case 'credit_card':
      return 0.75; // Más difícil de cobrar
    case 'personal_loan':
      return 0.85;
    case 'mortgage':
      return 0.95; // Más fácil, garantizado
    case 'student_loan':
      return 0.80;
    case 'car_loan':
      return 0.90;
    default:
      return 0.80;
  }
}

/**
 * Calcula proyecciones de cobro usando estrategia agresiva
 * (cobra más rápido, más recursos dedicados)
 */
function calculateAggressiveCollectionProjection(debts: Debt[], probability: number = 0.8): ProjectionResult {
  return calculateCollectionProjection(debts, probability, 'aggressive');
}

/**
 * Calcula proyecciones de cobro usando estrategia conservadora
 * (cobra más lentamente, menos recursos)
 */
function calculateConservativeCollectionProjection(debts: Debt[], probability: number = 0.8): ProjectionResult {
  return calculateCollectionProjection(debts, probability, 'conservative');
}

/**
 * Función principal para calcular proyecciones de cobro
 */
function calculateCollectionProjection(debts: Debt[], probability: number, strategy: CollectionStrategy): ProjectionResult {
  if (debts.length === 0) {
    return {
      collectionStrategy: strategy,
      monthsToPayOff: 0,
      totalPaid: 0,
      totalInterest: 0, // Sin interés para incoming
      monthlyPayment: 0,
      payoffDate: new Date(),
      monthlyBreakdown: [],
      expectedCollection: 0,
      probability,
    };
  }

  const monthlyBreakdown: ProjectionResult['monthlyBreakdown'] = [];
  let totalCollected = 0;
  let month = 0;
  let remainingDebts = debts.map(debt => ({
    ...debt,
    remaining: debt.monto_actual,
    prob: getCollectionProbability(debt.tipo) * probability // Probabilidad ajustada
  }));

  // Estrategia agresiva: cobra 1.5x pagos mínimos, conservador: 0.75x
  const collectionMultiplier = strategy === 'aggressive' ? 1.5 : 0.75;

  while (remainingDebts.some(debt => debt.remaining > 0) && month < 600) {
    month++;
    let monthlyTotalCollection = 0;
    let monthlyPrincipal = 0;
    let monthlyInterest = 0; // Siempre 0 para incoming

    const activeDebts = remainingDebts.filter(debt => debt.remaining > 0);

    for (const debt of activeDebts) {
      // Simular cobro probabilístico
      const collectionAmount = debt.pagos_minimos * collectionMultiplier;
      const actualCollection = collectionAmount * debt.prob; // Monto esperado basado en probabilidad
      const principalCollection = Math.min(actualCollection, debt.remaining);
      debt.remaining -= principalCollection;
      monthlyPrincipal += principalCollection;
      monthlyTotalCollection += principalCollection;
    }

    totalCollected += monthlyTotalCollection;

    monthlyBreakdown.push({
      month,
      totalPayment: monthlyTotalCollection,
      principalPayment: monthlyPrincipal,
      interestPayment: monthlyInterest,
      remainingBalance: remainingDebts.reduce((sum, debt) => sum + Math.max(0, debt.remaining), 0),
    });

    if (remainingDebts.every(debt => debt.remaining <= 0)) {
      break;
    }
  }

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + month);

  const totalExpected = debts.reduce((sum, debt) => sum + debt.monto_actual * getCollectionProbability(debt.tipo) * probability, 0);

  return {
    collectionStrategy: strategy,
    monthsToPayOff: month,
    totalPaid: totalCollected, // Para incoming, totalCollected
    totalInterest: 0,
    monthlyPayment: debts.reduce((sum, debt) => sum + debt.pagos_minimos * collectionMultiplier, 0),
    payoffDate,
    monthlyBreakdown,
    expectedCollection: totalExpected,
    probability,
  };
}

/**
 * Calcula proyecciones de cobro para todas las estrategias disponibles
 */
export function calculateCollectionProjections(input: DebtProjectionInput): ProjectionResult[] {
  const { debts, collectionStrategy, probability = 0.8 } = input;

  if (collectionStrategy) {
    switch (collectionStrategy) {
      case 'aggressive':
        return [calculateAggressiveCollectionProjection(debts, probability)];
      case 'conservative':
        return [calculateConservativeCollectionProjection(debts, probability)];
      default:
        return [calculateAggressiveCollectionProjection(debts, probability)];
    }
  }

  // Calcular ambas estrategias
  return [
    calculateAggressiveCollectionProjection(debts, probability),
    calculateConservativeCollectionProjection(debts, probability),
  ];
}

/**
 * Obtiene el nombre legible de una estrategia de cobro
 */
export function getCollectionStrategyName(strategy: CollectionStrategy): string {
  switch (strategy) {
    case 'aggressive':
      return 'Agresiva (Cobro Rápido)';
    case 'conservative':
      return 'Conservadora (Cobro Lento)';
    default:
      return 'Desconocida';
  }
}

/**
 * Obtiene la descripción de una estrategia de cobro
 */
export function getCollectionStrategyDescription(strategy: CollectionStrategy): string {
  switch (strategy) {
    case 'aggressive':
      return 'Enfocado en cobrar lo más rápido posible dedicando más recursos. Mayor probabilidad de recuperación pero más costoso.';
    case 'conservative':
      return 'Enfocado en cobrar de manera sostenible con menos recursos. Menor costo pero más tiempo.';
    default:
      return '';
  }
}