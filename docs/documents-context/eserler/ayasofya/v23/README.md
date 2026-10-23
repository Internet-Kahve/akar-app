# Ayasofya V23 — V22 biçim kaybını geri alma

Kullanıcının gösterdiği uzun düz üst duvarlar V22'deki değiştirme işleminden kaynaklandı. Kademeli payanda yüzeyleri tek eğimli prizmaya çevrilmiş, yan galeri kubbe/tonoz örtüleri sürekli bir yüzeye indirgenmişti.

V23, V21 sahnesinden yeniden üretilir. Dört üst payandanın kademeleri, taçları ve galeri örtüleri V21 biçiminde korunur. V22'nin batı girişindeki narteks ve dört kemerli payanda düzenlemesi korunur. V21 ve V22 dosyaları değiştirilmez.

İki ince doğu minaresi yakın renderlarla kontrol edildi. Gövde, şerefe ve külah arasında görünür kopma saptanmadı. GLB üçgenlerinin minare çevresindeki düşey kapsaması yaklaşık 28 m'den alemin tepesine kadar tarandı; 1 mm üzeri düşey boşluk bulunmadı. Bu kontrol bütün minarenin kapalı/manifold bir ağ olduğunu kanıtlamaz. Minare geometrisi değiştirilmedi.

Bu sürüm bütün yapının yeniden doğrulandığı anlamına gelmez. Eski kaynak modeldeki küçük çatı birleşimleri, basitleştirilmiş ek yapılar ve yaklaşık türbe yerleşimleri hâlâ ayrı çalışılmalıdır. Galeri örtülerinin eski biçimini geri almak bunların tüm birleşim kusurlarını çözmez.

Dosyalar: `ayasofya_v23.blend`, `ayasofya_v23.glb`, `validation.json`. Renderlar son GLB yeniden içeri alınarak üretilir. Tekrarlama sırası: `build_v23.py`, `finalize_export.py`, `review_v23.py` (Blender arka plan Python).

22 Ekim 2026 teknik incelemesi: `audit_delivery.py` teslim GLB'sini bağımsız olarak içeri alır; sonuç `delivery_audit.json` dosyasındadır. 139.776 üçgende geçersiz koordinat, dejenere üçgen veya 0,1 mm koordinat yuvarlamasında aynı köşeleri paylaşan kopya üçgen bulunmadı. Dört yeni kemerli payanda, UV/normal dikişleri birleştirildikten sonra kapalı ve pozitif hacimlidir. Narteks çatısının iki yan birleşiminde altı örnek noktada yüzey bulundu. GLB dış kaynak gerektirmiyor. Mevcut beş detay/genel render da incelendi; bu kontroller kapsamında kritik kusur saptanmadığından model dosyaları değiştirilmedi. Bu inceleme tüm çatı kesişimlerini veya tarihsel/mimari doğruluğu onaylamaz.
