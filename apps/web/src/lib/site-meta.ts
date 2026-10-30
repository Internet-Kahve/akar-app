import type { HeritageSite } from "@akar/domain";

/** «1399 · Yıldırım Bayezid»: the parts a site has. */
export const siteMeta = (site: HeritageSite) =>
  [site.year, site.architect]
    .filter((value) => value && value !== "—")
    .join(" · ");
