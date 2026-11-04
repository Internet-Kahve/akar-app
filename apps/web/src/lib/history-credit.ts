/**
 * An archive photograph's credit line, split as the prototype's Geçmişi Gör card shows it: «Fotoğraf: X · rest»
 * gives the photographer X (under the title, after the date) and the rest (the small source line).
 */
export function splitCredit(description: string): { by: string | null; rest: string } {
  const match = /^Fotoğraf:\s*([^·]*?)\s*·\s*(.*)$/.exec(description.trim());
  if (!match) return { by: null, rest: description.trim() };
  // The archive writes an unknown photographer as a name; the card says «Fotoğrafçı bilinmiyor» itself.
  const by = match[1] && !/^fotoğrafçı bilinmiyor$/i.test(match[1]) ? match[1] : null;
  return { by, rest: match[2]! };
}

/** The licence in a word or two after the source line: «CC0», «CC BY-SA», «Kamu malı», otherwise «Yazılı izin». */
export function shortLicense(license: string) {
  if (/^CC0/.test(license)) return "CC0";
  if (/^CC /.test(license)) return license.split(" ").slice(0, 2).join(" ");
  if (/^Kamu malı/.test(license)) return "Kamu malı";
  return "Yazılı izin";
}

/** The present-day photograph's credit without its «Fotoğraf:» lead, as it follows the old one's source line. */
export const presentCredit = (description: string) => description.replace(/^Fotoğraf:\s*/, "");
