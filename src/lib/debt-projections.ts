import { Debt } from './types';

export type PaymentStrategy = 'avalanche' | 'snowball' | 'combined';

export interface ProjectionResult {
  strategy: PaymentStrategy;
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
}

export interface DebtProjectionInput {
  debts: Debt[];
  extraPayment?: number; // Pago extra mensual adicional
  strategy?: PaymentStrategy;
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
  const { debts, extraPayment = 0, strategy } = input;

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