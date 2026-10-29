import { test } from "@playwright/test";
import { photoGalleryTests } from "./helpers/photo-gallery";

test.use({ browserName: "webkit", channel: async ({}, use) => use(undefined) });

photoGalleryTests();
