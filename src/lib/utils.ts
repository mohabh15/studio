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
 * @param year - Año
 * @param month - Mes (0-11)
 * @param locale - Locale ('en' | 'es')
 * @returns Nombre del mes formateado
 */
export function formatMonthName(year: number, month: number, locale: 'en' | 'es'): string {
  const date = new Date(year, month, 1);

  // Para español usar 'es-ES', para inglés usar 'en-US'
  const localeString = locale === 'es' ? 'es-ES' : 'en-US';

  return date.toLocaleDateString(localeString, {
    month: 'long',
    year: 'numeric'
  });
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
