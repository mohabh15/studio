import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Transaction, Budget, Category } from '@/types';

// Colecciones de Firestore
const TRANSACTIONS_COLLECTION = 'transactions';
const BUDGETS_COLLECTION = 'budgets';
const CATEGORIES_COLLECTION = 'categories';

// Servicio de Transacciones
export const transactionService = {
  // Obtener todas las transacciones
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          amount: data.amount,
          date: data.date.toDate().toISOString(),
          category: data.category,
          notes: data.notes,
          merchant: data.merchant
        } as Transaction;
      });
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      throw error;
    }
  },

  // Crear nueva transacción
  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        ...transaction,
        date: Timestamp.fromDate(new Date(transaction.date)),
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando transacción:', error);
      throw error;
    }
  },

  // Actualizar transacción
  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<void> {
    try {
      const updateData: any = { ...transaction };
      if (transaction.date) {
        updateData.date = Timestamp.fromDate(new Date(transaction.date));
      }
      await updateDoc(doc(db, TRANSACTIONS_COLLECTION, id), updateData);
    } catch (error) {
      console.error('Error actualizando transacción:', error);
      throw error;
    }
  },

  // Eliminar transacción
  async deleteTransaction(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, id));
    } catch (error) {
      console.error('Error eliminando transacción:', error);
      throw error;
    }
  },

  // Obtener transacciones por mes
  async getTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 1);
      
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          amount: data.amount,
          date: data.date.toDate().toISOString(),
          category: data.category,
          notes: data.notes,
          merchant: data.merchant
        } as Transaction;
      });
    } catch (error) {
      console.error('Error obteniendo transacciones por mes:', error);
      throw error;
    }
  }
};

// Servicio de Presupuestos
export const budgetService = {
  // Obtener todos los presupuestos
  async getAllBudgets(): Promise<Budget[]> {
    try {
      const querySnapshot = await getDocs(collection(db, BUDGETS_COLLECTION));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          category: data.category,
          amount: data.amount
        } as Budget;
      });
    } catch (error) {
      console.error('Error obteniendo presupuestos:', error);
      throw error;
    }
  },

  // Crear nuevo presupuesto
  async createBudget(budget: Omit<Budget, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, BUDGETS_COLLECTION), {
        ...budget,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando presupuesto:', error);
      throw error;
    }
  },

  // Actualizar presupuesto
  async updateBudget(id: string, budget: Partial<Budget>): Promise<void> {
    try {
      await updateDoc(doc(db, BUDGETS_COLLECTION, id), budget);
    } catch (error) {
      console.error('Error actualizando presupuesto:', error);
      throw error;
    }
  },

  // Eliminar presupuesto
  async deleteBudget(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, BUDGETS_COLLECTION, id));
    } catch (error) {
      console.error('Error eliminando presupuesto:', error);
      throw error;
    }
  }
};

// Servicio de Categorías
export const categoryService = {
  // Obtener todas las categorías
  async getAllCategories(): Promise<Category[]> {
    try {
      const querySnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          icon: data.icon,
          type: data.type
        } as Category;
      });
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  },

  // Crear nueva categoría
  async createCategory(category: Omit<Category, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
        ...category,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando categoría:', error);
      throw error;
    }
  },

  // Actualizar categoría
  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    try {
      await updateDoc(doc(db, CATEGORIES_COLLECTION, id), category);
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      throw error;
    }
  },

  // Eliminar categoría
  async deleteCategory(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      throw error;
    }
  }
};