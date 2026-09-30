'use client';
import { useEffect, useState } from 'react';
import { today } from '../domain/finance';

export function useLocalDate() {
  const [date, setDate] = useState(today);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      setDate(today());
      // Cuiabá uses UTC−04; recompute on focus as suspended tabs throttle timers.
      const next = Date.parse(today() + 'T00:00:00-04:00') + 86_400_000;
      timer = setTimeout(refresh, Math.max(100, next - Date.now() + 50));
    };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return date;
}
