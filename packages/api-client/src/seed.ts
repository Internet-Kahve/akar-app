import type {
  CityScene,
  HeritageRoute,
  HeritageSite,
  SiteBadge,
  SiteModel,
  SiteTask,
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
/** Bursa's city record (`veri/sehir/bursa.json`), as the import stores it (§11.42). */
export const demoCityScenes: Record<string, CityScene> = {
  Bursa: {
    light: {
      ambient: 2,
      sun: 1,
      fill: 1,
      azimuthDeg: 315,
      elevationDeg: 45,
      saturation: 1.25,
      groundShadow: 0.18,
    },
    backgroundTop: "#DDE4E5",
    backgroundBottom: "#A7B4B7",
  },
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
/** Part names of the demo GLBs (what the server reads from a model upload), for the placement's main-part list. */
const demoParts: Record<string, string[]> = {
  "ulu-cami": [
    "Alemler",
    "Avlu_Mermer_Cesme",
    "Avlu_Sadirvan_Bati",
    "Avlu_Sadirvan_Dogu",
    "Cati",
    "Cephe_Bati",
    "Cephe_Dogu",
    "Cephe_Guney",
    "Cephe_Kuzey",
    "Giris_Cikintili_Blok",
    "Govde",
    "Ic_Sadirvan_Havuz",
    "Ic_Zemin",
    "Kapi_Bati",
    "Kapi_Dogu",
    "Kasnak_Pencereleri",
    "Kubbeler_19",
    "Mermer_Bant",
    "Minare_1",
    "Minare_2",
    "Pencere_Girintileri",
    "Portal_Silmeleri",
    "Sadirvan_Iskeleti",
    "Sadirvan_Kubbe",
    "Silme_Ust",
    "Tac_Kapi",
  ],
  bedesten: [
    "Cati",
    "Dukkan_Kapilari",
    "Dukkanlar",
    "Govde",
    "Kapilar",
    "Kubbeler",
    "Pencereler",
    "Sacak",
  ],
  "koza-han": [
    "Avlu_Cephe",
    "Avlu_Halka",
    "Avlu_Mescit",
    "Avlu_Revak",
    "Avlu_Zemin",
    "Baca",
    "Cati",
    "Cephe",
    "Govde_Dis",
    "Ic_Koza",
    "Kubbe_Avlu",
    "Mescit_Dikis",
    "Mescit_Kubbe",
    "Portal",
    "Silme_Kat",
  ],
  "orhan-gazi": [
    "Cami_Govde",
    "Cami_Mihrap",
    "Cami_SonCemaat",
    "Kubbe_Ana",
    "Kubbe_Mihrap",
    "Kubbe_SonCemaat",
    "Kubbe_Tabhane_B",
    "Kubbe_Tabhane_D",
    "Minare_1",
    "Revak_Cephe",
    "Revak_Kemerler",
    "Sadirvan",
  ],
};
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
  parts: demoParts[name] ?? [],
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
/**
 * Ulucami's tasks and badges (`icerik/gorevler.json`, 28 Ekim 2026), as the public API serves them: no
 * answer key. The key and the texts shown after success are `demoSiteTaskKeys`, which stays inside the mock client.
 */
const ulucamiTasks: SiteTask[] = [
  {
    id: "ulu-soru-kundekari",
    kind: "quiz",
    title: "Minberin sırrı",
    prompt: "Ulucami'nin ahşap minberi hangi teknikle yapıldı?",
    part: "Minber",
    source: "E cilt-1 PDF s.27",
    trust: "verified",
    quiz: {
      options: ["Kündekâri", "Çini", "Kalem işi", "Mukarnas"],
      hints: [
        "Minberin parçalarına bak: aralarında çivi ya da tutkal yok, birbirine geçiyorlar.",
        "Cevap «K» harfiyle başlıyor.",
      ],
      wrongText: "Tekrar dene. İpucu almak istersen aşağıda.",
      fromHome: true,
    },
  },
  {
    id: "ulu-saha-sahaflar",
    kind: "field",
    title: "Sahaflar Kapısı",
    prompt:
      "Caminin kuzey cephesindeki mermer taç kapıyı bul. Halk arasında adı «Sahaflar Kapısı».",
    source: "E cilt-1 PDF s.25",
    trust: "verified",
    field: {
      onSite: {
        text: "Kapının önüne gel ve «Buradayım»a dokun. İstersen fotoğrafını çekip İz Bırak'a ekle.",
        radiusM: 80,
      },
      fromHome: {
        text: "3D modelde Sahaflar Kapısı'na dokun.",
        part: "Tac_Kapi",
      },
    },
  },
];
const ulucamiBadges: SiteBadge[] = [
  {
    id: "ulu-hikaye",
    title: "Ulucami'yi dinledin",
    text: "Ulucami'nin hikâyesini sonuna kadar dinledin ya da okudun.",
    condition: "story",
    taskId: null,
    onSiteLabel: false,
  },
  {
    id: "ulu-kundekari",
    title: "Kündekâri",
    text: "Minberin çivisiz, birbirine geçen parçalarını öğrendin.",
    condition: "task",
    taskId: "ulu-soru-kundekari",
    onSiteLabel: false,
  },
  {
    id: "ulu-sahaflar",
    title: "Sahaflar Kapısı",
    text: "Ulucami'nin kuzeydeki taç kapısını buldun.",
    condition: "task",
    taskId: "ulu-saha-sahaflar",
    onSiteLabel: true,
  },
];
/** Mock only: answer key of the question and the texts shown once a task is done. Never part of a site. */
export const demoSiteTaskKeys: Record<
  string,
  { correctIndex: number; correctText: string } | { doneText: string }
> = {
  "ulu-soru-kundekari": {
    correctIndex: 0,
    correctText:
      "Kündekâri: ahşap parçalar çivi, tutkal ya da başka bir bağlayıcı kullanılmadan birbirine geçirilir. Ulucami minberi bu tekniğin en özgün örneklerinden biridir.",
  },
  "ulu-saha-sahaflar": {
    doneText:
      "Ulucami'ye üç kapıdan girilir: kuzeyde Sahaflar Kapısı, doğuda Çarşı Kapısı, batıda Müftülük ya da Mahkeme Kapısı.",
  },
};
export const sites: HeritageSite[] = input.map((site, i) => ({
  ...site,
  ...(demoModels[site.id] && { model: demoModels[site.id] }),
  ...(site.id === "ulu-cami" && {
    tasks: ulucamiTasks,
    badges: ulucamiBadges,
  }),
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
