// lib/translations.ts — 100% local, no API, no internet needed

import { lookupPhrase, analyzeEmotionKeywords } from "./dictionary";
import type { EmotionResult } from "./emotions";

export type TranslationResult = {
  original: string;
  translation: string;
  explanation: string;
  tone: string;
  found: boolean;
};

export function translateMeme(input: string): TranslationResult {
  const phrase = lookupPhrase(input);

  if (phrase) {
    return {
      original: input,
      translation: phrase.translation,
      explanation: phrase.explanation,
      tone: phrase.tone,
      found: true,
    };
  }

  return {
    original: input,
    translation: "This phrase isn't in the dictionary yet!",
    explanation: "We don't have this phrase yet — try one of the example chips above, or add it to the dictionary in lib/dictionary.ts",
    tone: "عادي",
    found: false,
  };
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

  // Fallback: keyword-based analysis
  const result = analyzeEmotionKeywords(input);
  const { primary, sentiment, intensity, ...percentages } = result;
  return {
    primary,
    percentages: percentages as Record<string, number>,
    intensity,
    sentiment,
  };
}