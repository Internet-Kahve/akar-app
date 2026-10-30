# Görev: Ulucami'deki 3D parça kartlarını öbür 6 esere de yaz

Sen AKAR adlı bir hackathon projesinde çalışıyorsun (KÖK&KOD, 42 Türkiye × Vakıf Katılım; final 7–8 Kasım 2026). AKAR, Bursa'daki vakıf eserlerini harita, 3D model, sesli hikâye ve eski fotoğraflarla anlatan bir uygulama.

**Ulucami'de bu iş yapıldı ve referans o.** Eser detayındaki 3D modelde bir parçaya dokununca bir kart açılıyor:
- üstte yana kaydırılan fotoğraflar;
- altta kısa, kaynaklı bir metin;
- sesli dinle düğmesi.

Kartlar eser başına tek bir dosyadan geliyor: `icerik/parcalar.md`. Öbür altı eserde bu dosya yok. O yüzden parçaya dokununca yalnız parçanın adı çıkıyor. Senin işin bu altı eserin kartlarını yazmak.

Her adımda neyi neden yaptığını kısaca yaz. **Uydurma bilgi yasak.** Her kart metni eserin kendi kaynaklı metninden gelmeli ve sayfa kodunu taşımalı.

---

## 1. Kesin kurallar

1. **Dokunma:**
   - `DC/design/test-redmi9t/` (v1), `akar-app/apps/`, `services/`, `packages/`;
   - Ulucami'nin dosyaları (yalnız referans olarak oku);
   - `app.js`, `app.css`, `hazirla.py`;
   - 3D modeller ve `model.json`.
2. **Metin yalnız kaynaktan.** Kaynaklar:
   - `icerik/eser-hakkinda.md` paragrafları (her birinin sonunda kaynak kodu ve güven etiketi var);
   - envanter sayfası;
   - eserin `*_notlar.md`'sinde kaynağı yazılı bilgiler.

   Kaynağı olmayan cümle yazma. Güveni «Tarihsel çıkarım» olan bilgi kullanılabilir, ama kartın güveni de öyle olur.
3. **Kısa:** 2–4 cümle, sade dil. Ulucami kartlarının uzunluğuna bak.
4. **Fotoğraflar:** `icerik/fotograflar.md` listesindeki ve `icerik/foto/` içinde gerçekten bulunan dosyalar. İlki kapaktır; parçayı en iyi gösteren fotoğraf olsun. Parçayı göstermeyen fotoğraf koyma.
5. **Dil:** Para, kazanç, yatırım, getiri, bağış, faiz gibi kelimeler kullanılmaz; sponsor bir katılım bankası. Vakıf ilişkisi «gelirini … için ayırdı» gibi yazılır.
6. **Dosya silme.** Gereksiz bir şey olursa `_eski/` alt klasörüne taşı ve raporda yaz.

## 2. Yollar

Kök klasör `akar-app/docs/documents-context/`; aşağıda kısaca **DC**.

| Ne | Yol |
|---|---|
| **Referans** (biçim, ton, uzunluk, «kartı olmayan parçalar» bölümü) | `DC/eserler/ulu-cami/icerik/parcalar.md` |
| **Başlangıç noktası** (parçalar ve önerilen başlıklar, 29 Ekim) | `DC/eserler/<eser>/icerik/parcalar_taslak.md` |
| Kaynaklı metin | `DC/eserler/<eser>/icerik/eser-hakkinda.md` |
| Fotoğraflar | `DC/eserler/<eser>/icerik/fotograflar.md` + `icerik/foto/` |
| Hikâye (hangi parçalar vurgulanıyor) | `DC/eserler/<eser>/icerik/hikaye.md` |
| 3D model | `DC/eserler/<eser>/3d/model.json` → `glb`; dosya `3d/export/<glb>_sunum.glb` |

**Eserler:**
- `yildirim-bayezid-bedesteni`
- `koza-han`
- `orhan-bey-kulliyesi`
- `orhan-bey-hamami`
- `emir-han`
- `orhan-gazi-turbesi`

## 3. Önemli: dosya adının etkisi

`parcalar.md` dosyası olan eserde **yalnız kartı olan parçalar tıklanır.** Kartı olmayan parça tıklanmaz. Bu yüzden:
- Kaynağı olan her anlamlı parçaya kart yaz.
- Anlatacak kaynaklı bilgisi olmayan parçayı «Kartı olmayan (tıklanmayan) parçalar» bölümüne nedeniyle yaz (Ulucami'deki gibi).
- Hikâyede vurgulanan parçaların kartı olsun. Ziyaretçi hikâyede yanan parçaya dokunup boş bir şeyle karşılaşmasın.
- Birden çok parça aynı kartı açabilir. «Parçalar» sütununa virgülle yazılır; uygulama bunları birlikte seçer ve vurgular.

## 4. Eser başına ne hazırlanacak

`DC/eserler/<eser>/icerik/parcalar.md`. Ulucami'deki dosyayla aynı biçim:
- başlık;
- tarih ve kısa açıklama paragrafı;
- tablo `| Parçalar | Başlık | Metin | Fotoğraflar | Kaynak | Güven |`;
- «Kartı olmayan (tıklanmayan) parçalar» bölümü;
- «Notlar» bölümü.

**Parça adları** 3D modeldeki üst düzey adlarla birebir aynı olmalı. Taslaktaki adlar 29 Ekim modeliyle doğrulandı, ama kendin de kontrol et:

```python
import json, struct, sys
b = open(sys.argv[1], 'rb').read()
n = struct.unpack_from('<I', b, 12)[0]
j = json.loads(b[20:20 + n])
kok = j['scenes'][j.get('scene', 0)]['nodes']
print('\n'.join(sorted(j['nodes'][i].get('name', '?') for i in kok if 'mesh' in j['nodes'][i])))
```

`python3 adlar.py DC/eserler/<eser>/3d/export/<glb>_sunum.glb`. `Zemin*`, `Cevre*`, `Olcek*` ile başlayan adları ve `model.json`'daki `sunum_ek` listesindekileri seçme; bunlar zemin, ağaç ve ölçek figürleri.

**Belirsiz bilgi:** Koza Han `Ic_Koza` içindeki mermer havuz envanterde geçmiyor, yalnız bir fotoğrafa dayanıyor. Kartta havuzdan söz edeceksen bunu belirt ya da hiç söz etme.

## 5. Bitince

- `parcalar_taslak.md` dosyasını `_eski/` alt klasörüne taşı; yerini `parcalar.md` aldı.
- `python3 DC/design/test-redmi9t-v2/hazirla.py /tmp/akar-deneme` hatasız çalışmalı (kartları okur).
- Prototipte dene: `bash DC/design/test-redmi9t-v2/sunucu.sh`. Her eserde 3D'de parçaya dokun; kart açılsın, fotoğraflar görünsün; kartı olmayan parça tıklanmasın.
- `DC/yaptiklarim-2.md` en altına yeni madde (numara: son madde + 1).

**RAPOR:** eser başına kart sayısı, kartı olmayan parçalar ve nedenleri, kaynağı zayıf ya da belirsiz kalan bilgiler.
