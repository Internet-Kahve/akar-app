import { createHash } from "node:crypto";
import type { NarrationLang } from "../../db/schema/narrations.ts";

/**
 * The text a voice reads. The Turkish voices (Deepgram Flux, early access) do not normalize numbers themselves, so the
 * API writes digits out as words before the call; the stored story text is never changed (decision §11.56).
 */

const ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
const SCALES: [number, string][] = [
  [1_000_000_000, "milyar"],
  [1_000_000, "milyon"],
  [1_000, "bin"],
];
/** Ordinal form of the last word of a cardinal. */
const ORDINAL: Record<string, string> = {
  sıfır: "sıfırıncı",
  bir: "birinci",
  iki: "ikinci",
  üç: "üçüncü",
  dört: "dördüncü",
  beş: "beşinci",
  altı: "altıncı",
  yedi: "yedinci",
  sekiz: "sekizinci",
  dokuz: "dokuzuncu",
  on: "onuncu",
  yirmi: "yirminci",
  otuz: "otuzuncu",
  kırk: "kırkıncı",
  elli: "ellinci",
  altmış: "altmışıncı",
  yetmiş: "yetmişinci",
  seksen: "sekseninci",
  doksan: "doksanıncı",
  yüz: "yüzüncü",
  bin: "bininci",
  milyon: "milyonuncu",
  milyar: "milyarıncı",
};

/** Largest number written out; anything bigger keeps its digits. */
const LIMIT = 1_000_000_000_000;

function below1000(n: number): string {
  const words: string[] = [];
  const hundreds = Math.floor(n / 100);
  if (hundreds === 1) words.push("yüz");
  else if (hundreds > 1) words.push(ONES[hundreds]!, "yüz");
  const tens = Math.floor((n % 100) / 10);
  if (tens) words.push(TENS[tens]!);
  if (n % 10) words.push(ONES[n % 10]!);
  return words.join(" ");
}

/** 1399 → "bin üç yüz doksan dokuz". `null` when the number is too big to write out. */
export function cardinal(n: number): string | null {
  if (!Number.isSafeInteger(n) || n < 0 || n >= LIMIT) return null;
  if (n === 0) return "sıfır";
  const words: string[] = [];
  let rest = n;
  for (const [size, name] of SCALES) {
    const count = Math.floor(rest / size);
    rest %= size;
    if (!count) continue;
    // "bin", not "bir bin"; "bir milyon" keeps its one.
    words.push(size === 1_000 && count === 1 ? name : `${below1000(count)} ${name}`);
  }
  if (rest) words.push(below1000(rest));
  return words.join(" ");
}

/** 13 → "on üçüncü". */
export function ordinal(n: number): string | null {
  const words = cardinal(n);
  if (!words) return null;
  const at = words.lastIndexOf(" ") + 1;
  return words.slice(0, at) + (ORDINAL[words.slice(at)] ?? words.slice(at));
}

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
function fromRoman(s: string): number {
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const v = ROMAN[s[i]!]!;
    total += v < (ROMAN[s[i + 1]!] ?? 0) ? -v : v;
  }
  return total;
}

/** "dört" turns "dörd" before a suffix that starts with a vowel: dördüncü, dörde. The other number words stay as they are. */
function attach(words: string, suffix: string): string {
  const s = suffix.toLocaleLowerCase("tr");
  return words.endsWith("dört") && /^[aeıioöuüâîû]/.test(s) ? `${words.slice(0, -1)}d${s}` : words + s;
}

/** The fraction after the comma is read as a number, its leading zeros one by one: 3,05 → üç virgül sıfır beş. */
function fraction(digits: string): string | null {
  const zeros = /^0*/.exec(digits)![0].length;
  const rest = digits.slice(zeros);
  const words = rest ? cardinal(Number(rest)) : "";
  return words === null ? null : [...Array<string>(zeros).fill("sıfır"), words].filter(Boolean).join(" ");
}

// A number not glued to letters or digits: thousands with dots (1.250) or plain digits, an optional decimal part,
// then an ordinal dot (before a lower-case word), an apostrophe suffix, or nothing.
const NUMBER = /(?<![\p{L}\d])(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(?:(\.)(?=\s+\p{Ll})|['’ʼ](\p{L}+))?(?![\p{L}\d])/gu;
const ROMAN_ORDINAL = /(?<![\p{L}\d])([IVXLC]+)\.(?=\s+(?:yüzyıl|asır))/gu;

/** Rewrites digits, ordinals (13. yüzyıl), apostrophe suffixes (1399'da, 1400'lerde) and a few abbreviations as spoken Turkish. */
export function turkishSpokenText(text: string): string {
  return text
    .replace(/M\.\s?Ö\./g, "milattan önce")
    .replace(/M\.\s?S\./g, "milattan sonra")
    .replace(/%\s*(\d+(?:,\d+)?)/g, "yüzde $1")
    .replace(/(\d+(?:,\d+)?)\s*%/g, "yüzde $1")
    .replace(ROMAN_ORDINAL, (whole, roman: string) => ordinal(fromRoman(roman)) ?? whole)
    .replace(NUMBER, (whole, int: string, frac: string | undefined, dot: string | undefined, suffix: string | undefined) => {
      const value = Number(int.replaceAll(".", ""));
      if (dot) return ordinal(value) ?? whole;
      const words = cardinal(value);
      if (words === null) return whole;
      if (frac !== undefined) {
        const decimals = fraction(frac);
        return decimals === null ? whole : `${words} virgül ${decimals}`;
      }
      return suffix ? attach(words, suffix) : words;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/** Whitespace-collapsed text: what the English voices read. */
export function plainSpokenText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** The text the voice of `lang` reads for `text`. */
export function spokenText(lang: NarrationLang, text: string): string {
  return lang === "tr" ? turkishSpokenText(text) : plainSpokenText(text);
}

/** Identity of one recording: the voice model and the spoken text. A different hash means the recording is stale. */
export function narrationHash(model: string, spoken: string): string {
  return createHash("sha256").update(model).update("\n").update(spoken).digest("hex");
}
