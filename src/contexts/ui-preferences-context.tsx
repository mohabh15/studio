'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UiPreferencesContextType {
  showDebts: boolean;
  toggleShowDebts: () => void;
}

const UiPreferencesContext = createContext<UiPreferencesContextType | undefined>(undefined);

export function UiPreferencesProvider({ children }: { children: ReactNode }) {
  const [showDebts, setShowDebts] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('showDebts');
    if (stored !== null) {
      setShowDebts(JSON.parse(stored));
    }
  }, []);

  const toggleShowDebts = () => {
    const newValue = !showDebts;
    setShowDebts(newValue);
    localStorage.setItem('showDebts', JSON.stringify(newValue));
  };

  return (
    <UiPreferencesContext.Provider value={{ showDebts, toggleShowDebts }}>
      {children}
    </UiPreferencesContext.Provider>
  );
}

export function useShowDebts() {
  const context = useContext(UiPreferencesContext);
  if (context === undefined) {
    throw new Error('useShowDebts must be used within a UiPreferencesProvider');
  }
  return context;
}