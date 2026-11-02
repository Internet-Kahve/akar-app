/** Device key of the chosen theme; kept apart from theme.ts so the server layout can import it without React hooks. */
export const THEME_KEY = "akar.tema";
/**
 * Runs in <head> before the page paints (layout.tsx), so a visitor who chose night does not see the day theme first
 * (Next guide «Preventing flash before hydration»). Kept in step with theme.ts `storedTheme` and `applyTheme`.
 */
export const THEME_BOOT = `try{if(localStorage.getItem("${THEME_KEY}")==="night")document.documentElement.dataset.theme="night"}catch(e){}`;

/** The site's main page (Muhammed, 2 Nov 2026): the scrolled introduction; its buttons lead into the app. */
export const INTRO_PAGE = "/tanitim";
/**
 * Runs in <head> before the page paints: the bare address is the introduction. The app lives behind its views
 * (`/#view=map`, `/#view=detail&site=…`), which every button and link into it carries.
 */
export const INTRO_BOOT = `try{if(location.pathname==="/"&&!location.hash)location.replace("${INTRO_PAGE}")}catch(e){}`;
