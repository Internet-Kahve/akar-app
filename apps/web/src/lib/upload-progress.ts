import { useSyncExternalStore } from "react";

let fraction: number | null = null;
const listeners = new Set<() => void>();

/** Fed by the API client's `onUploadProgress`: 0..1 while a photo uploads, `null` otherwise. */
export function setUploadProgress(next: number | null) {
  fraction = next;
  listeners.forEach((notify) => notify());
}

export function useUploadProgress(): number | null {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => void listeners.delete(notify);
    },
    () => fraction,
    () => null,
  );
}
