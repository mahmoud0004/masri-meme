// lib/translations.ts
// Uses Claude AI to translate Egyptian Arabic memes and phrases

import type { EmotionResult } from "./emotions";

export type TranslationResult = {
  original: string;
  translation: string;
  explanation: string;
  tone: string;
};

const TRANSLATION_SYSTEM = `أنت خبير في اللهجة المصرية والميمز المصرية.
مهمتك ترجمة العبارات المصرية ترجمة ذكية — مش ترجمة حرفية.
يعني لو حد قال "متعملش فيها ناصح" ما تقولش "don't act wise in it" — قول "don't pretend you know better" أو ما يعادلها بشكل طبيعي.
رد بـ JSON فقط بدون أي نص إضافي:
{
  "translation": "الترجمة الإنجليزية الطبيعية",
  "explanation": "شرح بسيط للمعنى والسياق الثقافي بالعربي",
  "tone": "نبرة العبارة (سخرية / غضب / فرح / عادي / إلخ)"
}`;

const IMAGE_SYSTEM = `أنت خبير في قراءة الميمز المصرية وتحليلها.
انظر للصورة واستخرج أي نص موجود فيها أو اوصف المحتوى الكوميدي/الساخر.
ثم ترجم وفسر المعنى الفعلي — مش ترجمة حرفية.
رد بـ JSON فقط:
{
  "extractedText": "النص المستخرج من الصورة أو وصف المحتوى",
  "translation": "الترجمة الإنجليزية الطبيعية",
  "explanation": "شرح بسيط للمعنى والسياق الثقافي بالعربي",
  "tone": "نبرة العبارة"
}`;

async function callClaude(system: string, userMsg: string, imgB64?: string, imgMime?: string): Promise<string> {
  const content: any[] = [];
  if (imgB64 && imgMime) {
    content.push({ type: "image", source: { type: "base64", media_type: imgMime, data: imgB64 } });
  }
  content.push({ type: "text", text: userMsg });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

export async function translateMeme(text: string): Promise<TranslationResult> {
  const raw = await callClaude(
    TRANSLATION_SYSTEM,
    `ترجم الجملة دي من اللهجة المصرية:\n\n"${text.trim()}"`
  );

  let parsed: any;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    // Fallback if JSON fails
    return {
      original: text,
      translation: raw.trim(),
      explanation: "",
      tone: "عادي",
    };
  }

  return {
    original: text,
    translation: parsed.translation ?? raw,
    explanation: parsed.explanation ?? "",
    tone: parsed.tone ?? "عادي",
  };
}

export async function translateMemeFromImage(
  imgB64: string,
  imgMime: string
): Promise<{ translation: TranslationResult; emotion: EmotionResult; extractedText: string }> {
  const { detectEmotions } = await import("./emotions");

  const raw = await callClaude(
    IMAGE_SYSTEM,
    "حلل الميم ده واستخرج وترجم المحتوى",
    imgB64,
    imgMime
  );

  let parsed: any;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    parsed = { extractedText: raw, translation: raw, explanation: "", tone: "عادي" };
  }

  const extractedText = parsed.extractedText ?? "";
  const emotion = await detectEmotions(extractedText || parsed.translation || "");

  return {
    extractedText,
    translation: {
      original: extractedText,
      translation: parsed.translation ?? raw,
      explanation: parsed.explanation ?? "",
      tone: parsed.tone ?? "عادي",
    },
    emotion,
  };
}