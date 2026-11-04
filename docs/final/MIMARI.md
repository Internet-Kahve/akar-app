# Mimari ve veri modeli

Şartname §5.1.2 ve §5.4 için tek sayfa.

```mermaid
flowchart LR
  subgraph Kaynak["İçerik kaynağı (Git)"]
    K1["Envanter kitapları, Foto Atlas"]
    K2["eserler/&lt;eser&gt;/icerik, 3d, gecmisi-gor"]
    K3["veri/sehir, veri/rota"]
    K1 --> K2
  end
  P["prepare-demo-content.py<br/>manifest"]
  I["import-demo<br/>panel kayıtlarını korur"]
  K2 --> P
  K3 --> P
  P --> I
  subgraph Supabase["Supabase · Frankfurt"]
    DB[("PostgreSQL / PostGIS")]
    ST["Storage: foto, GLB, ses"]
    AU["Auth"]
  end
  I --> DB
  I --> ST
  API["Fastify API · Vercel<br/>Zod doğrulama, OpenAPI"]
  DB <--> API
  AU --> API
  WEB["Next.js web · Vercel<br/>MapLibre, three.js"]
  API <--> WEB
  ST --> WEB
  OFM["OpenFreeMap<br/>harita altlığı"] --> WEB
  PAN["Yönetim paneli<br/>içerik, açı, moderasyon"] --> API
  P -. "yerel demo: demo-content.json" .-> WEB
```

## Paylaşılan kod
`packages/domain` tipler ve iş kuralları, `packages/api-client` HTTP ve yerel istemci, `packages/design-tokens` tasarım değişkenleri.

## Temel veri modeli
- **Şehir:** kimlik (renk, desen, amblem), harita görünümü, sahne ışığı.
- **Eser:** tür, rol (hayrat veya akar), konum, kaynaklar.
- **Hikâye cümlesi:** metin, kaynak ve güven etiketi, fotoğraf, 3D açı, vurgulanan parçalar, varsa gelir yolu (`flow`).
- **Model:** sunum, gece ve pişmiş harita dosyaları, parça adları.
- **Parça kartı, «Eser hakkında» bölümü, görev, rozet, rota.**
- **Anı (İz Bırak):** moderasyon durumu, KVKK rıza kaydı.

## Güven kuralı
Her içerik `verified`, `inferred` ya da `representative` etiketi ve kaynak taşır. Doğrulanmış olan için etiket gösterilmez; çıkarım ve temsilî olan her zaman işaretlidir.

## Yeni eser ya da şehir eklemek
1. **Panelden:** Eser, hikâye, açı, kart, görev kod değişmeden eklenir. CSV içe aktarma da var.
2. **Paketle:** `eserler/<eser>/` klasörü ve `eser.json`, sonra `import-demo`.
3. **Yeni şehir:** `veri/sehir/<il>.json` ve içe aktarma. Kod değişmez.
4. **3D isteğe bağlıdır:** Modeli olmayan eser fotoğraflarıyla açılır.

## Performans kararları
Harita için ışığı dokuya pişirilmiş dosyalar, yakında sunum modeline geçiş, malzemeye göre birleştirme, görüntü boyutuna göre fotoğraf, telefonda sade çizim.
