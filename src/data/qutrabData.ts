// مثلث قطرب - Qutrab's Triangle Data
//
// Words whose meaning changes with the vowel on the first letter:
//   الفتحة (fatha) = ـَ, الكسرة (kasra) = ـِ, الضمة (damma) = ـُ
//
// Sources:
//   "qutrub"  – Qutrub's original مثلث as versified by Ibn Zurayq al-Baghdadi
//               (نظم مثلث قطرب); `verse` holds the couplet that uses all three
//               words. Glosses follow the نظم's own explanatory lines.
//   "classic" – well-known textbook triangles (no verse).
//
// Triangles whose glosses in the available transcription were unclear or
// linguistically stretched were deliberately left out rather than risk
// teaching a wrong meaning.

import { shuffle } from "../utils/random";

export type Haraka = "fatha" | "damma" | "kasra";
export type TriangleDifficulty = "easy" | "medium" | "hard";

export interface TriangleSense {
  word: string; // Word with tashkeel
  meaning: string;
  example?: string;
}

export interface QutrabTriangle {
  id: number;
  base: string; // The base word without tashkeel
  fatha: TriangleSense;
  damma: TriangleSense;
  kasra: TriangleSense;
  difficulty: TriangleDifficulty;
  source: "qutrub" | "classic";
  verse?: string; // Couplet from نظم مثلث قطرب (Ibn Zurayq)
}

export const QUTRAB_TRIANGLES: QutrabTriangle[] = [
  // ───────────── From نظم مثلث قطرب (Ibn Zurayq) ─────────────
  {
    id: 1,
    base: "غمر",
    fatha: { word: "غَمْر", meaning: "الماء الكثير", example: "نهرٌ غَمْرٌ: كثير الماء" },
    kasra: { word: "غِمْر", meaning: "الحقد في الصدر", example: "لا تجوز شهادة ذي الغِمْر على أخيه" },
    damma: { word: "غُمْر", meaning: "من لم يجرّب الأمور (الغِرّ)", example: "رجلٌ غُمْرٌ: قليل التجربة" },
    difficulty: "easy",
    source: "qutrub",
    verse: "إن دموعي غَمْرُ ~ وليس عندي غِمْرُ\nفقلتُ يا ذا الغُمْرِ ~ أقصِرْ عنِ التعتُّبِ",
  },
  {
    id: 2,
    base: "حلم",
    fatha: { word: "حَلَم", meaning: "القُراد الكبير، ودودٌ يثقب الجلد", example: "أديمٌ حَلِمٌ: أفسده الحَلَم" },
    kasra: { word: "حِلْم", meaning: "الأناة والعفو وضبط النفس", example: "الحِلْم سيد الأخلاق" },
    damma: { word: "حُلْم", meaning: "ما يراه النائم في منامه", example: "رأيتُ حُلْماً جميلاً" },
    difficulty: "easy",
    source: "qutrub",
    verse: "جُدْ فالأديمُ حَلْمُ ~ وما بقي لي حِلْمُ\nوما هنا لي حُلْمُ ~ مذ غبتَ يا معذبي",
  },
  {
    id: 3,
    base: "حمام",
    fatha: { word: "حَمَام", meaning: "الطير المعروف", example: "هدَلَ الحَمَامُ على الغصن" },
    kasra: { word: "حِمَام", meaning: "الموت المقدَّر", example: "وافاه الحِمَامُ" },
    damma: { word: "حُمَام", meaning: "اسم رجل (عَلَم)، وقيل: السيد الشريف" },
    difficulty: "easy",
    source: "qutrub",
    verse: "قولوا لأطيار الحَمامْ ~ يبكينني حتى الحِمامْ\nأما ترى يا ابنَ الحُمامْ ~ ما في الهوى من طربِ",
  },
  {
    id: 4,
    base: "سلام",
    fatha: { word: "سَلَام", meaning: "التحية", example: "ألقى عليه السَّلَام" },
    kasra: { word: "سِلَام", meaning: "الحجارة الصلبة (جمع سَلِمة)", example: "رماه بالسِّلَام" },
    damma: { word: "سُلَام", meaning: "عِرق في اليد، وقيل: عظام الأصابع (السُّلامى)" },
    difficulty: "easy",
    source: "qutrub",
    verse: "بدا فحيّا بالسَّلام ~ رمى عذولي بالسِّلامْ\nأشار نحوي بالسُّلام ~ بكفه المخضَّبِ",
  },
  {
    id: 5,
    base: "كلام",
    fatha: { word: "كَلَام", meaning: "القول المفهوم", example: "كَلَامٌ فصيح" },
    kasra: { word: "كِلَام", meaning: "الجراح (جمع كَلْم)", example: "بجسده كِلَامٌ كثيرة" },
    damma: { word: "كُلَام", meaning: "الأرض الصلبة الغليظة", example: "سرنا في أرضٍ كُلَامٍ" },
    difficulty: "easy",
    source: "qutrub",
    verse: "تيّمَ قلبي بالكَلام ~ وفي الحشا منه كِلامْ\nفصرتُ في أرضٍ كُلامْ ~ لكي أنالَ مطلبي",
  },
  {
    id: 6,
    base: "جد",
    fatha: { word: "جَدّ", meaning: "أبو الأب، والحظّ", example: "جَدُّه رجلٌ كريم" },
    kasra: { word: "جِدّ", meaning: "ضد الهزل واللعب (الاجتهاد)", example: "أخذ الأمر بجِدٍّ" },
    damma: { word: "جُدّ", meaning: "البئر (القليب)", example: "نزلوا على جُدٍّ" },
    difficulty: "medium",
    source: "qutrub",
    verse: "عالٍ رفيعُ الجَدِّ ~ أفعالهُ بالجِدِّ\nلقيتُه بالجُدِّ ~ كالمعطَّلِ المخرَّبِ",
  },
  {
    id: 7,
    base: "جوار",
    fatha: { word: "جَوَار", meaning: "جمع جارية (الفتيات)", example: "غنّت الجَوَارِي" },
    kasra: { word: "جِوَار", meaning: "المجاورة والحماية", example: "هو في جِوَارِي: في حمايتي" },
    damma: { word: "جُوَار", meaning: "الصوت العالي والصياح", example: "سُمع جُوَارُ الداعي" },
    difficulty: "medium",
    source: "qutrub",
    verse: "غنّى وغنّتْهُ الجَوارْ ~ بالقرب مني والجِوارْ\nفاستمعوا صوتَ الجُوارْ ~ ثم انثنوا بالطربِ",
  },
  {
    id: 8,
    base: "حجر",
    fatha: { word: "حَجْر", meaning: "حِضن الإنسان، والمنع", example: "تربّى في حَجْرِ أمه" },
    kasra: { word: "حِجْر", meaning: "العقل", example: "هل في ذلك قَسَمٌ لذي حِجْر" },
    damma: { word: "حُجْر", meaning: "اسم رجل (كحُجْر والد امرئ القيس)" },
    difficulty: "medium",
    source: "qutrub",
    verse: "ملأتْ دموعي حَجْري ~ وقلّ فيه حِجْري\nلو كنتُ كابن حُجْرٍ ~ لضاق فيه أدبي",
  },
  {
    id: 9,
    base: "حرة",
    fatha: { word: "حَرَّة", meaning: "أرض ذات حجارة سود", example: "حَرَّة المدينة" },
    kasra: { word: "حِرَّة", meaning: "الحرارة والعطش", example: "أصابته حِرَّةٌ شديدة" },
    damma: { word: "حُرَّة", meaning: "المرأة الكريمة المختارة", example: "هي حُرَّةٌ من كرام النساء" },
    difficulty: "medium",
    source: "qutrub",
    verse: "ثبتُّ بأرضٍ حَرَّةْ ~ معروفةٌ بالحِرَّةْ\nفقلتُ يا ابن الحُرَّةْ ~ ارثِ لما قد حل بي",
  },
  {
    id: 10,
    base: "دعوة",
    fatha: { word: "دَعْوة", meaning: "الدعاء والنداء", example: "دَعْوة المظلوم مستجابة" },
    kasra: { word: "دِعْوة", meaning: "الادّعاء في النسب", example: "هو دِعْوةٌ: يُدّعى إلى غير أبيه" },
    damma: { word: "دُعْوة", meaning: "الطعام يُدعى إليه الناس (الوليمة)", example: "أقام دُعْوةً للأصدقاء" },
    difficulty: "medium",
    source: "qutrub",
    verse: "دعوتُ ربي دَعْوةْ ~ لما أتى بالدِّعوةْ\nفقلتُ عندي دُعْوةْ ~ إن زرتَني في رجبِ",
  },
  {
    id: 11,
    base: "شرب",
    fatha: { word: "شَرْب", meaning: "القوم الشاربون (جمع شارب)", example: "جلس الشَّرْبُ حول الماء" },
    kasra: { word: "شِرْب", meaning: "الحظّ والنصيب من الماء", example: "لكل نفسٍ شِرْبُها" },
    damma: { word: "شُرْب", meaning: "فعل الشُّرب (المصدر)", example: "فشاربون شُرْبَ الهِيم" },
    difficulty: "medium",
    source: "qutrub",
    verse: "زلِقتُ نحو الشَّرْبِ ~ فلم أُذَدْ عن شِرْبي\nفانقلبوا بالشُّرْبِ ~ ولم يخافوا غضبي",
  },
  {
    id: 12,
    base: "شكل",
    fatha: { word: "شَكْل", meaning: "المِثل والشبيه", example: "هذا من شَكْلِ ذاك" },
    kasra: { word: "شِكْل", meaning: "الدلال والغنج", example: "امرأةٌ ذات شِكْلٍ" },
    damma: { word: "شُكْل", meaning: "جمع شِكال: قيد الدابة", example: "قيّد الدواب بالشُّكْل" },
    difficulty: "medium",
    source: "qutrub",
    verse: "شاكلَني بالشَّكلِ ~ تيّمَني بالشِّكلِ\nغلبني بالشُّكلِ ~ في حُبِّه والحزبِ",
  },
  {
    id: 13,
    base: "صرة",
    fatha: { word: "صَرَّة", meaning: "الجماعة من الناس، وقيل: الصيحة الشديدة", example: "فأقبلت امرأته في صَرَّة" },
    kasra: { word: "صِرَّة", meaning: "شدة البرد", example: "ليلةٌ ذات صِرَّةٍ" },
    damma: { word: "صُرَّة", meaning: "كيس النقود", example: "أخرج الصُّرَّة من جيبه" },
    difficulty: "medium",
    source: "qutrub",
    verse: "صاحبَني في صَرَّةِ ~ في ليلة ذي صِرَّةِ\nوما بقي في صُرَّتي ~ خردلةٌ من ذهبِ",
  },
  {
    id: 14,
    base: "عرف",
    fatha: { word: "عَرْف", meaning: "الرائحة الطيبة", example: "فاح عَرْفُ المسك" },
    kasra: { word: "عِرْف", meaning: "الصبر", example: "ما عنده عِرْفٌ على المكاره" },
    damma: { word: "عُرْف", meaning: "المعروف، وما تعارف عليه الناس من الخير", example: "وأمُرْ بالعُرْف" },
    difficulty: "medium",
    source: "qutrub",
    verse: "ظبيٌ ذكيُّ العَرْفِ ~ وآخِذٌ بالعِرْفِ\nوآمِرٌ بالعُرْفِ ~ سامٍ رفيعُ الرتبِ",
  },
  {
    id: 15,
    base: "قسط",
    fatha: { word: "قَسْط", meaning: "الجَور والظلم", example: "قَسَطَ الحاكم: جار" },
    kasra: { word: "قِسْط", meaning: "العدل", example: "وزنوا بالقِسْطاس المستقيم" },
    damma: { word: "قُسْط", meaning: "عودٌ هندي يُتبخَّر به", example: "تداووا بالقُسْط الهندي" },
    difficulty: "medium",
    source: "qutrub",
    verse: "طارحَني بالقَسْطِ ~ ولم يزِنْ بالقِسْطِ\nفي فيه عِرقُ القُسْطِ ~ والعنبريِّ المطيَّبِ",
  },
  {
    id: 16,
    base: "أمة",
    fatha: { word: "أَمَّة", meaning: "الشَّجَّة في الرأس تبلغ أُمَّ الدماغ", example: "أصابته أَمَّةٌ" },
    kasra: { word: "إِمَّة", meaning: "النِّعمة ورغد العيش (ضد البؤس)", example: "هم في إِمَّةٍ من العيش" },
    damma: { word: "أُمَّة", meaning: "جماعة الناس", example: "كنتم خير أُمَّةٍ" },
    difficulty: "hard",
    source: "qutrub",
    verse: "فأمَّ قلبي أَمَّةْ ~ عند زوال الإِمَّةْ\nفاستمعوا يا أُمَّةْ ~ بحقكم ما حل بي",
  },
  {
    id: 17,
    base: "خرق",
    fatha: { word: "خَرْق", meaning: "الأرض الواسعة (الفلاة)", example: "قطعوا خَرْقاً بعيداً" },
    kasra: { word: "خِرْق", meaning: "الكريم السخيّ", example: "رجلٌ خِرْقٌ: جوادٌ كريم" },
    damma: { word: "خُرْق", meaning: "الحُمق وضد الرِّفق", example: "الخُرْقُ شؤمٌ" },
    difficulty: "hard",
    source: "qutrub",
    verse: "رامَ سلوكَ الخَرْقِ ~ معَ الطريقِ الخِرْقِ\nإنّ بيانَ الخُرْقِ ~ عند ركوبِ السببِ",
  },
  {
    id: 18,
    base: "سبت",
    fatha: { word: "سَبْت", meaning: "اليوم المعروف", example: "يوم السَّبْت" },
    kasra: { word: "سِبْت", meaning: "الجلد المدبوغ تُصنع منه النعال", example: "نعلٌ سِبْتِيَّة" },
    damma: { word: "سُبْت", meaning: "نباتٌ (كالخِطْمي)", example: "رعت الإبلُ السُّبْت" },
    difficulty: "hard",
    source: "qutrub",
    verse: "حمِدَ يومَ السَّبْتِ ~ إذ جاء مُحذي السِّبْتِ\nعلى نبات السُّبْتِ ~ في المَهْمَهِ المستصعَبِ",
  },
  {
    id: 19,
    base: "سقط",
    fatha: { word: "سَقْط", meaning: "الثلج والبَرَد", example: "نزل السَّقْطُ على الجبال" },
    kasra: { word: "سِقْط", meaning: "ما يسقط من الزَّند من النار (الشرارة)", example: "قدح الزند فطار سِقْطه" },
    damma: { word: "سُقْط", meaning: "الولد يسقط قبل تمامه", example: "أسقطت المرأة سُقْطاً" },
    difficulty: "hard",
    source: "qutrub",
    verse: "ناولَ بردَ السَّقْطِ ~ مِن فيهِ عينَ السِّقْطِ\nفلاحَ رميُ السُّقْطِ ~ وميضُهُ كالشهُبِ",
  },
  {
    id: 20,
    base: "سهام",
    fatha: { word: "سَهَام", meaning: "شدة الحر ووهجه", example: "يومٌ ذو سَهَامٍ" },
    kasra: { word: "سِهَام", meaning: "جمع سهم", example: "أطلق السِّهَام" },
    damma: { word: "سُهَام", meaning: "ضوء الشمس الخافت، وقيل: لُعاب الشمس", example: "بدا السُّهَامُ عند المغرب" },
    difficulty: "hard",
    source: "qutrub",
    verse: "خدّدَ في يومٍ سَهام ~ قلبي بأمثال السِّهام\nكالشمسِ ترمي بالسُّهام ~ بضوئها واللهَبِ",
  },
  {
    id: 21,
    base: "صل",
    fatha: { word: "صَلّ", meaning: "صوت الحديد (الصليل)", example: "سُمع صَلُّ السيوف" },
    kasra: { word: "صِلّ", meaning: "الحية الخبيثة", example: "لدغه صِلٌّ" },
    damma: { word: "صُلّ", meaning: "الماء الآسن المتغيّر", example: "لا يُشرب الصُّلُّ" },
    difficulty: "hard",
    source: "qutrub",
    verse: "لا تركنَنْ للصَّلِّ ~ ولا تثق بالصِّلِّ\nواحذر طعامَ الصُّلِّ ~ وانهض نهوضَ المُجدِبِ",
  },
  {
    id: 22,
    base: "طلا",
    fatha: { word: "طَلا", meaning: "ولد الظبية", example: "رعى الطَّلا مع أمه" },
    kasra: { word: "طِلا", meaning: "الخمر", example: "شربوا الطِّلا" },
    damma: { word: "طُلا", meaning: "الأعناق (جمع طُلْية)", example: "ضُربت الطُّلا" },
    difficulty: "hard",
    source: "qutrub",
    verse: "يُسفِرُ عن عينِ الطَّلا ~ ووجنةٍ تحكي الطِّلا\nوجِيدُهُ من الطُّلا ~ غَيْدًا ولم تحتجبِ",
  },
  {
    id: 23,
    base: "لمة",
    fatha: { word: "لَمَّة", meaning: "الشدَّة، والمَسُّ من الجن", example: "أصابته لَمَّةٌ" },
    kasra: { word: "لِمَّة", meaning: "الشعر المجاوز شحمة الأذن", example: "له لِمَّةٌ سوداء" },
    damma: { word: "لُمَّة", meaning: "الجماعة من الناس (الرفقة)", example: "خرج في لُمَّةٍ من أصحابه" },
    difficulty: "hard",
    source: "qutrub",
    verse: "كأنّ ما بي لَمَّةْ ~ مذ شابَ شعرُ اللِّمَّةْ\nوما بقي لي لُمَّةْ ~ ولا لقي مِن نَصَبِ",
  },

  // ───────────── Classic textbook triangles ─────────────
  {
    id: 24,
    base: "جنة",
    fatha: { word: "جَنَّة", meaning: "البستان، ودار النعيم", example: "جنّاتٌ تجري من تحتها الأنهار" },
    kasra: { word: "جِنَّة", meaning: "الجنّ، والجنون", example: "ما بصاحبكم من جِنَّة" },
    damma: { word: "جُنَّة", meaning: "الوقاية والسُّترة (كالدرع والتُّرس)", example: "الصوم جُنَّة" },
    difficulty: "easy",
    source: "classic",
  },
  {
    id: 25,
    base: "حب",
    fatha: { word: "حَبّ", meaning: "الحبوب (كالقمح والشعير)", example: "فالق الحَبِّ والنوى" },
    kasra: { word: "حِبّ", meaning: "المحبوب (الحبيب)", example: "هو حِبِّي وابنُ حِبِّي" },
    damma: { word: "حُبّ", meaning: "المحبة والوداد", example: "ملأ الحُبُّ قلبه" },
    difficulty: "easy",
    source: "classic",
  },
  {
    id: 26,
    base: "بر",
    fatha: { word: "بَرّ", meaning: "اليابسة (ضد البحر)", example: "ظهر الفساد في البَرِّ والبحر" },
    kasra: { word: "بِرّ", meaning: "الإحسان والطاعة", example: "بِرُّ الوالدين" },
    damma: { word: "بُرّ", meaning: "القمح", example: "طحنوا البُرَّ" },
    difficulty: "easy",
    source: "classic",
  },
  {
    id: 27,
    base: "قدم",
    fatha: { word: "قَدَم", meaning: "العضو الذي يُمشى عليه", example: "مشيتُ على قَدَمي" },
    kasra: { word: "قِدَم", meaning: "السبق في الزمن (ضد الحدوث)", example: "هذا الأثر على قِدَمِه محفوظ" },
    damma: { word: "قُدُم", meaning: "المضيّ إلى الأمام", example: "مضى قُدُماً ولم يلتفت" },
    difficulty: "easy",
    source: "classic",
  },
  {
    id: 28,
    base: "ملك",
    fatha: { word: "مَلَك", meaning: "واحد الملائكة", example: "نزل المَلَك بالوحي" },
    kasra: { word: "مِلْك", meaning: "ما يملكه الإنسان من مال", example: "هذا البيت مِلْكي" },
    damma: { word: "مُلْك", meaning: "السلطان والحكم", example: "له المُلْك وله الحمد" },
    difficulty: "easy",
    source: "classic",
  },
  {
    id: 29,
    base: "مرة",
    fatha: { word: "مَرَّة", meaning: "الفعلة الواحدة", example: "زاره مَرَّةً واحدة" },
    kasra: { word: "مِرَّة", meaning: "القوة وشدة العقل", example: "ذو مِرَّةٍ فاستوى" },
    damma: { word: "مُرَّة", meaning: "ضد الحُلوة (مؤنث مُرّ)", example: "شجرةٌ مُرَّةُ الثمر" },
    difficulty: "medium",
    source: "classic",
  },
  {
    id: 30,
    base: "كبر",
    fatha: { word: "كَبَر", meaning: "نباتٌ ذو شوك (القَبَّار)", example: "ينبت الكَبَر في الصحراء" },
    kasra: { word: "كِبْر", meaning: "التعاظم والغرور", example: "الكِبْرُ مذموم" },
    damma: { word: "كُبْر", meaning: "العظمة، ومعظم الشيء", example: "كُبْرُ القوم: أكبرهم سنّاً" },
    difficulty: "medium",
    source: "classic",
  },
];

// Helper function to get triangles by difficulty
export function getTrianglesByDifficulty(
  difficulty: TriangleDifficulty
): QutrabTriangle[] {
  return QUTRAB_TRIANGLES.filter((t) => t.difficulty === difficulty);
}

// Helper function to get random triangle
export function getRandomTriangle(
  difficulty?: TriangleDifficulty
): QutrabTriangle {
  const triangles = difficulty
    ? getTrianglesByDifficulty(difficulty)
    : QUTRAB_TRIANGLES;
  return triangles[Math.floor(Math.random() * triangles.length)];
}

// Re-export the shared Fisher-Yates shuffle for backwards compatibility
export { shuffle as shuffleArray } from "../utils/random";

export interface QutrabRoundData {
  triangle: QutrabTriangle;
  words: { key: Haraka; word: string }[];
  meanings: { key: Haraka; meaning: string }[];
}

// Difficulty tiers to try, in order, for a requested difficulty. Harder
// requests fall back to easier tiers only after their own tier is exhausted,
// and easy requests never pull hard triangles while easier ones remain.
const TIER_ORDER: Record<TriangleDifficulty, TriangleDifficulty[]> = {
  easy: ["easy", "medium", "hard"],
  medium: ["medium", "easy", "hard"],
  hard: ["hard", "medium", "easy"],
};

/**
 * Generate a round.
 *
 * @param difficulty  Preferred tier (undefined = any). The preferred tier is
 *                    used while it still has unused triangles.
 * @param usedIds     Triangle ids already shown this session (avoid repeats).
 */
export function generateQutrabRound(
  difficulty?: TriangleDifficulty,
  usedIds?: Set<number>
): QutrabRoundData {
  const unused = QUTRAB_TRIANGLES.filter((t) => !usedIds || !usedIds.has(t.id));
  let pool: QutrabTriangle[] = [];

  if (difficulty) {
    for (const tier of TIER_ORDER[difficulty]) {
      pool = unused.filter((t) => t.difficulty === tier);
      if (pool.length > 0) break;
    }
  } else {
    pool = unused;
  }

  // If every triangle has been used, reset and allow all (preferring the tier)
  if (pool.length === 0) {
    pool = difficulty ? getTrianglesByDifficulty(difficulty) : QUTRAB_TRIANGLES;
    if (pool.length === 0) pool = QUTRAB_TRIANGLES;
  }

  const triangle = shuffle(pool)[0];

  const words = shuffle([
    { key: "fatha" as const, word: triangle.fatha.word },
    { key: "damma" as const, word: triangle.damma.word },
    { key: "kasra" as const, word: triangle.kasra.word },
  ]);

  const meanings = shuffle([
    { key: "fatha" as const, meaning: triangle.fatha.meaning },
    { key: "damma" as const, meaning: triangle.damma.meaning },
    { key: "kasra" as const, meaning: triangle.kasra.meaning },
  ]);

  return { triangle, words, meanings };
}
