import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, FAB, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '../hooks/useI18n';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { Budget, Category } from '../types';
import { sampleBudgets } from '../data/sampleData';
import { defaultCategories } from '../constants/categories';
import BudgetsList from '../components/BudgetsList';
import BudgetModal from '../components/BudgetModal';

export default function BudgetsScreen() {
  const { t } = useI18n();
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  const [budgets, setBudgets, budgetsLoaded] = useAsyncStorage<Budget[]>('budgets', []);
  const [categories, setCategories, categoriesLoaded] = useAsyncStorage<Category[]>('categories', []);

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

  const handleAddBudget = () => {
    setEditingBudget(null);
    setModalVisible(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setModalVisible(true);
  };

  const handleSaveBudget = async (budgetData: Omit<Budget, 'id'>) => {
    if (editingBudget) {
      await setBudgets(prev =>
        prev.map(b => (b.id === editingBudget.id ? { ...budgetData, id: b.id } : b))
      );
    } else {
      const newBudget = { ...budgetData, id: Date.now().toString() };
      await setBudgets(prev => [...prev, newBudget]);
    }
    setModalVisible(false);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    await setBudgets(prev => prev.filter(b => b.id !== budgetId));
  };

  if (!budgetsLoaded || !categoriesLoaded) {
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
        <Text style={styles.headerTitle}>{t('budgets_page.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('budgets_page.description')}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Title title={t('budgets_page.all_budgets')} />
        <Card.Content>
          <BudgetsList 
            budgets={budgets} 
            categories={categories}
            onEdit={handleEditBudget}
            onDelete={handleDeleteBudget}
          />
        </Card.Content>
      </Card>

      <Portal>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddBudget}
        />
        <BudgetModal
          visible={isModalVisible}
          onDismiss={() => setModalVisible(false)}
          onSave={handleSaveBudget}
          budget={editingBudget}
          categories={categories}
          existingBudgets={budgets}
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
    backgroundColor: '#2E8B57',
  },
});