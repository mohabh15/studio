import React from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, List, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useI18n } from '../hooks/useI18n';
import { Budget, Category } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

type BudgetsListProps = {
  budgets: Budget[];
  categories: Category[];
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
};

export default function BudgetsList({ budgets, categories, onEdit, onDelete }: BudgetsListProps) {
  const { t } = useI18n();

  const findCategory = (id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  };

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

  const handleDelete = (budget: Budget) => {
    Alert.alert(
      t('budgets_page.delete_dialog_title'),
      t('budgets_page.delete_dialog_description'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => onDelete(budget.id),
        },
      ]
    );
  };

  const renderBudget = ({ item: budget }: { item: Budget }) => {
    const category = findCategory(budget.category);
    const iconName = getIconName(category?.icon || 'briefcase');
    
    return (
      <List.Item
        title={category ? t(category.name) : t('common.uncategorized')}
        description={formatCurrency(budget.amount)}
        left={(props) => (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={iconName} 
              size={20} 
              color="#6B7280" 
            />
          </View>
        )}
        right={() => (
          <View style={styles.actionsContainer}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => onEdit(budget)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#DC2626"
              onPress={() => handleDelete(budget)}
            />
          </View>
        )}
      />
    );
  };

  if (budgets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {t('budgets_page.no_budgets')}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={budgets}
      renderItem={renderBudget}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});