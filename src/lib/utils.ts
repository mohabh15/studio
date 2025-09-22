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
