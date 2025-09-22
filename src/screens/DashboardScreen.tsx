import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, FAB, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useI18n } from '../hooks/useI18n';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { Transaction, Budget, Category } from '../types';
import { sampleTransactions, sampleBudgets } from '../data/sampleData';
import { defaultCategories } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';
import SummaryCards from '../components/SummaryCards';
import RecentTransactions from '../components/RecentTransactions';
import BudgetStatus from '../components/BudgetStatus';
import AddTransactionModal from '../components/AddTransactionModal';

export default function DashboardScreen() {
  const { t } = useI18n();
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  
  const [transactions, setTransactions, transactionsLoaded] = useAsyncStorage<Transaction[]>('transactions', []);
  const [budgets, setBudgets, budgetsLoaded] = useAsyncStorage<Budget[]>('budgets', []);
  const [categories, setCategories, categoriesLoaded] = useAsyncStorage<Category[]>('categories', []);

  useEffect(() => {
    if (transactionsLoaded && transactions.length === 0) {
      setTransactions(sampleTransactions);
    }
  }, [transactionsLoaded, transactions.length, setTransactions]);

  useEffect(() => {
    if (budgetsLoaded && budgets.length === 0) {
      setBudgets(sampleBudgets);
    }
  }, [budgetsLoaded, budgets.length, setBudgets]);

  useEffect(() => {
    if (categoriesLoaded && categories.length === 0) {
      setCategories(defaultCategories);
    }
  }, [categoriesLoaded, categories.length, setCategories]);

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
    const transaction = {
      ...newTransaction,
      id: Date.now().toString(),
    };
    await setTransactions(prev => [transaction, ...prev]);
    setAddModalVisible(false);
  };

  if (!transactionsLoaded || !budgetsLoaded || !categoriesLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="wallet" size={28} color="#2E8B57" />
          <Text style={styles.headerTitle}>{t('app.title')}</Text>
        </View>

        <SummaryCards income={summary.income} expense={summary.expense} />
        
        <View style={styles.content}>
          <RecentTransactions transactions={transactions} categories={categories} />
          <BudgetStatus transactions={transactions} budgets={budgets} categories={categories} />
        </View>
      </ScrollView>

      <Portal>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setAddModalVisible(true)}
        />
        <AddTransactionModal
          visible={isAddModalVisible}
          onDismiss={() => setAddModalVisible(false)}
          onSave={handleAddTransaction}
          categories={categories}
        />
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1F2937',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
    backgroundColor: '#2E8B57',
  },
});