import assert from "node:assert/strict";
import test from "node:test";
import { hasLocalMatch } from "next/dist/shared/lib/match-local-pattern.js";
import config from "../../next.config";
import { IMAGE_WIDTHS, sized } from "./image-size";

const photo = "/icerik/eserler/ulu-cami/icerik/foto/01.jpg";

/** CSS widths the screens pass to `sized`, and the one shared file each should get. */
const slots: [number, number, string][] = [
  [40, 96, "map pin"],
  [48, 96, "route stop"],
  [64, 256, "history button, same file as the strip"],
  [96, 256, "list, peek, detail header, blur"],
  [128, 256, "history strip"],
  [180, 384, "gallery, phone, small"],
  [300, 640, "gallery, phone, large"],
  [360, 750, "gallery, desktop, small"],
  [400, 828, "memory photograph"],
  [440, 1200, "model angle, same file as a large gallery tile"],
  [512, 1200, "story card at its largest"],
  [560, 1200, "gallery large, part card, puzzle"],
  [1200, 2560, "story, about cover, memory hero"],
];

test("a catalogue photograph is asked for at about twice the width it is shown", () => {
  assert.equal(sized(photo, 64), `/_next/image?url=${encodeURIComponent(photo)}&w=256&q=75`);
  assert.match(sized("https://abc.supabase.co/storage/v1/object/public/media/x.jpg", 300)!, /&w=640&q=75$/);
  assert.match(sized("/icerik/a.jpg", 5000)!, /&w=2560&/);
});

test("screens that show one photograph share a width instead of each inventing one", () => {
  const used = new Set<number>();
  for (const [css, w] of slots) {
    assert.match(sized(photo, css)!, new RegExp(`&w=${w}&q=75$`));
    used.add(w);
  }
  assert.deepEqual([...used], [96, 256, 384, 640, 750, 828, 1200, 2560]);
  assert.deepEqual([...used], IMAGE_WIDTHS);
});

test("the optimiser allowlist is exactly those widths, at one quality and one format", () => {
  const images = config.images!;
  assert.deepEqual([...(images.imageSizes ?? []), ...(images.deviceSizes ?? [])], IMAGE_WIDTHS);
  assert.deepEqual(images.qualities, [75]);
  assert.deepEqual(images.formats, ["image/webp"]);
  assert.equal(images.minimumCacheTTL, 2_678_400);
  assert.equal(hasLocalMatch(images.localPatterns, "/icerik/eserler/ulu-cami/icerik/foto/01.jpg"), true);
  assert.equal(hasLocalMatch(images.localPatterns, "/rozetler/ulu-hikaye.webp"), false);
  assert.equal(hasLocalMatch(images.localPatterns, "/tanitim/harita.jpg"), false);
});

test("drawings, a visitor's own picture and other addresses stay as they are", () => {
  for (const src of ["/figma/a.svg", "data:image/png;base64,AA", "blob:http://x/1", "https://example.com/a.jpg", "/tanitim/harita.jpg", undefined])
    assert.equal(sized(src, 64), src);
});
