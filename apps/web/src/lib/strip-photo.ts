/**
 * A visitor's photograph drawn afresh before it leaves the device: a drawn image carries no EXIF, so the place and the
 * phone it was taken with stay behind (KVKK). Upright as it was shown, no larger than it needs to be.
 */
const MAX_SIDE = 2400;

export async function photoWithoutMetadata(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.9);
  } finally {
    bitmap.close();
  }
}
