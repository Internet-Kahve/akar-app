import test from "node:test";
import assert from "node:assert/strict";
import type { HistoryImage, SampleTrace, SitePhoto } from "@akar/domain";
import { ARCHIVE_PAIR_BY, pairOf } from "./history-pair";

const photo = (id: string): SitePhoto => ({
  id,
  src: `/${id}.webp`,
  alt: id,
  title: "",
  titleEn: "",
  description: `Fotoğraf: ${id}`,
  sourceId: "",
  license: "Lisans",
  trust: "verified",
});
const image = (id: string, extra: Partial<HistoryImage> = {}): HistoryImage => ({
  id,
  photo: photo(`old-${id}`),
  caption: id,
  dateLabel: "1930",
  sourceId: "",
  trust: "verified",
  ...extra,
});
const trace = (id: string, historyImageId: string | undefined, addedOn: string, extra: Partial<SampleTrace> = {}): SampleTrace => ({
  id,
  author: "AKAR ekibi",
  text: id,
  photo: photo(id),
  addedOn,
  ...(historyImageId && { historyImageId }),
  ...extra,
});

test("the archive's own pair wins and keeps its angle word; it is not an example", () => {
  const archive = image("a", { presentPhoto: photo("now"), presentAngleMatch: "near" });
  const pair = pairOf({ sampleTraces: [trace("iz", "a", "2026-10-28", { angleMatch: "same" })] }, archive);
  assert.deepEqual(pair, { photo: photo("now"), by: ARCHIVE_PAIR_BY, example: false, angleMatch: "near" });
});

test("without an archive pair the newest sample of that photograph's view stands in, tagged as an example; a later one wins a tie", () => {
  const site = {
    sampleTraces: [
      trace("old", "a", "2026-10-01", { author: "Eski", angleMatch: "same" }),
      trace("other-photo", "b", "2026-12-01"),
      trace("newest", "a", "2026-10-29", { author: "Yeni", angleMatch: "near" }),
      trace("no-link", undefined, "2027-01-01"),
    ],
  };
  const pair = pairOf(site, image("a"));
  assert.deepEqual([pair?.photo.id, pair?.by, pair?.example, pair?.angleMatch], ["newest", "Yeni", true, "near"]);
  const tie = pairOf({ sampleTraces: [trace("first", "a", "2026-10-29"), trace("second", "a", "2026-10-29")] }, image("a"));
  assert.equal(tie?.photo.id, "second");
});

test("nothing else is presented as a pair", () => {
  assert.equal(pairOf({}, image("a")), null);
  assert.equal(pairOf({ sampleTraces: [] }, image("a")), null);
  assert.equal(pairOf({ sampleTraces: [trace("iz", undefined, "2026-10-28"), trace("elsewhere", "b", "2026-10-28")] }, image("a")), null);
});
