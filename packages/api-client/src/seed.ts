import type {
  HeritageRoute,
  HeritageSite,
  SiteModel,
  Snapshot,
  StoryBlock,
} from "@akar/domain";

/** UI fixtures only: names follow the 15 October brief; content is not editorial approval. */
export const demoRegion = {
  city: "Bursa",
  district: "Hanlar Bölgesi",
  center: [29.0619, 40.184] as [number, number],
  heroId: "ulu-cami",
};
const story = (id: string, title: string, text: string): StoryBlock => ({
  id,
  title,
  text,
  simple: text,
  trust: "representative",
});
export const heroStories: StoryBlock[] = [
  story(
    "giris",
    "Bursa’da bir başlangıç",
    "Ulucami’den başlayarak Hanlar Bölgesi’ndeki vakıf yapılarını keşfet. Bu metin, arayüzü denemek için hazırlanmıştır.",
  ),
  story(
    "banisi",
    "Yapının geçmişi",
    "Yapım tarihi ve yaptıran bilgisi, içerik ekibinin kaynaklı anlatımıyla burada yer alacak.",
  ),
  story(
    "kubbe",
    "Kubbeye yakından bak",
    "Kubbelerle ilgili cümle, fotoğraf ve kaynak bu adımda birlikte gösterilecek.",
  ),
  story(
    "avlu",
    "Yapıyı keşfet",
    "Dış görünüşten iç mekâna geçişi bu örnek adım üzerinden deneyebilirsin.",
  ),
  story(
    "sadirvan",
    "İç mekânın ayrıntıları",
    "Şadırvan ve diğer mimari ayrıntılar için kaynaklı fotoğraflar hazırlanıyor.",
  ),
  story(
    "akar",
    "Bir yapı, diğerini yaşatır",
    "Güncel demo, Bedesten ile Ulucami arasındaki akar–hayrat ilişkisini anlatmayı hedefliyor. Kaynaklı içerik bu alana bağlanacak.",
  ),
  story(
    "kaynak",
    "Bilginin kaynağı",
    "Her tarihî cümlenin kaynağı ve güven etiketi, anlatımın aynı adımından açılabilecek.",
  ),
  story(
    "komsu",
    "Hanlar Bölgesi’nde devam et",
    "Bedesten, Koza Hanı ve Orhan Gazi Camii’ni örnek rotalarda keşfedebilirsin.",
  ),
  story(
    "bugun",
    "Şimdi senin izin",
    "Hikâyeyi tamamladın. İstersen bir anı bırakarak katkı akışını deneyebilirsin.",
  ),
];
const input: Array<
  Pick<
    HeritageSite,
    "id" | "name" | "year" | "kind" | "coordinates" | "description"
  >
> = [
  {
    id: "ulu-cami",
    name: "Ulucami",
    year: "1399",
    kind: "cami",
    coordinates: [29.0619, 40.184],
    description:
      "Bursa’da vakıf mirasını keşfetmeye başla. Ulucami ve Bedesten ilişkisi, yeni demo anlatımının merkezinde.",
  },
  {
    id: "bedesten",
    name: "Yıldırım Bayezid Bedesteni",
    year: "1399",
    kind: "bedesten",
    coordinates: [29.0624, 40.1856],
    description:
      "Ulucami ile akar ilişkisi üzerinden ele alınan ticaret yapısı. Kaynaklı anlatım hazırlanıyor.",
  },
  {
    id: "koza-han",
    name: "Koza Hanı",
    year: "1491",
    kind: "han",
    coordinates: [29.0639, 40.1844],
    description:
      "Hanlar Bölgesi’nde örnek rotanın bir durağı. Fotoğraf ve hikâye içeriği hazırlanıyor.",
  },
  {
    id: "orhan-gazi",
    name: "Orhan Gazi Camii",
    year: "1339",
    kind: "cami",
    coordinates: [29.0645, 40.1837],
    description:
      "Bursa’daki vakıf yapılarının izini sürerken keşfedebileceğin bir durak.",
  },
  {
    id: "bursa-cesme-demo",
    name: "Bursa Çeşmesi · örnek",
    year: "Örnek kayıt",
    kind: "cesme",
    coordinates: [29.0602, 40.1851],
    description:
      "Su yapıları filtresini denemek için oluşturulmuş kurmaca kayıt; gerçek bir envanter eseri değildir.",
  },
  {
    id: "bursa-mektep-demo",
    name: "Bursa Mektebi · örnek",
    year: "Örnek kayıt",
    kind: "egitim",
    coordinates: [29.0658, 40.1861],
    description:
      "Eğitim filtresini denemek için oluşturulmuş kurmaca kayıt; gerçek bir envanter eseri değildir.",
  },
];
/**
 * Demo models (`apps/web/public/demo-models`) and where the map draws them. Positions and headings are the
 * prototype's, matched against OSM building outlines and satellite imagery; the anchor part keeps the
 * courtyards and side buildings from shifting the base point.
 */
const demoModel = (
  name: string,
  bytes: number,
  triangles: number,
  placement: Pick<
    NonNullable<SiteModel["placement"]>,
    "lng" | "lat" | "headingDeg" | "anchorNode"
  >,
): SiteModel => ({
  name,
  bytes,
  src: `/demo-models/${name}.glb`,
  parts: [],
  trust: "representative",
  triangles,
  placement: {
    scale: 1,
    altitudeM: 0,
    hiddenPoints: [],
    keptPoints: [],
    ...placement,
  },
});
const demoModels: Record<string, SiteModel> = {
  "ulu-cami": demoModel("ulu-cami", 834836, 87280, {
    lng: 29.0618836,
    lat: 40.1839236,
    headingDeg: 174,
    anchorNode: "Govde",
  }),
  bedesten: demoModel("bedesten", 171848, 20088, {
    lng: 29.0621257,
    lat: 40.1851377,
    headingDeg: 4,
    anchorNode: "Govde",
  }),
  "koza-han": demoModel("koza-han", 848548, 38624, {
    lng: 29.0635407,
    lat: 40.1843748,
    headingDeg: 4,
    anchorNode: "Govde_Dis",
  }),
  "orhan-gazi": demoModel("orhan-gazi", 274116, 16014, {
    lng: 29.0640872,
    lat: 40.1839238,
    headingDeg: 13,
    anchorNode: "Cami_Govde",
  }),
};
export const sites: HeritageSite[] = input.map((site, i) => ({
  ...site,
  ...(demoModels[site.id] && { model: demoModels[site.id] }),
  architect: "—",
  city: demoRegion.city,
  district: demoRegion.district,
  minutes: i === 0 ? 4 : 2,
  status: "published",
  tier: i === 0 ? "Hero" : "Tier 2",
  source:
    "15 Ekim AKAR ürün notları · mock içerik, tarih ve koordinatlar ekip doğrulaması bekliyor",
  stories:
    i === 0
      ? heroStories
      : [
          story(
            `${site.id}-intro`,
            "Bir hikâyeye yakından bak",
            site.description,
          ),
          story(
            `${site.id}-memory`,
            "Senin hikâyen",
            "Bu eserin kaynaklı anlatımı hazırlanıyor. Şimdilik bir anı bırakarak demo akışını deneyebilirsin.",
          ),
        ],
}));
export const routes: HeritageRoute[] = [
  {
    id: "hanlar",
    name: "Hanlar Bölgesi Vakıf Yürüyüşü",
    description:
      "Ulucami, Koza Hanı ve Orhan Gazi Camii arasında öneri rota. Duraklar, süre ve mesafe demo içindir.",
    siteIds: ["ulu-cami", "koza-han", "orhan-gazi"],
    minutes: 40,
    distance: "1,2 km",
    theme: "Vakıf kültürü",
  },
  {
    id: "akar-hayrat",
    name: "Akar ve Hayrat",
    description:
      "Bedesten ile Ulucami arasındaki bağı keşfetmek için örnek rota.",
    siteIds: ["bedesten", "ulu-cami"],
    minutes: 20,
    distance: "0,4 km",
    theme: "Vakıf kültürü",
  },
  {
    id: "hanlar-ticaret",
    name: "Hanların İzinde",
    description:
      "Bedesten’den Koza Hanı’na örnek keşif. Yürüyüş süresi ve mesafe temsili değerlerdir.",
    siteIds: ["bedesten", "koza-han"],
    minutes: 25,
    distance: "0,6 km",
    theme: "Ticaret yapıları",
  },
];
/** Demo quiz questions: the mock serves them for every published site. `correct` never leaves the mock client. */
export interface DemoQuiz {
  question: string;
  options: [string, string, string];
  correct: 0 | 1 | 2;
  hint: string;
  explanation: string;
}
export const demoQuizzes: DemoQuiz[] = [
  {
    question: "Vakıfta “akar” neyi ifade eder?",
    options: ["Gelir sağlayan yapı", "Bir mimari süsleme", "Ziyaretçi defteri"],
    correct: 0,
    hint: "Hamam ve dükkânların vakıf içindeki işlevini düşün.",
    explanation:
      "Örnek hikâyedeki akar, hizmetlerin sürmesini destekleyen gelir sağlayan yapıdır.",
  },
  {
    question: "“Hayrat” hangi amaca hizmet eder?",
    options: [
      "Yalnızca ticarete",
      "Topluma hizmet sunmaya",
      "Yapıların yüksekliğini ölçmeye",
    ],
    correct: 1,
    hint: "Gelirin nasıl bir faydaya dönüştüğünü düşün.",
    explanation:
      "Hayrat, vakfın toplumsal hizmet sunan yapıları için kullanılan kavramdır.",
  },
  {
    question: "Temsili bir tarih anlatımını nasıl okumalıyız?",
    options: [
      "Kesin tarihî belge olarak",
      "Kaynağa gerek duymadan",
      "Kaynak doğrulaması bekleyen örnek olarak",
    ],
    correct: 2,
    hint: "Hikâyedeki içerik etiketini hatırla.",
    explanation:
      "Temsili anlatım, doğrulanmış tarihî belge yerine geçmez. Kaynak ve güven etiketi birlikte değerlendirilir.",
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
