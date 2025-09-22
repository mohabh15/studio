import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, SegmentedButtons, Card } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useI18n } from '../hooks/useI18n';
import { Transaction, TransactionType, Category } from '../types';

type AddTransactionModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  categories: Category[];
};

export default function AddTransactionModal({ 
  visible, 
  onDismiss, 
  onSave, 
  categories 
}: AddTransactionModalProps) {
  const { t } = useI18n();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState('');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setType('expense');
      setAmount('');
      setDate(new Date());
      setCategory('');
      setMerchant('');
      setNotes('');
    }
  }, [visible]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleScanReceipt = async () => {
    try {
      setIsScanning(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        // Here you would implement OCR scanning
        // For now, we'll just show a success message
        setMerchant('Scanned Store');
        setAmount('25.99');
      }
    } catch (error) {
      console.error('Error scanning receipt:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = () => {
    if (!amount || !category) return;

    const transaction: Omit<Transaction, 'id'> = {
      type,
      amount: parseFloat(amount),
      date: date.toISOString(),
      category,
      merchant: merchant || undefined,
      notes: notes || undefined,
    };

    onSave(transaction);
  };

  const typeButtons = [
    { value: 'expense', label: t('common.expense') },
    { value: 'income', label: t('common.income') },
  ];

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{t('add_transaction_dialog.title')}</Text>
          <Text style={styles.subtitle}>{t('add_transaction_dialog.description')}</Text>

          <Button
            mode="outlined"
            onPress={handleScanReceipt}
            loading={isScanning}
            disabled={isScanning}
            style={styles.scanButton}
            icon={() => <Ionicons name="scan" size={20} color="#2E8B57" />}
          >
            {isScanning ? t('add_transaction_dialog.scanning') : t('add_transaction_dialog.scan_receipt')}
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('add_transaction_dialog.or_manual')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <SegmentedButtons
            value={type}
            onValueChange={(value) => setType(value as TransactionType)}
            buttons={typeButtons}
            style={styles.segmentedButtons}
          />

          <TextInput
            label={t('add_transaction_dialog.amount')}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                {date.toLocaleDateString()}
              </Button>
            </View>

            <View style={styles.halfWidth}>
              <Card style={styles.pickerCard}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                >
                  <Picker.Item 
                    label={t('add_transaction_dialog.select_category')} 
                    value="" 
                  />
                  {filteredCategories.map(cat => (
                    <Picker.Item 
                      key={cat.id} 
                      label={t(cat.name)} 
                      value={cat.id} 
                    />
                  ))}
                </Picker>
              </Card>
            </View>
          </View>

          <TextInput
            label={t('add_transaction_dialog.merchant')}
            value={merchant}
            onChangeText={setMerchant}
            mode="outlined"
            style={styles.input}
            placeholder={t('add_transaction_dialog.merchant_placeholder')}
          />

          <TextInput
            label={t('add_transaction_dialog.notes')}
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder={t('add_transaction_dialog.notes_placeholder')}
          />

          <View style={styles.buttonRow}>
            <Button mode="outlined" onPress={onDismiss} style={styles.button}>
              {t('common.cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSave} 
              style={styles.button}
              disabled={!amount || !category}
            >
              {t('add_transaction_dialog.save_transaction')}
            </Button>
          </View>
        </ScrollView>

        <DatePicker
          modal
          open={showDatePicker}
          date={date}
          mode="date"
          onConfirm={(selectedDate) => {
            setShowDatePicker(false);
            setDate(selectedDate);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
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
    maxHeight: '90%',
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
  scanButton: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  dateButton: {
    height: 56,
    justifyContent: 'center',
  },
  pickerCard: {
    height: 56,
    justifyContent: 'center',
  },
  picker: {
    height: 56,
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