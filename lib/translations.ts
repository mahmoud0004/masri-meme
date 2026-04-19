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

function buildGloss(input: string) {
  const tokens = tokenize(input);
  const translated = translateTokens(tokens);

  if (!translated.trim()) {
    return "We can read the vibe of this sentence, but we still need more vocabulary to translate it precisely.";
  }

  return translated.charAt(0).toUpperCase() + translated.slice(1);
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

  const gloss = buildGloss(input);
  const tone = inferTone(input);
  const confidence = matchedPhrases.length ? 0.72 : 0.55;

  return {
    original: input,
    translation: gloss,
    explanation: matchedPhrases.length
      ? `This sentence was interpreted using similar phrases from the local dictionary plus word-level guessing.`
      : "This result is a smart local approximation based on Egyptian Arabic wording and emotional cues, not an exact phrase match.",
    tone,
    found: false,
    confidence,
    mode: matchedPhrases.length ? "hybrid" : "inference",
    matchedPhrases,
  };
}

export function translateMeme(input: string): TranslationResult {
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
