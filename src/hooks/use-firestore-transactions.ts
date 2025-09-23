'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Transaction } from '@/lib/types';

export function useFirestoreTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar transacciones desde Firestore al montar el componente
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(
          query(collection(db, 'transactions'), orderBy('date', 'desc'))
        );
        
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        
        setTransactions(docs);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Error al cargar transacciones');
        console.error('Error loading transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        
        setTransactions(docs);
        setError(null);
      },
      (err) => {
        setError(err.message || 'Error al escuchar cambios');
        console.error('Error listening to transactions:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Función para añadir transacción
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'transactions'), transaction);
      return docRef.id;
    } catch (err: any) {
      setError(err.message || 'Error al añadir transacción');
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    addTransaction,
    setTransactions
  };
}