import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, RadioButton } from 'react-native-paper';

import { useI18n } from '../hooks/useI18n';
import { Locale } from '../types';

export default function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  const languages = [
    { code: 'en' as Locale, name: 'English' },
    { code: 'es' as Locale, name: 'Español' },
  ];

  return (
    <View style={styles.container}>
      {languages.map((language) => (
        <List.Item
          key={language.code}
          title={language.name}
          onPress={() => setLocale(language.code)}
          right={() => (
            <RadioButton
              value={language.code}
              status={locale === language.code ? 'checked' : 'unchecked'}
              onPress={() => setLocale(language.code)}
            />
          )}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
});