import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { INTRO_BOOT } from "./theme-boot";

test("the introduction opens for bare links, but never consumes an auth return before or after its token hash is cleared", () => {
  for (const [url, expected] of [
    ["https://akar.test/", "/tanitim"],
    ["https://akar.test/#akar", "/tanitim#akar"],
    ["https://akar.test/#view=map", null],
    ["https://akar.test/#access_token=token", null],
    ["https://akar.test/?auth=callback#access_token=token", null],
    ["https://akar.test/?auth=callback", null],
    ["https://akar.test/?auth=callback#error=access_denied", null],
  ] as const) {
    let redirect: string | null = null;
    const location = new URL(url);
    runInNewContext(INTRO_BOOT, {
      URLSearchParams,
      location: {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        replace: (value: string) => {
          redirect = value;
        },
      },
    });
    assert.equal(redirect, expected, url);
  }
});
