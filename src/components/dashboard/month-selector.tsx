'use client';

import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthName } from '@/lib/utils';

type MonthSelectorProps = {
  selectedYear: number;
  selectedMonth: number;
  updateSelectedMonth: (year: number, month: number) => void;
};

export default function MonthSelector({ selectedYear, selectedMonth, updateSelectedMonth }: MonthSelectorProps) {
  const { t, locale } = useI18n();

  const getMonthName = (year: number, month: number) => {
    return formatMonthName(year, month, locale);
  };

  const handlePreviousMonth = () => {
    const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    updateSelectedMonth(newYear, newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    updateSelectedMonth(newYear, newMonth);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    updateSelectedMonth(now.getFullYear(), now.getMonth());
  };

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        onClick={handleCurrentMonth}
        className="h-8 min-w-[140px] justify-center text-sm font-medium"
      >
        {getMonthName(selectedYear, selectedMonth)}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}