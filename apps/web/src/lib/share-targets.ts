/**
 * Share buttons for apps (6 Nov 2026: «Instagram, X, WhatsApp çıkması gerekiyor»). WhatsApp, X and Facebook take a
 * sentence and the app's address through their own share pages; a picture cannot go that way, so the card goes as a
 * file only through the system sheet (HTTPS) or a download. Instagram has no web share page at all: its button shares
 * the file where the sheet exists, and otherwise downloads it and opens Instagram to add it to a story.
 */
export type ShareTarget = "whatsapp" | "x" | "facebook";

/** The app's address in a shared sentence: this page's own on HTTPS, the public site on a local or plain-http one. */
export const PUBLIC_SITE = "https://www.internetkahve.com.tr";
export function shareAddress(location: { protocol: string; hostname: string; origin: string }): string {
  const local = /^(localhost|127\.|10\.|192\.168\.|\[::1\])/.test(location.hostname);
  return location.protocol === "https:" && !local ? location.origin : PUBLIC_SITE;
}

export function shareTargetUrl(target: ShareTarget, text: string, url: string): string {
  const e = encodeURIComponent;
  switch (target) {
    case "whatsapp":
      return `https://wa.me/?text=${e(`${text} ${url}`)}`;
    case "x":
      return `https://x.com/intent/post?text=${e(text)}&url=${e(url)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${e(url)}&quote=${e(text)}`;
  }
}

/** Where Instagram opens after the card is downloaded: the story camera in the phone's app, the site elsewhere. */
export function instagramOpenUrl(phone: boolean): string {
  return phone ? "instagram://story-camera" : "https://www.instagram.com/";
}
