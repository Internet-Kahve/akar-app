import { Capacitor } from "@capacitor/core";

/** Use a real cache file on phones: WebView downloads cannot open the OS share sheet. */
export async function sharePhoto(dataUrl: string, name: string, text: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const extension =
    blob.type === "image/png"
      ? "png"
      : blob.type === "image/webp"
        ? "webp"
        : "jpg";
  const filename = `${name.replace(/[^a-zA-Z0-9_-]/g, "_")}.${extension}`;
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const path = `share/${Date.now()}-${filename}`;
    const { uri } = await Filesystem.writeFile({
      path,
      data: dataUrl.split(",")[1]!,
      directory: Directory.Cache,
      recursive: true,
    });
    // Keep the cached file until the OS clears it; Android receivers may read it after share() resolves.
    await Share.share({ text, files: [uri] });
    return;
  }
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] }))
    await navigator.share({ files: [file], text });
  else {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }
}
