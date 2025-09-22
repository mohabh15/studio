import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, List, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useI18n } from '../hooks/useI18n';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

type TransactionsListProps = {
  transactions: Transaction[];
  categories: Category[];
};

export default function TransactionsList({ transactions, categories }: TransactionsListProps) {
  const { t } = useI18n();

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

  const renderTransaction = ({ item: transaction }: { item: Transaction }) => {
    const category = findCategory(transaction.category);
    const iconName = getIconName(category?.icon || 'briefcase');
    
    return (
      <List.Item
        title={transaction.merchant || 'N/A'}
        description={category ? t(category.name) : t('common.uncategorized')}
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
          <View style={styles.rightContainer}>
            <Chip 
              mode="outlined"
              textStyle={[
                styles.chipText,
                { color: transaction.type === 'income' ? '#2E8B57' : '#DC2626' }
              ]}
              style={[
                styles.chip,
                { 
                  backgroundColor: transaction.type === 'income' 
                    ? 'rgba(46, 139, 87, 0.1)' 
                    : 'rgba(220, 38, 38, 0.1)' 
                }
              ]}
            >
              {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
            </Chip>
            <Text style={styles.date}>
              {format(new Date(transaction.date), 'MMM d, yyyy')}
            </Text>
          </View>
        )}
      />
    );
  };

  if (sortedTransactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {t('transactions_page.no_transactions')}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sortedTransactions}
      renderItem={renderTransaction}
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
  rightContainer: {
    alignItems: 'flex-end',
  },
  chip: {
    marginBottom: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
});