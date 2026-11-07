"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { kindCategory, type CityIdentity, type SiteKind } from "@akar/domain";
import { identityStyle, PATTERN_DIR } from "../lib/city-identity";
import { nextWaitIndex, waitWords, type WaitGroup } from "../lib/wait-words";
import { useCities } from "./city-scenes";
import { EMBLEM_PATH, EMBLEM_VIEW_BOX } from "../lib/emblem";
import { describeDownload, type DownloadProgress } from "../lib/model-download";
import type { MessageKey } from "../lib/messages";
import { useI18n } from "./i18n";

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
      {/* A thin ring turning round the emblem: something is coming (3 Nov 2026: «yanıp sönmesin, dönsün»). */}
      <circle className="emblem-ring" r="80" pathLength={1} />
      <g className="emblem-turn">
        <path pathLength={1} d={EMBLEM_PATH} />
      </g>
    </svg>
  );
}

/** A city's emblem as a mask in the city's colour: `--m` the file, `--c` the colour (the night theme lightens it). */
function motifStyle(identity: CityIdentity | null | undefined): CSSProperties | undefined {
  if (!identity?.emblem) return undefined;
  return { "--m": `url("${PATTERN_DIR}${identity.emblem}")`, "--c": identity.accent } as CSSProperties;
}

/**
 * Waiting words (lib/wait-words) turning under a loading picture every few seconds, with a gloss for an old word.
 * Decoration only: the screen's own status line is what assistive technology reads.
 */
export function WaitWords({ group }: { group: WaitGroup }) {
  const { lang } = useI18n();
  const words = waitWords(group, lang === "en" ? "en" : "tr");
  // The first word is the same on the server and in the browser (a random one would not match the server's page);
  // the turns after it are random.
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    setIndex(Math.floor(Math.random() * words.length));
    let swap = 0;
    const timer = setInterval(() => {
      setLeaving(true);
      swap = window.setTimeout(() => {
        setIndex((i) => nextWaitIndex(words.length, i));
        setLeaving(false);
      }, 260);
    }, 2600);
    return () => {
      clearInterval(timer);
      clearTimeout(swap);
    };
  }, [words.length]);
  const word = words[index % words.length]!;
  return (
    <p className={`wait-words${leaving ? " leaving" : ""}`} aria-hidden="true">
      {word.text}
      {word.gloss && <small>{word.gloss}</small>}
    </p>
  );
}

/** The map's wait (6 Nov 2026): the city's own motif turning slowly in its colour, a gold ring running round it. */
export function CityMotifLoader({ identity }: { identity: CityIdentity }) {
  return (
    <span className="loader-city" style={motifStyle(identity)} aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" pathLength={1} />
      </svg>
      <i />
    </span>
  );
}

/** No city yet (the globe, a first visit): the cities' motifs in a triangle, turning together, breathing in turn. */
export function CitiesLoader({ identities }: { identities: CityIdentity[] }) {
  const three = identities.filter((i) => i.emblem).slice(0, 3);
  return (
    <span className="loader-cities" aria-hidden="true">
      <svg viewBox="0 0 170 170">
        <polygon points="85,7 156,133 14,133" />
      </svg>
      <b />
      {three.map((identity, i) => (
        <i key={identity.emblem} className={`at-${i}`} style={motifStyle(identity)} />
      ))}
    </span>
  );
}

/** A mosque or a tomb's 3D model: the building rises, stones in rows, the door's arch, the dome, the minaret, the finial. */
export function BuildingLoader() {
  const [built, setBuilt] = useState(false);
  useEffect(() => {
    let down = 0;
    const cycle = () => {
      setBuilt(true);
      down = window.setTimeout(() => setBuilt(false), 4600);
    };
    const first = requestAnimationFrame(cycle);
    const timer = setInterval(cycle, 5400);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(timer);
      clearTimeout(down);
    };
  }, []);
  const stones: Array<[number, number, number, boolean]> = [
    [30, 146, 34, false], [66, 146, 34, true], [102, 146, 34, false], [138, 146, 20, true],
    [30, 130, 20, true], [52, 130, 34, false], [88, 130, 34, true], [124, 130, 34, false],
    [30, 114, 34, false], [66, 114, 34, true], [102, 114, 34, false], [138, 114, 20, true],
  ];
  return (
    <svg className={`loader-building${built ? " built" : ""}`} viewBox="0 0 220 170" aria-hidden="true">
      <line className="ground" x1="6" y1="160" x2="214" y2="160" />
      <path className="crane" d="M196 160 V30 H140 M196 44 L176 30" />
      <g className="hook">
        <line className="crane" x1="150" y1="30" x2="150" y2="52" />
        <rect className="gold" x="144" y="52" width="12" height="7" rx="2" />
      </g>
      {stones.map(([x, y, w, light], i) => (
        <rect key={i} className={`piece stone${light ? " light" : ""}`} style={{ "--i": i } as CSSProperties} x={x} y={y} width={w} height="14" rx="3" />
      ))}
      <path className="line" style={{ "--i": 12 } as CSSProperties} d="M82 160 V138 Q94 122 106 138 V160" />
      <path className="piece dome" style={{ "--i": 13 } as CSSProperties} d="M40 112 Q94 50 148 112 Z" />
      <path className="line" style={{ "--i": 13 } as CSSProperties} d="M40 112 Q94 50 148 112" />
      <rect className="piece stone light" style={{ "--i": 15 } as CSSProperties} x="14" y="62" width="12" height="98" rx="5" />
      <path className="piece gold" style={{ "--i": 16 } as CSSProperties} d="M20 50 l6 12 h-12 z" />
      <rect className="piece gold" style={{ "--i": 17 } as CSSProperties} x="93" y="70" width="2.5" height="12" rx="1" />
      <circle className="piece gold" style={{ "--i": 18 } as CSSProperties} cx="94.2" cy="67" r="4" />
    </svg>
  );
}

/** Any other site's 3D model (hans, the bedesten, a bath): three arches drawn in turn, the city's motif in each. */
export function ArcadeLoader({ identity }: { identity: CityIdentity | null }) {
  return (
    <span className="loader-arcade" style={motifStyle(identity)} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ "--i": i } as CSSProperties}>
          <svg viewBox="0 0 64 108">
            <path d="M4 106 V48 Q32 4 60 48 V106" pathLength={1} />
          </svg>
          {identity?.emblem && <i />}
        </span>
      ))}
    </span>
  );
}

/** Saving and sending (İz Bırak, the content studio): nine tiles turning in a wave, the cities' motifs on their backs. */
export function TileLoader({ small = false }: { small?: boolean }) {
  const cities = useCities()
    .map((c) => c.identity)
    .filter((i): i is CityIdentity => !!i?.emblem);
  const order = [0, 1, 2, 1, 2, 3, 2, 3, 4];
  return (
    <span className={`loader-tiles${small ? " small" : ""}`} aria-hidden="true">
      {order.map((wave, i) => {
        const identity = cities.length ? cities[i % cities.length] : null;
        return (
          <span key={i} style={{ "--i": wave, ...(identity && { "--c": identity.accent }) } as CSSProperties}>
            <b />
            <i style={motifStyle(identity)} />
          </span>
        );
      })}
    </span>
  );
}

/** Which picture a 3D model's wait shows: a building rising for a mosque or a tomb, arches for every other kind. */
export function modelLoaderFor(kind: SiteKind | undefined): "building" | "arcade" {
  return kind && kindCategory[kind] === "dini" ? "building" : "arcade";
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
  const { t } = useI18n();
  const cityIdentities = useCities()
    .map((c) => c.identity)
    .filter((i): i is CityIdentity => !!i?.emblem);
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
        : { role: "status", "aria-label": t("opening.aria") })}
      style={style}
    >
      {"--city-pattern" in style && <CityPattern />}
      <div className="opening-inner">
        {/* The city's own motif turning; before a city (the globe) the cities' motifs together; the AKAR emblem when
            no city has one. */}
        {identity?.emblem ? (
          <CityMotifLoader identity={identity} />
        ) : cityIdentities.length >= 2 ? (
          <CitiesLoader identities={cityIdentities} />
        ) : (
          <Emblem />
        )}
        <div className="opening-brand">AKAR</div>
        <div className="opening-city">
          {cityName && (
            <span key={cityName}>
              {"--city-emblem" in style && <i className="opening-city-emblem" aria-hidden="true" />}
              {cityName}
            </span>
          )}
        </div>
        <div className="opening-note">{t("opening.note")}</div>
        <WaitWords group="map" />
      </div>
    </div>
  );
}

/** Where the model is shown decides what the card tells the visitor to do meanwhile. */
export type ModelLoadingContext = "detail" | "story" | "reading";
const HINTS: Record<ModelLoadingContext, MessageKey> = {
  detail: "model.hintDetail",
  story: "model.hintStory",
  reading: "model.hintReading",
};

/**
 * The 3D loading card (§5.9): emblem, «3D model yükleniyor · %NN», a bar and «x MB / y MB. …», all from the bytes the
 * browser has read. Without a known length the bar runs without a percentage. The panel beside the scene stays usable.
 */
export function ModelLoadingCard({
  progress,
  context,
  kind,
  identity = null,
}: {
  progress: DownloadProgress | null;
  context: ModelLoadingContext;
  /** The site's kind: a mosque or a tomb rises as a building, the rest as arches (6 Nov 2026). */
  kind?: SiteKind | undefined;
  /** The site's city: the arches carry its motif and colour. */
  identity?: CityIdentity | null;
}) {
  const { lang, t } = useI18n();
  const view = describeDownload(progress, lang);
  return (
    <div className="model-loading" role="group" aria-label={t("model.loading")}>
      {/* One calm announcement; the numbers below change too often to be read out. */}
      <p className="sr-only" role="status">
        {t("model.loading")}
      </p>
      {modelLoaderFor(kind) === "building" ? <BuildingLoader /> : <ArcadeLoader identity={identity} />}
      <b className="model-loading-title" aria-hidden="true">
        {view.title}
      </b>
      <div
        className={`model-loading-bar${view.percent === null ? " unknown" : ""}`}
        role="progressbar"
        aria-label={t("model.loading")}
        aria-valuemin={0}
        aria-valuemax={100}
        {...(view.percent !== null && {
          "aria-valuenow": view.percent,
          "aria-valuetext": t("model.percent", { percent: view.percent }),
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
        {t(HINTS[context])}
      </p>
      <WaitWords group="model" />
    </div>
  );
}
