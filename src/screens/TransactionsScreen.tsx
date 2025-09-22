import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '../hooks/useI18n';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { Transaction, Category } from '../types';
import { sampleTransactions } from '../data/sampleData';
import { defaultCategories } from '../constants/categories';
import TransactionsList from '../components/TransactionsList';

export default function TransactionsScreen() {
  const { t } = useI18n();
  
  const [transactions, setTransactions, transactionsLoaded] = useAsyncStorage<Transaction[]>('transactions', []);
  const [categories, setCategories, categoriesLoaded] = useAsyncStorage<Category[]>('categories', []);

  useEffect(() => {
    if (transactionsLoaded && transactions.length === 0) {
      setTransactions(sampleTransactions);
    }
  }, [transactionsLoaded, transactions.length, setTransactions]);

  useEffect(() => {
    if (categoriesLoaded && categories.length === 0) {
      setCategories(defaultCategories);
    }
  }, [categoriesLoaded, categories.length, setCategories]);

  if (!transactionsLoaded || !categoriesLoaded) {
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('transactions_page.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('transactions_page.description')}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Title title={t('transactions_page.all_transactions')} />
        <Card.Content>
          <TransactionsList transactions={transactions} categories={categories} />
        </Card.Content>
      </Card>
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
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    margin: 16,
    flex: 1,
  },
});