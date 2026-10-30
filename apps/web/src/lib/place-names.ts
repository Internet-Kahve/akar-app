const BACK_VOWELS = "aıou";
const HARD_ENDINGS = "fstkçşhp";

/** «Bursa» → «Bursa'da», «Konya» → «Konya'da», «Hatay» → «Hatay'da»; `from` gives «Bursa'dan». */
export function cityCase(name: string, from = false) {
  const lower = name.toLocaleLowerCase("tr");
  const vowel = [...lower].reverse().find((c) => "aıoueiöü".includes(c)) ?? "a";
  const consonant = HARD_ENDINGS.includes(lower.slice(-1)) ? "t" : "d";
  return `${name}'${consonant}${BACK_VOWELS.includes(vowel) ? "a" : "e"}${from ? "n" : ""}`;
}
