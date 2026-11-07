import assert from "node:assert/strict";
import { test } from "node:test";
import type { SiteDetail } from "../catalog/schemas.ts";
import { catalogContext, siteContext, systemPrompt } from "./service.ts";

const site = {
  id: "ulu",
  name: "Ulu Cami",
  nameEn: "Great Mosque",
  city: { id: "bursa", name: "Bursa" },
  year: "1399",
  architect: "Ali",
  patron: "Bayezid",
  era: "Osmanlı",
  address: "Bursa",
  district: "Osmangazi",
  kind: "cami",
  role: "hayrat",
  description: "Tanıtım",
  descriptionEn: "Introduction",
  sourceSummary: "Bursa Envanteri, s. 42",
  sources: [
    {
      id: "book",
      title: "Bursa Envanteri",
      page: "s. 42",
      url: "https://example.org/book",
    },
  ],
  stories: [
    {
      title: "Hikâye",
      text: "Minber ceviz ağacındandır.",
      textEn: "The pulpit is walnut.",
      sourceId: "book",
    },
  ],
  sections: [
    { title: "Mimari", body: "Yirmi kubbe vardır.", sourceId: "book" },
  ],
  partCards: [
    { title: "Minber", body: "Kündekâri tekniği.", sourceId: "book" },
  ],
  cards: [{ title: "Kitabe", body: "Kitabe metni.", sourceId: "book" }],
  historyImages: [
    { dateLabel: "1890", caption: "Eski meydan.", sourceId: "book" },
  ],
  tasks: [{ answer: "gizli yarışma cevabı" }],
} as unknown as SiteDetail;

test("local context includes published content and inventory facts with provenance, excluding editorial data and quiz answers", () => {
  const context = siteContext(site, "tr", {
    measurements: 4,
    domeTransitions: "Türk üçgeni",
    nameWarning: "gizli editör notu",
    rawAddress: "özel adres",
  });
  for (const text of [
    "ceviz",
    "Yirmi kubbe",
    "Kündekâri",
    "Kitabe metni",
    "Eski meydan",
    "Türk üçgeni",
    "Ölçü sayısı: 4",
    "Bursa Envanteri",
    "s. 42",
  ])
    assert.ok(context.text.includes(text), text);
  assert.doesNotMatch(context.text, /gizli|özel adres/);
  assert.equal(context.refs.get("s1")?.source?.url, "https://example.org/book");
  assert.equal(context.refs.get("i")?.kind, "inventory");
  assert.match(siteContext(site, "en").text, /The pulpit is walnut/);
});

test("general chat receives detailed source blocks, with unique keys for each site", () => {
  const other = { ...site, id: "other", name: "Diğer Eser" };
  const context = catalogContext(
    [site, other],
    "tr",
    [siteContext(site, "tr"), siteContext(other, "tr")],
    "Ulu Cami minberi",
  );
  assert.match(context.text, /ceviz ağacındandır/);
  assert.equal(context.refs.get("c1_s1")?.siteId, "ulu");
  assert.equal(context.refs.get("c2_s1")?.siteId, "other");
  assert.match(systemPrompt(context, "tr"), /Bunlar yeterliyse needsWeb=false/);
  assert.match(
    systemPrompt(context, "tr"),
    /Genel hafızandan tarihî iddia ekleme/,
  );
});
