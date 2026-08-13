// مثلث قطرب - Qutrab's Triangle Data
// Words that change meaning based on the first letter's vowel mark (haraka/tashkeel)
// الفتحة (fatha) = ـَ, الضمة (damma) = ـُ, الكسرة (kasra) = ـِ

import { shuffle } from "../utils/random";

export interface QutrabTriangle {
  id: number;
  base: string; // The base word without tashkeel
  fatha: {
    word: string; // Word with fatha
    meaning: string;
    example?: string;
  };
  damma: {
    word: string; // Word with damma
    meaning: string;
    example?: string;
  };
  kasra: {
    word: string; // Word with kasra
    meaning: string;
    example?: string;
  };
  difficulty: "easy" | "medium" | "hard";
}

// Comprehensive database of Qutrab triangles
export const QUTRAB_TRIANGLES: QutrabTriangle[] = [
  {
    id: 1,
    base: "حلم",
    fatha: {
      word: "حَلَم",
      meaning: "القُراد الكبير (حشرة)",
      example: "رأيت حَلَماً على الجمل",
    },
    damma: {
      word: "حُلُم",
      meaning: "ما يراه النائم في منامه",
      example: "رأيت حُلُماً جميلاً",
    },
    kasra: {
      word: "حِلْم",
      meaning: "الأناة وضبط النفس",
      example: "الحِلْم سيد الأخلاق",
    },
    difficulty: "easy",
  },
  {
    id: 2,
    base: "قدم",
    fatha: {
      word: "قَدَم",
      meaning: "العضو الذي يُمشى عليه",
      example: "مشيتُ على قَدَمي",
    },
    damma: {
      word: "قُدُم",
      meaning: "التقدم إلى الأمام",
      example: "سِرْ قُدُماً ولا تلتفت",
    },
    kasra: {
      word: "قِدَم",
      meaning: "السبق الزمني والأولية",
      example: "هذا الأثر على قِدَمه محفوظ",
    },
    difficulty: "easy",
  },
  {
    id: 3,
    base: "علم",
    fatha: {
      word: "عَلَم",
      meaning: "الراية أو الجبل المرتفع",
      example: "رفعوا عَلَم البلاد",
    },
    damma: {
      word: "عُلُم",
      meaning: "جمع عليم",
      example: "هم عُلُم بالأمر",
    },
    kasra: {
      word: "عِلْم",
      meaning: "المعرفة والإدراك",
      example: "طلب العِلْم فريضة",
    },
    difficulty: "easy",
  },
  {
    id: 4,
    base: "حرم",
    fatha: {
      word: "حَرَم",
      meaning: "المكان المقدس",
      example: "زرتُ الحَرَم الشريف",
    },
    damma: {
      word: "حُرُم",
      meaning: "جمع حرام",
      example: "الأشهر الحُرُم أربعة",
    },
    kasra: {
      word: "حِرْم",
      meaning: "المحروم الممنوع",
      example: "هو حِرْم من الخير",
    },
    difficulty: "medium",
  },
  {
    id: 5,
    base: "صبر",
    fatha: {
      word: "صَبِر",
      meaning: "نبات مُرّ الطعم",
      example: "الصَبِر دواء نافع",
    },
    damma: {
      word: "صُبُر",
      meaning: "جمع صبور",
      example: "هم قوم صُبُر على الشدائد",
    },
    kasra: {
      word: "صِبْر",
      meaning: "الحبس والتحمل",
      example: "الصِبْر عند المصيبة",
    },
    difficulty: "medium",
  },
  {
    id: 6,
    base: "سمر",
    fatha: {
      word: "سَمَر",
      meaning: "الحديث بالليل",
      example: "جلسنا للسَمَر",
    },
    damma: {
      word: "سُمُر",
      meaning: "جمع أسمر",
      example: "قوم سُمُر البشرة",
    },
    kasra: {
      word: "سِمْر",
      meaning: "المسمار",
      example: "دقّ السِمْر في الخشب",
    },
    difficulty: "medium",
  },
  {
    id: 7,
    base: "خبر",
    fatha: {
      word: "خَبَر",
      meaning: "النبأ والحدث",
      example: "سمعتُ خَبَراً سارّاً",
    },
    damma: {
      word: "خُبُر",
      meaning: "جمع خبير",
      example: "هم خُبُر بالأمر",
    },
    kasra: {
      word: "خِبْر",
      meaning: "العلم والمعرفة بالشيء",
      example: "لي خِبْر بهذا الأمر",
    },
    difficulty: "easy",
  },
  {
    id: 8,
    base: "ملك",
    fatha: {
      word: "مَلَك",
      meaning: "المَلاك من الملائكة",
      example: "نزل المَلَك بالوحي",
    },
    damma: {
      word: "مُلُك",
      meaning: "السلطة والحكم",
      example: "له المُلُك وله الحمد",
    },
    kasra: {
      word: "مِلْك",
      meaning: "ما يُملك من مال",
      example: "هذا البيت مِلْكي",
    },
    difficulty: "easy",
  },
  {
    id: 9,
    base: "شعر",
    fatha: {
      word: "شَعَر",
      meaning: "الشَّعْر النابت على الجسم",
      example: "شَعَر رأسه أسود",
    },
    damma: {
      word: "شُعُر",
      meaning: "الفطنة والإدراك",
      example: "ليت شُعُري ما يكون",
    },
    kasra: {
      word: "شِعْر",
      meaning: "الكلام الموزون المُقفّى",
      example: "قرأتُ شِعْراً جميلاً",
    },
    difficulty: "easy",
  },
  {
    id: 10,
    base: "كبر",
    fatha: {
      word: "كَبَر",
      meaning: "نبات له شوك",
      example: "الكَبَر ينبت في الصحراء",
    },
    damma: {
      word: "كُبُر",
      meaning: "العظمة والجلال",
      example: "لله الكُبُر في السماوات",
    },
    kasra: {
      word: "كِبْر",
      meaning: "التعالي والغرور",
      example: "الكِبْر مذموم",
    },
    difficulty: "medium",
  },
  {
    id: 11,
    base: "سحر",
    fatha: {
      word: "سَحَر",
      meaning: "آخر الليل قبل الفجر",
      example: "استيقظتُ وقت السَحَر",
    },
    damma: {
      word: "سُحُر",
      meaning: "جمع ساحر",
      example: "كان فرعون محاطاً بالسُحُر",
    },
    kasra: {
      word: "سِحْر",
      meaning: "ما يفعله الساحر",
      example: "السِحْر من الكبائر",
    },
    difficulty: "medium",
  },
  {
    id: 12,
    base: "نقض",
    fatha: {
      word: "نَقَض",
      meaning: "فسخ العهد",
      example: "نَقَض العهد خيانة",
    },
    damma: {
      word: "نُقُض",
      meaning: "جمع نقيض",
      example: "هذان نُقُض لبعضهما",
    },
    kasra: {
      word: "نِقْض",
      meaning: "البعير الهزيل من السفر",
      example: "وصل الجمل وهو نِقْض",
    },
    difficulty: "hard",
  },
  {
    id: 13,
    base: "قشر",
    fatha: {
      word: "قَشَر",
      meaning: "الغلاف الخارجي للثمر",
      example: "قَشَر البرتقال سميك",
    },
    damma: {
      word: "قُشُر",
      meaning: "جمع قشرة",
      example: "رميتُ القُشُر",
    },
    kasra: {
      word: "قِشْر",
      meaning: "اللحاء والغطاء",
      example: "قِشْر الشجرة خشن",
    },
    difficulty: "hard",
  },
  {
    id: 14,
    base: "جلد",
    fatha: {
      word: "جَلَد",
      meaning: "الأرض الصلبة المستوية",
      example: "سرنا في جَلَد الصحراء",
    },
    damma: {
      word: "جُلُد",
      meaning: "جمع جلود",
      example: "جُلُد الأنعام",
    },
    kasra: {
      word: "جِلْد",
      meaning: "غطاء الجسم",
      example: "جِلْد الإنسان ناعم",
    },
    difficulty: "easy",
  },
  {
    id: 15,
    base: "صدق",
    fatha: {
      word: "صَدَق",
      meaning: "قال الحق (فعل)",
      example: "صَدَق في قوله",
    },
    damma: {
      word: "صُدُق",
      meaning: "المهر",
      example: "دفع صُدُقها كاملاً",
    },
    kasra: {
      word: "صِدْق",
      meaning: "الحق والصراحة",
      example: "قال ذلك بصِدْق",
    },
    difficulty: "medium",
  },
  {
    id: 16,
    base: "حسن",
    fatha: {
      word: "حَسَن",
      meaning: "اسم علم مذكر",
      example: "حَسَن ولد كريم",
    },
    damma: {
      word: "حُسُن",
      meaning: "الجمال",
      example: "أُعجبتُ بحُسُنها",
    },
    kasra: {
      word: "حِسْن",
      meaning: "الحسن والجودة",
      example: "فعل ذلك بحِسْن نية",
    },
    difficulty: "easy",
  },
  {
    id: 17,
    base: "عسر",
    fatha: {
      word: "عَسَر",
      meaning: "استخدام اليد اليسرى",
      example: "هو أعسر يكتب بيده اليسرى",
    },
    damma: {
      word: "عُسُر",
      meaning: "الشدة والضيق",
      example: "مع العُسُر يُسراً",
    },
    kasra: {
      word: "عِسْر",
      meaning: "الصعوبة",
      example: "في الأمر عِسْر",
    },
    difficulty: "hard",
  },
  {
    id: 18,
    base: "يسر",
    fatha: {
      word: "يَسَر",
      meaning: "استخدام اليد اليسرى",
      example: "هو أيسر",
    },
    damma: {
      word: "يُسُر",
      meaning: "السهولة واللين",
      example: "الدين يُسُر",
    },
    kasra: {
      word: "يِسْر",
      meaning: "الغنى والسعة",
      example: "هو في يِسْر من العيش",
    },
    difficulty: "medium",
  },
  {
    id: 19,
    base: "وقر",
    fatha: {
      word: "وَقَر",
      meaning: "ثقل السمع",
      example: "في أذنه وَقَر",
    },
    damma: {
      word: "وُقُر",
      meaning: "الحمل الثقيل",
      example: "حمل الجمل وُقُره",
    },
    kasra: {
      word: "وِقْر",
      meaning: "حمل الدابة",
      example: "حمار عليه وِقْر",
    },
    difficulty: "hard",
  },
  {
    id: 20,
    base: "طلع",
    fatha: {
      word: "طَلَع",
      meaning: "ظهر وبان",
      example: "طَلَع الفجر",
    },
    damma: {
      word: "طُلُع",
      meaning: "جمع طليعة",
      example: "هم طُلُع الجيش",
    },
    kasra: {
      word: "طِلْع",
      meaning: "ما يطلع من النخل",
      example: "طِلْع النخلة منضود",
    },
    difficulty: "medium",
  },
];

// Helper function to get triangles by difficulty
export function getTrianglesByDifficulty(
  difficulty: "easy" | "medium" | "hard"
): QutrabTriangle[] {
  return QUTRAB_TRIANGLES.filter((t) => t.difficulty === difficulty);
}

// Helper function to get random triangle
export function getRandomTriangle(
  difficulty?: "easy" | "medium" | "hard"
): QutrabTriangle {
  const triangles = difficulty
    ? getTrianglesByDifficulty(difficulty)
    : QUTRAB_TRIANGLES;
  return triangles[Math.floor(Math.random() * triangles.length)];
}

// Re-export the shared Fisher-Yates shuffle for backwards compatibility
export { shuffle as shuffleArray } from "../utils/random";

// Generate game round data - picks from ALL triangles regardless of difficulty
// usedIds: Set of triangle IDs that have already been used (to avoid repeats)
export interface QutrabRoundData {
  triangle: QutrabTriangle;
  words: { key: "fatha" | "damma" | "kasra"; word: string }[];
  meanings: { key: "fatha" | "damma" | "kasra"; meaning: string }[];
}

export function generateQutrabRound(
  difficulty?: "easy" | "medium" | "hard",
  usedIds?: Set<number>
): QutrabRoundData {
  // IGNORE difficulty - pick from ALL triangles for mixed difficulty gameplay
  // Exclude already-used triangles to prevent repeats
  let available = QUTRAB_TRIANGLES;
  
  if (usedIds && usedIds.size > 0) {
    available = QUTRAB_TRIANGLES.filter((t) => !usedIds.has(t.id));
  }
  
  // If all triangles have been used, reset and allow all
  if (available.length === 0) {
    available = QUTRAB_TRIANGLES;
  }
  
  // Shuffle for random order and pick first
  const shuffled = shuffle(available);
  const triangle = shuffled[0];

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
