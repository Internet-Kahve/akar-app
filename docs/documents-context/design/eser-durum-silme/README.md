# Eser durumu ve silme · ekran görüntüleri

7 Kasım 2026, dal `talha/eser-durum-silme`. Yönetim paneli, demo modu (Playwright). Masaüstü 1280×800, telefon 390×780; `day` gündüz, `night` gece teması. Karar: `docs/BACKEND-DECISIONS.md` §11.81.

| Dosya | İçerik |
|---|---|
| `1-liste-durumlar-*` | Eser listesi: her satırda durum seçimi (Yayında / Taslak / Deaktif). Silme düğmesi yalnız taslak ve deaktif eserde açık, yayındakinde kapalı. |
| `2-silme-onayi-*` | Silme onay penceresi. |
| `3-silindikten-sonra-*` | Silinen eser listeden kalkar. |
| `4-duzenleyici-deaktif-day` | Deaktif eserin düzenleyicisinde «Deaktif olarak kaydet» (taslağa dönmez). |
| `5-telefon-*` | Telefonda tablo kendi içinde yana kayar; seçim ve düğmeler 44 px. |

Silme kaydı kaldırmaz, gizler: ziyaretçilerin rozet, puan ve anıları korunur. API testleri ve migration bu bilgisayarda çalıştırılmadı (Docker yok).
