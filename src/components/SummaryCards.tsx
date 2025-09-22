import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useI18n } from '../hooks/useI18n';
import { formatCurrency } from '../utils/formatCurrency';

type SummaryCardsProps = {
  income: number;
  expense: number;
};

export default function SummaryCards({ income, expense }: SummaryCardsProps) {
  const { t } = useI18n();
  const balance = income - expense;

  const cards = [
    {
      title: t('dashboard.summary.total_income'),
      amount: income,
      icon: 'trending-up',
      color: '#2E8B57',
    },
    {
      title: t('dashboard.summary.total_expenses'),
      amount: expense,
      icon: 'trending-down',
      color: '#DC2626',
    },
    {
      title: t('dashboard.summary.balance'),
      amount: balance,
      icon: 'wallet',
      color: '#6B7280',
    },
  ];

  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <Card key={index} style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Ionicons name={card.icon as any} size={20} color={card.color} />
            </View>
            <Text style={[styles.cardAmount, { color: card.color }]}>
              {formatCurrency(card.amount)}
            </Text>
            <Text style={styles.cardSubtitle}>
              {t('dashboard.summary.this_month')}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  card: {
    flex: 1,
  },
  cardContent: {
    paddingVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});