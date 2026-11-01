import type { CSSProperties } from "react";
import { validateCityIdentity, type CityIdentity } from "@akar/domain";

/** Where the pattern tiles are served from: `public/desenler`, the files of `design/desenler`. */
export const PATTERN_DIR = "/desenler/";

/**
 * The loading screens' custom properties from a city's identity (§11.49): `--city-accent` and `--city-pattern`
 * (a `url()` of the tile). A city without an identity, or one the renderer cannot draw, gets none and the screens
 * stay neutral.
 */
export function identityStyle(identity: CityIdentity | null): CSSProperties {
  if (!identity) return {};
  try {
    validateCityIdentity(identity);
  } catch {
    return {};
  }
  return {
    "--city-accent": identity.accent,
    "--city-pattern": `url("${PATTERN_DIR}${identity.pattern}")`,
    ...(identity.patternScale !== undefined && { "--city-pattern-scale": String(identity.patternScale) }),
    // The opening screen shows it at 30 px: the small cut where there is one.
    ...(identity.emblem !== undefined && {
      "--city-emblem": `url("${PATTERN_DIR}${identity.emblemSmall ?? identity.emblem}")`,
    }),
  } as CSSProperties;
}

/**
 * The same identity for the whole interface: `.app-shell` takes the active city's colour and motif, and every
 * surface that belongs to a place reads them from `--sehir-aksan`, `--sehir-acik` and `--sehir-desen`. The
 * shared interface stays neutral.
 */
export function cityIdentityStyle(identity: CityIdentity | null): CSSProperties {
  const base = identityStyle(identity);
  if (!identity || !("--city-accent" in base)) return {};
  return {
    ...base,
    "--sehir-aksan": identity.accent,
    "--sehir-acik": identity.patternColour,
    "--sehir-desen": `url("${PATTERN_DIR}${identity.pattern}")`,
    ...(identity.patternScale !== undefined && { "--sehir-desen-olcek": String(identity.patternScale) }),
    // The small cut where there is one: the chips that show it are 14 px.
    ...(identity.emblem !== undefined && {
      "--sehir-amblem": `url("${PATTERN_DIR}${identity.emblemSmall ?? identity.emblem}")`,
    }),
  } as CSSProperties;
}
