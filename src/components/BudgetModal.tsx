import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, Card } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';

import { useI18n } from '../hooks/useI18n';
import { Budget, Category } from '../types';

type BudgetModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (budget: Omit<Budget, 'id'>) => void;
  budget: Budget | null;
  categories: Category[];
  existingBudgets: Budget[];
};

export default function BudgetModal({ 
  visible, 
  onDismiss, 
  onSave, 
  budget,
  categories,
  existingBudgets
}: BudgetModalProps) {
  const { t } = useI18n();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (visible) {
      if (budget) {
        setCategory(budget.category);
        setAmount(budget.amount.toString());
      } else {
        setCategory('');
        setAmount('');
      }
    }
  }, [visible, budget]);

  const availableCategories = categories.filter(c => 
    c.type === 'expense' && 
    (budget ? c.id === budget.category : !existingBudgets.some(b => b.category === c.id))
  );

  const handleSave = () => {
    if (!category || !amount) return;

    const budgetData: Omit<Budget, 'id'> = {
      category,
      amount: parseFloat(amount),
    };

    onSave(budgetData);
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <Text style={styles.title}>
          {budget ? t('budget_dialog.edit_title') : t('budget_dialog.add_title')}
        </Text>
        <Text style={styles.subtitle}>
          {budget ? t('budget_dialog.edit_description') : t('budget_dialog.add_description')}
        </Text>

        <Text style={styles.label}>{t('common.category')}</Text>
        <Card style={styles.pickerCard}>
          <Picker
            selectedValue={category}
            onValueChange={setCategory}
            style={styles.picker}
            enabled={!budget} // Disable if editing
          >
            <Picker.Item 
              label={t('budget_dialog.select_category')} 
              value="" 
            />
            {availableCategories.map(cat => (
              <Picker.Item 
                key={cat.id} 
                label={t(cat.name)} 
                value={cat.id} 
              />
            ))}
          </Picker>
        </Card>

        <TextInput
          label={t('common.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={onDismiss} style={styles.button}>
            {t('common.cancel')}
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSave} 
            style={styles.button}
            disabled={!category || !amount}
          >
            {t('common.save')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#1F2937',
  },
  pickerCard: {
    marginBottom: 16,
    height: 56,
    justifyContent: 'center',
  },
  picker: {
    height: 56,
  },
  input: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
});