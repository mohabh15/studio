import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, SegmentedButtons, Card } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';

import { useI18n } from '../hooks/useI18n';
import { Category, TransactionType } from '../types';

type CategoryModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (category: Omit<Category, 'id'>) => void;
  category: Category | null;
};

const iconOptions = [
  { label: 'Basket', value: 'basket' },
  { label: 'Home', value: 'home' },
  { label: 'Car', value: 'car' },
  { label: 'Shirt', value: 'shirt' },
  { label: 'Film', value: 'film' },
  { label: 'Medical', value: 'medical' },
  { label: 'Gift', value: 'gift' },
  { label: 'Briefcase', value: 'briefcase' },
  { label: 'Business', value: 'business' },
  { label: 'Wallet', value: 'wallet' },
];

export default function CategoryModal({ 
  visible, 
  onDismiss, 
  onSave, 
  category
}: CategoryModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [type, setType] = useState<TransactionType>('expense');

  useEffect(() => {
    if (visible) {
      if (category) {
        const nameWithoutPrefix = category.name.startsWith('categories.') 
          ? category.name.replace('categories.', '')
          : category.name;
        setName(nameWithoutPrefix);
        setIcon(category.icon);
        setType(category.type);
      } else {
        setName('');
        setIcon('');
        setType('expense');
      }
    }
  }, [visible, category]);

  const handleSave = () => {
    if (!name || !icon) return;

    const categoryData: Omit<Category, 'id'> = {
      name,
      icon,
      type,
    };

    onSave(categoryData);
  };

  const typeButtons = [
    { value: 'expense', label: t('common.expense') },
    { value: 'income', label: t('common.income') },
  ];

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <Text style={styles.title}>
          {category ? t('category_dialog.edit_title') : t('category_dialog.add_title')}
        </Text>
        <Text style={styles.subtitle}>
          {category ? t('category_dialog.edit_description') : t('category_dialog.add_description')}
        </Text>

        <TextInput
          label={t('category_dialog.name')}
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          placeholder={t('category_dialog.name_placeholder')}
        />

        <Text style={styles.label}>{t('category_dialog.icon')}</Text>
        <Card style={styles.pickerCard}>
          <Picker
            selectedValue={icon}
            onValueChange={setIcon}
            style={styles.picker}
          >
            <Picker.Item 
              label={t('category_dialog.icon_placeholder')} 
              value="" 
            />
            {iconOptions.map(option => (
              <Picker.Item 
                key={option.value} 
                label={option.label} 
                value={option.value} 
              />
            ))}
          </Picker>
        </Card>

        <Text style={styles.label}>{t('category_dialog.type')}</Text>
        <SegmentedButtons
          value={type}
          onValueChange={(value) => setType(value as TransactionType)}
          buttons={typeButtons}
          style={styles.segmentedButtons}
        />

        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={onDismiss} style={styles.button}>
            {t('common.cancel')}
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSave} 
            style={styles.button}
            disabled={!name || !icon}
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
  input: {
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
  segmentedButtons: {
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