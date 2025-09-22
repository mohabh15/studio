import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAsyncStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => Promise<void>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  const readValue = useCallback(async (): Promise<T> => {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading AsyncStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  useEffect(() => {
    const loadStoredValue = async () => {
      const value = await readValue();
      setStoredValue(value);
      setIsLoaded(true);
    };
    loadStoredValue();
  }, [readValue]);

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      await AsyncStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
    } catch (error) {
      console.warn(`Error setting AsyncStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isLoaded];
}