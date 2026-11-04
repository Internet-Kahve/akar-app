import { useEffect, useRef } from "react";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { consumeNativeBack, registerNativeBack } from "./native-back";
import { currentTheme, subscribeTheme, type Theme } from "./theme";

export function useNativeBack(
  callback: (canGoBack: boolean) => boolean,
  priority = 0,
) {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(
    () => registerNativeBack((back) => latest.current(back), priority),
    [priority],
  );
}

/** Subscribe once; each listener is removed even if its async setup finishes after unmount. */
export function useNativeRuntime(onResume: () => void) {
  const resume = useRef(onResume);
  useEffect(() => {
    resume.current = onResume;
  });
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const setBars = (theme: Theme) => {
      void SystemBars.setStyle({
        style: theme === "night" ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      }).catch(() => {});
    };
    setBars(currentTheme());
    const unsubscribe = subscribeTheme(setBars);
    const listeners = [
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) resume.current();
        else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      }),
    ];
    if (Capacitor.getPlatform() === "android") {
      listeners.push(
        App.addListener("backButton", ({ canGoBack }) => {
          // Native <dialog> elements live in the top layer, above all app screens.
          const dialogs =
            document.querySelectorAll<HTMLDialogElement>("dialog[open]");
          const dialog = dialogs.item(dialogs.length - 1);
          if (dialog) {
            dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
            return;
          }
          if (!consumeNativeBack(canGoBack)) void App.minimizeApp();
        }),
      );
    }
    return () => {
      unsubscribe();
      for (const listener of listeners)
        void listener.then((handle) => handle.remove()).catch(() => {});
    };
  }, []);
}
