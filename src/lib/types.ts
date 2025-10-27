export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO string
  category: string; // category id
  notes?: string;
  merchant?: string;
};

export type Category = {
  id: string;
  userId: string;
  name: string;
  icon: string;
  type: TransactionType;
};

export type Budget = {
  id: string;
  userId: string;
  category: string; // category id
  amount: number;
  surplusStrategy?: SurplusStrategy;
};

export type DebtType = 'credit_card' | 'personal_loan' | 'mortgage' | 'student_loan' | 'car_loan' | 'other';

export type Debt = {
  id: string;
  userId: string;
  tipo: DebtType;
  monto: number; // monto original
  monto_actual: number; // monto pendiente
  tasa_interes: number; // tasa de interés anual en porcentaje
  pagos_minimos: number; // pago mínimo mensual
  fecha_vencimiento: string; // fecha de vencimiento (ISO string)
  descripcion?: string;
  fecha_creacion: string; // fecha cuando se creó la deuda (ISO string)
  direction?: string;
  status?: 'active' | 'inactive';
};

export type DebtPayment = {
  id: string;
  userId: string;
  debt_id: string;
  amount: number;
  date: string; // ISO string
  description?: string;
  tipo: 'regular' | 'extra' | 'collection'; // pago regular vs pago extra vs cobro
  transaction_id?: string; // referencia a la transacción creada
};

export type DebtGoal = {
  id: string;
  userId: string;
  debt_id: string;
  target_amount: number; // monto objetivo a reducir
  target_date: string; // fecha objetivo (ISO string)
  description?: string;
  completed: boolean;
  fecha_creacion: string;
};

export type SavingsType = 'emergency_fund' | 'investment' | 'purchase_goal' | 'vacation' | 'retirement' | 'other';

export type Savings = {
  id: string;
  userId: string;
  tipo: SavingsType;
  nombre: string;
  monto_actual: number; // monto actual ahorrado
  monto_objetivo?: number; // monto objetivo (opcional)
  fecha_objetivo?: string; // fecha objetivo (ISO string, opcional)
  descripcion?: string;
  fecha_creacion: string; // fecha cuando se creó el ahorro (ISO string)
  status: 'active' | 'completed' | 'paused';
  interes_anual?: number; // tasa de interés anual en porcentaje (opcional)
};

export type SavingsContribution = {
  id: string;
  userId: string;
  savings_id: string;
  amount: number;
  date: string; // ISO string
  description?: string;
  tipo: 'regular' | 'extra'; // aporte regular vs aporte extra
  transaction_id?: string; // referencia a la transacción creada
};

export type EmergencyFund = {
  id: string;
  userId: string;
  monto_actual: number;
  monto_objetivo: number; // objetivo mínimo 3 meses de gastos
  gastos_mensuales: number; // gastos mensuales promedio
  fecha_creacion: string;
  meses_cobertura_actual: number; // meses que cubre actualmente
};

export type FinancialFreedomGoal = {
  id: string;
  userId: string;
  nombre: string;
  descripcion?: string;
  ingresos_pasivos_objetivo: number; // ingresos pasivos mensuales objetivo
  gastos_mensuales_actuales: number;
  patrimonio_objetivo: number; // patrimonio necesario para generar los ingresos pasivos
  patrimonio_actual: number;
  fecha_objetivo: string; // fecha objetivo (ISO string)
  fecha_creacion: string;
  status: 'active' | 'achieved' | 'paused';
};

export type SurplusStrategyType = 'redistribute' | 'save' | 'invest' | 'ignore';

export type RedistributionTarget = {
  categoryId: string;
  percentage: number;
};

export type SurplusStrategy = {
  type: SurplusStrategyType;
  redistributionTargets?: RedistributionTarget[];
  savingsGoalId?: string;
  investmentId?: string;
};

export type BudgetSurplus = {
  budgetId: string;
  amount: number;
  date: string; // ISO string
  strategy: SurplusStrategy;
  applied: boolean;
};

export function validateRedistributionTargets(targets: RedistributionTarget[]): boolean {
  const totalPercentage = targets.reduce((sum, target) => sum + target.percentage, 0);
  return totalPercentage === 100 && targets.every(target => target.percentage > 0);
}
