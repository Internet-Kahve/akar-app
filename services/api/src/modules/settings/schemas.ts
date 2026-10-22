import { z } from "zod";

export const MapSettings = z.object({
  modelMinZoom: z
    .number("Yakınlaştırma eşiği sayı olmalı.")
    .min(0, "Yakınlaştırma eşiği 0 ile 24 arasında olmalı.")
    .max(24, "Yakınlaştırma eşiği 0 ile 24 arasında olmalı.")
    .describe("3B modeller bu harita yakınlaştırmasından (zoom) itibaren yüklenir"),
  maxVisibleModels: z
    .number("Model sayısı sayı olmalı.")
    .int("Model sayısı tam sayı olmalı.")
    .min(0, "Model sayısı 0 ile 50 arasında olmalı.")
    .max(50, "Model sayısı 0 ile 50 arasında olmalı.")
    .describe("Haritada aynı anda çizilen en çok 3B model; 0 haritada 3B'yi kapatır"),
});
export type MapSettings = z.infer<typeof MapSettings>;
