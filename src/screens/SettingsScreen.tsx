import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, List, Button, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '../hooks/useI18n';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { Category, TransactionType } from '../types';
import { defaultCategories } from '../constants/categories';
import CategoriesList from '../components/CategoriesList';
import CategoryModal from '../components/CategoryModal';
import LanguageSelector from '../components/LanguageSelector';

export default function SettingsScreen() {
  const { t } = useI18n();
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [categories, setCategories, categoriesLoaded] = useAsyncStorage<Category[]>('categories', []);

  useEffect(() => {
    if (categoriesLoaded && categories.length === 0) {
      setCategories(defaultCategories);
    }
  }, [categoriesLoaded, categories.length, setCategories]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setModalVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setModalVisible(true);
  };

  const handleSaveCategory = async (categoryData: Omit<Category, 'id'>) => {
    const nameKey = categoryData.name.startsWith('categories.') 
      ? categoryData.name 
      : `categories.${categoryData.name.toLowerCase().replace(/\s+/g, '_')}`;

    if (editingCategory) {
      await setCategories(prev =>
        prev.map(c => (c.id === editingCategory.id ? { ...categoryData, name: nameKey, id: c.id } : c))
      );
    } else {
      const id = nameKey.replace('categories.', '');
      const newCategory = { ...categoryData, name: nameKey, id };
      await setCategories(prev => [...prev, newCategory]);
    }
    setModalVisible(false);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await setCategories(prev => prev.filter(c => c.id !== categoryId));
  };

  const renderCategorySection = (type: TransactionType, title: string, description: string) => {
    const filteredCategories = categories.filter(c => c.type === type);
    
    return (
      <Card style={styles.card} key={type}>
        <Card.Title 
          title={title}
          subtitle={description}
          right={(props) => (
            <Button mode="outlined" onPress={handleAddCategory} compact>
              {t('settings_page.add_category')}
            </Button>
          )}
        />
        <Card.Content>
          <CategoriesList 
            categories={filteredCategories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </Card.Content>
      </Card>
    );
  };

  if (!categoriesLoaded) {
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('settings_page.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('settings_page.description')}</Text>
        </View>

        <Card style={styles.card}>
          <Card.Title 
            title={t('settings_page.language_title')}
            subtitle={t('settings_page.language_description')}
          />
          <Card.Content>
            <LanguageSelector />
          </Card.Content>
        </Card>

        {renderCategorySection('expense', t('settings_page.expense_categories'), t('settings_page.manage_expense_categories'))}
        {renderCategorySection('income', t('settings_page.income_categories'), t('settings_page.manage_income_categories'))}
      </ScrollView>

      <Portal>
        <CategoryModal
          visible={isModalVisible}
          onDismiss={() => setModalVisible(false)}
          onSave={handleSaveCategory}
          category={editingCategory}
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
  scrollView: {
    flex: 1,
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
  },
});