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
import { Transaction, Category, Budget, Debt, DebtPayment, DebtGoal } from '@/lib/types';

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
        const transactionData = docSnap.data();

        // If it's a debt payment transaction, restore the amount to the debt
        if (transactionData.category === 'debt' && transactionData.notes) {
          // Extract debt ID from notes format: "Pago de deuda [debt_id]: ..."
          const debtIdMatch = transactionData.notes.match(/Pago de deuda \[([^\]]+)\]/);
          if (debtIdMatch) {
            const debtId = debtIdMatch[1];
            console.log('Restoring payment to debt:', debtId);

            const debtDoc = await getDoc(doc(db, 'debts', debtId));
            if (debtDoc.exists()) {
              const currentDebt = debtDoc.data();
              const restoredAmount = currentDebt.monto_actual + transactionData.amount;

              // Update the debt with the restored amount
              await updateDoc(doc(db, 'debts', debtId), {
                monto_actual: restoredAmount
              });
              console.log('Debt amount restored:', debtId, 'new amount:', restoredAmount);
            }
          }
        }

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

// Hook for debts
export function useFirestoreDebts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'debts'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Debt[];
      setDebts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching debts');
    } finally {
      setLoading(false);
    }
  };

  const addDebt = async (debt: Omit<Debt, 'id'>) => {
    try {
      await addDoc(collection(db, 'debts'), debt);
      await fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding debt');
    }
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    try {
      const docRef = doc(db, 'debts', id);
      await updateDoc(docRef, updates);
      await fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating debt');
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'debts', id));
      await fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting debt');
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  return {
    debts,
    loading,
    error,
    addDebt,
    updateDebt,
    deleteDebt,
    refetch: fetchDebts,
  };
}

// Hook for debt payments
export function useFirestoreDebtPayments() {
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebtPayments = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'debt_payments'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DebtPayment[];
      setDebtPayments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching debt payments');
    } finally {
      setLoading(false);
    }
  };

  const addDebtPayment = async (payment: Omit<DebtPayment, 'id'>) => {
    try {
      await addDoc(collection(db, 'debt_payments'), payment);
      await fetchDebtPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding debt payment');
    }
  };

  const updateDebtPayment = async (id: string, updates: Partial<DebtPayment>) => {
    try {
      const docRef = doc(db, 'debt_payments', id);
      await updateDoc(docRef, updates);
      await fetchDebtPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating debt payment');
    }
  };

  const deleteDebtPayment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'debt_payments', id));
      await fetchDebtPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting debt payment');
    }
  };

  useEffect(() => {
    fetchDebtPayments();
  }, []);

  return {
    debtPayments,
    loading,
    error,
    addDebtPayment,
    updateDebtPayment,
    deleteDebtPayment,
    refetch: fetchDebtPayments,
  };
}

// Hook for debt goals
export function useFirestoreDebtGoals() {
  const [debtGoals, setDebtGoals] = useState<DebtGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebtGoals = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'debt_goals'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DebtGoal[];
      setDebtGoals(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching debt goals');
    } finally {
      setLoading(false);
    }
  };

  const addDebtGoal = async (goal: Omit<DebtGoal, 'id'>) => {
    try {
      await addDoc(collection(db, 'debt_goals'), goal);
      await fetchDebtGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding debt goal');
    }
  };

  const updateDebtGoal = async (id: string, updates: Partial<DebtGoal>) => {
    try {
      const docRef = doc(db, 'debt_goals', id);
      await updateDoc(docRef, updates);
      await fetchDebtGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating debt goal');
    }
  };

  const deleteDebtGoal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'debt_goals', id));
      await fetchDebtGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting debt goal');
    }
  };

  useEffect(() => {
    fetchDebtGoals();
  }, []);

  return {
    debtGoals,
    loading,
    error,
    addDebtGoal,
    updateDebtGoal,
    deleteDebtGoal,
    refetch: fetchDebtGoals,
  };
}