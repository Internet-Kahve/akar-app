"use client";
import { useEffect, useRef, useState } from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";
import type { Map as MapType } from "maplibre-gl";

const TICKS = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
const LETTERS = [
  { label: "K", x: 50, y: 28 },
  { label: "D", x: 75, y: 54 },
  { label: "G", x: 50, y: 79 },
  { label: "B", x: 25, y: 54 },
];
/** A pointer that moved less than this tapped the dial. */
const DRAG_PX = 4;

/**
 * Zoom, position and the compass dial. The dial's label says the view it leads to (2D while tilted, 3D while
 * flat), its ring turns with the map, dragging the ring turns the map, and after a turn by hand the first
 * press only brings north up again.
 */
export function MapControls({
  map,
  ready,
  tiltPitch,
  onMove,
  onLocate,
}: {
  map: MapType | null;
  ready: boolean;
  tiltPitch: number;
  /** A visitor's move; a late city record must not pull the map back after it. */
  onMove: () => void;
  onLocate: () => void;
}) {
  const [tilted, setTilted] = useState(true),
    [bearing, setBearing] = useState(0),
    [turned, setTurned] = useState(false),
    dial = useRef<HTMLButtonElement>(null),
    drag = useRef<{
      x: number;
      y: number;
      angle: number;
      bearing: number;
      moved: boolean;
    } | null>(null);
  useEffect(() => {
    if (!map) return;
    const update = () => {
      setTilted(map.getPitch() > 5);
      setBearing(map.getBearing());
    };
    const turnedByHand = (e: { originalEvent?: unknown }) => {
      if (e.originalEvent) setTurned(true);
    };
    update();
    map.on("pitch", update);
    map.on("rotate", update);
    map.on("rotatestart", turnedByHand);
    return () => {
      map.off("pitch", update);
      map.off("rotate", update);
      map.off("rotatestart", turnedByHand);
    };
  }, [map]);
  const facing = turned && Math.abs(bearing) > 0.5;
  const angleOf = (e: React.PointerEvent) => {
    const r = dial.current!.getBoundingClientRect();
    return (
      (Math.atan2(
        e.clientY - r.top - r.height / 2,
        e.clientX - r.left - r.width / 2,
      ) *
        180) /
      Math.PI
    );
  };
  return (
    <div className="map-controls">
      <div className="map-zoom">
        <button
          aria-label="Yakınlaştır"
          disabled={!ready}
          onClick={() => {
            onMove();
            map?.zoomIn();
          }}
        >
          <Plus size={20} />
        </button>
        <button
          aria-label="Uzaklaştır"
          disabled={!ready}
          onClick={() => {
            onMove();
            map?.zoomOut();
          }}
        >
          <Minus size={20} />
        </button>
      </div>
      <button
        className="map-round"
        title="Konumuma git"
        aria-label="Konumuma git"
        onClick={onLocate}
      >
        <LocateFixed size={20} />
      </button>
      <button
        ref={dial}
        className={`map-dial${tilted ? " tilted" : ""}`}
        disabled={!ready}
        aria-label={
          facing
            ? "Kuzeyi yukarı getir"
            : tilted
              ? "2D haritaya geç"
              : "3D haritaya geç"
        }
        onPointerDown={(e) => {
          if (e.button === 0 && map)
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              angle: angleOf(e),
              bearing: map.getBearing(),
              moved: false,
            };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !map) return;
          if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < DRAG_PX)
            return;
          if (!d.moved) {
            d.moved = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            setTurned(true);
            onMove();
          }
          map.setBearing(d.bearing - (angleOf(e) - d.angle));
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.moved || !map) return;
          onMove();
          if (facing) {
            setTurned(false);
            map.easeTo({ bearing: 0, duration: 500 });
            return;
          }
          setTurned(false);
          map.easeTo(
            tilted
              ? { pitch: 0, bearing: 0, duration: 600 }
              : { pitch: tiltPitch, bearing: 0, duration: 600 },
          );
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(e) => {
          if ((e.key !== "Enter" && e.key !== " ") || !map) return;
          e.preventDefault();
          onMove();
          setTurned(false);
          map.easeTo(
            facing
              ? { bearing: 0, duration: 500 }
              : { pitch: tilted ? 0 : tiltPitch, bearing: 0, duration: 600 },
          );
        }}
      >
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          style={{ transform: `rotate(${-bearing}deg)` }}
        >
          <circle className="dial-ring" cx="50" cy="50" r="40" />
          {TICKS.map((a, i) => (
            <line
              key={a}
              className={i % 2 ? "dial-tick" : "dial-major"}
              x1={50 + Math.sin(a) * (i % 2 ? 37 : 35.5)}
              y1={50 - Math.cos(a) * (i % 2 ? 37 : 35.5)}
              x2={50 + Math.sin(a) * (i % 2 ? 43 : 44.5)}
              y2={50 - Math.cos(a) * (i % 2 ? 43 : 44.5)}
            />
          ))}
          {LETTERS.map(({ label, x, y }) => (
            <text key={label} className="dial-letter" x={x} y={y}>
              {label}
            </text>
          ))}
          <circle className="dial-disc" cx="50" cy="50" r="15" />
          <circle className="dial-north" cx="50" cy="10" r="5" />
        </svg>
        <b>{tilted ? "2D" : "3D"}</b>
      </button>
    </div>
  );
}
