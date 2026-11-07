/**
 * Resolve editorial folder names through imported media, preserving API identifiers. An editorial record stands in
 * for the imported route with its id or its name; the imported routes it does not replace stay (7 Nov 2026: the demo
 * showed one route where the live site shows three).
 */
export function editorialRoutes(records, manifest) {
  const ids = new Map(manifest.sites.flatMap((site) => [
    [site.id, site.id],
    ...[site.model, ...(site.photos ?? [])].filter(Boolean).map((media) => [media.file.split('/')[1], site.id]),
  ]));
  const replaced = new Set();
  const edited = records.map((record) => {
    const existing = manifest.routes.find((route) => route.id === record.id) ?? manifest.routes.find((route) => route.name === record.ad);
    if (existing) replaced.add(existing);
    const minutes = Number(String(record.sure ?? '').match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(',', '.'));
    return {
      ...existing,
      id: record.id,
      name: record.ad,
      description: record.aciklama ?? '',
      ...(record.ad_en && { nameEn: record.ad_en }),
      ...(record.aciklama_en && { descriptionEn: record.aciklama_en }),
      siteIds: (record.duraklar ?? []).map((id) => ids.get(id) ?? id),
      minutes: Number.isFinite(minutes) ? minutes : (existing?.minutes ?? 0),
      distance: record.mesafe ?? existing?.distance ?? '',
      theme: existing?.theme ?? '',
    };
  });
  return [...edited, ...manifest.routes.filter((route) => !replaced.has(route))];
}
