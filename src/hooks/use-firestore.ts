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
export function useFirestoreTransactions(userId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'transactions'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'transactions'), { ...transaction, userId });
      await fetchTransactions(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding transaction');
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const docRef = doc(db, 'transactions', id);
      await updateDoc(docRef, updates);
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const docRef = doc(db, 'transactions', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const transactionData = docSnap.data();

        // If it's a debt payment or collection transaction, restore the amount to the debt
        if ((transactionData.category === 'debt' || transactionData.category === 'debt_collection') && transactionData.notes) {
          // Extract debt ID from notes format: "Pago de deuda [debt_id]: ..." or "Cobro de deuda [debt_id]: ..."
          const debtIdMatch = transactionData.notes.match(/(Pago|Cobro) de deuda \[([^\]]+)\]/);
          if (debtIdMatch) {
            const debtId = debtIdMatch[2];

            const debtDoc = await getDoc(doc(db, 'debts', debtId));
            if (debtDoc.exists()) {
              const currentDebt = debtDoc.data();
              const restoredAmount = currentDebt.monto_actual + transactionData.amount;

              // Update the debt with the restored amount
              await updateDoc(doc(db, 'debts', debtId), {
                monto_actual: restoredAmount
              });
            }

            // Find and delete the corresponding debt payment record
            const debtPaymentsQuery = query(
              collection(db, 'debt_payments'),
              where('userId', '==', userId),
              where('debt_id', '==', debtId),
              where('amount', '==', transactionData.amount),
              where('date', '==', transactionData.date)
            );
            const debtPaymentsSnapshot = await getDocs(debtPaymentsQuery);
            if (!debtPaymentsSnapshot.empty) {
              let paymentToDelete;
              if (debtPaymentsSnapshot.docs.length === 1) {
                paymentToDelete = debtPaymentsSnapshot.docs[0];
              } else {
                // Multiple matches, choose the most recent
                const sortedDocs = debtPaymentsSnapshot.docs.sort((a, b) => new Date(b.data().date).getTime() - new Date(a.data().date).getTime());
                paymentToDelete = sortedDocs[0];
              }
              await deleteDoc(paymentToDelete.ref);
            }
          }
        }

        await deleteDoc(docRef);
      } else {
        throw new Error(`Transaction with id ${id} does not exist`);
      }

      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting transaction');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

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
export function useFirestoreCategories(userId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Get both system categories (userId: 'default') and user-specific categories
      const q = query(collection(db, 'categories'), where('userId', 'in', ['default', userId]));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Category))
        // Remove duplicates by prioritizing user-specific categories over system ones
        .reduce((acc, category) => {
          const existingIndex = acc.findIndex(cat => cat.id === category.id);
          if (existingIndex >= 0) {
            // Replace system category with user-specific one if it exists
            acc[existingIndex] = category;
          } else {
            acc.push(category);
          }
          return acc;
        }, [] as Category[]);
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
      // First try to delete by id
      const docRef = doc(db, 'categories', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await deleteDoc(docRef);
      } else {
        // If not found by id, find by name (for categories that might have different ids)
        const q = query(collection(db, 'categories'), where('name', '==', `categories.${id}`));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docToDelete = querySnapshot.docs[0];
          await deleteDoc(docToDelete.ref);
        } else {
          throw new Error(`Category with id ${id} does not exist`);
        }
      }

      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting category');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [userId]);

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
export function useFirestoreBudgets(userId: string) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'budgets'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Budget));
      setBudgets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching budgets');
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'budgets'), { ...budget, userId });
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
  }, [userId]);

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
export function useFirestoreDebts(userId: string) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'debts'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Debt));
      setDebts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching debts');
    } finally {
      setLoading(false);
    }
  };

  const addDebt = async (debt: Omit<Debt, 'id' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'debts'), { ...debt, userId });
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
  }, [userId]);

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
export function useFirestoreDebtPayments(userId: string) {
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebtPayments = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'debt_payments'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as DebtPayment));
      setDebtPayments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching debt payments');
    } finally {
      setLoading(false);
    }
  };

  const addDebtPayment = async (payment: Omit<DebtPayment, 'id' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'debt_payments'), { ...payment, userId });
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
  }, [userId]);

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
export function useFirestoreDebtGoals(userId: string) {
  const [debtGoals, setDebtGoals] = useState<DebtGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebtGoals = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'debt_goals'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as DebtGoal));
      setDebtGoals(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching debt goals');
    } finally {
      setLoading(false);
    }
  };

  const addDebtGoal = async (goal: Omit<DebtGoal, 'id' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'debt_goals'), { ...goal, userId });
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
  }, [userId]);

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