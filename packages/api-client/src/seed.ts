import type {
  HeritageRoute,
  HeritageSite,
  Snapshot,
  StoryBlock,
} from "@akar/domain";
const story = (
  id: string,
  title: string,
  text: string,
  simple: string,
): StoryBlock => ({ id, title, text, simple, trust: "representative" });
export const heroStories = [
  story(
    "banisi",
    "Bir kaptanın izi",
    "Tophane’de, denize komşu bir külliyenin hikâyesindeyiz. Kılıç Ali Paşa adına yapılan bu yapı topluluğu, semtin hafızasında önemli bir yer tutuyor.",
    "Kılıç Ali Paşa adına yapılan külliye Tophane’de bulunur.",
  ),
  story(
    "mimar",
    "Sinan’ın İstanbul’u",
    "Figma’daki örnek eser, Mimar Sinan’ın 1580 tarihli Kılıç Ali Paşa Camii. Yapıyı yalnızca bir anıt olarak değil, çevresiyle yaşayan bir bütün olarak keşfet.",
    "Bu örnek anlatımda camiyi çevresindeki yapılarla birlikte keşfediyoruz.",
  ),
  story(
    "kubbe",
    "Başını kaldır",
    "Kubbe, ışık ve taşıyıcı düzen arasındaki ilişkiye bak. Mimari bir yapının hikâyesi bazen tek bir ayrıntıda gizlidir.",
    "Kubbeye ve içeri giren ışığa dikkat et.",
  ),
  story(
    "avlu",
    "Şehrin içinde bir durak",
    "Avlu, sokak ile yapının iç mekânı arasında bir geçiş oluşturur. Burada durup çevrendeki malzemeyi, sesleri ve ölçeği fark et.",
    "Avluya bak. Sokakla cami arasında nasıl bir geçiş var?",
  ),
  story(
    "hamam",
    "Komşu yapının hikâyesi",
    "Caminin yakınındaki hamam, külliyenin günlük hayatla kurduğu bağı düşünmek için bir başlangıç noktasıdır.",
    "Yakındaki hamam da bu yapı topluluğunun bir parçasıdır.",
  ),
  story(
    "akar",
    "Bir yapı, diğerini yaşatır",
    "Vakıflarda gelir getiren yapılara akar, topluma hizmet sunan yapılara hayrat denir. Buradaki hamam → bakım → cami akışı, genel sistemi anlatan temsili bir örnektir; bu vakfa ait gelir ilişkileri henüz doğrulanmadı.",
    "Akar gelir sağlar. Bu gelir, hayratın hizmet vermesine yardımcı olur. Şema örnektir.",
  ),
  story(
    "kiyi",
    "Değişen kıyı",
    "Bir kenti anlamak için bugünkü görünümün ötesine bakarız. Tarihî fotoğraf ve haritalar eklendiğinde bu bölümde kıyının değişimini karşılaştırabileceksin.",
    "Geçmiş görüntüler eklendiğinde kıyının değişimini görebileceksin.",
  ),
  story(
    "komsu",
    "Hikâye burada bitmiyor",
    "Tophane Çeşmesi ve Nusretiye Camii, çevrede keşfedebileceğin diğer duraklar. Her biri için ayrı bir hikâye var.",
    "Yakında başka eserler de var. Rotana ekleyebilirsin.",
  ),
  story(
    "bugun",
    "Şimdi senin izin",
    "Bir yapıyı yaşatan yalnızca taşları değildir. Burada fark ettiğin bir ayrıntıyı ya da anını bırakarak yaşayan hafızaya katıl.",
    "Hikâyeyi tamamladın. İstersen bir anı bırak.",
  ),
];
const input: Array<
  [
    string,
    string,
    string,
    string,
    HeritageSite["kind"],
    number,
    number,
    number,
    string,
  ]
> = [
  [
    "kilic-ali-pasa",
    "Kılıç Ali Paşa Camii",
    "1580",
    "Mimar Sinan",
    "cami",
    28.9805,
    41.0266,
    20,
    "Denize açılan bir hikâye. Tophane’de mimarinin ve vakıf kültürünün izlerini keşfet.",
  ],
  [
    "tophane-cesmesi",
    "Tophane Çeşmesi",
    "1732",
    "—",
    "cesme",
    28.981,
    41.0267,
    10,
    "Meydanın ortasında bir su hikâyesi; mermerin üzerindeki ayrıntılara yakından bak.",
  ],
  [
    "nusretiye",
    "Nusretiye Camii",
    "1826",
    "Krikor Balyan",
    "cami",
    28.984,
    41.0277,
    20,
    "Tophane siluetinin zarif duraklarından biri. Bir sonraki hikâyen burada.",
  ],
  [
    "kilic-ali-hamam",
    "Kılıç Ali Paşa Hamamı",
    "16. yüzyıl",
    "Mimar Sinan",
    "hamam",
    28.9799,
    41.0263,
    15,
    "Gündelik hayatın içinden bir vakıf yapısı. Akar ile hayrat arasındaki bağı keşfet.",
  ],
  [
    "karakoy-cesmesi",
    "Karaköy Çeşmesi · örnek",
    "Örnek kayıt",
    "—",
    "cesme",
    28.9768,
    41.0243,
    10,
    "Harita ve filtre deneyimini göstermek için hazırlanmış örnek eser kaydı.",
  ],
  [
    "tophane-mektebi",
    "Tophane Mektebi · örnek",
    "Örnek kayıt",
    "—",
    "egitim",
    28.9791,
    41.0295,
    15,
    "Eğitim ve sosyal yapılar kategorisine ait temsili demo kaydı.",
  ],
];
export const sites: HeritageSite[] = input.map(
  ([id, name, year, architect, kind, lng, lat, minutes, description], i) => ({
    id,
    name,
    year,
    architect,
    kind,
    coordinates: [lng, lat],
    minutes,
    description,
    city: "İstanbul",
    district: "Tophane · Beyoğlu",
    status: "published",
    tier: i === 0 ? "Hero" : "Tier 2",
    source: "AKAR Figma taslağı · ekip doğrulaması bekliyor",
    stories:
      i === 0
        ? heroStories
        : [
            story(
              `${id}-intro`,
              "Bir hikâyeye yakından bak",
              description,
              description,
            ),
            story(
              `${id}-memory`,
              "Senin hikâyen",
              "Bu eserin ayrıntılı anlatımı içerik ekibi tarafından hazırlanacak. Şimdilik çevrendeki bir ayrıntıyı keşfet ve anını bırak.",
              "Anlatım hazırlanıyor. İstersen bir anı bırak.",
            ),
          ],
  }),
);
export const routes: HeritageRoute[] = [
  {
    id: "tophane",
    name: "Tophane Vakıf Yürüyüşü",
    description:
      "Bir kaptanın camisinden meydanın çeşmesine. Birbirini yaşatan yapıların izinde küçük bir yolculuk.",
    siteIds: ["kilic-ali-pasa", "tophane-cesmesi", "nusretiye"],
    minutes: 40,
    distance: "1,2 km",
    theme: "Vakıf kültürü",
  },
  {
    id: "sinan",
    name: "Sinan’ın İzinde",
    description:
      "Bir cami, bir hamam, yüzlerce hikâye. Mimarlığa başka bir gözle bak.",
    siteIds: ["kilic-ali-pasa", "kilic-ali-hamam"],
    minutes: 35,
    distance: "0,6 km",
    theme: "Mimari",
  },
  {
    id: "su",
    name: "Suyun Hafızası",
    description:
      "Meydanları buluşturan su yapılarıyla semtin gündelik hayatını keşfet.",
    siteIds: ["tophane-cesmesi", "karakoy-cesmesi"],
    minutes: 25,
    distance: "0,9 km",
    theme: "Su yapıları",
  },
];
export function createSeed(): Snapshot {
  return {
    version: 1,
    sites: structuredClone(sites),
    memories: [],
    savedIds: [],
    routeIds: [],
    visitedIds: [],
    readIds: [],
    quizIds: [],
    points: 0,
    name: "Gezgin",
  };
}
