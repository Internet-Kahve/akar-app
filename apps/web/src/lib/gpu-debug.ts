import type * as THREE from "three";
import { modelPixelRatio, modestDevice } from "./device";

const KEY = "akar-debug-gpu";

/**
 * The diagnostics box is asked for with `?debug=gpu` (or `#debug=gpu`); once asked it stays for the tab's session,
 * so moving between screens (which rewrites the hash) does not lose it. `?debug=off` puts it away.
 */
export function gpuDebugWanted(search: string, hash: string, stored: string | null): boolean {
  const params = [new URLSearchParams(search), new URLSearchParams(hash.replace(/^#/, ""))];
  const asked = params.map((p) => p.get("debug")).find((v) => v !== null);
  if (asked === "off") return false;
  return asked === "gpu" || stored === "1";
}

function wanted(): boolean {
  if (typeof window === "undefined") return false;
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(KEY);
  } catch {
    /* private mode: the box is only for this page load */
  }
  const on = gpuDebugWanted(location.search, location.hash, stored);
  try {
    if (on) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return on;
}

/** What the browser tells about the GPU and the context, as lines of text. */
export function describeGpu(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, shadowMap: number | null): string[] {
  const gl = renderer.getContext();
  const attrs = gl.getContextAttributes();
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  const precision = (type: number) => {
    const f = gl.getShaderPrecisionFormat(type, gl.HIGH_FLOAT);
    return f ? `${f.precision} bit` : "?";
  };
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return [
    `UA: ${navigator.userAgent}`,
    `GPU: ${ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "(not told)"}`,
    `WebGL: ${gl.getParameter(gl.VERSION)}`,
    `screen: ${innerWidth}×${innerHeight} @${window.devicePixelRatio}, canvas ratio ${renderer.getPixelRatio()} (model ${modelPixelRatio()})`,
    `modest: ${modestDevice()} · cores ${navigator.hardwareConcurrency ?? "?"} · memory ${memory ?? "(not told)"}`,
    `depth bits: ${gl.getParameter(gl.DEPTH_BITS)} · samples: ${gl.getParameter(gl.SAMPLES)} · antialias: ${attrs?.antialias}`,
    `float precision (high): fragment ${precision(gl.FRAGMENT_SHADER)} · vertex ${precision(gl.VERTEX_SHADER)}`,
    `max texture: ${gl.getParameter(gl.MAX_TEXTURE_SIZE)} · anisotropy: ${renderer.capabilities.getMaxAnisotropy()}`,
    `shadows: ${renderer.shadowMap.enabled ? `on, type ${renderer.shadowMap.type}, map ${shadowMap ?? "?"}` : "off"}`,
    `camera: near ${camera.near.toPrecision(3)} · far ${camera.far.toPrecision(3)} · ratio ${(camera.far / camera.near).toFixed(0)}`,
  ];
}

/**
 * A small box over the 3D viewer for the iPhone's «kasıyor / çizgiler önüne geliyor» reports: the device, the
 * context's depth bits and precision, shadow and pixel settings, frames per second, draw calls and any lost
 * context. «Kopyala» puts it all on the clipboard to send. Returns what takes it away again.
 */
export function mountGpuDebug(
  host: HTMLElement,
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  shadowMap: () => number | null,
): () => void {
  if (!wanted()) return () => {};
  const box = document.createElement("div");
  box.setAttribute("data-gpu-debug", "");
  box.style.cssText =
    "position:absolute;left:6px;top:6px;z-index:50;max-width:calc(100% - 12px);padding:6px 8px;border-radius:8px;" +
    "background:rgba(0,0,0,.78);color:#9f9;font:10px/13px ui-monospace,Menlo,monospace;white-space:pre-wrap;" +
    "word-break:break-all;pointer-events:none;";
  const text = document.createElement("div");
  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "Kopyala";
  copy.style.cssText = "margin-top:4px;padding:3px 8px;pointer-events:auto;font:11px system-ui;";
  box.append(text, copy);
  host.appendChild(box);

  let lost = 0;
  let frames = 0;
  let fps = 0;
  let since = performance.now();
  const canvas = renderer.domElement;
  const onLost = () => {
    lost += 1;
  };
  canvas.addEventListener("webglcontextlost", onLost);
  const render = () => {
    const info = renderer.info;
    return [
      ...describeGpu(renderer, camera, shadowMap()),
      `fps ${fps} · calls ${info.render.calls} · triangles ${info.render.triangles}`,
      `geometries ${info.memory.geometries} · textures ${info.memory.textures} · context lost ${lost}×`,
    ].join("\n");
  };
  copy.onclick = () => {
    void navigator.clipboard?.writeText(render()).catch(() => {});
    copy.textContent = "Kopyalandı";
  };
  let frame = 0;
  const tick = (now: number) => {
    frames += 1;
    if (now - since >= 1000) {
      fps = Math.round((frames * 1000) / (now - since));
      frames = 0;
      since = now;
      text.textContent = render();
    }
    frame = requestAnimationFrame(tick);
  };
  text.textContent = render();
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    canvas.removeEventListener("webglcontextlost", onLost);
    box.remove();
  };
}
