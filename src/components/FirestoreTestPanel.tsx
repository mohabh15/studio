import React from 'react';
import { testAddIncome, testAddExpense, testGetTransactions } from '@/lib/test-firestore';

export function FirestoreTestPanel() {
  const handleTestIncome = async () => {
    try {
      const id = await testAddIncome();
      alert(`✅ Ingreso de prueba creado con ID: ${id}`);
    } catch (error) {
      alert(`❌ Error al crear ingreso: ${error}`);
    }
  };

  const handleTestExpense = async () => {
    try {
      const id = await testAddExpense();
      alert(`✅ Gasto de prueba creado con ID: ${id}`);
    } catch (error) {
      alert(`❌ Error al crear gasto: ${error}`);
    }
  };

  const handleTestGetTransactions = async () => {
    try {
      const result = await testGetTransactions();
      alert(`📊 ${result.message}`);
    } catch (error) {
      alert(`❌ Error al obtener transacciones: ${error}`);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-blue-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">🧪</span>
        Panel de Pruebas Firestore
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleTestIncome}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
        >
          <span className="mr-2">💰</span>
          Crear Ingreso de Prueba
        </button>
        <button
          onClick={handleTestExpense}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
        >
          <span className="mr-2">💸</span>
          Crear Gasto de Prueba
        </button>
        <button
          onClick={handleTestGetTransactions}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
        >
          <span className="mr-2">📊</span>
          Ver Transacciones
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-4 text-center">
        Estos botones permiten probar las funciones de Firestore. Los datos se sincronizarán automáticamente.
      </p>
    </div>
  );
}