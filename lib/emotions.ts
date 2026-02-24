// lib/emotions.ts — 100% local, no API, no internet needed

export type EmotionResult = {
  primary: string;
  secondary?: string;
  percentages: Record<string, number>;
  intensity: 1 | 2 | 3 | 4 | 5;
  sentiment: "positive" | "neutral" | "negative";
};

const EMOTION_KEYWORDS: Record<string, Partial<Record<string, number>>> = {
  غاضب:   { غاضب:65, متضايق:20, زعلان:15 },
  اتخنقت: { غاضب:60, متضايق:25, زعلان:15 },
  كفاية:  { غاضب:55, متضايق:25, زعلان:20 },
  مستفز:  { غاضب:60, ساخر:20, متضايق:20 },
  بستهبل: { غاضب:40, ساخر:35, متضايق:25 },
  بضيع:   { غاضب:50, متضايق:30, زعلان:20 },
  زعلان:  { زعلان:60, متضايق:25, خايف:15 },
  حزين:   { زعلان:65, متضايق:20, خايف:15 },
  تعبت:   { زعلان:45, متضايق:35, خايف:20 },
  ماليش:  { زعلان:40, متضايق:35, خايف:25 },
  طبعاً:  { ساخر:65, متضايق:20, غاضب:15 },
  أكيد:   { ساخر:60, متضايق:25, غاضب:15 },
  واضح:   { ساخر:60, متضايق:25, مبسوط:15 },
  ناصح:   { ساخر:65, متضايق:20, غاضب:15 },
  استعبط: { ساخر:55, متضايق:25, غاضب:20 },
  فرحان:  { فرحان:55, مبسوط:30, متحمس:15 },
  ممتاز:  { فرحان:45, مبسوط:35, متحمس:20 },
  تمام:   { مبسوط:50, فرحان:30, متحمس:20 },
  حلو:    { فرحان:45, مبسوط:35, متحمس:20 },
  رائع:   { متحمس:45, فرحان:35, مبسوط:20 },
  تجنن:   { متحمس:50, فرحان:30, مبسوط:20 },
  حبيبي:  { مبسوط:55, فرحان:30, متحمس:15 },
  وحشتني: { مبسوط:45, فرحان:25, زعلان:30 },
  أحبك:   { مبسوط:60, فرحان:30, متحمس:10 },
  خايف:   { خايف:60, زعلان:25, متضايق:15 },
  قلقان:  { خايف:55, متضايق:30, زعلان:15 },
  متوتر:  { خايف:50, متضايق:30, زعلان:20 },
  متحمس:  { متحمس:65, فرحان:25, مبسوط:10 },
  يالا:   { متحمس:55, فرحان:30, مبسوط:15 },
  نروح:   { متحمس:50, فرحان:30, مبسوط:20 },
};

const EMPTY: Record<string, number> = {
  فرحان: 0, غاضب: 0, زعلان: 0, ساخر: 0,
  متحمس: 0, متضايق: 0, خايف: 0, مبسوط: 0,
};

export function detectEmotions(text: string): EmotionResult {
  const pcts = { ...EMPTY };
  let matched = false;

  for (const [keyword, weights] of Object.entries(EMOTION_KEYWORDS)) {
    if (text.includes(keyword)) {
      for (const [emo, val] of Object.entries(weights)) {
        pcts[emo] = (pcts[emo] ?? 0) + (val ?? 0);
      }
      matched = true;
    }
  }

  if (!matched) {
    pcts.مبسوط = 40; pcts.فرحان = 25; pcts.متحمس = 20; pcts.ساخر = 15;
  }

  // Normalise to exactly 100
  const total = Object.values(pcts).reduce((s, v) => s + v, 0);
  if (total > 0 && total !== 100) {
    for (const k of Object.keys(pcts)) pcts[k] = Math.round((pcts[k] / total) * 100);
    const diff = 100 - Object.values(pcts).reduce((s, v) => s + v, 0);
    const top = Object.entries(pcts).sort(([, a], [, b]) => b - a)[0][0];
    pcts[top] += diff;
  }

  const sorted = Object.entries(pcts).sort(([, a], [, b]) => b - a);
  const primary = sorted[0][0];
  const secondary = sorted[1][1] > 15 ? sorted[1][0] : undefined;
  const primaryVal = sorted[0][1];

  const sentiment: "positive" | "neutral" | "negative" =
    ["فرحان", "مبسوط", "متحمس"].includes(primary) ? "positive" :
    ["غاضب", "زعلان", "متضايق", "خايف"].includes(primary) ? "negative" : "neutral";

  const intensity = (
    primaryVal >= 70 ? 5 : primaryVal >= 55 ? 4 :
    primaryVal >= 40 ? 3 : primaryVal >= 25 ? 2 : 1
  ) as 1 | 2 | 3 | 4 | 5;

  return { primary, secondary, percentages: pcts, intensity, sentiment };
}