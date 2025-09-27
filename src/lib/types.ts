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
};

export type DebtPayment = {
  id: string;
  userId: string;
  debt_id: string;
  amount: number;
  date: string; // ISO string
  description?: string;
  tipo: 'regular' | 'extra'; // pago regular vs pago extra
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
