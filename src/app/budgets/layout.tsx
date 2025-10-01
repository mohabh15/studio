import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Budgets - Budget3M',
  description: 'Manage your personal budgets and financial goals',
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}