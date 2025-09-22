import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { I18nProvider } from './src/context/I18nContext';
import { theme } from './src/theme/theme';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import BudgetsScreen from './src/screens/BudgetsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { useI18n } from './src/hooks/useI18n';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Transactions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Budgets') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: t('nav.overview') }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{ tabBarLabel: t('nav.transactions') }}
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetsScreen}
        options={{ tabBarLabel: t('nav.budgets') }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: t('nav.settings') }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <StatusBar style="auto" />
            <TabNavigator />
          </NavigationContainer>
        </PaperProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}