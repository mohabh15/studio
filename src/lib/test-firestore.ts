import { transactionService } from '@/lib/firestore';
import { Transaction } from '@/types';

// Función de prueba para añadir un ingreso
export async function testAddIncome() {
  try {
    console.log('🧪 Iniciando prueba de ingreso en Firestore...');
    
    // Crear un ingreso de prueba
    const testIncome = {
      type: 'income' as const,
      amount: 1500,
      date: new Date().toISOString(),
      category: 'Salario',
      notes: 'Ingreso de prueba desde consola',
      merchant: 'Empresa Test'
    };
    
    console.log('💰 Datos del ingreso:', testIncome);
    
    // Añadir el ingreso a Firestore
    const newTransactionId = await transactionService.createTransaction(testIncome);
    
    console.log('✅ Ingreso añadido exitosamente!');
    console.log('🆔 ID del documento:', newTransactionId);
    console.log('📊 Monto:', testIncome.amount);
    console.log('📅 Fecha:', testIncome.date);
    
    return newTransactionId;
    
  } catch (error) {
    console.error('❌ Error al añadir ingreso:', error);
    throw error;
  }
}

// Función de prueba para añadir un gasto
export async function testAddExpense() {
  try {
    console.log('🧪 Iniciando prueba de gasto en Firestore...');
    
    // Crear un gasto de prueba
    const testExpense = {
      type: 'expense' as const,
      amount: 75.50,
      date: new Date().toISOString(),
      category: 'Comida',
      notes: 'Gasto de prueba desde consola',
      merchant: 'Restaurante Test'
    };
    
    console.log('💸 Datos del gasto:', testExpense);
    
    // Añadir el gasto a Firestore
    const newTransactionId = await transactionService.createTransaction(testExpense);
    
    console.log('✅ Gasto añadido exitosamente!');
    console.log('🆔 ID del documento:', newTransactionId);
    console.log('📊 Monto:', testExpense.amount);
    console.log('📅 Fecha:', testExpense.date);
    
    return newTransactionId;
    
  } catch (error) {
    console.error('❌ Error al añadir gasto:', error);
    throw error;
  }
}

// Función para verificar las transacciones actuales
export async function testGetTransactions() {
  try {
    console.log('Obteniendo transacciones...');
    const transactions = await transactionService.getAllTransactions();
    console.log(`Se encontraron ${transactions.length} transacciones:`);
    
    transactions.forEach((transaction: Transaction, index: number) => {
      const displayText = transaction.notes || transaction.merchant || 'Sin descripción';
      console.log(`${index + 1}. ${transaction.type === 'income' ? '💰' : '💸'} ${displayText}: $${transaction.amount} (${new Date(transaction.date).toLocaleDateString()})`);
    });

    return {
      success: true,
      message: `Se encontraron ${transactions.length} transacciones`,
      data: transactions.map((transaction: Transaction, index: number) => ({
        index: index + 1,
        description: transaction.notes || transaction.merchant || 'Sin descripción',
        amount: transaction.amount,
        type: transaction.type,
        date: new Date(transaction.date).toLocaleDateString()
      }))
    };
  } catch (error) {
    console.error('❌ Error al obtener transacciones:', error);
    throw error;
  }
}