"use client";
import { useEffect, useRef } from "react";
import type { CityIdentity } from "@akar/domain";
import { identityStyle } from "../lib/city-identity";
import { EMBLEM_PATH, EMBLEM_VIEW_BOX } from "../lib/emblem";
import { describeDownload, type DownloadProgress } from "../lib/model-download";

/** The opening screen leaves after this, whatever the map does (a map that never draws must not hold the page). */
export const OPENING_MAX_MS = 8000;
/** Fade of the opening screen (`.opening` in globals.css); the screen leaves the page a moment after it. */
const OPENING_FADE_MS = 320;

/** The AKAR emblem, drawn stroke by stroke; fully drawn and still under reduced motion. */
export function Emblem({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`emblem ${className}`.trim()}
      viewBox={EMBLEM_VIEW_BOX}
      aria-hidden="true"
      focusable="false"
    >
      <path pathLength={1} d={EMBLEM_PATH} />
    </svg>
  );
}

/**
 * The city's pattern, faint (about 8 %, the design's 6–10 %) over the screen it is placed in. It reads the colour and
 * the tile from the `--city-accent` / `--city-pattern` of a parent (`identityStyle`); never rendered without them.
 */
export function CityPattern() {
  return <div className="city-pattern" aria-hidden="true" />;
}

/**
 * Full-screen opening (§5.9): the city's faint pattern, the emblem drawn stroke by stroke, «AKAR», the city's name
 * and «Vakıf eserleri yükleniyor». The city is the default city's record; the name and the pattern are not there
 * before the records are read, the screen is whole without them. `done` (the map has been drawn, or there is nothing
 * to wait for) fades it away; `onGone` then takes it off the page.
 */
export function OpeningScreen({
  cityName,
  identity,
  done,
  onGone,
}: {
  cityName?: string;
  identity: CityIdentity | null;
  done: boolean;
  onGone: () => void;
}) {
  const gone = useRef(onGone);
  gone.current = onGone;
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => gone.current(), OPENING_FADE_MS + 80);
    return () => clearTimeout(timer);
  }, [done]);
  const style = identityStyle(identity);
  return (
    <div
      className={`opening${done ? " done" : ""}`}
      // While it fades out it is no longer news: hidden from assistive technology.
      {...(done
        ? { "aria-hidden": true }
        : { role: "status", "aria-label": "AKAR yükleniyor" })}
      style={style}
    >
      {"--city-pattern" in style && <CityPattern />}
      <div className="opening-inner">
        <Emblem />
        <div className="opening-brand">AKAR</div>
        <div className="opening-city">
          {cityName && <span key={cityName}>{cityName}</span>}
        </div>
        <div className="opening-note">Vakıf eserleri yükleniyor</div>
      </div>
    </div>
  );
}

/** Where the model is shown decides what the card tells the visitor to do meanwhile. */
export type ModelLoadingContext = "detail" | "story" | "reading";
const HINTS: Record<ModelLoadingContext, string> = {
  detail:
    "Bu sırada Dinle ya da Oku ile başlayabilirsin; model gelince sahne kendiliğinden açılır.",
  story: "Model gelince sahne kendiliğinden açılır.",
  reading:
    "Bu sırada okumaya devam edebilirsin; model gelince sahne kendiliğinden açılır.",
};

/**
 * The 3D loading card (§5.9): emblem, «3D model yükleniyor · %NN», a bar and «x MB / y MB. …», all from the bytes the
 * browser has read. Without a known length the bar runs without a percentage. The panel beside the scene stays usable.
 */
export function ModelLoadingCard({
  progress,
  context,
}: {
  progress: DownloadProgress | null;
  context: ModelLoadingContext;
}) {
  const view = describeDownload(progress);
  return (
    <div className="model-loading" role="group" aria-label="3D model yükleniyor">
      {/* One calm announcement; the numbers below change too often to be read out. */}
      <p className="sr-only" role="status">
        3D model yükleniyor
      </p>
      <Emblem className="model-loading-emblem" />
      <b className="model-loading-title" aria-hidden="true">
        {view.title}
      </b>
      <div
        className={`model-loading-bar${view.percent === null ? " unknown" : ""}`}
        role="progressbar"
        aria-label="3D model yükleniyor"
        aria-valuemin={0}
        aria-valuemax={100}
        {...(view.percent !== null && {
          "aria-valuenow": view.percent,
          "aria-valuetext": `%${view.percent}`,
        })}
      >
        <i
          style={
            view.percent === null
              ? undefined
              : { transform: `scaleX(${view.percent / 100})` }
          }
        />
      </div>
      <p className="model-loading-note">
        {view.sizes && `${view.sizes} `}
        {HINTS[context]}
      </p>
    </div>
  );
}
