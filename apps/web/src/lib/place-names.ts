const BACK_VOWELS = "aıou";
const HARD_ENDINGS = "fstkçşhp";

/** «Bursa» → «Bursa'da», «Konya» → «Konya'da», «Hatay» → «Hatay'da»; `from` gives «Bursa'dan». */
export function cityCase(name: string, from = false) {
  const lower = name.toLocaleLowerCase("tr");
  const vowel = [...lower].reverse().find((c) => "aıoueiöü".includes(c)) ?? "a";
  const consonant = HARD_ENDINGS.includes(lower.slice(-1)) ? "t" : "d";
  return `${name}'${consonant}${BACK_VOWELS.includes(vowel) ? "a" : "e"}${from ? "n" : ""}`;
}

const VOWELS = "aeıioöuü";
const GENITIVE_VOWEL: Record<string, string> = { a: "ı", ı: "ı", e: "i", i: "i", o: "u", u: "u", ö: "ü", ü: "ü" };

/** «Ulucami» → «Ulucami'nin», «Koza Hanı» → «Koza Hanı'nın», «Bedesten» → «Bedesten'in» (prototype's `ilgi`). */
export function genitive(name: string) {
  const lower = name.toLocaleLowerCase("tr");
  const vowel = [...lower].reverse().find((c) => VOWELS.includes(c)) ?? "e";
  return `${name}'${VOWELS.includes(lower.slice(-1)) ? "n" : ""}${GENITIVE_VOWEL[vowel]}n`;
}

const ACCUSATIVE_VOWEL: Record<string, string> = { a: "ı", ı: "ı", e: "i", i: "i", o: "u", u: "u", ö: "ü", ü: "ü" };

/** «Ulucami» → «Ulucami'yi», «Koza Hanı» → «Koza Hanı'nı», «Bedesten» → «Bedesten'i» (prototype's `ziyaretEki`). */
export function accusative(name: string) {
  const lower = name.trim().toLocaleLowerCase("tr");
  const vowel = [...lower].reverse().find((c) => VOWELS.includes(c)) ?? "e";
  const buffer = VOWELS.includes(lower.slice(-1)) ? (/\s/.test(lower) ? "n" : "y") : "";
  return `${name.trim()}'${buffer}${ACCUSATIVE_VOWEL[vowel]}`;
}
