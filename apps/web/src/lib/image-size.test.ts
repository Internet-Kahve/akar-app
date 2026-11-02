import assert from "node:assert/strict";
import test from "node:test";
import { sized } from "./image-size";

test("a catalogue photograph is asked for at about twice the width it is shown", () => {
  assert.equal(sized("/icerik/eserler/ulu-cami/icerik/foto/01.jpg", 64), "/_next/image?url=%2Ficerik%2Feserler%2Fulu-cami%2Ficerik%2Ffoto%2F01.jpg&w=128&q=75");
  assert.match(sized("https://abc.supabase.co/storage/v1/object/public/media/x.jpg", 300)!, /&w=640&q=75$/);
  assert.match(sized("/icerik/a.jpg", 5000)!, /&w=3840&/);
});

test("drawings, a visitor's own picture and other addresses stay as they are", () => {
  for (const src of ["/figma/a.svg", "data:image/png;base64,AA", "blob:http://x/1", "https://example.com/a.jpg", "/tanitim/harita.jpg", undefined])
    assert.equal(sized(src, 64), src);
});
