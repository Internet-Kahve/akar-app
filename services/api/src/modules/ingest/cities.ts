import type { SiteSource } from "@akar/domain";

/** Per-city import settings. A new city = one entry here + its CSV files. */
export type CityConfig = {
  id: string;
  /** Also the OSM province name used by the Overpass query. */
  name: string;
  /** Geocoder results outside [minLng, minLat, maxLng, maxLat] are rejected. */
  bbox: [number, number, number, number];
  /** Canonical district spellings (OSM admin_level 6 names); CSV values are matched by `normalize()`. */
  districts: string[];
  /**
   * Paths inside the dataset (`origin/main:docs/documents-context/veri/` by default). Inventory
   * columns: id, cilt, sayfa, ilce, ad_ham, ad_supheli, tur, sablon, rol, olcu_sayisi, kubbe_gecisi, adres.
   */
  dataset: { inventory: string; osm: string };
  /** One bibliography entry per inventory volume (`cilt` column). */
  volumeSource: (volume: string) => SiteSource;
};

export const CITIES: Record<string, CityConfig> = {
  bursa: {
    id: "bursa",
    name: "Bursa",
    bbox: [28.1, 39.55, 30.1, 40.75],
    districts: [
      "Osmangazi",
      "Yıldırım",
      "Nilüfer",
      "Büyükorhan",
      "Gemlik",
      "Gürsu",
      "Harmancık",
      "İnegöl",
      "İznik",
      "Karacabey",
      "Keles",
      "Kestel",
      "Mudanya",
      "Mustafakemalpaşa",
      "Orhaneli",
      "Orhangazi",
      "Yenişehir",
    ],
    // eser-turleri.csv, not bursa_eserler.csv: same 408 rows plus row 409, but the districts of 45
    // volume-3 rows are corrected there and it carries the data team's `ad_supheli` flag.
    dataset: { inventory: "bursa/eser-turleri.csv", osm: "bursa/osm_secilen.csv" },
    volumeSource: (volume) => {
      const n = volume.replace(/\D+/g, "") || "?";
      return {
        id: `vgm-bursa-envanteri-cilt-${n}`,
        title: `Bursa Vakıf Eserleri Envanteri, Cilt ${n}`,
        kind: "book",
        author: "Vakıflar Genel Müdürlüğü",
        year: "",
        page: "",
        url: "",
        trust: "verified",
      };
    },
  },
};
