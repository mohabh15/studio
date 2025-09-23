import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction, Budget, Category } from '@/types';

// Hook para sincronización en tiempo real con Firestore
export function useRealtimeTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const transactionsData: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          transactionsData.push({
            id: doc.id,
            type: data.type,
            amount: data.amount,
            date: data.date.toDate().toISOString(),
            category: data.category,
            notes: data.notes,
            merchant: data.merchant
          } as Transaction);
        });
        setTransactions(transactionsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error en tiempo real de transacciones:', error);
        setError('Error al sincronizar transacciones');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { transactions, loading, error };
}

// Hook para sincronización en tiempo real de presupuestos
export function useRealtimeBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'budgets'),
      (querySnapshot) => {
        const budgetsData: Budget[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          budgetsData.push({
            id: doc.id,
            category: data.category,
            amount: data.amount
          } as Budget);
        });
        setBudgets(budgetsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error en tiempo real de presupuestos:', error);
        setError('Error al sincronizar presupuestos');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { budgets, loading, error };
}

// Hook para sincronización en tiempo real de categorías
export function useRealtimeCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'categories'),
      (querySnapshot) => {
        const categoriesData: Category[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          categoriesData.push({
            id: doc.id,
            name: data.name,
            icon: data.icon,
            type: data.type
          } as Category);
        });
        setCategories(categoriesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error en tiempo real de categorías:', error);
        setError('Error al sincronizar categorías');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { categories, loading, error };
}