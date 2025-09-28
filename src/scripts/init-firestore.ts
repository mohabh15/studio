import { initializeApp } from 'firebase/app';
import { collection, addDoc, getDocs, setDoc, doc, deleteDoc, getFirestore } from 'firebase/firestore';
import { defaultCategories } from '../lib/constants';
import { sampleTransactions, sampleBudgets } from '@/lib/sample-data';

// Initialize Firebase using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeFirestore() {
  try {
    // Force recreate categories with correct IDs for all users (system categories)
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    if (!categoriesSnapshot.empty) {
      // Delete existing categories first
      const deletePromises = categoriesSnapshot.docs.map(document => {
        return deleteDoc(document.ref);
      });
      await Promise.all(deletePromises);
      console.log('Categorías existentes eliminadas');
    }

    // Create categories with correct IDs for all users (system categories)
    for (const category of defaultCategories) {
      const { id, ...categoryData } = category;
      await setDoc(doc(db, 'categories', id), { ...categoryData, userId: 'default' });
    }
    console.log('Categorías por defecto recreadas con IDs correctos para todos los usuarios');

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