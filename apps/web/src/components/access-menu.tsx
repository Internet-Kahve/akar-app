"use client";
import { useEffect, useRef, useState } from "react";
import { announce } from "../lib/announce";
import {
  highContrast,
  setContrast,
  setTextSize,
  TEXT_SIZES,
  textSize,
  type TextSize,
} from "../lib/access";
import { useI18n } from "./i18n";

const SIZE_LABEL: Record<TextSize, "access.sizeNormal" | "access.sizeLarge" | "access.sizeXlarge"> = {
  normal: "access.sizeNormal",
  large: "access.sizeLarge",
  xlarge: "access.sizeXlarge",
};

/** High contrast and text size: in the header's menu and on the profile page. Each change is spoken. */
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
            announce(t(e.target.checked ? "access.contrastOn" : "access.contrastOff"));
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
                announce(t("access.sizeChanged", { size: t(SIZE_LABEL[s]) }));
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

/**
 * The header's «Aa»: opens the controls beside it and moves focus into them; Esc or a press elsewhere closes them,
 * Esc returning focus to «Aa».
 */
export function AccessMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    pop.current?.querySelector<HTMLElement>("input, button")?.focus();
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
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
        ref={toggle}
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
        <div className="access-pop" role="dialog" aria-label={t("access.open")} ref={pop}>
          <AccessControls />
        </div>
      )}
    </div>
  );
}
