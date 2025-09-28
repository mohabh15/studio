import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

async function addDebtPaymentCategory() {
  try {
    // Check if debt_payment category already exists
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const debtPaymentCategory = categoriesSnapshot.docs.find(doc => doc.data().name === 'categories.debt_payment');

    if (debtPaymentCategory) {
      return;
    }

    // Add the debt_payment category
    await addDoc(collection(db, 'categories'), {
      name: 'categories.debt_payment',
      icon: 'CreditCard',
      type: 'expense'
    });
  } catch (error) {
    console.error('Error añadiendo la categoría de pagos de deudas:', error);
  }
}

addDebtPaymentCategory();