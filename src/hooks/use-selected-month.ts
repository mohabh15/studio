import { useState, useEffect } from 'react';

export function useSelectedMonth() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  useEffect(() => {
    const storedYear = localStorage.getItem('selectedYear');
    const storedMonth = localStorage.getItem('selectedMonth');

    if (storedYear && storedMonth) {
      setSelectedYear(parseInt(storedYear, 10));
      setSelectedMonth(parseInt(storedMonth, 10));
    }
  }, []);

  const updateSelectedMonth = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    localStorage.setItem('selectedYear', year.toString());
    localStorage.setItem('selectedMonth', month.toString());
  };

  return {
    selectedYear,
    selectedMonth,
    updateSelectedMonth,
    selectedDate: { year: selectedYear, month: selectedMonth }
  };
}