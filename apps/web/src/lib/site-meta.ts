import type { HeritageSite } from "@akar/domain";

/** «1399 · Yıldırım Bayezid»: the parts a site has. */
export const siteMeta = (site: HeritageSite) =>
  [site.year, site.architect]
    .filter((value) => value && value !== "—")
    .join(" · ");

/** A copy of `sites` in the catalog's rank (`eser.json` `sira`); unranked sites follow, by name. */
export const byDisplayOrder = <T extends HeritageSite>(sites: T[]) =>
  [...sites].sort(
    (a, b) =>
      (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity) ||
      a.name.localeCompare(b.name, "tr"),
  );
