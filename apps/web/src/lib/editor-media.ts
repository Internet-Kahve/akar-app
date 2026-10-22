import type { SiteModel } from "@akar/domain";

export function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

/** Re-encoding strips metadata and bounds the local demo's storage footprint. */
export async function preparePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("JPG, PNG veya WebP fotoğraf seç.");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Fotoğraf en fazla 5 MB olabilir.");
  const image = new Image();
  image.src = await readDataUrl(file);
  try {
    await image.decode();
  } catch {
    throw new Error("Fotoğraf açılamadı. Başka bir dosya seç.");
  }
  const scale = Math.min(
    1,
    1200 / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tarayıcı fotoğrafı hazırlayamıyor.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const src = canvas.toDataURL("image/webp", 0.8);
  if (src.length > 650_000)
    throw new Error(
      "Fotoğraf depolama için çok büyük. Daha küçük bir görsel seç.",
    );
  return src;
}

export async function prepareModel(file: File): Promise<SiteModel> {
  if (!file.name.toLowerCase().endsWith(".glb"))
    throw new Error("GLB dosyası seç.");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Model en fazla 5 MB olabilir.");
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  if (
    buffer.byteLength < 20 ||
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== buffer.byteLength ||
    view.getUint32(16, true) !== 0x4e4f534a
  )
    throw new Error("Geçerli bir GLB 2.0 dosyası değil.");
  const size = view.getUint32(12, true);
  if (20 + size > buffer.byteLength) throw new Error("GLB dosyası eksik.");
  const data = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 20, size)),
  );
  const nodes: { name?: string; mesh?: number }[] = data.nodes ?? [];
  const parts = nodes.flatMap((n, i) =>
    n.mesh === undefined ? [] : [n.name || `Parça ${i + 1}`],
  );
  if (!parts.length)
    throw new Error("Modelde gösterilebilir parça bulunamadı.");
  return {
    name: file.name,
    bytes: file.size,
    src: await readDataUrl(file),
    parts: [...new Set(parts)],
    trust: "representative",
  };
}
