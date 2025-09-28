'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Dynamic import with ssr: false for client-side only rendering
const AuthErrorBoundary = dynamic(() => import('@/components/auth/auth-error-boundary').then(mod => ({ default: mod.AuthErrorBoundary })), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

interface AuthErrorBoundaryClientProps {
  children: ReactNode;
}

export function AuthErrorBoundaryClient({ children }: AuthErrorBoundaryClientProps) {
  return <AuthErrorBoundary>{children}</AuthErrorBoundary>;
}