"use client";
import { createContext, useContext } from "react";
import { defaultCityScene, type CityScene } from "@akar/domain";

/** City scenes by city name (`GET /v1/cities`, §11.42); read once by `AkarApp`. */
export const CityScenes = createContext<Record<string, CityScene>>({});

export function useCityScenes() {
  return useContext(CityScenes);
}

/** The scene of one city; the default light and background when it has none. */
export function useCityScene(city: string): CityScene {
  return useCityScenes()[city] ?? defaultCityScene;
}
