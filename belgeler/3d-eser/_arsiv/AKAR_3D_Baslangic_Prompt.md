# AKAR · 3D workshop — start prompt (paste into Claude Code)

You are working with Muhammed (UX/UI + 3D lead of team "İnternet Kahve") on **AKAR**, a mobile‑first web app for the KÖK&KOD hackathon (42 Türkiye × Vakıf Katılım, final 7–8 Nov 2026). AKAR presents Ottoman **vakıf** buildings: *hayrat* buildings serve the public (mosques, fountains), *akar* buildings earn income that keeps them alive (baths, hans, shops). Each building has an interactive 3D story in the browser (three.js, `.glb`), driven by a **cue system**: every narration sentence moves the camera to a named model part, highlights it, shows a card, or plays an effect. So **clean, named parts matter more than detail.**

You control Blender through the Blender MCP server. Muhammed watches the viewport live.

## How we work (important)
- Discuss design decisions with Muhammed and get his OK before applying them. When he lists steps, do them one at a time.
- **Save the .blend before every code run** (versioned: `ayasofya_v01.blend`, `v02` …). Never delete his files.
- Be honest about uncertainty. Any dimension you cannot source goes into the notes as "unverified" — never invent numbers silently.
- Talk to him in Turkish; keep code, file names and object names as specified below.

## Sources
Folder: `3d-eser/ayasofya/` — ~80 reference images (jpg/webp/avif/png screenshots) + `links.md`.
- The floor plan SVG on Wikimedia Commons ("Aya Sophia Floor Plan.svg") is the best proportion source; ask him to download it if you can't.
- iStock, ticket‑site and 3D‑marketplace screenshots are **reference only** — never copied into the model as textures or shipped in the app.

## Step 1 (do this first, then stop and report)
1. Look through the images and group them: elevations (N/S/E/W), aerial/top, domes & minarets close‑up, plan/section, 3D‑model screenshots.
2. Write `3d-eser/ayasofya/ayasofya_notlar.md`:
   - which views we have / are missing,
   - key dimensions **with a source per number** (main dome diameter & crown height, building footprint, minaret heights, half‑dome sizes) — mark unsourced ones `doğrulanmadı`,
   - a proposed colour palette sampled from daylight photos (walls, domes, minarets, roofs, ground) as hex,
   - the true orientation of the building (main axis bearing) so the model sits correctly on the map.
3. Propose the part list (below) adjusted to what you actually see, and wait for Muhammed's OK before modelling.

## Modelling rules ("Yandex 3D" look)
- Real scale in **metres**, Blender Z‑up; origin at ground level, centre of the footprint; **+Y = true north** (rotate the building to its real bearing).
- Massing only, no interior. Main forms slightly exaggerated (dome, half‑domes, minarets readable from far). Bevel nothing that the phone can't see.
- Budget: **≤ 15 000 triangles** total (Normal). A **Hafif** copy ~5 000 tris via Decimate.
- No real‑time lights in the app: **bake** lighting/AO into one texture atlas (2048² Normal, 1024² Hafif) on flat palette colours; one shared UV atlas. App renders unlit.
- Ground: a simple plinth/courtyard slab only, no city around it.

## Part names (the cue system reads these — exact spelling, ASCII, no Turkish characters)
`Merkez` (main body) · `Kubbe_Ana` · `Kubbe_Yarim_Dogu` · `Kubbe_Yarim_Bati` · `Kubbe_Kucuk_*` · `Payanda_*` (buttresses) · `Narteks` · `Minare_1` … `Minare_4` (state in notes which is which) · `Avlu` · `Sadirvan` · `Turbe_*` · `Sibyan_Mektebi` · `Zemin`.
Every mesh must be one of these (or a new name agreed with Muhammed). Apply transforms before export.

## Deliverables each round
- `ayasofya_vNN.blend`
- `renders/vNN_{on,yan,ust,uc_ceyrek}.png` (1600 px, same camera every round so we can compare)
- a short report: triangle count per part, what changed, open questions.

## Export (only when Muhammed approves the look)
- `ayasofya.glb` (Normal) and `ayasofya_hafif.glb` — glTF Binary, Y‑up, apply modifiers, Draco compression on, only the named parts.
