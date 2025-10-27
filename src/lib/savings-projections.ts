// Tipos de datos para estrategias de ahorro
export type SavingsStrategy = 'conservative' | 'moderate' | 'aggressive';

// Estrategias de ahorro con tasas de retorno anuales
export const SAVINGS_STRATEGIES = {
  conservative: { rate: 0.04, label: 'Conservadora' },
  moderate: { rate: 0.06, label: 'Moderada' },
  aggressive: { rate: 0.08, label: 'Agresiva' },
} as const;

// Interfaz para parámetros de cálculo
export interface SavingsProjectionParams {
  initialAmount: number;
  monthlyContribution: number;
  years: number;
  strategy: SavingsStrategy;
  targetAmount?: number;
}

// Interfaz para resultados de proyección
export interface SavingsProjectionResult {
  strategy: SavingsStrategy;
  futureValue: number;
  totalContributions: number;
  totalReturns: number;
  yearsToTarget?: number;
  monthlyData: Array<{
    year: number;
    balance: number;
    contributions: number;
    returns: number;
  }>;
}

// Función principal para calcular proyecciones de ahorros
export function calculateSavingsProjections(params: SavingsProjectionParams): SavingsProjectionResult {
  const { initialAmount, monthlyContribution, years, strategy, targetAmount } = params;

  // Validaciones
  if (initialAmount < 0 || monthlyContribution < 0 || years <= 0 || years > 50) {
    throw new Error('Parámetros inválidos: valores deben ser positivos y años máximo 50');
  }

  const annualRate = SAVINGS_STRATEGIES[strategy].rate;
  const monthlyRate = annualRate / 12;
  const totalMonths = years * 12;

  let balance = initialAmount;
  let totalContributions = initialAmount;
  const monthlyData: SavingsProjectionResult['monthlyData'] = [];

  let yearsToTarget: number | undefined;

  for (let month = 1; month <= totalMonths; month++) {
    // Interés compuesto mensual
    balance += balance * monthlyRate;
    // Aportación mensual
    balance += monthlyContribution;
    totalContributions += monthlyContribution;

    // Registrar datos anuales
    if (month % 12 === 0) {
      const year = month / 12;
      const contributionsThisYear = initialAmount + (monthlyContribution * 12 * year);
      const returnsThisYear = balance - contributionsThisYear;

      monthlyData.push({
        year,
        balance,
        contributions: contributionsThisYear,
        returns: returnsThisYear,
      });

      // Verificar si se alcanza el objetivo
      if (targetAmount && balance >= targetAmount && !yearsToTarget) {
        yearsToTarget = year;
      }
    }
  }

  const totalReturns = balance - totalContributions;

  return {
    strategy,
    futureValue: balance,
    totalContributions,
    totalReturns,
    yearsToTarget,
    monthlyData,
  };
}

// Función auxiliar para formatear moneda
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Función auxiliar para formatear porcentaje
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

// Función auxiliar para calcular tiempo hasta objetivo (si no se alcanza en la proyección)
export function calculateTimeToTarget(
  initialAmount: number,
  monthlyContribution: number,
  annualRate: number,
  targetAmount: number
): number | null {
  if (targetAmount <= initialAmount) return 0;

  const monthlyRate = annualRate / 12;
  let months = 0;
  let balance = initialAmount;

  while (balance < targetAmount && months < 50 * 12) {
    balance += balance * monthlyRate + monthlyContribution;
    months++;
  }

  return balance >= targetAmount ? months / 12 : null;
}