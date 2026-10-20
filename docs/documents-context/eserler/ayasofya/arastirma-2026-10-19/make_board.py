from PIL import Image,ImageOps,ImageDraw,ImageFont
from pathlib import Path
D=Path(__file__).resolve().parent
fontpath='/System/Library/Fonts/Supplemental/Arial.ttf'
font=ImageFont.truetype(fontpath,24);small=ImageFont.truetype(fontpath,18);large=ImageFont.truetype(fontpath,36)
out=Image.new('RGB',(2000,1850),'#f4f2ed');dr=ImageDraw.Draw(out)
dr.text((40,25),'Ayasofya v20 — fotoğraf / model denetimi',font=large,fill='#172321')
dr.text((40,80),'Aynı kamera kalibrasyonu yapılmadı. Karşılaştırma biçim ve birleşim düzeni içindir.',font=small,fill='#52605d')
def panel(path,box,label):
 x,y,w,h=box;im=Image.open(path).convert('RGB');im=ImageOps.contain(im,(w,h-40));out.paste(im,(x+(w-im.width)//2,y+40+(h-40-im.height)//2));dr.text((x+10,y+5),label,font=font,fill='#172321')
panel(D/'referans/2171646-2098546734.jpg',(30,125,940,650),'Gerçek yapı · hava fotoğrafı')
panel(D/'model_ust.png',(1020,125,950,650),'v20 · üst görünüş')
panel(D/'referans/large_ma_or_hs_ext08.jpg',(30,800,940,500),'Gerçek yapı · yan çatı ve payanda düzeni')
panel(D/'model_cati_birlesim.png',(1020,800,950,500),'v20 · çatı birleşimleri yakın plan')
items=[('01','ÇATI GEÇİŞLERİ','Yan tonozlar ve kubbeler kesilmiş yüzeyler yerine üst üste kütleler gibi okunuyor.'),('02','TÜRBELER','Üç benzer çokgen kütle gerçek yapıların farklı plan ve revaklarını karşılamıyor.'),('03','PAYANDALAR','Genel konumlar yaklaşık; kesit, saçak ve bağlantı biçimleri aşırı basitleştirilmiş.'),('04','KAYNAK MODEL','Örneklenen yüzey noktaları eski referansla 1 mm içinde örtüşüyor; aktarım tek neden değil.')]
for i,(num,title,body) in enumerate(items):
 y=1350+i*95;dr.rounded_rectangle((40,y,92,y+48),radius=8,fill='#9e4738');dr.text((49,y+8),num,font=font,fill='white');dr.text((115,y),title,font=font,fill='#172321');dr.text((115,y+35),body,font=small,fill='#384944')
dr.text((40,1760),'Fotoğraf kaynakları: Arab News hava fotoğrafı; Columbia University / Robert Ousterhout dış cephe arşivi.',font=small,fill='#52605d')
dr.text((40,1792),'Tam bağlantılar, 13 görsel/çizim, geometri ölçümleri ve düzeltme listesi: ARASTIRMA_RAPORU.md',font=small,fill='#52605d')
out.save(D/'karsilastirma.jpg',quality=93)
