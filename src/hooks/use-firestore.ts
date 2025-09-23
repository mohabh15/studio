import { useState, useEffect, useCallback } from 'react';
import { transactionService, budgetService, categoryService } from '@/lib/firestore';
import { Transaction, Budget, Category } from '@/types';

// Hook para manejar transacciones con Firestore
export function useFirestoreTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar transacciones
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionService.getAllTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Error al cargar transacciones');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear transacción
  const createTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const id = await transactionService.createTransaction(transaction);
      const newTransaction = { ...transaction, id };
      setTransactions(prev => [newTransaction, ...prev]);
      return id;
    } catch (err) {
      setError('Error al crear transacción');
      console.error('Error creating transaction:', err);
      throw err;
    }
  }, []);

  // Actualizar transacción
  const updateTransaction = useCallback(async (id: string, transaction: Partial<Transaction>) => {
    try {
      await transactionService.updateTransaction(id, transaction);
      setTransactions(prev => prev.map(tx => 
        tx.id === id ? { ...tx, ...transaction } : tx
      ));
    } catch (err) {
      setError('Error al actualizar transacción');
      console.error('Error updating transaction:', err);
      throw err;
    }
  }, []);

  // Eliminar transacción
  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await transactionService.deleteTransaction(id);
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch (err) {
      setError('Error al eliminar transacción');
      console.error('Error deleting transaction:', err);
      throw err;
    }
  }, []);

  // Obtener transacciones por mes
  const getTransactionsByMonth = useCallback(async (year: number, month: number) => {
    try {
      return await transactionService.getTransactionsByMonth(year, month);
    } catch (err) {
      setError('Error al obtener transacciones del mes');
      console.error('Error getting monthly transactions:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByMonth,
    refresh: loadTransactions
  };
}

// Hook para manejar presupuestos con Firestore
export function useFirestoreBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar presupuestos
  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await budgetService.getAllBudgets();
      setBudgets(data);
    } catch (err) {
      setError('Error al cargar presupuestos');
      console.error('Error loading budgets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear presupuesto
  const createBudget = useCallback(async (budget: Omit<Budget, 'id'>) => {
    try {
      const id = await budgetService.createBudget(budget);
      const newBudget = { ...budget, id };
      setBudgets(prev => [...prev, newBudget]);
      return id;
    } catch (err) {
      setError('Error al crear presupuesto');
      console.error('Error creating budget:', err);
      throw err;
    }
  }, []);

  // Actualizar presupuesto
  const updateBudget = useCallback(async (id: string, budget: Partial<Budget>) => {
    try {
      await budgetService.updateBudget(id, budget);
      setBudgets(prev => prev.map(bg => 
        bg.id === id ? { ...bg, ...budget } : bg
      ));
    } catch (err) {
      setError('Error al actualizar presupuesto');
      console.error('Error updating budget:', err);
      throw err;
    }
  }, []);

  // Eliminar presupuesto
  const deleteBudget = useCallback(async (id: string) => {
    try {
      await budgetService.deleteBudget(id);
      setBudgets(prev => prev.filter(bg => bg.id !== id));
    } catch (err) {
      setError('Error al eliminar presupuesto');
      console.error('Error deleting budget:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  return {
    budgets,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    refresh: loadBudgets
  };
}

// Hook para manejar categorías con Firestore
export function useFirestoreCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar categorías
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      setError('Error al cargar categorías');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear categoría
  const createCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    try {
      const id = await categoryService.createCategory(category);
      const newCategory = { ...category, id };
      setCategories(prev => [...prev, newCategory]);
      return id;
    } catch (err) {
      setError('Error al crear categoría');
      console.error('Error creating category:', err);
      throw err;
    }
  }, []);

  // Actualizar categoría
  const updateCategory = useCallback(async (id: string, category: Partial<Category>) => {
    try {
      await categoryService.updateCategory(id, category);
      setCategories(prev => prev.map(cat => 
        cat.id === id ? { ...cat, ...category } : cat
      ));
    } catch (err) {
      setError('Error al actualizar categoría');
      console.error('Error updating category:', err);
      throw err;
    }
  }, []);

  // Eliminar categoría
  const deleteCategory = useCallback(async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (err) {
      setError('Error al eliminar categoría');
      console.error('Error deleting category:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh: loadCategories
  };
}