import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { defaultCategories } from '../lib/constants';
import { sampleTransactions, sampleBudgets } from '@/lib/sample-data';

async function initializeFirestore() {
  try {
    console.log('Inicializando Firestore...');

    // Check if categories already exist
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    if (categoriesSnapshot.empty) {
      console.log('Añadiendo categorías por defecto...');
      for (const category of defaultCategories) {
        const { id, ...categoryData } = category;
        await addDoc(collection(db, 'categories'), categoryData);
      }
      console.log('Categorías añadidas.');
    } else {
      console.log('Las categorías ya existen.');
    }

    // Check if transactions already exist
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    if (transactionsSnapshot.empty) {
      console.log('Añadiendo transacciones de muestra...');
      for (const transaction of sampleTransactions) {
        const { id, ...transactionData } = transaction;
        await addDoc(collection(db, 'transactions'), transactionData);
      }
      console.log('Transacciones añadidas.');
    } else {
      console.log('Las transacciones ya existen.');
    }

    // Check if budgets already exist
    const budgetsSnapshot = await getDocs(collection(db, 'budgets'));
    if (budgetsSnapshot.empty) {
      console.log('Añadiendo presupuestos de muestra...');
      for (const budget of sampleBudgets) {
        const { id, ...budgetData } = budget;
        await addDoc(collection(db, 'budgets'), budgetData);
      }
      console.log('Presupuestos añadidos.');
    } else {
      console.log('Los presupuestos ya existen.');
    }

    console.log('Inicialización completada.');
  } catch (error) {
    console.error('Error inicializando Firestore:', error);
  }
}

initializeFirestore();