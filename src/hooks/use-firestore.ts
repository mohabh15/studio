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
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction, Category, Budget, Debt, DebtPayment, DebtGoal, Savings, SavingsContribution, EmergencyFund, FinancialFreedomGoal } from '@/lib/types';

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
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding transaction');
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const docRef = doc(db, 'transactions', id);
      await updateDoc(docRef, updates);
      // No need to refetch, real-time listener will update
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

      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting transaction');
    }
  };

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'transactions'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err instanceof Error ? err.message : 'Error fetching transactions');
      setLoading(false);
    });

    return () => unsubscribe();
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
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding category');
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const docRef = doc(db, 'categories', id);
      await updateDoc(docRef, updates);
      // No need to refetch, real-time listener will update
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

      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting category');
    }
  };

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'categories'), where('userId', 'in', ['default', userId]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err instanceof Error ? err.message : 'Error fetching categories');
      setLoading(false);
    });

    return () => unsubscribe();
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
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding budget');
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const docRef = doc(db, 'budgets', id);
      await updateDoc(docRef, updates);
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating budget');
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'budgets', id));
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting budget');
    }
  };

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'budgets'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Budget));
      setBudgets(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err instanceof Error ? err.message : 'Error fetching budgets');
      setLoading(false);
    });

    return () => unsubscribe();
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
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding debt');
    }
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    try {
      const docRef = doc(db, 'debts', id);
      await updateDoc(docRef, updates);
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating debt');
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'debts', id));
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting debt');
    }
  };

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'debts'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Debt));
      setDebts(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err instanceof Error ? err.message : 'Error fetching debts');
      setLoading(false);
    });

    return () => unsubscribe();
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
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding debt payment');
    }
  };

  const updateDebtPayment = async (id: string, updates: Partial<DebtPayment>) => {
    try {
      const docRef = doc(db, 'debt_payments', id);
      await updateDoc(docRef, updates);
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating debt payment');
    }
  };

  const deleteDebtPayment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'debt_payments', id));
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting debt payment');
    }
  };

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'debt_payments'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as DebtPayment));
      setDebtPayments(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err instanceof Error ? err.message : 'Error fetching debt payments');
      setLoading(false);
    });

    return () => unsubscribe();
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

// Hook for savings
export function useFirestoreSavings(userId: string) {
  const [savings, setSavings] = useState<Savings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavings = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'savings'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Savings));
      setSavings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching savings');
    } finally {
      setLoading(false);
    }
  };

  const addSavings = async (savings: Omit<Savings, 'id' | 'userId'>) => {
    try {
      setError(null); // Clear any previous errors
      await addDoc(collection(db, 'savings'), { ...savings, userId });
      // No need to refetch, real-time listener will update
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding savings';
      setError(errorMessage);
      throw new Error(errorMessage); // Re-throw to allow component-level error handling
    }
  };

  const updateSavings = async (id: string, updates: Partial<Savings>) => {
    try {
      setError(null); // Clear any previous errors
      const docRef = doc(db, 'savings', id);
      await updateDoc(docRef, updates);
      // No need to refetch, real-time listener will update
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating savings';
      setError(errorMessage);
      throw new Error(errorMessage); // Re-throw to allow component-level error handling
    }
  };

  const deleteSavings = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'savings', id));
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting savings');
    }
  };

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'savings'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Savings));
      setSavings(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err instanceof Error ? err.message : 'Error fetching savings');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    savings,
    loading,
    error,
    addSavings,
    updateSavings,
    deleteSavings,
    refetch: fetchSavings,
  };
}

// Hook for savings contributions
export function useFirestoreSavingsContributions(userId: string) {
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'savings_contributions'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as SavingsContribution));
      setContributions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching savings contributions');
    } finally {
      setLoading(false);
    }
  };

  const addContribution = async (contribution: Omit<SavingsContribution, 'id' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'savings_contributions'), { ...contribution, userId });
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding savings contribution');
    }
  };

  const updateContribution = async (id: string, updates: Partial<SavingsContribution>) => {
    try {
      const docRef = doc(db, 'savings_contributions', id);
      await updateDoc(docRef, updates);
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating savings contribution');
    }
  };

  const deleteContribution = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'savings_contributions', id));
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting savings contribution');
    }
  };

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'savings_contributions'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as SavingsContribution));
      setContributions(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err instanceof Error ? err.message : 'Error fetching savings contributions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    contributions,
    loading,
    error,
    addContribution,
    updateContribution,
    deleteContribution,
    refetch: fetchContributions,
  };
}

// Hook for emergency fund
export function useFirestoreEmergencyFund(userId: string) {
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmergencyFund = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'emergency_fund'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as EmergencyFund));
      setEmergencyFund(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching emergency fund');
    } finally {
      setLoading(false);
    }
  };

  const addEmergencyFund = async (fund: Omit<EmergencyFund, 'id' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'emergency_fund'), { ...fund, userId });
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding emergency fund');
    }
  };

  const updateEmergencyFund = async (id: string, updates: Partial<EmergencyFund>) => {
    try {
      const docRef = doc(db, 'emergency_fund', id);
      await updateDoc(docRef, updates);
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating emergency fund');
    }
  };

  const deleteEmergencyFund = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'emergency_fund', id));
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting emergency fund');
    }
  };

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'emergency_fund'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as EmergencyFund));
      setEmergencyFund(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err instanceof Error ? err.message : 'Error fetching emergency fund');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    emergencyFund,
    loading,
    error,
    addEmergencyFund,
    updateEmergencyFund,
    deleteEmergencyFund,
    refetch: fetchEmergencyFund,
  };
}

// Hook for financial freedom goals
export function useFirestoreFinancialFreedomGoals(userId: string) {
  const [goals, setGoals] = useState<FinancialFreedomGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'financial_freedom_goals'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FinancialFreedomGoal));
      setGoals(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching financial freedom goals');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goal: Omit<FinancialFreedomGoal, 'id' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'financial_freedom_goals'), { ...goal, userId });
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding financial freedom goal');
    }
  };

  const updateGoal = async (id: string, updates: Partial<FinancialFreedomGoal>) => {
    try {
      const docRef = doc(db, 'financial_freedom_goals', id);
      await updateDoc(docRef, updates);
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating financial freedom goal');
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'financial_freedom_goals', id));
      // No need to refetch, real-time listener will update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting financial freedom goal');
    }
  };

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'financial_freedom_goals'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FinancialFreedomGoal));
      setGoals(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err instanceof Error ? err.message : 'Error fetching financial freedom goals');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
}