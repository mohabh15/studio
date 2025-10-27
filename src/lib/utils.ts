import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as LucideIcons from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIcon(iconName: keyof typeof LucideIcons): React.ElementType {
  const Icon = LucideIcons[iconName] as React.ElementType;
  return Icon || LucideIcons.Package;
}

/**
 * Formatea el nombre del mes y año según el locale especificado
 * @param year - Año (puede ser completo o de 2 dígitos)
 * @param month - Mes (0-11)
 * @param locale - Locale ('en' | 'es')
 * @param shortYear - Si es true, muestra solo las últimas 2 dígitos del año
 * @returns Nombre del mes formateado
 */
export function formatMonthName(year: number, month: number, locale: 'en' | 'es', shortYear?: boolean): string {
  // Si el año tiene 2 dígitos y queremos mostrar solo 2 dígitos, convertir a año completo
  let fullYear = year;
  if (year < 100 && !shortYear) {
    fullYear = year + 2000; // Asumir años 2000+ para años de 2 dígitos
  }

  const date = new Date(fullYear, month, 1);

  // Para español usar 'es-ES', para inglés usar 'en-US'
  const localeString = locale === 'es' ? 'es-ES' : 'en-US';

  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
  };

  // Si shortYear es true, mostrar solo las últimas 2 dígitos del año
  if (shortYear) {
    options.year = '2-digit';
  } else {
    options.year = 'numeric';
  }

  return date.toLocaleDateString(localeString, options);
}

// Lista de iconos comunes que queremos mostrar en el selector
export const commonIconNames = [
  'ShoppingCart',
  'Home',
  'Car',
  'Shirt',
  'Clapperboard',
  'HeartPulse',
  'Gift',
  'Briefcase',
  'Landmark',
  'PiggyBank',
  'Wallet',
  'Coffee',
  'Pizza',
  'Bus',
  'Plane',
  'Train',
  'Smartphone',
  'Laptop',
  'Book',
  'Backpack',
  'DollarSign',
  'CreditCard',
  'Building',
  'Utensils',
  'ShoppingBag'
];

import type { Budget, Transaction, RedistributionTarget, Category } from '@/lib/types';
import { validateRedistributionTargets } from '@/lib/types';

export function applyRolloverStrategy(currentBudget: Budget, surplus: number, existingNextBudget?: Budget): Budget {
  if (existingNextBudget) {
    return {
      ...existingNextBudget,
      amount: existingNextBudget.amount + surplus,
    };
  } else {
    return {
      id: '',
      userId: currentBudget.userId,
      category: currentBudget.category,
      amount: currentBudget.amount + surplus,
      surplusStrategy: currentBudget.surplusStrategy,
    };
  }
}

export function applyRedistributionStrategy(
  budget: Budget,
  surplus: number,
  redistributionTargets: RedistributionTarget[],
  categories: Category[]
): Transaction[] {
  if (!validateRedistributionTargets(redistributionTargets)) {
    throw new Error('Los porcentajes de redistribución deben sumar 100% y ser positivos');
  }

  const transactions: Transaction[] = [];
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

  for (const target of redistributionTargets) {
    const category = categoryMap.get(target.categoryId);
    if (!category) {
      throw new Error(`Categoría destino no encontrada: ${target.categoryId}`);
    }

    const amount = surplus * (target.percentage / 100);
    const transaction: Transaction = {
      id: '', // Se generará al guardar
      userId: budget.userId,
      type: 'expense', // Asumiendo que redistribuir es un gasto adicional
      amount: amount,
      date: new Date().toISOString(),
      category: target.categoryId,
      notes: `Redistribución de sobrante del presupuesto ${budget.category}`,
    };
    transactions.push(transaction);
  }

  return transactions;
}
