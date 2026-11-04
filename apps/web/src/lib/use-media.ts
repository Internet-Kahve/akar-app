import { useSyncExternalStore } from "react";

/** Whether `query` matches now, re-rendering when that changes; false on the server. */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

/** The phone layout of the CSS (`@media (max-width: 899.98px)`): bottom sheet and floating site card. */
export const PHONE_LAYOUT = "(max-width: 899.98px)";
