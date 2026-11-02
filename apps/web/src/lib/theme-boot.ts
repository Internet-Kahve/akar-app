/** Device key of the chosen theme; kept apart from theme.ts so the server layout can import it without React hooks. */
export const THEME_KEY = "akar.tema";
/**
 * Runs in <head> before the page paints (layout.tsx), so a visitor who chose night does not see the day theme first
 * (Next guide «Preventing flash before hydration»). Kept in step with theme.ts `storedTheme` and `applyTheme`.
 */
export const THEME_BOOT = `try{if(localStorage.getItem("${THEME_KEY}")==="night")document.documentElement.dataset.theme="night"}catch(e){}`;

/** Device key set by the introduction page (`/tanitim/yeni/`) once it has been shown. */
export const INTRO_KEY = "akar.tanitim";
/** Where a first visit begins (Muhammed, 2 Nov 2026): the scrolled introduction, whose «Haritayı aç» opens the map. */
export const INTRO_PAGE = "/tanitim/yeni/index.html";
/**
 * Runs in <head> before the page paints: a first visit to the bare address goes to the introduction. A visitor who has
 * seen it (or the map's welcome card) and every link into the app (`/#view=…`) opens the app itself.
 */
export const INTRO_BOOT = `try{if(location.pathname==="/"&&!location.hash&&!localStorage.getItem("${INTRO_KEY}")&&!localStorage.getItem("akar.karsilama"))location.replace("${INTRO_PAGE}")}catch(e){}`;
