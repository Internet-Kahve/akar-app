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
  } as CSSProperties;
}
