import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction, Category, Budget } from '@/lib/types';

// Hook for transactions
export function useFirestoreTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      await addDoc(collection(db, 'transactions'), transaction);
      await fetchTransactions(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding transaction');
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      console.log('Updating transaction in Firestore:', id, updates);
      const docRef = doc(db, 'transactions', id);
      await updateDoc(docRef, updates);
      console.log('Transaction updated successfully, fetching updated list...');
      await fetchTransactions();
      console.log('Transactions updated');
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(err instanceof Error ? err.message : 'Error updating transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      console.log('Deleting transaction from Firestore:', id);
      const docRef = doc(db, 'transactions', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log('Transaction exists, deleting...');
        await deleteDoc(docRef);
        console.log('Transaction deleted from Firestore, fetching updated list...');
      } else {
        console.error('Transaction does not exist:', id);
        throw new Error(`Transaction with id ${id} does not exist`);
      }
      await fetchTransactions();
      console.log('Transactions updated');
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err instanceof Error ? err.message : 'Error deleting transaction');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}

// Hook for categories
export function useFirestoreCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (category: Category) => {
    try {
      const docRef = doc(db, 'categories', category.id);
      await setDoc(docRef, category);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding category');
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const docRef = doc(db, 'categories', id);
      await updateDoc(docRef, updates);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating category');
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      console.log('Deleting category from Firestore by id:', id);

      // First try to delete by id
      const docRef = doc(db, 'categories', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log('Document exists by id, deleting...');
        await deleteDoc(docRef);
      } else {
        console.log('Document not found by id, trying to find by name...');
        // If not found by id, find by name (for categories that might have different ids)
        const q = query(collection(db, 'categories'), where('name', '==', `categories.${id}`));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docToDelete = querySnapshot.docs[0];
          console.log('Found document by name, deleting:', docToDelete.id);
          await deleteDoc(docToDelete.ref);
        } else {
          console.error('Category not found by id or name:', id);
          throw new Error(`Category with id ${id} does not exist`);
        }
      }

      console.log('Category deleted from Firestore, fetching updated list...');
      await fetchCategories();
      console.log('Categories updated');
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Error deleting category');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}

// Hook for budgets
export function useFirestoreBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'budgets'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Budget[];
      setBudgets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching budgets');
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    try {
      await addDoc(collection(db, 'budgets'), budget);
      await fetchBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding budget');
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const docRef = doc(db, 'budgets', id);
      await updateDoc(docRef, updates);
      await fetchBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating budget');
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'budgets', id));
      await fetchBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting budget');
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets,
  };
}