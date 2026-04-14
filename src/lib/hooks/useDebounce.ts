import { useState, useEffect } from 'react';

/**
 * Retarde la mise à jour d'une valeur après un délai (ms).
 * Utile pour éviter les re-renders à chaque frappe dans les champs de recherche.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
