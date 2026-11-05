/**
 * Sharing a picture: the system share sheet with the file where the browser offers it (`navigator.share` with
 * `files`; HTTPS only, so a phone on a plain `http://10.x` address gets the download instead, which is not an
 * error), otherwise a download. Like the history camera's «Paylaş», a cancelled sheet is not a failure.
 */
export function canShareFile(file: File): boolean {
  try {
    return typeof navigator !== "undefined" && typeof navigator.share === "function" && !!navigator.canShare?.({ files: [file] });
  } catch {
    return false;
  }
}

export type ShareOutcome = "shared" | "cancelled" | "downloaded";

export async function shareFile(file: File, title: string): Promise<ShareOutcome> {
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // A refused share (no user activation, a policy) still leaves the visitor the picture.
    }
  }
  downloadFile(file);
  return "downloaded";
}

export function downloadFile(file: Blob & { name?: string }, name = file.name ?? "akar.png"): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
