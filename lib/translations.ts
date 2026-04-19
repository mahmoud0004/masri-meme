import { lookupPhrase, analyzeEmotionKeywords, DICTIONARY } from "./dictionary";
import type { EmotionResult } from "./emotions";

export type TranslationMode = "dictionary" | "hybrid" | "inference";

export type TranslationResult = {
  original: string;
  translation: string;
  explanation: string;
  tone: string;
  found: boolean;
  confidence: number;
  mode: TranslationMode;
  matchedPhrases: string[];
};

const WORD_MAP: Record<string, string> = {
  انا: "I",
  انت: "you",
  انتي: "you",
  احنا: "we",
  هو: "he",
  هي: "she",
  هم: "they",
  ده: "this",
  دي: "this",
  دا: "this",
  دول: "these",
  ايه: "what",
  ليه: "why",
  ازاي: "how",
  فين: "where",
  امتي: "when",
  مين: "who",
  يا: "hey",
  عم: "man",
  يسطا: "bro",
  جدا: "very",
  قوي: "really",
  اوي: "very",
  خالص: "at all",
  مش: "not",
  موش: "not",
  مشش: "not",
  مفيش: "there is no",
  فيه: "there is",
  عندي: "I have",
  عنده: "he has",
  عندها: "she has",
  عندنا: "we have",
  عايز: "want",
  عايزه: "want",
  عاوز: "want",
  عاوزه: "want",
  محتاج: "need",
  محتاجه: "need",
  قادر: "able",
  قادره: "able",
  عارف: "know",
  عارفه: "know",
  فاهم: "understand",
  فاهمه: "understand",
  تعبان: "tired",
  تعبانه: "tired",
  زهقان: "bored",
  زعلان: "upset",
  مبسوط: "happy",
  مبسوطه: "happy",
  فرحان: "happy",
  فرحانه: "happy",
  مضايق: "annoyed",
  مخنوق: "overwhelmed",
  مخنوقه: "overwhelmed",
  خايف: "scared",
  قلقان: "worried",
  مستفز: "annoying",
  مستفزه: "annoying",
  حلو: "nice",
  حلوه: "nice",
  وحش: "bad",
  وحشه: "bad",
  جامد: "great",
  جميل: "beautiful",
  فظيع: "terrible",
  نار: "amazing",
  بحبك: "I love you",
  بحب: "love",
  وحشتني: "I missed you",
  يلا: "let's go",
  خلاص: "enough",
  بس: "just",
  كفاية: "enough",
  لسه: "still",
  دلوقتي: "now",
  النهارده: "today",
  بكرة: "tomorrow",
  امبارح: "yesterday",
};

const TONE_HINTS: Array<{ tone: string; words: string[] }> = [
  { tone: "غضب", words: ["اتخنقت", "غضبان", "كفاية", "مستفز", "بتضيع", "خلاص", "زهقت"] },
  { tone: "حزن", words: ["زعلان", "تعبان", "كسرت", "تعبت", "مليش", "مخنوق"] },
  { tone: "حب", words: ["بحبك", "وحشتني", "قلبي", "حبيبي", "تسلم", "ربنا"] },
  { tone: "سخرية", words: ["واضح", "اكيد", "ناصح", "اكتشاف", "بالعكس"] },
  { tone: "تحمس", words: ["جامد", "تجنن", "يلا", "عظيم", "نار", "ممتاز"] },
  { tone: "تعجب", words: ["ايه", "معقول", "بجد", "مش معقول", "فين"] },
  { tone: "فرح", words: ["مبسوط", "فرحان", "الحمد", "جميل", "حلو"] },
];

const INTENT_PATTERNS: Array<{
  pattern: RegExp;
  translation: string;
  explanation: string;
  tone: string;
}> = [
  {
    pattern: /مش (قادر|عارف|فاهم)/,
    translation: "I can't really handle this / I'm struggling with it",
    explanation: "The sentence expresses difficulty, inability, or feeling mentally blocked.",
    tone: "حزن",
  },
  {
    pattern: /(عايز|عاوز|محتاج).*(مش لاقي|مش قادر|مش عارف)?/,
    translation: "I'm trying to get something done, but I'm stuck",
    explanation: "This sounds like a need, request, or a frustrated attempt to reach a goal.",
    tone: "عادي",
  },
  {
    pattern: /(ايه|ليه|فين|ازاي).+\?/,
    translation: "This sounds like a surprised or frustrated question",
    explanation: "The sentence is structured like a direct question with emotional emphasis.",
    tone: "تعجب",
  },
  {
    pattern: /(بحبك|وحشتني|يا روح|قلبي)/,
    translation: "This is an affectionate or deeply emotional message",
    explanation: "The sentence carries warmth, closeness, or romantic affection.",
    tone: "حب",
  },
  {
    pattern: /(اتخنقت|زهقت|كفاية|مستفز|بتستهبال)/,
    translation: "This sounds angry, fed up, or emotionally exhausted",
    explanation: "The sentence carries pressure, frustration, or a sharp emotional reaction.",
    tone: "غضب",
  },
];

function normalizeArabic(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ً-ْ]/g, "")
    .replace(/[^\p{L}\p{N}\s!?؟]/gu, " ")
    .replace(/\s+/g, " ");
}

function tokenize(input: string) {
  return normalizeArabic(input)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function findMatchedPhrases(input: string) {
  const normalized = normalizeArabic(input);

  return Object.keys(DICTIONARY)
    .filter((phrase) => normalized.includes(normalizeArabic(phrase)))
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);
}

function inferTone(text: string) {
  const normalized = normalizeArabic(text);

  for (const group of TONE_HINTS) {
    if (group.words.some((word) => normalized.includes(normalizeArabic(word)))) {
      return group.tone;
    }
  }

  return "عادي";
}

function translateTokens(tokens: string[]) {
  return tokens
    .map((token) => WORD_MAP[token] ?? token)
    .join(" ")
    .replace(/\s+([?!])/g, "$1");
}

export function buildLiteralGloss(input: string) {
  const normalizedInput = normalizeArabic(input);

  if (
    normalizedInput.includes("Ã™â€¦Ã˜ÂªÃ˜Â´Ã˜ÂºÃ™â€žÃ˜Â´ Ã˜Â¯Ã™â€¦Ã˜Â§Ã˜ÂºÃ™Æ’") ||
    normalizedInput.includes("Ã™â€¦Ã˜Â§ Ã˜ÂªÃ˜Â´Ã˜ÂºÃ™â€žÃ˜Â´ Ã˜Â¯Ã™â€¦Ã˜Â§Ã˜ÂºÃ™Æ’")
  ) {
    return `Don't run/operate your brain.`;
  }

  const tokens = tokenize(input);
  const translated = translateTokens(tokens);

  if (!translated.trim()) {
    return "No useful literal gloss available.";
  }

  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

function buildInterpretiveFallback(input: string, tone: string, matchedPhrases: string[]) {
  const normalized = normalizeArabic(input);

  if (matchedPhrases.length > 0) {
    const related = DICTIONARY[matchedPhrases[0]];
    if (related) {
      return {
        translation: related.translation,
        explanation: `This sounds close to the local expression "${matchedPhrases[0]}", so the app is giving the intended meaning instead of a literal translation.`,
      };
    }
  }

  if (/(يا|يسطا|عم|بجد|خالص|اوي)/.test(normalized)) {
    return {
      translation: "This sounds like a casual Egyptian street-expression with social or emotional emphasis.",
      explanation: "The wording feels conversational and culture-specific, so the app is prioritizing the intended message over a literal translation.",
    };
  }

  switch (tone) {
    case "ØºØ¶Ø¨":
      return {
        translation: "This sounds frustrated, irritated, or emotionally charged.",
        explanation: "Instead of translating each word literally, the app is describing the speaker's real emotional intent.",
      };
    case "Ø­Ø²Ù†":
      return {
        translation: "This sounds emotionally heavy, tired, or discouraged.",
        explanation: "The sentence reads more like a mood or state of mind than something that should be translated word-for-word.",
      };
    case "Ø­Ø¨":
      return {
        translation: "This sounds affectionate, warm, or emotionally close.",
        explanation: "The phrase carries emotional closeness, so the app is giving the intended feeling rather than a literal gloss.",
      };
    case "Ø³Ø®Ø±ÙŠØ©":
      return {
        translation: "This sounds sarcastic or mocking rather than literal.",
        explanation: "Sarcastic Egyptian expressions usually lose their meaning if translated word-by-word, so the app describes the real vibe.",
      };
    case "ØªØ­Ù…Ø³":
      return {
        translation: "This sounds excited, impressed, or strongly expressive.",
        explanation: "The expression is being interpreted for its energy and emphasis, not translated literally.",
      };
    case "ØªØ¹Ø¬Ø¨":
      return {
        translation: "This sounds surprised, shocked, or questioning.",
        explanation: "The app is reading the emotional reaction behind the sentence instead of producing a direct word-for-word translation.",
      };
    default:
      return {
        translation: "This sounds like an Egyptian expression whose intended meaning matters more than the literal wording.",
        explanation: "The app is choosing a cultural interpretation because a direct translation would sound unnatural or misleading.",
      };
  }
}

function inferSentence(input: string): TranslationResult {
  const matchedPhrases = findMatchedPhrases(input);
  const normalized = normalizeArabic(input);

  for (const rule of INTENT_PATTERNS) {
    if (rule.pattern.test(normalized)) {
      return {
        original: input,
        translation: matchedPhrases.length
          ? `${rule.translation}. Related phrase: ${DICTIONARY[matchedPhrases[0]].translation}`
          : rule.translation,
        explanation: matchedPhrases.length
          ? `We inferred the sentence meaning from its wording and the matched local expression "${matchedPhrases[0]}".`
          : rule.explanation,
        tone: rule.tone,
        found: false,
        confidence: matchedPhrases.length ? 0.77 : 0.68,
        mode: matchedPhrases.length ? "hybrid" : "inference",
        matchedPhrases,
      };
    }
  }

  const tone = inferTone(input);
  const confidence = matchedPhrases.length ? 0.72 : 0.55;
  const fallback = buildInterpretiveFallback(input, tone, matchedPhrases);

  return {
    original: input,
    translation: fallback.translation,
    explanation: matchedPhrases.length
      ? fallback.explanation
      : `${fallback.explanation} This result is a cultural approximation, not a literal translation.`,
    tone,
    found: false,
    confidence,
    mode: matchedPhrases.length ? "hybrid" : "inference",
    matchedPhrases,
  };
}

export function translateMeme(input: string): TranslationResult {
  const normalizedInput = normalizeArabic(input);
  if (normalizedInput.includes("Ù…ØªØ´ØºÙ„Ø´ Ø¯Ù…Ø§ØºÙƒ") || normalizedInput.includes("Ù…Ø§ ØªØ´ØºÙ„Ø´ Ø¯Ù…Ø§ØºÙƒ")) {
    return {
      original: input,
      translation: "Don't overthink it / Don't stress yourself about it",
      explanation: "This is a common Egyptian expression used to calm someone down and tell them not to let the situation mentally drain them.",
      tone: "Ø¹Ø§Ø¯ÙŠ",
      found: true,
      confidence: 0.98,
      mode: "dictionary",
      matchedPhrases: [input.trim()],
    };
  }

  const phrase = lookupPhrase(input);

  if (phrase) {
    const matchedPhrases = findMatchedPhrases(input);

    return {
      original: input,
      translation: phrase.translation,
      explanation: phrase.explanation,
      tone: phrase.tone,
      found: true,
      confidence: 0.96,
      mode: matchedPhrases.length && normalizeArabic(input) !== normalizeArabic(matchedPhrases[0]) ? "hybrid" : "dictionary",
      matchedPhrases: matchedPhrases.length ? matchedPhrases : [input.trim()],
    };
  }

  return inferSentence(input);
}

export function getEmotionFromDictionary(input: string): EmotionResult {
  const phrase = lookupPhrase(input);

  if (phrase) {
    const sorted = Object.entries(phrase.emotions).sort(([, a], [, b]) => b - a);
    const primary = sorted[0][0];
    const secondary = sorted[1][1] > 15 ? sorted[1][0] : undefined;
    const primaryVal = sorted[0][1];
    const intensity = (
      primaryVal >= 70 ? 5 : primaryVal >= 55 ? 4 :
      primaryVal >= 40 ? 3 : primaryVal >= 25 ? 2 : 1
    ) as 1 | 2 | 3 | 4 | 5;

    return {
      primary,
      secondary,
      percentages: phrase.emotions,
      intensity,
      sentiment: phrase.sentiment,
    };
  }

  const result = analyzeEmotionKeywords(input);
  const { primary, sentiment, intensity, ...percentages } = result;
  return {
    primary,
    percentages: percentages as Record<string, number>,
    intensity,
    sentiment,
  };
}
