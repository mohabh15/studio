'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useFirestoreTransactions } from '@/hooks/use-firestore-transactions';
import type { Transaction } from '@/lib/types';

interface FirestoreTransactionsContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<string>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const FirestoreTransactionsContext = createContext<FirestoreTransactionsContextType | undefined>(undefined);

export function FirestoreTransactionsProvider({ children }: { children: ReactNode }) {
  const firestoreData = useFirestoreTransactions();

  return (
    <FirestoreTransactionsContext.Provider value={firestoreData}>
      {children}
    </FirestoreTransactionsContext.Provider>
  );
}

export function useFirestoreTransactionsContext() {
  const context = useContext(FirestoreTransactionsContext);
  if (context === undefined) {
    throw new Error('useFirestoreTransactionsContext must be used within a FirestoreTransactionsProvider');
  }
  return context;
}