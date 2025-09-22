import React from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, List, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useI18n } from '../hooks/useI18n';
import { Category } from '../types';

type CategoriesListProps = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
};

export default function CategoriesList({ categories, onEdit, onDelete }: CategoriesListProps) {
  const { t } = useI18n();

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

  const handleDelete = (category: Category) => {
    Alert.alert(
      t('settings_page.delete_dialog_title'),
      t('settings_page.delete_dialog_description'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => onDelete(category.id),
        },
      ]
    );
  };

  const renderCategory = ({ item: category }: { item: Category }) => {
    const iconName = getIconName(category.icon);
    
    return (
      <List.Item
        title={t(category.name)}
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
              onPress={() => onEdit(category)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#DC2626"
              onPress={() => handleDelete(category)}
            />
          </View>
        )}
      />
    );
  };

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No categories available
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={categories}
      renderItem={renderCategory}
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