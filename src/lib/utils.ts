import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as LucideIcons from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIcon(iconName: keyof typeof LucideIcons) {
  const Icon = LucideIcons[iconName] as React.ElementType;
  if (!Icon) {
    return LucideIcons.Package; // fallback icon
  }
  return Icon;
}

export const iconNames = Object.keys(LucideIcons).filter(
  (key) => typeof LucideIcons[key as keyof typeof LucideIcons] === 'object'
);
