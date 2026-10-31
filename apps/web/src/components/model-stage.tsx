"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";
import dynamic from "next/dynamic";
import { Box } from "lucide-react";
import type { CityIdentity, CityScene } from "@akar/domain";
import { identityStyle } from "../lib/city-identity";
import {
  describeDownload,
  downloadSoFar,
  type DownloadProgress,
} from "../lib/model-download";
import {
  CityPattern,
  ModelLoadingCard,
  type ModelLoadingContext,
} from "./loading-screens";
import { useI18n } from "./i18n";

const ModelViewer = dynamic(() => import("./model-viewer"), { ssr: false });

/** A loading indicator waits this long before it shows, so a model that comes at once never flashes a card. */
const LOADING_DELAY_MS = 300;

function useAfter(ms: number) {
  const [over, setOver] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setOver(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return over;
}

/**
 * The stage of a 3D model: the city's scene background and, until the model is drawn, the 3D loading card
 * (§11.49) over the city's faint pattern. The card lives here, not in the viewer, so it also covers the time the
 * viewer's own code (three.js, loaded on demand) is on its way and stays one card from the first moment to the last.
 * The viewer reports the bytes it has read and whether the model came.
 */
export function ModelStage({
  scene,
  identity,
  context,
  onPhotos,
  ...viewer
}: {
  scene: CityScene;
  identity: CityIdentity | null;
  context: ModelLoadingContext;
  /** «Görsellerle devam et» when the model cannot open; absent when the site has no photographs. */
  onPhotos?: (() => void) | undefined;
} & Omit<
  ComponentProps<typeof ModelViewer>,
  "scene" | "onProgress" | "onSettled"
>) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<"loading" | "ready" | "failed">("loading"),
    [attempt, setAttempt] = useState(0);
  // A viewer that joins a download in progress starts from what has been read.
  const [progress, setProgress] = useState<DownloadProgress | null>(() =>
    downloadSoFar(viewer.model.src),
  );
  // The card says megabytes to one decimal and whole percents: most chunks change nothing it shows.
  const shown = useRef("");
  const onProgress = useCallback((next: DownloadProgress) => {
    const view = describeDownload(next);
    const key = `${view.title}|${view.sizes}`;
    if (key === shown.current) return;
    shown.current = key;
    setProgress(next);
  }, []);
  const look = identityStyle(identity);
  const waited = useAfter(LOADING_DELAY_MS);
  const card = phase === "loading" && waited;
  return (
    <div
      className={`model-viewer${context === "detail" ? " detail-model" : ""}`}
      style={
        {
          "--scene-top": scene.backgroundTop,
          "--scene-bottom": scene.backgroundBottom,
          ...look,
        } as CSSProperties
      }
    >
      <ModelViewer
        key={attempt}
        {...viewer}
        scene={scene}
        detail={context === "detail"}
        onProgress={onProgress}
        onSettled={setPhase}
      />
      {card && "--city-pattern" in look && <CityPattern />}
      {card && <ModelLoadingCard progress={progress} context={context} />}
      {phase === "failed" && (
        <div className="model-failed" role="alert">
          <Box size={28} />
          <h3>{t("site.modelFailedTitle")}</h3>
          <p>{t("site.modelFailedBody")}</p>
          <button
            className="btn"
            onClick={() => {
              setPhase("loading");
              setAttempt((n) => n + 1);
            }}
          >
            {t("site.retryModel")}
          </button>
          {onPhotos && (
            <button className="btn secondary" onClick={onPhotos}>
              {t("site.continueWithPhotos")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
