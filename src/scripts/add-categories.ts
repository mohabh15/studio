import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

async function addCategories() {
  try {
    const categories = [
      { name: 'groceries', icon: 'ShoppingCart', type: 'expense' },
      { name: 'rent', icon: 'Home', type: 'expense' },
      { name: 'transport', icon: 'Car', type: 'expense' },
      { name: 'salary', icon: 'Landmark', type: 'income' },
    ];

    for (const category of categories) {
      await addDoc(collection(db, 'categories'), category);
    }
  } catch (error) {
    console.error('Error añadiendo categorías:', error);
  }
}

addCategories();