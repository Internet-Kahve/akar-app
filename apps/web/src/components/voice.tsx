"use client";
import { createContext, useContext } from "react";
import type { Lang } from "../lib/i18n";
import type { VoiceGender } from "../lib/story-voice";

export interface Voice {
  lang: Lang;
  gender: VoiceGender;
}

const VoiceContext = createContext<Voice>({ lang: "tr", gender: "female" });

/** The voice the visitor listens to (story player, part cards): the effective language and gender of the recordings. */
export const VoiceProvider = VoiceContext.Provider;
export const useVoice = () => useContext(VoiceContext);
