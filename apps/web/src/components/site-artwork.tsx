"use client";
import { Landmark } from "lucide-react";
import type { HeritageSite } from "@akar/domain";
import { Architecture } from "./scene";

export function SiteArtwork({
  site,
  live,
}: {
  site?: HeritageSite;
  live: boolean;
}) {
  const photo =
    site?.photos?.find((p) => p.id === site.coverPhotoId) ?? site?.photos?.[0];
  if (photo)
    return (
      <img
        className="site-photo"
        src={photo.src}
        alt={photo.alt}
        loading="lazy"
      />
    );
  return live ? (
    <div className="artwork-placeholder" aria-label="Görsel eklenmedi">
      <Landmark aria-hidden="true" size={32} />
    </div>
  ) : (
    <Architecture kind={site?.kind} />
  );
}
