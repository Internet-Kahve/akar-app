# Vakıf Haritası — prototype

A mobile-first proof of concept: a real map of Tophane/Karaköy in a modern flat-illustration style
with a light miniature touch, a three-stop vakıf walking route, and two stylized 3D models on the map:
Kılıç Ali Paşa Camii (stop 1) and Tophane Çeşmesi (stop 2). Tapping the mosque or marker 1 opens a
detailed 3D view of the complex (mosque, hamam and fountain) with a narrated story. Tapping the fountain flies to stop 2.

## Run

```bash
npm install
npm run dev        # http://localhost:5173 (also on your LAN, so you can open it on a phone)
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
```

**Netlify:** drag the `dist/` folder onto Netlify Drop, or set build command
`npm run build` and publish directory `dist`. The build uses a relative base
(`./`), so it also works from a subfolder. No environment variables or keys are needed.

**Testing flags:** `?low=1` forces the low-end path and `?low=0` forces the normal path.

## Tile source

- **Vector tiles:** [OpenFreeMap](https://openfreemap.org), `https://tiles.openfreemap.org/planet`
  (OpenMapTiles schema, no API key). The style itself is written from scratch in `src/style.js`.
- **Label glyphs:** OpenFreeMap only serves Noto Sans, so the label glyphs
  (Inter Medium / SemiBold for streets, places and water; Cormorant Garamond SemiBold for monument names; all OFL) are generated as MapLibre SDF
  PBFs by `npm run glyphs` (`scripts/make-glyphs.mjs`) into `public/fonts/`. They are
  committed, so you only need to rerun the script if you change fonts.
- **Attribution:** OpenFreeMap © OpenMapTiles, data © OpenStreetMap contributors (shown in the map's attribution control).

## Files

| File | Role |
|---|---|
| `src/map.js` | MapLibre map, footprint plinth, route line, markers, `flyToStop` |
| `src/style.js` | Illustrated map style (peach land, teal water, cream roads) plus the generated wave-mark pattern |
| `src/mapModel.js` | One MapLibre custom layer (three.js, shared GL context) for both map models, and tap ray-casting |
| `src/mosque.js` | Shared mosque builder: `buildMosque({ detail: 'low' \| 'high' })`, toon kit (3-tone ramp, darker-tone hull outlines, soft crease lines, blob shadows), tree shapes |
| `src/fountain.js` | Tophane Çeşmesi model: `buildFountain({ detail, kit, x, z, ry })` |
| `src/detailView.js` | Full-screen detail view and its camera (`flyTo` / `recenter` / pivot clamp): created on open, fully disposed on close |
| `src/story.js` | Narrated story: Dinle (speechSynthesis tr-TR, timed fallback) / Oku (IntersectionObserver), CSS2D cards, effects |
| `src/stories/kilic-ali-pasa.json` | The 9 story segments: text, camera, card, effect, trust label |
| `src/hamam.js` | Kılıç Ali Paşa Hamamı model (same toon kit as the mosque) |
| `src/actions.js` | After-story actions: Geçmişi Gör slider, İz Bırak (local record), Birlikte Gez link |
| `src/ui.js` | Progress bar, stop card, markers, toasts, bottom-sheet drag handle |
| `src/dial.js` | Rotation dial UI shared by the map and the 3D view (markup, pointer/keyboard input, knob, placement) |
| `src/icons.js` | Lucide icons (tree-shaken) as SVG strings, and the çintemani ornament |
| `src/stops.js` | Stops, route, mosque and fountain footprints (from OSM), `toLocal()` lng/lat → model metres |
| `src/perf.js` | Device tier and pixel ratio |
| `src/main.js` | Wiring and the open/close transitions |

## Look

Flat illustration with a light miniature touch. `references/style-1.png` and `style-2.png` were used
only for direction (palette, flat shading, softness); nothing is copied from them.

- **3D:** `MeshToonMaterial` with a 3-step gradient on vertex-coloured merged geometry; off-white/terracotta
  buildings, blue-grey domes, deep-teal windows, gold finials. Outlines are a thin (≈0.8 px) inverted hull tinted
  a darker tone of each surface's own colour, plus 1 px translucent crease lines; there's no black ink.
  Each building stands on a soft blob shadow (a transparent plane with a radial-gradient texture).
  Trees are cypresses and rounded crowns in three greens.
- **Sea (detail view):** muted teal with a lighter shallow band and sparse "︵︵" wave marks that turn to face the camera.
- **UI:** Inter for UI and body, Cormorant Garamond only for monument titles. Pill buttons and 16 px cards with soft
  shadows, Lucide icons, 44 px minimum touch targets, pressed states. Bottom sheets have a rounded top,
  blur/translucency (opaque on low-end devices) and a drag handle (swipe or tap to collapse).
  A thin teal progress bar with a gold active dot. Trust labels are small chips. The miniature accent is thin gold rules,
  one small çintemani ornament under the title, and gold card stems.

## Performance

- No shadows. Pixel ratio is `min(devicePixelRatio, 1.5)`, or 1 on low-end devices (`deviceMemory ≤ 4` or `≤ 4` cores).
  Low-end devices also skip MSAA and the `backdrop-filter` blur on panels.
- Map models: **~3.5k triangles** (mosque ~3.0k + fountain ~0.6k), one scene, one renderer and one material kit in a
  single custom layer. They render only when MapLibre repaints; there is no animation loop.
- Detail scene: **~25k triangles** (mosque ~17.6k, hamam ~3.5k, fountain ~4.2k). Frames render only during camera tweens,
  while the orbit controls are moving (including damping), or during story effects; then the loop stops.
  Closing disposes geometries, materials, textures and the renderer, and calls `forceContextLoss()`.

## Approximations

1. **Coordinates come from OSM** (way 165574748, footprint centroid 41.026416 N, 28.980947 E).
   Stop 2 is Tophane Çeşmesi (way 1051483433) and stop 3 is Nusretiye Camii (way 498861882).
2. **Orientation:** the model's qibla axis is set to 132°, taken from the long axis of the OSM footprint.
   The minaret is on the NE flank, where the footprint has a protrusion.
3. **Dimensions are estimated**, not surveyed: hall 26 × 26 m with 12 m walls, dome Ø13 m (top ≈ 22 m),
   minaret ≈ 48 m with the finial. Overall size matches the ~37 × 27 m OSM footprint.
4. **Semi-domes sit on the qibla axis**, which is the mosque's Hagia Sophia-like scheme, rather than on the left and right sides.
5. **Single portico** with five domes. The real mosque's outer portico with its sloped roof is omitted.
6. **Detail-only extras are illustrative:** courtyard walls and gate, şadırvan, the türbe's position, garden plots and trees.
   The island-in-the-sea setting is a stylistic nod to the original waterfront site, not today's
   (filled-in) shoreline.
7. **Hiding the flat footprint:** OpenFreeMap merges buildings into large multipolygons, so one building
   can't be filtered out. Instead, a light "plinth" is drawn over the exact OSM outlines under both models.
8. **Route:** stop 1 → 2 crosses the open square directly. Stop 2 → 3 is a simplified OSRM foot route.
   Marker 1 sits about 50 m W of the mosque and marker 2 about 22 m W of the fountain, so they don't cover the models.
9. **Labels are Latin-only** (`name:tr`, otherwise `name:latin`), because only the Latin glyph ranges are generated.
10. **Dates and attributions for stops 2 and 3** are given as commonly cited (Tophane Çeşmesi 1732, Sultan I. Mahmud;
    Nusretiye 1826, Krikor Balyan). Check them with a historian before showing them publicly.
11. **Low-end detection** is a heuristic and can misclassify mid-range 4 GB phones.
12. **Tophane Çeşmesi** (OSM way 1051483433, `amenity=fountain`, `fountain=sebilj`, `height=4`): the position is the
    centroid of its OSM footprint (41.0267496 N, 28.9812685 E), 45.7 m from the mosque at a bearing of 36°. The map and
    detail models both use that offset. The model is a *Temsili canlandırma*: the square body (9.2 m), rounded sebil corners,
    tap niches, relief panels (stylised Tulip-era vases), eaves (12.6 m, within the ~13.8 × 11.9 m footprint) and the
    low roof with finials are approximations.

## Story

Opening the detail view offers **Dinle** (speech, one segment per utterance; if the device has no
Turkish voice it auto-advances: 5 s, or longer for long segments) and **Oku** (silent transcript; the segment
crossing the middle of the panel drives the scene). Each segment tweens the camera (instant cut with
`prefers-reduced-motion`), shows at most one CSS2D card and runs at most one effect. All of these are disposed when the segment changes.
Segments 8–9 turn to Tophane Çeşmesi, then highlight it as a vakıf *hayrat*. When the story ends, the camera returns
to a wide view of the whole complex. Afterwards the sheet shows Geçmişi Gör / İz Bırak / Birlikte Gez.

**Camera:** every tween (intro, story shots, end-of-story wide view) animates `camera.position` **and**
`controls.target` together, so the orbit pivot is always the point being looked at. Story shots may aim
away from the complex (segment 7 looks out to sea). If the user starts dragging during such a shot, the pivot glides back
to the centre of the complex (between mosque, hamam and fountain) and the distance eases into 70–200 m. While the user is in
control, two-finger pan is allowed but the pivot is clamped to 24 m around that centre (2–20 m high).

**Rotation dial** (`src/dial.js`; right edge of the detail view, 96 px; 64 px when the screen is ≤ 380 px wide or ≤ 700 px tall):
the knob's angle on the dial (clockwise from **K**/north; D, G, B = east, south, west) is the camera's compass bearing as seen from the
complex centre, so dragging around the dial orbits the complex. Touching the dial first glides the pivot to that centre, so
it never orbits the sea. Tapping the centre button returns to the default view, and − / + zoom. It's a focusable `role="slider"`
("Görünümü döndür"): ←/→ (and ↓/↑) rotate by 15°, and − / + zoom. While a story is running, touching the dial pauses the
automatic camera (and the Dinle narration); pressing play flies back to the current segment's shot and resumes. The dial is
vertically centred in the free band between the top buttons and the bottom sheet / story panel, drops the zoom row if space is short,
and hides rather than overlap. One-finger drag and pinch on the canvas still work. Double-click / double-tap zoom and
text selection are blocked on the canvas.

**The same dial on the map** (`addRotationDial` in `src/map.js`): the knob shows the map's bearing (the compass direction the
top of the screen faces), and dragging around it turns the map around the screen centre, easing after the finger. The centre button flies back
to the current stop's framing (bearing, pitch, zoom), − / + zoom by one level, and the keyboard works the same way. Touching the dial
interrupts a running fly-to. It sits in the band between the progress header and the attribution / stop card. Pan, pinch zoom
and two-finger rotate still work, and the knob follows them. Double-click / double-tap zoom is turned off on the map too.

**Placeholders:** the gravür card in segment 7; both images in Geçmişi Gör; İz Bırak stores records
in `localStorage` (`vakif.memories.v1`, shaped like a server record with `status: "pending"` and
`sync.state: "local"`) and has no backend or moderation; the Birlikte Gez room code and link do nothing yet.
The hamam's position beside the mosque is illustrative.
