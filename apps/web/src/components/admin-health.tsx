"use client";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { AdminHealth } from "@akar/api-client";

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });
const GB = 1024 ** 3;
const MB = 1024 ** 2;
/** Binary units, so the default 1024 MB quota reads "1 GB". */
const size = (bytes: number) =>
  bytes >= GB
    ? `${number.format(bytes / GB)} GB`
    : `${Math.round(bytes / MB)} MB`;

/** Panel warnings (decision §11.21): shown only for storage at `warn`/`critical` and stale pending memories. */
export function AdminHealthAlert({
  health,
  failed,
  onPending,
}: {
  health: AdminHealth | null;
  failed: boolean;
  onPending: (() => void) | undefined;
}) {
  if (failed)
    return (
      <p className="admin-health-error" role="status">
        Panel uyarıları yüklenemedi.
      </p>
    );
  if (!health) return null;
  const storage =
    health.storage && health.storage.level !== "ok" ? health.storage : null;
  const { count, thresholdHours } = health.pendingStale;
  if (!storage && count === 0) return null;
  const level = storage?.level === "critical" ? "critical" : "warn";
  return (
    <div className={`admin-health ${level}`} role="alert">
      <AlertTriangle size={18} />
      <div>
        {storage && (
          <p className={storage.level}>
            <strong>
              Kayıtlı medya: {size(storage.usedBytes)} / {size(storage.quotaBytes)}{" "}
              (%{number.format(storage.percent)})
            </strong>
            <span> Bu değer medya kayıtlarını kapsar; geçici yüklemeler ve sahipsiz dosyalar dahil değildir.</span>
            {storage.level === "critical"
              ? " Yer kalmayınca fotoğraf yüklemeleri durur."
              : " Kotanın %80'i geçildi."}
          </p>
        )}
        {count > 0 && (
          <p>
            {count} anı {thresholdHours} saatten uzun süredir onay bekliyor.
            {onPending && (
              <button className="admin-health-link" onClick={onPending}>
                Bekleyenlere git
                <ArrowRight size={14} />
              </button>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
