import { useEffect, useRef } from "react";

/**
 * Counts an opening once per change of `key` (`undefined` = nothing open); a key that stays the same, or the second
 * run of an effect under React StrictMode, counts nothing. Closing and opening again counts again.
 */
export function useCountOpen(key: string | undefined, count: (key: string) => void) {
  const last = useRef<string | undefined>(undefined);
  const latest = useRef(count);
  latest.current = count;
  useEffect(() => {
    if (key !== undefined && key !== last.current) latest.current(key);
    last.current = key;
  }, [key]);
}
