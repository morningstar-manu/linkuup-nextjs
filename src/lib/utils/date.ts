'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export function formatSelectedDate(date: Date): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useWeekManager() {
  const initialWeek = () => {
    const year = dayjs().format('YYYY');
    const week = dayjs().isoWeek();
    return `${year}-W${String(week).padStart(2, '0')}`;
  };

  const [week, setWeek] = useState(initialWeek());

  return {
    week,
    handleWeekChange: (newWeek: string) => setWeek(newWeek),
  };
}

export function useClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client only to avoid hydration mismatch
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}
