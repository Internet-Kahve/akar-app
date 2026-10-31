import { translate, type Lang } from "./i18n";

/**
 * What the 3D loading card says about a model download (§11.49). The numbers are the bytes the browser has really
 * read from the response stream; the total is the length the server announced, `null` when it announced none.
 */
export interface DownloadProgress {
  loaded: number;
  total: number | null;
}

/** The part of a `ProgressEvent` three.js's loader sends while it reads the response (`lengthComputable` = a length is known). */
export function toDownloadProgress(event: {
  loaded: number;
  total: number;
  lengthComputable: boolean;
}): DownloadProgress {
  return {
    loaded: event.loaded,
    total: event.lengthComputable && event.total > 0 ? event.total : null,
  };
}

const MB = 1024 * 1024;
/** `0,4`: one decimal, with the language's decimal separator (Turkish comma, English point). */
export function formatMb(bytes: number, lang: Lang = "tr"): string {
  return (bytes / MB).toLocaleString(lang === "en" ? "en-GB" : "tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export interface DownloadView {
  /** 0–100; `null` = no length known (or nothing read yet): the bar does not tell a percentage. */
  percent: number | null;
  /** `3D model yükleniyor · %62`, or without the percentage. */
  title: string;
  /** `0,4 MB / 0,8 MB.`, `0,4 MB indirildi.` without a length, empty before the first bytes. */
  sizes: string;
}

export function describeDownload(progress: DownloadProgress | null, lang: Lang = "tr"): DownloadView {
  const title = translate(lang, "model.loading");
  if (!progress || progress.loaded <= 0) return { percent: null, title, sizes: "" };
  if (progress.total === null)
    return {
      percent: null,
      title,
      sizes: translate(lang, "model.downloaded", { size: formatMb(progress.loaded, lang) }),
    };
  // A server that compresses on the fly announces the compressed length while the stream carries the full bytes:
  // never show more than 100 % or a total smaller than what has been read.
  const total = Math.max(progress.total, progress.loaded);
  const percent = Math.min(100, Math.round((progress.loaded / total) * 100));
  return {
    percent,
    title: translate(lang, "model.loadingPercent", { percent }),
    sizes: `${formatMb(progress.loaded, lang)} MB / ${formatMb(total, lang)} MB.`,
  };
}

/**
 * The last progress of each download still running. A second viewer of the same file (the visitor tapped «Oku»
 * while the model was coming) joins the download in progress and starts from what has been read, not from nothing.
 */
const running = new Map<string, DownloadProgress>();
export const rememberDownload = (src: string, progress: DownloadProgress) =>
  void running.set(src, progress);
export const forgetDownload = (src: string) => void running.delete(src);
export const downloadSoFar = (src: string): DownloadProgress | null =>
  running.get(src) ?? null;
