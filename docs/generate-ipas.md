// ======================================================
// QUESTION GENERATOR ENGINE V2
// SUPABASE EDGE FUNCTION
// ======================================================
//
// Update:
// - Fix bug "merasakan" terbaca sebagai "rasa".
// - Skenario penerapan sekarang memprioritaskan nama organ.
// - Skill alias lama didukung:
//   memahami                    -> memahami dasar
//   hubungan konsep             -> memahami dasar
//   menerapkan konsep           -> penerapan
//   pemecahan masalah sederhana -> penerapan
//   analisis situasi            -> analisis mendalam
// - Posisi jawaban benar tetap diacak.
// - Metadata lengkap tetap disimpan ke tabel questions.
//
// ======================================================

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ======================================================
// SUPABASE
// ======================================================

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ======================================================
// CORS
// ======================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ======================================================
// TYPES
// ======================================================

type Skill =
  | "mengenal"
  | "memahami dasar"
  | "analisis sederhana"
  | "penerapan"
  | "analisis mendalam"
  | "evaluasi"
  | "HOTS";

type OptionMap = {
  a?: string;
  b?: string;
  c?: string;
  d?: string;
};

type GeneratedQuestion = {
  question: string;
  options: OptionMap;
  answer: string;
  quality_score?: number;
};

type DifficultyData = {
  level: number;
  label: string;
  cognitive: string;
};

type QualityResult = {
  passed: boolean;
  score: number;
  problems?: string[];
};

type NormalizedSkillResult = {
  originalSkill: string;
  skill: Skill;
  wasAlias: boolean;
};

// ======================================================
// BASIC UTIL
// ======================================================

function shuffle<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

function randomItem<T>(array: T[]) {
  if (!array.length) {
    return undefined;
  }

  return array[
    Math.floor(Math.random() * array.length)
  ];
}

function cleanText(text: string) {

  return String(text || "")

    // perbaikan duplikasi kata umum
    .replace(/\bingin ingin\b/gi, "ingin")
    .replace(/\bsangat sangat\b/gi, "sangat")
    .replace(/\badalah adalah\b/gi, "adalah")
    .replace(/\nyang yang\b/gi, "yang")
    .replace(/\bdengan dengan\b/gi, "dengan")

    // rapikan spasi
    .replace(/\s+/g, " ")

    // rapikan tanda baca
    .replace(/\.\./g, "...")
    .replace(/\.{4,}/g, "...")

    .replace(/\s+\./g, ".")
    .replace(/\s+\?/g, "?")
    .replace(/\s+!/g, "!")
    .replace(/\s+,/g, ",")

    // beri spasi setelah tanda baca jika hilang
    .replace(/([,.!?])([^\s])/g, "$1 $2")

    // hapus spasi sebelum tanda baca
    .replace(/\s+([,.!?])/g, "$1")

    // rapikan kapital setelah titik
    .replace(/([.!?])\s+([a-z])/g, (_, p1, p2) =>
      `${p1} ${p2.toUpperCase()}`
    )

    .trim();

}

function cleanOption(text: string) {
  return String(text || "")
    .replace(/\.$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(text: string) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]) {
  const used = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const cleaned = cleanOption(value);
    const key = normalizeText(cleaned);

    if (!cleaned || used.has(key)) {
      return;
    }

    used.add(key);
    result.push(cleaned);
  });

  return result;
}

function containsAny(text: string, keywords: string[]) {
  const normalized = normalizeText(text);

  return keywords.some((keyword) =>
    normalized.includes(normalizeText(keyword))
  );
}

// ======================================================
// CONCEPT READER
// ======================================================

function getConceptName(concept: any) {
  return cleanOption(concept?.name || "");
}

function getFact(concept: any) {
  if (
    !concept?.facts ||
    !Array.isArray(concept.facts) ||
    !concept.facts.length
  ) {
    return "";
  }

  return String(concept.facts[0] || "");
}

function getFunction(concept: any) {
  if (!concept) {
    return "";
  }

  const directFunction =
    concept.function_text ||
    concept.fungsi ||
    concept.function ||
    concept.usage ||
    concept.kegunaan;

  if (directFunction) {
    return cleanOption(String(directFunction));
  }

  const fact = getFact(concept);

  if (!fact) {
    return "";
  }

  const name = getConceptName(concept);

  return cleanOption(
    fact
      .replace(new RegExp(name, "gi"), "")
      .replace(/digunakan untuk/gi, "")
      .replace(/berfungsi untuk/gi, "")
      .replace(/fungsi dari/gi, "")
      .replace(/fungsi .*? adalah/gi, "")
      .replace(/kegunaan .*? yaitu/gi, "")
      .replace(/membantu manusia untuk/gi, "")
      .replace(/membantu untuk/gi, "")
      .replace(/membantu/gi, "")
      .replace(/^adalah\s+/gi, "")
      .replace(/^yaitu\s+/gi, "")
      .replace(/^untuk\s+/gi, "")
      .replace(/\.$/, ""),
  );
}

function getExplanation(concept: any) {
  const fact = getFact(concept);

  if (fact) {
    return cleanText(fact);
  }

  const name = getConceptName(concept);
  const functionText = getFunction(concept);

  if (name && functionText) {
    return cleanText(`${name} berfungsi untuk ${functionText}.`);
  }

  return "";
}

// ======================================================
// SKILL ENGINE V2
// ======================================================

const SUPPORTED_SKILLS: Skill[] = [
  "mengenal",
  "memahami dasar",
  "analisis sederhana",
  "penerapan",
  "analisis mendalam",
  "evaluasi",
  "HOTS",
];

const SKILL_ALIASES: Record<string, Skill> = {
  "mengenal": "mengenal",

  "memahami": "memahami dasar",
  "memahami dasar": "memahami dasar",
  "hubungan konsep": "memahami dasar",

  "analisis sederhana": "analisis sederhana",

  "penerapan": "penerapan",
  "menerapkan konsep": "penerapan",
  "pemecahan masalah sederhana": "penerapan",

  "analisis mendalam": "analisis mendalam",
  "analisis situasi": "analisis mendalam",

  "evaluasi": "evaluasi",

  "hots": "HOTS",
  "HOTS": "HOTS",
};

function isSupportedSkill(skill: string): skill is Skill {
  return SUPPORTED_SKILLS.includes(skill as Skill);
}

function normalizeSkill(rawSkill: string): NormalizedSkillResult | null {
  const originalSkill = cleanOption(rawSkill || "mengenal");
  const normalizedKey = normalizeText(originalSkill);

  const mapped =
    SKILL_ALIASES[originalSkill] ||
    SKILL_ALIASES[normalizedKey];

  if (!mapped) {
    return null;
  }

  return {
    originalSkill,
    skill: mapped,
    wasAlias: originalSkill !== mapped,
  };
}

// ======================================================
// PATTERN GENERATOR ENGINE V2
// ======================================================

const names = [
  "Andi",
  "Budi",
  "Cici",
  "Dina",
  "Eka",
  "Fani",
  "Rudi",
  "Sinta",
];

function buildName() {
  return randomItem(names) || "Andi";
}

// ======================================================
// ACTIVITY SCENARIO BUILDER
// ======================================================

function getActivityScenario(concept: any) {
  const name = normalizeText(getConceptName(concept));
  const functionText = getFunction(concept);
  const normalizedFunction = normalizeText(functionText);

  if (
    name === "mata" ||
    containsAny(normalizedFunction, [
      "melihat",
      "penglihatan",
      "warna",
      "bentuk",
      "gerakan",
    ])
  ) {
    return randomItem([
      "melihat warna bunga di taman",
      "membaca tulisan di papan tulis",
      "melihat kendaraan yang bergerak di jalan",
      "memilih pensil berdasarkan warnanya",
    ]) || `menggunakan kemampuan ${functionText}`;
  }

  if (
    name === "telinga" ||
    containsAny(normalizedFunction, [
      "mendengar",
      "pendengaran",
      "suara",
      "bunyi",
    ])
  ) {
    return randomItem([
      "mendengar suara bel sekolah",
      "mendengarkan penjelasan guru",
      "mendengar suara teman memanggil",
      "mendengarkan bunyi musik",
    ]) || `menggunakan kemampuan ${functionText}`;
  }

  if (
    name === "hidung" ||
    containsAny(normalizedFunction, [
      "mencium",
      "penciuman",
      "bau",
      "aroma",
    ])
  ) {
    return randomItem([
      "mencium aroma bunga",
      "mencium bau makanan di dapur",
      "mengenali bau sampah",
      "mencium aroma buah yang matang",
    ]) || `menggunakan kemampuan ${functionText}`;
  }

  if (
    name === "lidah" ||
    containsAny(normalizedFunction, [
      "mengecap",
      "pengecap",
      "rasa manis",
      "rasa asin",
      "rasa asam",
      "rasa pahit",
    ])
  ) {
    return randomItem([
      "mencicipi rasa manis pada buah",
      "merasakan rasa asin pada makanan",
      "membedakan rasa manis dan asam",
      "mencicipi makanan saat makan siang",
    ]) || `menggunakan kemampuan ${functionText}`;
  }

  if (
    name === "kulit" ||
    containsAny(normalizedFunction, [
      "panas",
      "dingin",
      "halus",
      "kasar",
      "sakit",
      "sentuhan",
      "meraba",
    ])
  ) {
    return randomItem([
      "merasakan gelas yang masih hangat",
      "meraba permukaan meja yang halus",
      "merasakan udara dingin di pagi hari",
      "menyentuh permukaan batu yang kasar",
    ]) || `menggunakan kemampuan ${functionText}`;
  }

  return randomItem([
    `menggunakan fungsi ${getConceptName(concept)}`,
    `melakukan kegiatan yang membutuhkan ${functionText}`,
    `memakai kemampuan ${functionText}`,
  ]) || `menggunakan kemampuan ${functionText}`;
}

// ======================================================
// C1 - MENGENAL
// ======================================================

function generateRecallQuestion(concept: any) {
  const name = getConceptName(concept);

  const templates = [
    `${name} digunakan untuk ...`,
    `Fungsi dari ${name} adalah ...`,
    `${name} membantu manusia untuk ...`,
    `Kegunaan ${name} yaitu ...`,
  ];

  return cleanText(
    randomItem(templates) || `${name} digunakan untuk ...`,
  );
}

// ======================================================
// C2 - MEMAHAMI DASAR
// ======================================================

function generateUnderstandQuestion(concept: any) {
  const name = getConceptName(concept);

  const templates = [
    `Manakah hubungan yang benar antara ${name} dan fungsinya?`,
    `Hubungan yang benar antara ${name} dengan kegunaannya adalah ...`,
    `Fungsi yang tepat untuk ${name} adalah ...`,
    `Pasangan yang sesuai antara ${name} dan kegunaannya adalah ...`,
  ];

  return cleanText(
    randomItem(templates) ||
      `Manakah hubungan yang benar antara ${name} dan fungsinya?`,
  );
}

// ======================================================
// C3 - ANALISIS SEDERHANA
// ======================================================

function generateAnalysisQuestion(concept: any) {

  const scenarioList =
    getAnalysisScenario(concept);


  const scenario =
    randomItem(scenarioList)
    ||
    {
      condition:
      `${buildName()} mengalami kondisi tertentu`,

      clue:
      getFunction(concept)
    };


  const templates = [


    `Perhatikan kondisi berikut.

${scenario.condition}.

Berdasarkan kondisi tersebut,
kesimpulan yang tepat adalah ...`,


    `Seseorang mengalami kondisi berikut:

${scenario.condition}.

Organ tubuh yang kemungkinan mengalami gangguan adalah ...`,


    `Dari informasi tersebut:

${scenario.condition}.

Analisis yang tepat mengenai organ tubuh yang berperan adalah ...`

  ];


  return cleanText(
    randomItem(templates)
  );

}

function getApplications(concept:any){

  if(
    Array.isArray(concept.applications)
    &&
    concept.applications.length
  ){

    return concept.applications;

  }


  const map:any = {

    "Mata":[
      "membaca tulisan",
      "memilih warna benda",
      "melihat bentuk benda"
    ],


    "Telinga":[
      "mendengar suara guru",
      "mengetahui arah suara"
    ],


    "Hidung":[
      "mengenali aroma makanan",
      "mengetahui bau lingkungan"
    ],


    "Lidah":[
      "menentukan rasa makanan"
    ],


    "Kulit":[
      "mengetahui suhu air",
      "merasakan permukaan benda"
    ]

  };


  return (
    map[concept.name]
    ||
    [
      concept.function
    ]
  );

}

function getApplicationScenario(concept:any){

  const scenarios:any = {

    "Mata":[

      {
        activity:"membaca tulisan di papan kelas",
        problem:"mengetahui informasi yang tertulis"
      },

      {
        activity:"melihat warna bunga di taman",
        problem:"ingin membedakan warna bunga"
       }

      ],


    "Telinga":[

      {
        activity:"mendengarkan penjelasan guru",
        problem:"ingin memahami informasi yang disampaikan"
      },

      {
        activity:"mendengar suara teman",
        problem:"mengetahui siapa yang berbicara"
      }

    ],


    "Hidung":[

      {
        activity:"memeriksa aroma makanan",
        problem:"mengetahui bau makanan"
      },

    {
        activity:"mencium bau di sekitar rumah",
        problem:"ingin mengenali keadaan lingkungan"
      }

    ],


    "Lidah":[

      {
        activity:"mencicipi makanan",
        problem:"mengetahui rasa makanan"
      }

    ],


    "Kulit":[

      {
        activity:"memegang gelas berisi air",
        problem:"mengetahui apakah suhu benda aman"
      },

      {
        activity:"menyentuh permukaan benda",
        problem:"mengetahui tekstur benda"
      }

    ]

  };


  return (
    scenarios[concept.name]
    ||
    [
      {
        activity:getActivityScenario(concept),
        goal:getFunction(concept)
      }
    ]
  );

}

// ======================================================
// C3 - PENERAPAN
// ======================================================

function generateApplicationQuestion(concept: any) {

  const student = buildName();


  const scenarios =
    getApplicationScenario(concept);


  const scenario =
    randomItem(scenarios)
    ||
    {
      activity: getActivityScenario(concept),
      problem: getFunction(concept)
    };


  const templates = [


    `${student} sedang ${scenario.activity}.
Ia ingin ${scenario.problem}.
Organ tubuh yang membantu kegiatan tersebut adalah ...`,


    `Dalam kehidupan sehari-hari,
${student} melakukan kegiatan ${scenario.activity}.
Tujuannya adalah ${scenario.problem}.
Organ tubuh yang berperan adalah ...`,


    `${student} menghadapi situasi ketika ${scenario.problem}.
Untuk menyelesaikan kegiatan tersebut,
organ tubuh yang digunakan adalah ...`,


    `${student} sedang ${scenario.activity}.
Agar kegiatan tersebut berhasil,
bagian tubuh yang paling berperan adalah ...`

  ];


  return cleanText(
    randomItem(templates)
    ||
    `${student} sedang ${scenario.activity}.
Organ tubuh yang digunakan adalah ...`
  );

}

function getAnalysisScenario(concept:any){

  const scenarios:any = {

    "Mata":[

      {
        condition:
        "Budi dapat mendengar suara guru dan merasakan panas benda saat disentuh. Namun, Budi tidak dapat mengenali warna gambar yang diberikan guru",

        clue:
        "kemampuan melihat terganggu"
      },


      {
        condition:
        "Sinta dapat mencium aroma makanan dan mengecap rasa makanan dengan baik. Tetapi Sinta kesulitan melihat bentuk benda di depannya",

        clue:
        "indra penglihatan mengalami gangguan"
      }

    ],


    "Telinga":[

      {
        condition:
        "Andi dapat melihat tulisan di papan dan merasakan sentuhan benda. Namun, Andi tidak dapat mendengar suara guru di kelas",

        clue:
        "kemampuan mendengar terganggu"
      },


      {
        condition:
        "Rina dapat mencium bau makanan dan melihat warna benda. Tetapi Rina tidak dapat mengenali suara orang di dekatnya",

        clue:
        "indra pendengaran mengalami gangguan"
      }

    ],


    "Hidung":[

      {
        condition:
        "Cici dapat melihat makanan dan merasakan rasa makanan. Namun, Cici tidak dapat mengetahui aroma makanan yang diberikan",

        clue:
        "kemampuan mencium bau terganggu"
      }

    ],


    "Lidah":[

      {
        condition:
        "Dina dapat mencium bau makanan dan melihat bentuk makanan. Tetapi Dina tidak dapat membedakan rasa manis dan asin",

        clue:
        "kemampuan mengecap rasa terganggu"
      }

    ],


    "Kulit":[

      {
        condition:
        "Eka dapat melihat benda dan mendengar suara dengan baik. Namun, Eka tidak dapat merasakan panas atau dingin ketika menyentuh benda",

        clue:
        "kemampuan meraba terganggu"
      }

    ]

  };


  return scenarios[concept.name] || [];

}

// ======================================================
// C4 - ANALISIS MENDALAM
// ======================================================

function generateDeepAnalysisQuestion(concept: any) {
  const student = buildName();
  const name = getConceptName(concept);
  const functionText = getFunction(concept);
  const activity = getActivityScenario(concept);

  const templates = [
    `${student} tidak dapat ${functionText} saat melakukan aktivitas sehari-hari. Berdasarkan kondisi tersebut, organ yang kemungkinan mengalami gangguan adalah ...`,
    `Jika fungsi ${functionText} tidak berjalan dengan baik, aktivitas seperti ${activity} akan terganggu. Organ yang paling berhubungan adalah ...`,
    `${student} mengalami kesulitan saat ${activity}. Jika dikaitkan dengan fungsi ${name}, organ yang perlu diperhatikan adalah ...`,
    `Perhatikan peristiwa berikut. ${student} tidak mampu ${functionText}. Analisis organ yang bermasalah berdasarkan fungsi tersebut adalah ...`,
  ];

  return cleanText(
    randomItem(templates) ||
      `Jika fungsi ${functionText} tidak berjalan dengan baik, organ yang paling mungkin mengalami gangguan adalah ...`,
  );
}

// ======================================================
// C5 - EVALUASI
// ======================================================

function generateEvaluationQuestion(concept: any) {
  const name = getConceptName(concept);

  const templates = [
    `Manakah pasangan pernyataan yang paling tepat tentang ${name}?`,
    `Pilih hubungan organ dan fungsi yang benar tentang ${name}.`,
    `Pernyataan yang paling tepat mengenai fungsi ${name} adalah ...`,
    `Manakah pilihan yang menunjukkan fungsi ${name} secara benar?`,
  ];

  return cleanText(
    randomItem(templates) ||
      `Pernyataan yang paling tepat mengenai fungsi ${name} adalah ...`,
  );
}

// ======================================================
// C6 - HOTS
// ======================================================

function generateHOTSQuestion(concept: any) {
  const student = buildName();
  const name = getConceptName(concept);
  const functionText = getFunction(concept);
  const activity = getActivityScenario(concept);

  const templates = [
    `${student} harus menentukan organ yang tepat untuk membantu kegiatan ${activity}. Keputusan yang paling tepat adalah ...`,
    `Dalam suatu keadaan, kemampuan ${functionText} sangat dibutuhkan. Organ yang paling tepat untuk menyelesaikan masalah tersebut adalah ...`,
    `${student} menghadapi masalah saat ${activity}. Berdasarkan fungsi ${name}, pilihan organ yang paling tepat adalah ...`,
    `Jika ${student} ingin melakukan kegiatan ${activity} dengan baik, organ yang harus berfungsi dengan baik adalah ...`,
  ];

  return cleanText(
    randomItem(templates) ||
      `${student} harus menentukan organ yang tepat berdasarkan fungsi ${functionText}. Keputusan yang paling tepat adalah ...`,
  );
}

// ======================================================
// MAIN QUESTION ROUTER
// ======================================================

function generateQuestionText(
  skill: string,
  concept: any,
) {
  switch (skill) {
    case "mengenal":
      return generateRecallQuestion(concept);

    case "memahami dasar":
      return generateUnderstandQuestion(concept);

    case "analisis sederhana":
      return generateAnalysisQuestion(concept);

    case "penerapan":
      return generateApplicationQuestion(concept);

    case "analisis mendalam":
      return generateDeepAnalysisQuestion(concept);

    case "evaluasi":
      return generateEvaluationQuestion(concept);

    case "HOTS":
      return generateHOTSQuestion(concept);

    default:
      return generateRecallQuestion(concept);
  }
}

// ======================================================
// INTELLIGENT DISTRACTOR ENGINE V2
// ======================================================

function generateWrongFunctions(
  concept: any,
  concepts: any[],
) {
  const current = getFunction(concept);

  return uniqueStrings(
    concepts
      .filter((item) => item.id !== concept.id)
      .map((item) => getFunction(item))
      .filter((item) => item && item !== current),
  );
}

function generateWrongOrgans(
  concept: any,
  concepts: any[],
) {
  const current = getConceptName(concept);

  return uniqueStrings(
    concepts
      .filter((item) => item.id !== concept.id)
      .map((item) => getConceptName(item))
      .filter((item) => item && item !== current),
  );
}

// ======================================================
// ANSWER MAP BUILDER
// ======================================================

function buildAnswerMap(
  values: string[],
  correct: string,
) {
  const letters = [
    "a",
    "b",
    "c",
    "d",
  ];

  const cleanCorrect = cleanOption(correct);

  const wrongValues = uniqueStrings(values)
    .filter((item) =>
      normalizeText(item) !== normalizeText(cleanCorrect)
    )
    .slice(0, 3);

  const finalValues = shuffle([
    cleanCorrect,
    ...wrongValues,
  ]);

  const options: OptionMap = {};
  let answer = "";

  finalValues.forEach((item, index) => {
    const letter = letters[index];

    if (!letter) {
      return;
    }

    options[letter as keyof OptionMap] = item;

    if (
      normalizeText(item) ===
      normalizeText(cleanCorrect)
    ) {
      answer = letter;
    }
  });

  return {
    options,
    answer,
  };
}

// ======================================================
// MENGENAL DISTRACTOR
// ======================================================

function buildRecallOptions(
  concept: any,
  concepts: any[],
) {
  const correct = getFunction(concept);

  const wrong = generateWrongFunctions(
    concept,
    concepts,
  );

  const values = [
    correct,
    ...shuffle(wrong).slice(0, 3),
  ];

  return buildAnswerMap(
    values,
    correct,
  );
}

// ======================================================
// MEMAHAMI DASAR / EVALUASI DISTRACTOR
// ======================================================

function buildRelationshipOptions(
  concept: any,
  concepts: any[],
) {
  const conceptName = getConceptName(concept);
  const correctFunction = getFunction(concept);

  const correct =
    `${conceptName} - ${correctFunction}`;

  const sameOrganWrong = concepts
    .filter((item) => item.id !== concept.id)
    .map((item) => getFunction(item))
    .filter((functionText) =>
      functionText &&
      normalizeText(functionText) !== normalizeText(correctFunction)
    )
    .map((functionText) =>
      `${conceptName} - ${functionText}`
    );

  let wrong = uniqueStrings(sameOrganWrong)
    .filter((item) =>
      normalizeText(item) !== normalizeText(correct)
    );

  if (wrong.length < 3) {
    const fallbackWrong = concepts
      .filter((item) => item.id !== concept.id)
      .map((item) => {
        const name = getConceptName(item);

        if (!name || !correctFunction) {
          return "";
        }

        return `${name} - ${correctFunction}`;
      })
      .filter(Boolean);

    wrong = uniqueStrings([
      ...wrong,
      ...fallbackWrong,
    ])
      .filter((item) =>
        normalizeText(item) !== normalizeText(correct)
      );
  }

  const values = [
    correct,
    ...shuffle(wrong).slice(0, 3),
  ];

  return buildAnswerMap(
    values,
    correct,
  );
}

// ======================================================
// ANALISIS / PENERAPAN / HOTS DISTRACTOR
// ======================================================

function buildOrganOptions(
  concept: any,
  concepts: any[],
) {
  const correct = getConceptName(concept);

  const wrong = generateWrongOrgans(
    concept,
    concepts,
  );

  const values = [
    correct,
    ...shuffle(wrong).slice(0, 3),
  ];

  return buildAnswerMap(
    values,
    correct,
  );
}

// ======================================================
// SKILL OPTION ROUTER
// ======================================================

function buildOptionsBySkill(
  skill: string,
  concept: any,
  concepts: any[],
) {
  switch (skill) {
    case "mengenal":
      return buildRecallOptions(
        concept,
        concepts,
      );

    case "memahami dasar":
      return buildRelationshipOptions(
        concept,
        concepts,
      );

    case "analisis sederhana":
      return buildOrganOptions(
        concept,
        concepts,
      );

    case "penerapan":
      return buildOrganOptions(
        concept,
        concepts,
      );

    case "analisis mendalam":
      return buildOrganOptions(
        concept,
        concepts,
      );

    case "evaluasi":
      return buildRelationshipOptions(
        concept,
        concepts,
      );

    case "HOTS":
      return buildOrganOptions(
        concept,
        concepts,
      );

    default:
      return buildRecallOptions(
        concept,
        concepts,
      );
  }
}

// ======================================================
// QUALITY VALIDATOR
// ======================================================

function validateOptions(
  options: any,
  answer: string,
) {
  if (!options || typeof options !== "object") {
    return false;
  }

  const keys = [
    "a",
    "b",
    "c",
    "d",
  ];

  const hasAllKeys = keys.every((key) =>
    typeof options[key] === "string" &&
    options[key].trim().length > 0
  );

  if (!hasAllKeys) {
    return false;
  }

  if (!keys.includes(answer)) {
    return false;
  }

  if (!options[answer]) {
    return false;
  }

  const values = keys.map((key) =>
    cleanOption(options[key])
  );

  const unique = new Set(
    values.map((item) => normalizeText(item)),
  );

  if (unique.size !== 4) {
    return false;
  }

  return true;
}

function validateQuestion(question: string) {
  if (
    !question ||
    typeof question !== "string" ||
    question.trim().length < 10
  ) {
    return false;
  }

  return true;
}

function qualityCheck(data: any): QualityResult {
  const questionOK = validateQuestion(
    data?.question,
  );

  const optionOK = validateOptions(
    data?.options,
    data?.answer,
  );

  let semanticOK = true;

  const questionText = normalizeText(
    data?.question || "",
  );

  const isRelationshipQuestion =
    questionText.includes("pasangan") ||
    questionText.includes("hubungan") ||
    questionText.includes("fungsi yang tepat") ||
    questionText.includes("pernyataan");

  if (isRelationshipQuestion) {
    const answerText =
      data?.options?.[data?.answer];

    if (
      !answerText ||
      !String(answerText).includes("-")
    ) {
      semanticOK = false;
    }
  }

  const passedCount =
    Number(questionOK) +
    Number(optionOK) +
    Number(semanticOK);

  const score =
    passedCount === 3
      ? 100
      : Math.round(
          passedCount * (100 / 3),
        );

  return {
    passed:
      questionOK &&
      optionOK &&
      semanticOK,

    score,
  };
}

function advancedQualityCheck(
  question: any,
): QualityResult {
  const problems: string[] = [];

  if (
    !question?.question ||
    String(question.question).trim().length < 10
  ) {
    problems.push("question_too_short");
  }

  if (
    !question?.options ||
    typeof question.options !== "object"
  ) {
    problems.push("invalid_options");
  }

  if (
    !question?.options ||
    !question?.answer ||
    !question.options[question.answer]
  ) {
    problems.push("answer_not_found");
  }

  if (
    question?.options &&
    !validateOptions(
      question.options,
      question.answer,
    )
  ) {
    problems.push("options_failed_validation");
  }

  const basicCheck = qualityCheck(question);

  if (!basicCheck.passed) {
    problems.push("basic_quality_failed");
  }

  return {
    passed: problems.length === 0,
    score: problems.length === 0
      ? 100
      : Math.max(
          0,
          100 - problems.length * 20,
        ),
    problems,
  };
}

// ======================================================
// AUTO REGENERATE
// ======================================================

function generateValidatedQuestion(
  skill: string,
  concept: any,
  concepts: any[],
): GeneratedQuestion {
  let attempt = 0;

  while (attempt < 5) {
    const question = generateQuestionText(
      skill,
      concept,
    );

    const options = buildOptionsBySkill(
      skill,
      concept,
      concepts,
    );

    const result = {
      question,
      options: options.options,
      answer: options.answer,
    };

    const check = qualityCheck(result);

    if (check.passed) {
      return {
        ...result,
        quality_score: check.score,
      };
    }

    attempt++;
  }

  throw new Error(
    "Gagal membuat soal berkualitas",
  );
}

function safeGenerate(
  skill: string,
  concept: any,
  concepts: any[],
): GeneratedQuestion {
  let attempt = 0;
  let lastProblems: string[] = [];

  while (attempt < 8) {
    try {
      const generated = generateValidatedQuestion(
        skill,
        concept,
        concepts,
      );

      const check = advancedQualityCheck(
        generated,
      );

      if (check.passed) {
        return {
          ...generated,
          quality_score: check.score,
        };
      }

      lastProblems = check.problems || [];
    } catch (error) {
      lastProblems = [
        error instanceof Error
          ? error.message
          : String(error),
      ];
    }

    attempt++;
  }

  throw new Error(
    `Gagal membuat soal berkualitas setelah beberapa percobaan: ${lastProblems.join(", ")}`,
  );
}

// ======================================================
// DIFFICULTY ENGINE
// ======================================================

function getDifficultyData(
  skill: string,
): DifficultyData {
  const map: Record<string, DifficultyData> = {
    "mengenal": {
      level: 1,
      label: "basic recall",
      cognitive: "C1",
    },

    "memahami dasar": {
      level: 2,
      label: "understanding",
      cognitive: "C2",
    },

    "analisis sederhana": {
      level: 3,
      label: "simple analysis",
      cognitive: "C3",
    },

    "penerapan": {
      level: 4,
      label: "application",
      cognitive: "C3",
    },

    "analisis mendalam": {
      level: 5,
      label: "deep analysis",
      cognitive: "C4",
    },

    "evaluasi": {
      level: 6,
      label: "evaluation",
      cognitive: "C5",
    },

    "HOTS": {
      level: 7,
      label: "higher order thinking",
      cognitive: "C6",
    },
  };

  return (
    map[skill] ||
    map["mengenal"]
  );
}

// ======================================================
// QUESTION OBJECT BUILDER
// ======================================================

function buildQuestionObject(
  level: any,
  skill: string,
  originalSkill: string,
  concept: any,
  concepts: any[],
) {
  const generated = safeGenerate(
    skill,
    concept,
    concepts,
  );

  const difficulty = getDifficultyData(
    skill,
  );

  const promptUsed =
    originalSkill === skill
      ? skill
      : `${originalSkill} -> ${skill}`;

  return {
    topic_id: level.topic_id,
    stage_id: level.stage_id,
    level_id: level.id,

    question: generated.question,
    options: generated.options,
    answer: generated.answer,
    explanation: getExplanation(concept),

    generator_type: "rule",
    ai_model: null,
    prompt_used: promptUsed,

    quality_checked: true,
    quality_score: generated.quality_score,

    cognitive_level: difficulty.cognitive,
    difficulty: difficulty.level,
    difficulty_label: difficulty.label,

    concept_id: concept.id,
  };
}

// ======================================================
// DUPLICATE CHECK
// ======================================================

function getQuestionKey(question: any) {
  return normalizeText(
    question?.question || "",
  );
}

// ======================================================
// CONCEPT ROTATION
// ======================================================

function selectConcept(
  concepts: any[],
  used: string[],
) {
  let available = concepts.filter((item) =>
    !used.includes(item.id)
  );

  if (!available.length) {
    used.length = 0;
    available = concepts;
  }

  return randomItem(available);
}

// ======================================================
// BATCH QUESTION GENERATOR
// ======================================================

async function generateBatch(
  level: any,
  skill: string,
  originalSkill: string,
  concepts: any[],
  jumlah: number,
) {
  const questions: any[] = [];
  const usedConcepts: string[] = [];
  const usedQuestions = new Set<string>();

  let attempt = 0;

  const maxAttempt = Math.max(
    jumlah * 10,
    40,
  );

  while (
    questions.length < jumlah &&
    attempt < maxAttempt
  ) {
    attempt++;

    const concept = selectConcept(
      concepts,
      usedConcepts,
    );

    if (!concept) {
      continue;
    }

    usedConcepts.push(concept.id);

    try {
      const question = buildQuestionObject(
        level,
        skill,
        originalSkill,
        concept,
        concepts,
      );

      const key = getQuestionKey(question);

      if (!key || usedQuestions.has(key)) {
        continue;
      }

      const check = advancedQualityCheck(question);

      if (!check.passed) {
        continue;
      }

      question.quality_checked = true;
      question.quality_score = check.score;

      questions.push(question);
      usedQuestions.add(key);
    } catch (error) {
      console.log(
        "generation failed",
        error instanceof Error
          ? error.message
          : String(error),
      );
    }
  }

  return questions.slice(0, jumlah);
}

// ======================================================
// DATABASE COMPATIBILITY
// ======================================================

function prepareDatabasePayload(question: any) {
  return {
    topic_id: question.topic_id,
    stage_id: question.stage_id,
    level_id: question.level_id,
    question: question.question,
    options: question.options,
    answer: question.answer,
    explanation: question.explanation,
    generator_type: question.generator_type,
    ai_model: question.ai_model,
    prompt_used: question.prompt_used,
    quality_checked: question.quality_checked,
    quality_score: question.quality_score,
    cognitive_level: question.cognitive_level,
    difficulty: question.difficulty,
    difficulty_label: question.difficulty_label,
    concept_id: question.concept_id,
  };
}

// ======================================================
// REQUEST VALIDATION
// ======================================================

function parseJumlah(value: any) {
  const parsed = Number(value ?? 10);

  if (!Number.isFinite(parsed)) {
    return 10;
  }

  const integer = Math.floor(parsed);

  if (integer < 1) {
    return 1;
  }

  if (integer > 50) {
    return 50;
  }

  return integer;
}

// ======================================================
// EDGE FUNCTION HANDLER
// ======================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method tidak didukung. Gunakan POST.",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const body = await req.json();

    const level_id = body?.level_id;
    const jumlah = parseJumlah(body?.jumlah);

    if (!level_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "level_id wajib diisi.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { data: level, error: levelError } =
      await supabase
        .from("levels")
        .select("*")
        .eq("id", level_id)
        .single();

    if (levelError || !level) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Level tidak ditemukan.",
          detail: levelError?.message || null,
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const rawSkill =
     level?.skill ||
      level?.config?.skill ||
     "mengenal";

    const normalizedSkill = normalizeSkill(rawSkill);

    if (!normalizedSkill) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Skill tidak didukung: ${rawSkill}`,
          supported_skills: SUPPORTED_SKILLS,
          supported_aliases: Object.keys(SKILL_ALIASES),
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const skill = normalizedSkill.skill;
    const originalSkill = normalizedSkill.originalSkill;

    if (!isSupportedSkill(skill)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Skill hasil normalisasi tidak didukung: ${skill}`,
          supported_skills: SUPPORTED_SKILLS,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { data: concepts, error: conceptsError } =
      await supabase
        .from("concepts")
        .select("*")
        .eq("topic_id", level.topic_id);

    if (conceptsError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Gagal mengambil data konsep.",
          detail: conceptsError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const validConcepts = (concepts || [])
      .filter((concept: any) =>
        getConceptName(concept) &&
        getFunction(concept)
      );

    if (validConcepts.length < 4) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Data konsep tidak cukup. Minimal dibutuhkan 4 konsep valid dengan nama dan fungsi.",
          found: validConcepts.length,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const questions = await generateBatch(
      level,
      skill,
      originalSkill,
      validConcepts,
      jumlah,
    );

    if (questions.length < jumlah) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Generator belum dapat memenuhi jumlah soal yang diminta tanpa duplikasi.",
          requested: jumlah,
          generated: questions.length,
          generator: "rule-v2",
          original_skill: originalSkill,
          normalized_skill: skill,
          skill,
          questions,
        }),
        {
          status: 422,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const payload = questions.map(
      prepareDatabasePayload,
    );

    const { data: inserted, error: insertError } =
      await supabase
        .from("questions")
        .insert(payload)
        .select();

    if (insertError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Gagal menyimpan soal ke database.",
          detail: insertError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const difficulty = getDifficultyData(skill);

    return new Response(
      JSON.stringify({
        success: true,
        generator: "rule-v2",
        original_skill: originalSkill,
        normalized_skill: skill,
        skill,
        skill_alias_used: normalizedSkill.wasAlias,
        cognitive: difficulty.cognitive,
        difficulty: difficulty.level,
        difficulty_label: difficulty.label,
        requested: jumlah,
        count: inserted?.length || questions.length,
        questions: inserted || questions,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
