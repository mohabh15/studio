import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useI18n } from '../hooks/useI18n';
import { Transaction, Budget, Category } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

type BudgetStatusProps = {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
};

export default function BudgetStatus({ transactions, budgets, categories }: BudgetStatusProps) {
  const { t } = useI18n();

  const budgetData = useMemo(() => {
    const currentMonthTxs = transactions.filter(
      tx => new Date(tx.date).getMonth() === new Date().getMonth() && tx.type === 'expense'
    );
    
    return budgets.map(budget => {
      const spent = currentMonthTxs
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const progress = Math.min(spent / budget.amount, 1);
      const category = categories.find(c => c.id === budget.category);
      
      return {
        ...budget,
        spent,
        remaining,
        progress,
        categoryName: t(category?.name || ''),
        categoryIcon: category?.icon || 'briefcase',
      };
    });
  }, [transactions, budgets, categories, t]);

  const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'basket': 'basket',
      'home': 'home',
      'car': 'car',
      'shirt': 'shirt',
      'film': 'film',
      'medical': 'medical',
      'gift': 'gift',
      'briefcase': 'briefcase',
      'business': 'business',
      'wallet': 'wallet',
    };
    return iconMap[iconName] || 'ellipse';
  };

  if (budgetData.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Title title={t('dashboard.budget_status.title')} />
        <Card.Content>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t('dashboard.budget_status.no_budgets')}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Title 
        title={t('dashboard.budget_status.title')}
        subtitle={t('dashboard.budget_status.description')}
      />
      <Card.Content>
        {budgetData.map(budget => (
          <View key={budget.id} style={styles.budgetItem}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetInfo}>
                <Ionicons 
                  name={getIconName(budget.categoryIcon)} 
                  size={20} 
                  color="#6B7280" 
                  style={styles.budgetIcon}
                />
                <Text style={styles.budgetCategory}>{budget.categoryName}</Text>
              </View>
              <Text style={styles.budgetAmount}>
                {formatCurrency(budget.spent)}
              </Text>
            </View>
            <ProgressBar 
              progress={budget.progress} 
              color="#2E8B57"
              style={styles.progressBar}
            />
            <Text style={styles.budgetTotal}>
              <Text style={styles.budgetTotalBold}>{formatCurrency(budget.amount)}</Text> Budget
            </Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  budgetItem: {
    marginBottom: 24,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    marginRight: 8,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  budgetTotal: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  budgetTotalBold: {
    fontWeight: 'bold',
  },
});