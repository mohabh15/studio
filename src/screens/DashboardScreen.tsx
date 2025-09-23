import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useRealtimeTransactions, useRealtimeBudgets, useRealtimeCategories } from '../hooks/use-realtime';
import { FirestoreSyncStatus } from '../components/FirestoreSyncStatus';
import { FirestoreConfig } from '../components/FirestoreConfig';
import { FirestoreTestPanel } from '../components/FirestoreTestPanel';
import { Transaction, Budget, Category } from '../types';
import { sampleTransactions, sampleBudgets } from '../data/sampleData';
import { defaultCategories } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';
import SummaryCards from '../components/SummaryCards';
import RecentTransactions from '../components/RecentTransactions';
import BudgetStatus from '../components/BudgetStatus';
import AddTransactionModal from '../components/AddTransactionModal';
import { transactionService, budgetService, categoryService } from '../lib/firestore';
import { useFirestoreTransactionsContext } from '@/context/firestore-transactions-context';

export default function DashboardScreen() {
  const { t } = useI18n();
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  
  // Intentar usar el contexto de transacciones si está disponible
  let transactionsContext;
  try {
    transactionsContext = useFirestoreTransactionsContext();
  } catch (error) {
    // El contexto no está disponible, usar el hook realtime normal
    transactionsContext = null;
  }
  
  const { 
    transactions: realtimeTransactions, 
    loading: realtimeLoading, 
    error: realtimeError 
  } = useRealtimeTransactions();
  
  // Usar el contexto si está disponible, sino el realtime
  const transactions = transactionsContext?.transactions || realtimeTransactions;
  const transactionsLoading = transactionsContext?.loading ?? realtimeLoading;
  const transactionsError = transactionsContext?.error ?? realtimeError;
  
  const { 
    budgets, 
    loading: budgetsLoading, 
    error: budgetsError 
  } = useRealtimeBudgets();
  
  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError 
  } = useRealtimeCategories();



  // Inicializar datos de ejemplo si no hay datos en Firestore
  useEffect(() => {
    const hasInitialized = sessionStorage.getItem('budget3m_initialized');
    if (hasInitialized) return;
    
    const initializeSampleData = async () => {
      try {
        // Crear transacciones de ejemplo solo si no hay ninguna
        if (!transactionsLoading && transactions.length === 0 && !transactionsError) {
          for (const transaction of sampleTransactions) {
            await transactionService.createTransaction(transaction);
          }
        }
        
        // Crear presupuestos de ejemplo solo si no hay ninguno
        if (!budgetsLoading && budgets.length === 0 && !budgetsError) {
          for (const budget of sampleBudgets) {
            await budgetService.createBudget(budget);
          }
        }
        
        // Crear categorías por defecto solo si no hay ninguna
        if (!categoriesLoading && categories.length === 0 && !categoriesError) {
          for (const category of defaultCategories) {
            await categoryService.createCategory(category);
          }
        }
        
        // Marcar como inicializado para evitar duplicados en futuras cargas
        sessionStorage.setItem('budget3m_initialized', 'true');
      } catch (error) {
        console.error('Error al inicializar datos de ejemplo:', error);
      }
    };

    // Solo inicializar si no hay datos en ninguna colección
    const shouldInitialize = !transactionsLoading && !budgetsLoading && !categoriesLoading &&
                            transactions.length === 0 && budgets.length === 0 && categories.length === 0;
    
    if (shouldInitialize) {
      initializeSampleData();
    }
  }, [transactions.length, budgets.length, categories.length, transactionsLoading, budgetsLoading, categoriesLoading, transactionsError, budgetsError, categoriesError]);

  const summary = useMemo(() => {
    const currentMonthTxs = transactions.filter(tx => 
      new Date(tx.date).getMonth() === new Date().getMonth()
    );
    return currentMonthTxs.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    setIsCreatingTransaction(true);
    try {
      // Validaciones básicas
      if (!newTransaction.amount || newTransaction.amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }
      
      if (!newTransaction.category) {
        throw new Error('Debe seleccionar una categoría');
      }
      
      if (!newTransaction.merchant || newTransaction.merchant.trim() === '') {
        throw new Error('Debe ingresar un comerciante');
      }

      // Validar fecha no futura
      const transactionDate = new Date(newTransaction.date);
      const today = new Date();
      if (transactionDate > today) {
        throw new Error('La fecha no puede ser futura');
      }

      // Usar el contexto si está disponible, sino el servicio directo
      if (transactionsContext?.addTransaction) {
        await transactionsContext.addTransaction(newTransaction);
      } else {
        await transactionService.createTransaction(newTransaction);
      }
      
      setAddModalVisible(false);
    } catch (error) {
      console.error('Error al crear transacción:', error);
      // Aquí podrías añadir una notificación de error
      alert(error instanceof Error ? error.message : 'Error al crear la transacción');
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  if (transactionsLoading || budgetsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Panel de pruebas visible incluso durante la carga */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 border-b-4 border-blue-500 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <FirestoreTestPanel />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (transactionsError || budgetsError || categoriesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-red-800 font-semibold">Error</h3>
          </div>
          <p className="text-red-700 text-sm">
            Error al cargar datos: {transactionsError || budgetsError || categoriesError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Panel de pruebas en la parte superior - ULTRA VISIBLE */}
      <div className="bg-gradient-to-r from-blue-100 to-purple-100 border-b-4 border-blue-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <FirestoreTestPanel />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado de sincronización y configuración */}
        <div className="mb-8 space-y-4">
          <FirestoreSyncStatus />
          <FirestoreConfig />
        </div>

        {/* Encabezado */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h1 className="text-3xl font-bold text-gray-900">{t('app.title')}</h1>
          </div>
          
          <SummaryCards income={summary.income} expense={summary.expense} />
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentTransactions transactions={transactions} categories={categories} />
          <BudgetStatus transactions={transactions} budgets={budgets} categories={categories} />
        </div>
      </div>

      {/* Modal para añadir transacción - AHORA FUNCIONAL */}
      <AddTransactionModal
        visible={isAddModalVisible}
        onDismiss={() => setAddModalVisible(false)}
        onSave={handleAddTransaction}
        categories={categories}
        isLoading={isCreatingTransaction}
      />
    </div>
  );
}