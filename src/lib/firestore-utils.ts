import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, limit } from 'firebase/firestore';
import { Transaction, Budget, Category } from '@/types';

// Funciones de utilidad para Firestore
export class FirestoreUtils {
  
  // Obtener el balance total
  static async getTotalBalance(): Promise<number> {
    try {
      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
      let totalBalance = 0;
      
      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        const amount = data.amount || 0;
        totalBalance += data.type === 'income' ? amount : -amount;
      });
      
      return totalBalance;
    } catch (error) {
      console.error('Error al calcular balance total:', error);
      return 0;
    }
  }
  
  // Obtener transacciones por rango de fechas
  static async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      
      const q = query(
        collection(db, 'transactions'),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp)
      );
      
      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          type: data.type,
          amount: data.amount,
          date: data.date.toDate().toISOString(),
          category: data.category,
          notes: data.notes,
          merchant: data.merchant
        } as Transaction);
      });
      
      return transactions;
    } catch (error) {
      console.error('Error al obtener transacciones por rango de fechas:', error);
      return [];
    }
  }
  
  // Obtener el gasto total por categoría
  static async getTotalSpentByCategory(): Promise<{[key: string]: number}> {
    try {
      const transactionsSnapshot = await getDocs(
        query(collection(db, 'transactions'), where('type', '==', 'expense'))
      );
      
      const categoryTotals: {[key: string]: number} = {};
      
      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        const category = data.category || 'Sin categoría';
        const amount = data.amount || 0;
        
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });
      
      return categoryTotals;
    } catch (error) {
      console.error('Error al calcular gastos por categoría:', error);
      return {};
    }
  }
  
  // Verificar si hay datos en Firestore
  static async hasExistingData(): Promise<boolean> {
    try {
      const [transactionsSnapshot, budgetsSnapshot, categoriesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'transactions'), limit(1))),
        getDocs(query(collection(db, 'budgets'), limit(1))),
        getDocs(query(collection(db, 'categories'), limit(1)))
      ]);
      
      return !transactionsSnapshot.empty || !budgetsSnapshot.empty || !categoriesSnapshot.empty;
    } catch (error) {
      console.error('Error al verificar datos existentes:', error);
      return false;
    }
  }
  
  // Limpiar todos los datos (uso con precaución)
  static async clearAllData(): Promise<void> {
    try {
      // Nota: Firestore no permite eliminar colecciones completas desde el cliente
      // Esta función es más una plantilla para operaciones de limpieza
      console.warn('La limpieza de datos debe realizarse desde Firebase Console o Cloud Functions');
    } catch (error) {
      console.error('Error al limpiar datos:', error);
    }
  }
}

// Función para exportar datos a formato JSON
export function exportDataToJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

// Función para importar datos desde JSON
export function importDataFromJSON(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error al importar datos JSON:', error);
    return null;
  }
}