type Handler = { callback: (canGoBack: boolean) => boolean; priority: number };
const handlers = new Set<Handler>();

/** Nested screens consume Back before the app's navigation handler. */
export function registerNativeBack(
  callback: Handler["callback"],
  priority = 0,
) {
  const handler = { callback, priority };
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function consumeNativeBack(canGoBack: boolean) {
  for (const handler of [...handlers]
    .reverse()
    .sort((a, b) => b.priority - a.priority)) {
    if (handler.callback(canGoBack)) return true;
  }
  return false;
}
