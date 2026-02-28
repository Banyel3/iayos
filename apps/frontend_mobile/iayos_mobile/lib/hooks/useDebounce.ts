/**
 * useDebounce
 * Returns a debounced version of `value` that trails by `delay` ms.
 * Useful for delaying search API calls while the user is still typing.
 *
 * @example
 *   const debouncedQuery = useDebounce(searchQuery, 400);
 *   useEffect(() => { fetchResults(debouncedQuery); }, [debouncedQuery]);
 */

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
