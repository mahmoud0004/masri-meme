// lib/emotions.ts
// Uses Claude AI to detect emotions from Egyptian Arabic text with percentages

export type EmotionResult = {
  primary: string;
  secondary?: string;
  percentages: Record<string, number>;
  intensity: 1 | 2 | 3 | 4 | 5;
  sentiment: "positive" | "neutral" | "negative";
};

const EMOTIONS_SYSTEM = `أنت خبير في علم النفس وتحليل المشاعر في اللهجة المصرية.
حلل النص وحدد المشاعر الموجودة فيه بدقة.
رد بـ JSON فقط بدون أي نص إضافي:
{
  "primary": "الشعور الأساسي بالعربي (فرحان / غاضب / زعلان / ساخر / متحمس / متضايق / خايف / مبسوط)",
  "secondary": "شعور ثانوي إن وجد أو null",
  "percentages": {
    "فرحان": 0,
    "غاضب": 0,
    "زعلان": 0,
    "ساخر": 0,
    "متحمس": 0,
    "متضايق": 0,
    "خايف": 0,
    "مبسوط": 0
  },
  "intensity": 3,
  "sentiment": "positive"
}
قواعد:
- مجموع الـ percentages لازم يساوي 100
- intensity من 1 لـ 5
- sentiment: "positive" أو "neutral" أو "negative"
- لو النص قصير أو مش واضح، اعمل تحليل منطقي`;

async function callClaude(system: string, userMsg: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

export async function detectEmotions(text: string): Promise<EmotionResult> {
  if (!text.trim()) {
    return {
      primary: "neutral",
      percentages: { فرحان: 0, غاضب: 0, زعلان: 0, ساخر: 0, متحمس: 0, متضايق: 0, خايف: 0, مبسوط: 0 },
      intensity: 1,
      sentiment: "neutral",
    };
  }

  const raw = await callClaude(
    EMOTIONS_SYSTEM,
    `حلل المشاعر في النص ده:\n\n"${text.trim()}"`
  );

  let parsed: any;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    // Fallback: keyword-based detection
    return fallbackDetection(text);
  }

  // Normalise percentages to sum to 100
  const pcts = parsed.percentages ?? {};
  const total = Object.values(pcts).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
  if (total > 0 && Math.abs(total - 100) > 2) {
    for (const k of Object.keys(pcts)) pcts[k] = Math.round((pcts[k] / total) * 100);
  }

  return {
    primary: parsed.primary ?? "neutral",
    secondary: parsed.secondary ?? undefined,
    percentages: pcts,
    intensity: Math.min(5, Math.max(1, Number(parsed.intensity) || 3)) as 1 | 2 | 3 | 4 | 5,
    sentiment: parsed.sentiment ?? "neutral",
  };
}

// Simple keyword fallback if Claude fails
function fallbackDetection(text: string): EmotionResult {
  const t = text.toLowerCase();
  let primary = "مبسوط";
  let sentiment: "positive" | "neutral" | "negative" = "neutral";

  if (/غاضب|زعلان|اتخنقت|كفاية|مستفز|بيضيع/.test(t)) { primary = "غاضب"; sentiment = "negative"; }
  else if (/حزين|زعلان|كسرت|تعبت/.test(t)) { primary = "زعلان"; sentiment = "negative"; }
  else if (/طبعاً|أكيد|ناصح|يسطا/.test(t)) { primary = "ساخر"; sentiment = "neutral"; }
  else if (/فرحان|تمام|ممتاز|حلو|رائع/.test(t)) { primary = "فرحان"; sentiment = "positive"; }
  else if (/حبيبي|وحشتني|أحبك/.test(t)) { primary = "مبسوط"; sentiment = "positive"; }

  const pcts: Record<string, number> = {
    فرحان: 0, غاضب: 0, زعلان: 0, ساخر: 0, متحمس: 0, متضايق: 0, خايف: 0, مبسوط: 0,
  };
  pcts[primary] = 70;
  // Distribute remaining 30% among others
  const others = Object.keys(pcts).filter((k) => k !== primary);
  others.forEach((k, i) => { pcts[k] = i < 3 ? 10 : 0; });

  return { primary, percentages: pcts, intensity: 3, sentiment };
}