"use client";
import { createContext, useContext, useMemo } from "react";
import {
  defaultCityScene,
  type CityIdentity,
  type CityRecord,
  type CityScene,
} from "@akar/domain";

/** City records (`GET /v1/cities`, §11.42, §11.45); read once by `AkarApp`, empty until then. */
export const Cities = createContext<CityRecord[]>([]);

export function useCities() {
  return useContext(Cities);
}

/** Saved scenes by city name; a city without one is absent. */
export function useCityScenes(): Record<string, CityScene> {
  const cities = useCities();
  return useMemo(
    () =>
      Object.fromEntries(
        cities.flatMap((c) => (c.scene ? [[c.name, c.scene]] : [])),
      ),
    [cities],
  );
}

/** The scene of one city; the default light and background when it has none. */
export function useCityScene(city: string): CityScene {
  return useCityScenes()[city] ?? defaultCityScene;
}

/** The identity of one city (§11.49: its colour and pattern); `null` when it has none or the records are not read yet. */
export function useCityIdentity(city: string): CityIdentity | null {
  const cities = useCities();
  return useMemo(
    () => cities.find((c) => c.name === city)?.identity ?? null,
    [cities, city],
  );
}
