import test from "node:test";
import assert from "node:assert/strict";
import {
  describeDownload,
  downloadSoFar,
  forgetDownload,
  formatMb,
  rememberDownload,
  toDownloadProgress,
} from "./model-download";

const MB = 1024 * 1024;

test("sizes are megabytes with one decimal and a Turkish comma", () => {
  assert.equal(formatMb(0.4 * MB), "0,4");
  assert.equal(formatMb(0.8 * MB), "0,8");
  assert.equal(formatMb(12 * MB), "12,0");
  assert.equal(formatMb(1536 * 1024), "1,5");
});

test("a download with a known length tells the percentage and both sizes from the bytes read", () => {
  assert.deepEqual(describeDownload({ loaded: 0.4 * MB, total: 0.8 * MB }), {
    percent: 50,
    title: "3D model yükleniyor · %50",
    sizes: "0,4 MB / 0,8 MB.",
  });
  const done = describeDownload({ loaded: MB, total: MB });
  assert.deepEqual([done.percent, done.title], [100, "3D model yükleniyor · %100"]);
  assert.equal(describeDownload({ loaded: 620, total: 1000 }).percent, 62);
});

test("a server that announces less than it sends never makes the card say more than 100 %", () => {
  const view = describeDownload({ loaded: 3 * MB, total: MB });
  assert.deepEqual([view.percent, view.sizes], [100, "3,0 MB / 3,0 MB."]);
});

test("without a length the card names the megabytes read and no percentage; before the first bytes it says only the title", () => {
  assert.deepEqual(describeDownload({ loaded: 1.5 * MB, total: null }), {
    percent: null,
    title: "3D model yükleniyor",
    sizes: "1,5 MB indirildi.",
  });
  for (const nothing of [null, { loaded: 0, total: 5 * MB }, { loaded: 0, total: null }])
    assert.deepEqual(describeDownload(nothing), {
      percent: null,
      title: "3D model yükleniyor",
      sizes: "",
    });
});

test("the loader's progress event gives a total only when the response announced a length", () => {
  assert.deepEqual(toDownloadProgress({ loaded: 10, total: 100, lengthComputable: true }), {
    loaded: 10,
    total: 100,
  });
  assert.deepEqual(toDownloadProgress({ loaded: 10, total: 0, lengthComputable: false }), {
    loaded: 10,
    total: null,
  });
  assert.equal(toDownloadProgress({ loaded: 10, total: 0, lengthComputable: true }).total, null);
});

test("a download in progress is remembered per file until it ends", () => {
  assert.equal(downloadSoFar("/a.glb"), null);
  rememberDownload("/a.glb", { loaded: 5, total: 10 });
  rememberDownload("/a.glb", { loaded: 7, total: 10 });
  assert.deepEqual(downloadSoFar("/a.glb"), { loaded: 7, total: 10 });
  assert.equal(downloadSoFar("/b.glb"), null);
  forgetDownload("/a.glb");
  assert.equal(downloadSoFar("/a.glb"), null);
});
