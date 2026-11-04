"use client";
import { useEffect, useRef, useState } from "react";
import { highContrast, setContrast, setTextSize, TEXT_SIZES, textSize, type TextSize } from "../lib/access";
import { useI18n } from "./i18n";

const SIZE_LABEL: Record<TextSize, "access.sizeNormal" | "access.sizeLarge" | "access.sizeXlarge"> = {
  normal: "access.sizeNormal",
  large: "access.sizeLarge",
  xlarge: "access.sizeXlarge",
};

/** High contrast and text size: in the header's menu and on the profile page. */
export function AccessControls() {
  const { t } = useI18n();
  const [contrast, setOn] = useState(highContrast);
  const [size, setSize] = useState<TextSize>(textSize);
  return (
    <div className="access-controls">
      <label>
        {t("profile.contrast")}
        <input
          type="checkbox"
          checked={contrast}
          onChange={(e) => {
            setOn(e.target.checked);
            setContrast(e.target.checked);
          }}
        />
      </label>
      <fieldset>
        <legend>{t("access.size")}</legend>
        <div className="access-sizes">
          {TEXT_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              aria-label={t(SIZE_LABEL[s])}
              onClick={() => {
                setSize(s);
                setTextSize(s);
              }}
            >
              A
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/** The header's «Aa»: opens the controls beside it; Esc or a press elsewhere closes them. */
export function AccessMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div className="access-menu" ref={root}>
      <button
        type="button"
        className="theme-switch"
        aria-label={t("access.open")}
        title={t("access.open")}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Aa
      </button>
      {open && (
        <div className="access-pop" role="dialog" aria-label={t("access.open")}>
          <AccessControls />
        </div>
      )}
    </div>
  );
}
