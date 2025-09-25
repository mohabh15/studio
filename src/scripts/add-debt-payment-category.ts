import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

async function addDebtPaymentCategory() {
  try {
    console.log('Verificando si existe la categoría de pagos de deudas...');

    // Check if debt_payment category already exists
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const debtPaymentCategory = categoriesSnapshot.docs.find(doc => doc.data().name === 'categories.debt_payment');

    if (debtPaymentCategory) {
      console.log('La categoría de pagos de deudas ya existe.');
      return;
    }

    console.log('Añadiendo categoría de pagos de deudas...');

    // Add the debt_payment category
    await addDoc(collection(db, 'categories'), {
      name: 'categories.debt_payment',
      icon: 'CreditCard',
      type: 'expense'
    });

    console.log('Categoría de pagos de deudas añadida exitosamente.');
  } catch (error) {
    console.error('Error añadiendo la categoría de pagos de deudas:', error);
  }
}

addDebtPaymentCategory();