"use client";
import { useEffect, useState } from "react";
import type { SiteBadge } from "@akar/domain";
import { BookOpen, Feather, Landmark, Link, Map as MapIcon, MapPin, Sparkles, type LucideIcon } from "lucide-react";
import { badgeArt, fallbackBadgeArt, type AchievementId, type BadgeTier } from "../lib/badges";

/**
 * A badge as a medal: its own picture inside the tier's ring (bronze, silver, gold). Not earned, it is a grey
 * silhouette of the same medal, never an empty box. A missing picture falls back to its kind's, so no broken image.
 */
export function BadgeMedal({
  badge,
  tier,
  earned,
  size = 72,
  eager = false,
}: {
  badge: Pick<SiteBadge, "id" | "condition" | "onSiteLabel">;
  tier: BadgeTier;
  earned: boolean;
  size?: number;
  /** For the medal on screen at once (card, celebration); lists load lazily. */
  eager?: boolean;
}) {
  const [src, setSrc] = useState(() => badgeArt(badge));
  useEffect(() => setSrc(badgeArt(badge)), [badge]);
  return (
    <span className={`medal tier-${tier} ${earned ? "earned" : "locked"}`} style={{ ["--medal" as string]: `${size}px` }} aria-hidden="true">
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onError={() => {
          const fallback = fallbackBadgeArt(badge);
          if (src !== fallback) setSrc(fallback);
        }}
      />
    </span>
  );
}

export const ACHIEVEMENT_ICONS: Record<AchievementId, LucideIcon> = {
  "first-story": BookOpen,
  "whole-site": Landmark,
  "half-bursa": MapIcon,
  "akar-hayrat": Link,
  "first-on-site": MapPin,
  "first-memory": Feather,
  "all-badges": Sparkles,
};

/** An achievement's medal: a gold coin-ring with its sign when done, a grey one while on the way. */
export function AchievementMedal({ id, done, size = 64 }: { id: AchievementId; done: boolean; size?: number }) {
  const Icon = ACHIEVEMENT_ICONS[id];
  return (
    <span className={`medal achievement ach-${id} ${done ? "earned tier-gold" : "locked"}`} style={{ ["--medal" as string]: `${size}px` }} aria-hidden="true">
      <span className="achievement-face">
        <Icon size={Math.round(size * 0.42)} strokeWidth={2.4} />
      </span>
    </span>
  );
}
