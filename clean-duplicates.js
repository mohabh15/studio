// Script para limpiar transacciones duplicadas
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Configuración de Firebase (usa la misma que en tu proyecto)
const firebaseConfig = {
  // Añade aquí tu configuración de Firebase
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanDuplicates() {
  try {
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    const transactions = [];
    
    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`Encontradas ${transactions.length} transacciones`);

    const seen = new Map();
    const duplicates = [];

    transactions.forEach(transaction => {
      const key = `${transaction.type}-${transaction.amount}-${transaction.date.toDate().toISOString()}-${transaction.category}-${transaction.merchant || ''}-${transaction.notes || ''}`;
      
      if (seen.has(key)) {
        duplicates.push(transaction);
        console.log(`Duplicado encontrado: ${transaction.merchant} - ${transaction.amount}`);
      } else {
        seen.set(key, transaction);
      }
    });

    if (duplicates.length > 0) {
      console.log(`Eliminando ${duplicates.length} duplicados...`);
      
      for (const duplicate of duplicates) {
        await deleteDoc(doc(db, 'transactions', duplicate.id));
        console.log(`Eliminada transacción: ${duplicate.id}`);
      }
      
      console.log('¡Duplicados eliminados exitosamente!');
    } else {
      console.log('No se encontraron duplicados');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// cleanDuplicates();