import type { AkarClient, UsageEvent } from "@akar/api-client";
import type { UsageEventName } from "@akar/domain";

/**
 * Usage counting for the whole app (§11.72): components call `track` without passing the client down.
 * `AkarApp` sets the client once; events before that, or in tests, are dropped.
 */
let current: AkarClient | null = null;

export function setUsageClient(client: AkarClient | null) {
  current = client;
}

export function track(event: UsageEventName, siteId?: string, ref?: string | number) {
  const e: UsageEvent = { event };
  if (siteId !== undefined) e.siteId = siteId;
  if (ref !== undefined) e.ref = String(ref);
  current?.track(e);
}

/** Sends queued events while the page is being hidden or closed; returns the cleanup. */
export function flushUsageOnHide(): () => void {
  const flush = () => current?.flushUsage();
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", flush);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", flush);
  };
}
