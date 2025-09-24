import { useState, useEffect } from 'react';

export function useSelectedYear() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const stored = localStorage.getItem('selectedYear');
    if (stored) {
      setSelectedYear(parseInt(stored, 10));
    }
  }, []);

  const updateSelectedYear = (year: number) => {
    setSelectedYear(year);
    localStorage.setItem('selectedYear', year.toString());
  };

  return { selectedYear, updateSelectedYear };
}