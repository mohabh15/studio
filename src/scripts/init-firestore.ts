import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { defaultCategories } from '../lib/constants';
import { sampleTransactions, sampleBudgets } from '@/lib/sample-data';

async function initializeFirestore() {
  try {
    // Check if categories already exist
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    if (categoriesSnapshot.empty) {
      for (const category of defaultCategories) {
        const { id, ...categoryData } = category;
        await addDoc(collection(db, 'categories'), categoryData);
      }
    }

    // Check if transactions already exist
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    if (transactionsSnapshot.empty) {
      for (const transaction of sampleTransactions) {
        const { id, ...transactionData } = transaction;
        await addDoc(collection(db, 'transactions'), transactionData);
      }
    }

    // Check if budgets already exist
    const budgetsSnapshot = await getDocs(collection(db, 'budgets'));
    if (budgetsSnapshot.empty) {
      for (const budget of sampleBudgets) {
        const { id, ...budgetData } = budget;
        await addDoc(collection(db, 'budgets'), budgetData);
      }
    }
  } catch (error) {
    console.error('Error inicializando Firestore:', error);
  }
}

initializeFirestore();