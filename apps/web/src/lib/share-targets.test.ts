import assert from "node:assert/strict";
import test from "node:test";
import { instagramOpenUrl, PUBLIC_SITE, shareAddress, shareTargetUrl } from "./share-targets";

test("each app gets the sentence and the address through its own share page", () => {
  const text = "AKAR'da bu hafta 3 yeni rozet kazandım!";
  const url = "https://www.internetkahve.com.tr";
  const wa = new URL(shareTargetUrl("whatsapp", text, url));
  assert.equal(wa.host, "wa.me");
  assert.equal(wa.searchParams.get("text"), `${text} ${url}`);
  const x = new URL(shareTargetUrl("x", text, url));
  assert.equal(x.host, "x.com");
  assert.equal(x.pathname, "/intent/post");
  assert.equal(x.searchParams.get("text"), text);
  assert.equal(x.searchParams.get("url"), url);
  const fb = new URL(shareTargetUrl("facebook", text, url));
  assert.equal(fb.searchParams.get("u"), url);
});

test("a local or plain-http page shares the public address; a public HTTPS page shares its own", () => {
  assert.equal(shareAddress({ protocol: "http:", hostname: "10.19.11.130", origin: "http://10.19.11.130:3005" }), PUBLIC_SITE);
  assert.equal(shareAddress({ protocol: "http:", hostname: "127.0.0.1", origin: "http://127.0.0.1:3000" }), PUBLIC_SITE);
  assert.equal(shareAddress({ protocol: "https:", hostname: "akar.tamerakdeniz.com", origin: "https://akar.tamerakdeniz.com" }), "https://akar.tamerakdeniz.com");
});

test("Instagram opens the story camera on a phone, the site elsewhere", () => {
  assert.equal(instagramOpenUrl(true), "instagram://story-camera");
  assert.equal(instagramOpenUrl(false), "https://www.instagram.com/");
});
