# Rozet görselleri: promptlar

5 Kasım 2026. Uygulamadaki 28 rozet ve 3 yedek görsel şu an `apps/web/scripts/draw-badges.mjs` ile kodla çiziliyor (`apps/web/public/rozetler/<id>.webp`). Bir görsel üretme aracıyla boyanmış sürüm istenirse aşağıdaki promptlar kullanılır. Üretilen dosya **aynı adla** konur; kod değişmez.

## Kurallar

- Dosya: `apps/web/public/rozetler/<rozet-id>.webp`, 256 × 256, şeffaf zemin, 20 KB altı (`badges.test.ts` denetler).
- Seviye (bronz, gümüş, altın) **görselde yok**. Aynı rozet evden gümüş, yerinde altın olabilir; seviyenin halkası ve parıltısı ekranda çizilir. Madalyanın kendi kenarı nötr kalsın, dış çevresi biraz boşluk bıraksın.
- Okunabilir yazı, harf, rakam, hat ya da hat taklidi yok. Kitap ve levhalarda yalnız süsleme (şemse, bordür).
- Camiler ve türbeler kutsal mekân: saygılı, sakin; savaş, silah, kalkan arması, şaka yok.
- Para, sikke, sandık, hazine, şans çağrışımı yok.
- İçerik `docs/documents-context/eserler/<eser>/icerik/gorevler.json` dosyasından. Rozet metni dışında bilgi eklenmez.

## Ortak stil (her promptun başına)

> A collectible game medal icon, front view, centered on a transparent background, 256×256. Thick dark walnut-brown outline, chunky volume, soft top-left light with a glossy highlight, gentle drop shadow. The medal face is warm cream paper like an Ottoman miniature page; the emblem inside is painted in the flat, delicate style of 16th-century Ottoman miniatures (Nakkaş Osman school): lapis blue, turquoise, coral red, leaf green, ochre, gold leaf accents, small tulip or carnation sprigs. Rich and rewarding like a mobile game achievement medal, but calm and respectful. No text, no letters, no numbers, no calligraphy, no coins.

Avatarlarla akrabalık için: krem kâğıt zemin, ince altın bordür, çiçek dalları (`apps/web/public/avatarlar/`).

## Rozetler

| Rozet id | Eser | Madalya şekli · renk | Prompt (ortak stilden sonra) |
|---|---|---|---|
| `abc-hikaye` | Alaaddin Bey Çeşmesi | yuvarlak madalyon · deniz yeşili | Shape: round medallion, teal rim. Emblem: a small stone Ottoman fountain facade with a wide pointed arch, a spout and a thin stream of water falling into a stone basin. |
| `abc-sivri-kemer` | Alaaddin Bey Çeşmesi | mihrap biçimli kemer · mercan | Shape: tall pointed-arch tablet, coral rim. Emblem: a wide pointed arch built of alternating white travertine and red brick voussoirs, a single water drop in the middle. |
| `emir-hikaye` | Emir Hanı | sekizgen · aşı boyası | Shape: octagon, ochre rim. Emblem: the two-storey arcaded facade of an Ottoman han with a tall arched gate in the middle, stone and brick bands. |
| `emir-tas-tugla` | Emir Hanı | kalkan biçimli levha · koyu kırmızı | Shape: shield-shaped plaque (not a weapon shield), crimson rim. Emblem: two wide piers of alternating cut-stone blocks and double rows of brick, carrying a brick arch. |
| `emir-avlu` | Emir Hanı | rozet (dalgalı kenar) · zümrüt | Shape: scalloped rosette, emerald rim. Emblem: a courtyard seen from above, arcades with small domes all round, an octagonal marble şadırvan with water and a fountain jet in the centre. |
| `ebm-hikaye` | İnebey (Eyne Bey) Medresesi | yuvarlak madalyon · lacivert | Shape: round medallion, navy rim. Emblem: a medrese with a central lead dome, two small side domes and a deep arched iwan in front. |
| `ebm-kutuphane` | İnebey Medresesi | mühür (yıldız kenar) · mor | Shape: star-edged seal, plum rim. Emblem: an open manuscript on a wooden X-shaped book stand (rahle); the pages show only gold borders and a small ornamental medallion, no writing. |
| `hnc-hikaye` | Habib-i Neccar Camii | altıgen · zümrüt | Shape: hexagon, emerald rim. Emblem: a stone mosque with one lead dome and a slender minaret at the side. |
| `hnc-yasin` | Habib-i Neccar Camii | yumuşak dilimli · deniz yeşili | Shape: soft lobed medallion, teal rim. Emblem: a closed book with a deep green cover and a gold şemse medallion, resting on a wooden rahle, soft gold rays behind. No writing at all. |
| `kar-hikaye` | Karatay Medresesi | kalkan biçimli levha · lapis | Shape: shield-shaped plaque, lapis rim. Emblem: a Seljuk marble crown portal with a muqarnas niche, a turquoise-tiled dome behind. |
| `kar-cini` | Karatay Medresesi | sekizgen · turkuaz | Shape: octagon, turquoise rim. Emblem: a round tile panel of Seljuk star pattern: a large eight-pointed turquoise star, small white stars on deep navy. |
| `koza-hikaye` | Koza Han | yuvarlak madalyon · aşı boyası | Shape: round medallion, ochre rim. Emblem: a two-storey arcaded han with a small domed pavilion mosque in the courtyard. |
| `koza-kosk-mescit` | Koza Han | yumuşak dilimli · lapis | Shape: soft lobed medallion, lapis rim. Emblem: a small domed mosque raised on open arches (a köşk mescit), white marble, sitting above a fountain. |
| `koza-on-dort-basamak` | Koza Han | altıgen · gül | Shape: hexagon, rose rim. Emblem: a white marble staircase of many small steps climbing to the arched door of a small upper room. |
| `obh-hikaye` | Orhan Bey Hamamı | rozet (dalgalı kenar) · mercan | Shape: scalloped rosette, coral rim. Emblem: low bath domes pierced with small star-shaped skylights, soft steam curls rising. |
| `obh-aynali` | Orhan Bey Hamamı | yuvarlak madalyon · mor | Shape: round medallion, plum rim. Emblem: an ornate round hand mirror with a gold and coral frame, reflecting a pointed arch. |
| `obh-uc-giris` | Orhan Bey Hamamı | kalkan biçimli levha · aşı boyası | Shape: shield-shaped plaque, ochre rim. Emblem: a stone facade with three arched wooden doorways, the middle one taller. |
| `obc-hikaye` | Orhan Bey Camii | sekizgen · zümrüt | Shape: octagon, emerald rim. Emblem: an early Ottoman mosque with two lead domes in a row, a portico of five arches and one minaret. |
| `obc-alci-mihrap` | Orhan Bey Camii | mihrap biçimli kemer · lacivert | Shape: tall pointed-arch tablet, navy rim. Emblem: a white plaster mihrab niche with a seven-tier gilded muqarnas hood and a small gold lotus at its foot. |
| `obc-ikiz-kemer` | Orhan Bey Camii | mühür (yıldız kenar) · koyu kırmızı | Shape: star-edged seal, crimson rim. Emblem: twin pointed arches resting on one slender marble column with a gold capital, brick-edged. |
| `ogt-nilufer` | Orhan Gazi Türbesi | rozet (dalgalı kenar) · gül | Shape: scalloped rosette, rose rim. Emblem: a white and pale pink water lily (nilüfer) open on green lily pads on calm blue water. |
| `ogt-tek-kubbe` | Orhan Gazi Türbesi | kalkan biçimli levha · deniz yeşili | Shape: shield-shaped plaque, teal rim. Emblem: a square stone tomb with one large lead dome and an arched door, tulip sprigs at the sides. Calm and respectful. |
| `ulu-hikaye` | Ulucami | sekizgen · zümrüt | Shape: octagon, emerald rim. Emblem: a great mosque crowned by many small domes in rows, with two minarets at the corners. |
| `ulu-kundekari` | Ulucami | altıgen · aşı boyası | Shape: hexagon, ochre rim. Emblem: a wooden kündekâri panel: an eight-pointed star of walnut surrounded by small interlocking geometric wooden pieces, fitted together without nails. |
| `ulu-sahaflar` | Ulucami | mihrap biçimli kemer · lapis | Shape: tall pointed-arch tablet, lapis rim. Emblem: a white marble crown gate with a muqarnas hood and wooden doors; a small stack of closed books beside it (booksellers' gate). |
| `bed-hikaye` | Yıldırım Bayezid Bedesteni | yuvarlak madalyon · koyu kırmızı | Shape: round medallion, crimson rim. Emblem: a long stone market hall with a row of seven lead domes and an arched gate. |
| `bed-on-dort-kubbe` | Yıldırım Bayezid Bedesteni | sekizgen · lacivert | Shape: octagon, navy rim. Emblem: a roof seen from above: fourteen lead domes in two rows of seven on a stone base. |
| `bed-dort-kapi` | Yıldırım Bayezid Bedesteni | mühür (yıldız kenar) · turkuaz | Shape: star-edged seal, turquoise rim. Emblem: a heavy wooden double door in a pointed arch, studded with gold nails, two ring knockers. |

## Yedekler

Yeni bir rozetin kendi görseli yoksa türüne göre bunlardan biri görünür.

| Dosya | Ne zaman | Prompt |
|---|---|---|
| `_hikaye` | hikâye rozeti | Round medallion, ochre rim. Emblem: an open book with ornamental pages (gold borders and a small medallion, no writing) and a red ribbon bookmark, tulip sprigs above. |
| `_gorev` | soru rozeti | Octagon, lapis rim. Emblem: an eight-pointed navy and gold compass star on cream. |
| `_saha` | saha rozeti | Shield-shaped plaque, emerald rim. Emblem: a coral map pin with a tulip in its round head. |
