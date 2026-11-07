import { createRoot } from "react-dom/client";
import { AkarApp } from "../../apps/web/src/components/akar-app";
import { INTRO_BOOT } from "../../apps/web/src/lib/theme-boot";

// Run the same pre-hydration redirect as the app, including the OAuth return guard.
Function(INTRO_BOOT)();
createRoot(document.getElementById("root")!).render(<AkarApp />);
