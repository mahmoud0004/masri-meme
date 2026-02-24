// lib/dictionary.ts — 100% local, no API, no internet needed

export type PhraseData = {
  translation: string;
  explanation: string;
  tone: "سخرية" | "غضب" | "فرح" | "حب" | "عادي" | "تعجب" | "حزن" | "تحمس";
  emotions: {
    فرحان: number; غاضب: number; زعلان: number; ساخر: number;
    متحمس: number; متضايق: number; خايف: number; مبسوط: number;
  };
  sentiment: "positive" | "neutral" | "negative";
  intensity: 1 | 2 | 3 | 4 | 5;
};

export const DICTIONARY: Record<string, PhraseData> = {

  // ── Sarcasm ───────────────────────────────────────────────────────
  "متعملش فيها ناصح": {
    translation: "Stop acting like you know better",
    explanation: "Said to someone who acts like they know everything when they clearly don't",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:10, زعلان:5, ساخر:55, متحمس:0, متضايق:25, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "يا عم ده اكتشاف": {
    translation: "Wow, what a groundbreaking discovery! (sarcastic)",
    explanation: "Heavy sarcasm when someone states something completely obvious as if it's brand new",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:5, زعلان:0, ساخر:75, متحمس:0, متضايق:15, خايف:0, مبسوط:5 },
    sentiment: "neutral", intensity: 3,
  },
  "لا يا شيخ؟ ده اكتشاف!": {
    translation: "No way! That's HUGE news! (heavy sarcasm)",
    explanation: "Extreme sarcasm when someone says something painfully obvious",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:5, زعلان:0, ساخر:80, متحمس:0, متضايق:10, خايف:0, مبسوط:5 },
    sentiment: "neutral", intensity: 4,
  },
  "طبعاً أكيد": {
    translation: "Oh sure, absolutely (sarcastic)",
    explanation: "A sarcastic reply that actually means the complete opposite",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:5, زعلان:5, ساخر:70, متحمس:0, متضايق:15, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "حلوة دي كمل بقى": {
    translation: "That's cute... please continue (sarcastic)",
    explanation: "Sarcastic encouragement when someone says something ridiculous or illogical",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:5, زعلان:0, ساخر:70, متحمس:0, متضايق:20, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "معلش أصلنا أغبياء": {
    translation: "Sorry, I guess we're just dumb (self-deprecating sarcasm)",
    explanation: "Self-deprecating sarcasm used when the situation is absurd or frustrating",
    tone: "سخرية",
    emotions: { فرحان:5, غاضب:0, زعلان:10, ساخر:60, متحمس:0, متضايق:15, خايف:0, مبسوط:10 },
    sentiment: "neutral", intensity: 3,
  },
  "أيوه تاني": {
    translation: "Here we go again / Right, sure",
    explanation: "Boredom and frustration from a situation that keeps repeating itself",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:15, زعلان:15, ساخر:45, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 3,
  },
  "صاحي ولا نايم": {
    translation: "Are you awake? / Are you paying attention?",
    explanation: "Sarcastic question asking if someone is paying attention or just zoning out",
    tone: "سخرية",
    emotions: { فرحان:5, غاضب:10, زعلان:5, ساخر:50, متحمس:5, متضايق:20, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 2,
  },
  "ولا بالهمس": {
    translation: "Not even close / Not a chance",
    explanation: "Absolute rejection — it's not going to happen, not even a little bit",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:20, زعلان:10, ساخر:40, متحمس:0, متضايق:25, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "واضح": {
    translation: "Obviously / Clearly (usually sarcastic)",
    explanation: "Can mean genuine clarity, but usually used sarcastically when things are NOT obvious",
    tone: "سخرية",
    emotions: { فرحان:5, غاضب:5, زعلان:5, ساخر:55, متحمس:0, متضايق:20, خايف:0, مبسوط:10 },
    sentiment: "neutral", intensity: 2,
  },
  "يا عم ده انت فاهمها بالعكس": {
    translation: "Dude, you've got it completely backwards",
    explanation: "Correcting someone who understood a situation in the exact opposite way",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:10, زعلان:5, ساخر:50, متحمس:0, متضايق:25, خايف:0, مبسوط:10 },
    sentiment: "negative", intensity: 3,
  },

  // ── Anger & Frustration ───────────────────────────────────────────
  "إيه ده يسطا": {
    translation: "What is this, man?!",
    explanation: "Expression of disbelief or criticism toward something that's wrong or annoying",
    tone: "تعجب",
    emotions: { فرحان:0, غاضب:20, زعلان:10, ساخر:30, متحمس:0, متضايق:30, خايف:0, مبسوط:10 },
    sentiment: "negative", intensity: 3,
  },
  "إنت بتضيع وقتي": {
    translation: "You're wasting my time",
    explanation: "Frustration toward someone who isn't being serious or productive",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:55, زعلان:10, ساخر:10, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 4,
  },
  "هو أنا بكلم نفسي": {
    translation: "Am I talking to myself here?",
    explanation: "Frustration toward someone who isn't listening or responding at all",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:35, زعلان:15, ساخر:25, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 3,
  },
  "أنا اتخنقت": {
    translation: "I'm completely fed up / I've had it",
    explanation: "Reached the absolute breaking point from stress or frustration",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:50, زعلان:20, ساخر:5, متحمس:0, متضايق:20, خايف:5, مبسوط:0 },
    sentiment: "negative", intensity: 5,
  },
  "كفاية بقى": {
    translation: "That's enough / Stop it",
    explanation: "A firm and final request to stop doing something annoying",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:55, زعلان:10, ساخر:5, متحمس:0, متضايق:25, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 4,
  },
  "إنت مستفز جداً": {
    translation: "You're being really annoying / You're provoking me",
    explanation: "Direct expression of extreme annoyance toward someone's behavior",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:65, زعلان:5, ساخر:10, متحمس:0, متضايق:20, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 4,
  },
  "بلاش تستعبط": {
    translation: "Stop acting dumb / Quit fooling around",
    explanation: "Telling someone to stop pretending to be stupid or acting foolishly",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:45, زعلان:10, ساخر:20, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 3,
  },
  "إنت بتستهبل": {
    translation: "Are you messing with me? / Are you serious right now?",
    explanation: "Questioning whether someone is being genuine or just playing dumb",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:30, زعلان:10, ساخر:35, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 3,
  },
  "أكل راسي": {
    translation: "He/she drove me crazy / They're so annoying",
    explanation: "Someone who exhausts you with constant talking or irritating behavior",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:40, زعلان:15, ساخر:20, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 4,
  },
  "شيل عيني عنك": {
    translation: "Get out of my sight / Leave me alone",
    explanation: "Asking someone to leave completely — done with this person entirely",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:55, زعلان:15, ساخر:10, متحمس:0, متضايق:20, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 4,
  },
  "يا عم بلاش كده": {
    translation: "Come on man, don't be like that",
    explanation: "Politely but firmly asking someone to stop an annoying behavior",
    tone: "عادي",
    emotions: { فرحان:5, غاضب:15, زعلان:10, ساخر:20, متحمس:5, متضايق:35, خايف:0, مبسوط:10 },
    sentiment: "negative", intensity: 2,
  },
  "إيه الكلام ده": {
    translation: "What kind of talk is this?! / What are you saying?",
    explanation: "Rejection and disbelief toward something strange or illogical being said",
    tone: "تعجب",
    emotions: { فرحان:0, غاضب:25, زعلان:10, ساخر:30, متحمس:5, متضايق:20, خايف:5, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },

  // ── Happy & Positive ──────────────────────────────────────────────
  "ده أنا مبسوطه": {
    translation: "I'm so happy about this!",
    explanation: "Genuine and joyful expression of happiness about something that happened",
    tone: "فرح",
    emotions: { فرحان:50, غاضب:0, زعلان:0, ساخر:0, متحمس:25, متضايق:0, خايف:0, مبسوط:25 },
    sentiment: "positive", intensity: 4,
  },
  "تمام تمام": {
    translation: "Great / All good / Perfect",
    explanation: "Confirmation that everything is fine and going smoothly",
    tone: "عادي",
    emotions: { فرحان:30, غاضب:0, زعلان:0, ساخر:0, متحمس:15, متضايق:0, خايف:0, مبسوط:55 },
    sentiment: "positive", intensity: 2,
  },
  "يا سلام على الذوق": {
    translation: "Now THAT'S class! / Wow, how tasteful!",
    explanation: "Genuine admiration for something beautiful, elegant, or high quality",
    tone: "تحمس",
    emotions: { فرحان:35, غاضب:0, زعلان:0, ساخر:10, متحمس:30, متضايق:0, خايف:0, مبسوط:25 },
    sentiment: "positive", intensity: 4,
  },
  "ممتاز": {
    translation: "Excellent / Outstanding",
    explanation: "Praise and admiration for something done very well",
    tone: "فرح",
    emotions: { فرحان:35, غاضب:0, زعلان:0, ساخر:0, متحمس:25, متضايق:0, خايف:0, مبسوط:40 },
    sentiment: "positive", intensity: 3,
  },
  "الحمد لله": {
    translation: "Thank God / Praise be to God",
    explanation: "Gratitude to God for a blessing or when a problem gets resolved",
    tone: "فرح",
    emotions: { فرحان:40, غاضب:0, زعلان:0, ساخر:0, متحمس:15, متضايق:0, خايف:0, مبسوط:45 },
    sentiment: "positive", intensity: 3,
  },
  "حاجة تجنن": {
    translation: "It's insanely good / Mind-blowing",
    explanation: "Something so amazing it's almost unbelievable — overwhelming in the best way",
    tone: "تحمس",
    emotions: { فرحان:30, غاضب:0, زعلان:0, ساخر:5, متحمس:45, متضايق:0, خايف:0, مبسوط:20 },
    sentiment: "positive", intensity: 5,
  },
  "زي الفل": {
    translation: "Perfect / Smooth as silk / Everything's great",
    explanation: "Everything is going perfectly with absolutely no problems",
    tone: "فرح",
    emotions: { فرحان:40, غاضب:0, زعلان:0, ساخر:0, متحمس:25, متضايق:0, خايف:0, مبسوط:35 },
    sentiment: "positive", intensity: 3,
  },
  "ما شاء الله": {
    translation: "Wow / What a blessing / Impressive",
    explanation: "Admiration and praise — also said to ward off the evil eye",
    tone: "تحمس",
    emotions: { فرحان:35, غاضب:0, زعلان:0, ساخر:0, متحمس:30, متضايق:0, خايف:0, مبسوط:35 },
    sentiment: "positive", intensity: 3,
  },

  // ── Love & Affection ──────────────────────────────────────────────
  "يا روح قلبي": {
    translation: "You're my heart and soul / You mean everything to me",
    explanation: "Deep expression of love — literally means 'the soul of my heart'",
    tone: "حب",
    emotions: { فرحان:30, غاضب:0, زعلان:0, ساخر:0, متحمس:20, متضايق:0, خايف:0, مبسوط:50 },
    sentiment: "positive", intensity: 5,
  },
  "وحشتني والله": {
    translation: "I really missed you, I swear",
    explanation: "Sincere expression of missing someone who has been away for a while",
    tone: "حب",
    emotions: { فرحان:25, غاضب:0, زعلان:20, ساخر:0, متحمس:15, متضايق:0, خايف:0, مبسوط:40 },
    sentiment: "positive", intensity: 4,
  },
  "تسلم إيدك": {
    translation: "Bless your hands / Great job!",
    explanation: "Thank you and appreciation for someone who did something good — 'may your hands be safe'",
    tone: "حب",
    emotions: { فرحان:30, غاضب:0, زعلان:0, ساخر:0, متحمس:20, متضايق:0, خايف:0, مبسوط:50 },
    sentiment: "positive", intensity: 3,
  },
  "ربنا يخليك": {
    translation: "God bless you / May God keep you",
    explanation: "A warm prayer wishing someone well — commonly said to loved ones",
    tone: "حب",
    emotions: { فرحان:30, غاضب:0, زعلان:0, ساخر:0, متحمس:10, متضايق:0, خايف:0, مبسوط:60 },
    sentiment: "positive", intensity: 3,
  },
  "إنت عشرة عمر": {
    translation: "You're worth a lifetime of friendship",
    explanation: "Expressing how valuable and irreplaceable someone is in your life",
    tone: "حب",
    emotions: { فرحان:25, غاضب:0, زعلان:0, ساخر:0, متحمس:15, متضايق:0, خايف:0, مبسوط:60 },
    sentiment: "positive", intensity: 4,
  },

  // ── Sadness & Disappointment ──────────────────────────────────────
  "كسرت بخاطري": {
    translation: "You broke my heart / You let me down badly",
    explanation: "Deep emotional pain caused by someone close who acted hurtfully or betrayed trust",
    tone: "حزن",
    emotions: { فرحان:0, غاضب:15, زعلان:55, ساخر:0, متحمس:0, متضايق:20, خايف:5, مبسوط:5 },
    sentiment: "negative", intensity: 5,
  },
  "تعبت والله": {
    translation: "I'm exhausted / I'm really tired of this",
    explanation: "Expression of deep physical or emotional exhaustion",
    tone: "حزن",
    emotions: { فرحان:0, غاضب:15, زعلان:40, ساخر:5, متحمس:0, متضايق:30, خايف:5, مبسوط:5 },
    sentiment: "negative", intensity: 4,
  },
  "كنت متوقع منك أكتر": {
    translation: "I expected more from you",
    explanation: "Disappointment expressed toward someone who failed to meet expectations",
    tone: "حزن",
    emotions: { فرحان:0, غاضب:20, زعلان:45, ساخر:10, متحمس:0, متضايق:20, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 4,
  },
  "ماليش نفس": {
    translation: "I'm not in the mood / I don't feel like it",
    explanation: "Lack of desire or energy to do something due to emotional exhaustion",
    tone: "حزن",
    emotions: { فرحان:0, غاضب:10, زعلان:35, ساخر:5, متحمس:0, متضايق:35, خايف:10, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "مش لاقي في نفسي": {
    translation: "I can't bring myself to do it",
    explanation: "Lacking the emotional or mental strength to do something",
    tone: "حزن",
    emotions: { فرحان:0, غاضب:5, زعلان:35, ساخر:5, متحمس:0, متضايق:30, خايف:15, مبسوط:10 },
    sentiment: "negative", intensity: 3,
  },

  // ── Surprise & Shock ──────────────────────────────────────────────
  "معقول": {
    translation: "Really?! / Is that possible?!",
    explanation: "Expression of surprise or disbelief about something unexpected",
    tone: "تعجب",
    emotions: { فرحان:5, غاضب:5, زعلان:10, ساخر:15, متحمس:20, متضايق:10, خايف:15, مبسوط:20 },
    sentiment: "neutral", intensity: 3,
  },
  "يا نهار أبيض": {
    translation: "Oh my God! / Holy cow!",
    explanation: "Strong expression of shock or surprise — literally 'oh white day'",
    tone: "تعجب",
    emotions: { فرحان:10, غاضب:15, زعلان:10, ساخر:10, متحمس:25, متضايق:10, خايف:10, مبسوط:10 },
    sentiment: "neutral", intensity: 4,
  },
  "مش معقول": {
    translation: "Unbelievable! / No way!",
    explanation: "Strong disbelief toward something shocking or unexpected",
    tone: "تعجب",
    emotions: { فرحان:5, غاضب:15, زعلان:10, ساخر:15, متحمس:20, متضايق:10, خايف:15, مبسوط:10 },
    sentiment: "neutral", intensity: 4,
  },
  "ده فين ده": {
    translation: "Where did this come from? / That's out of nowhere",
    explanation: "Surprise at something that appeared or happened unexpectedly",
    tone: "تعجب",
    emotions: { فرحان:5, غاضب:10, زعلان:5, ساخر:30, متحمس:15, متضايق:15, خايف:10, مبسوط:10 },
    sentiment: "neutral", intensity: 3,
  },

  // ── Everyday phrases ──────────────────────────────────────────────
  "يا عم": {
    translation: "Dude / Man / Come on",
    explanation: "Informal address used to express various emotions — friendly or frustrated",
    tone: "عادي",
    emotions: { فرحان:10, غاضب:15, زعلان:10, ساخر:20, متحمس:15, متضايق:15, خايف:5, مبسوط:10 },
    sentiment: "neutral", intensity: 2,
  },
  "والنبي": {
    translation: "I swear / I promise / Please",
    explanation: "A strong oath or plea — used to emphasize sincerity or beg for something",
    tone: "تحمس",
    emotions: { فرحان:10, غاضب:5, زعلان:10, ساخر:0, متحمس:30, متضايق:10, خايف:15, مبسوط:20 },
    sentiment: "neutral", intensity: 3,
  },
  "إن شاء الله": {
    translation: "God willing / Hopefully / Maybe (sometimes used to avoid commitment)",
    explanation: "Can mean genuine hope, or sometimes used to politely dodge committing to something",
    tone: "عادي",
    emotions: { فرحان:20, غاضب:0, زعلان:5, ساخر:10, متحمس:15, متضايق:5, خايف:15, مبسوط:30 },
    sentiment: "neutral", intensity: 2,
  },
  "يا رب": {
    translation: "Oh God / Please God / Lord help me",
    explanation: "A prayer, plea, or call for help — used in both serious and casual situations",
    tone: "عادي",
    emotions: { فرحان:5, غاضب:5, زعلان:15, ساخر:0, متحمس:10, متضايق:20, خايف:30, مبسوط:15 },
    sentiment: "neutral", intensity: 3,
  },
  "بجد": {
    translation: "Seriously / For real / I mean it",
    explanation: "Used to emphasize that you are being completely genuine and not joking",
    tone: "عادي",
    emotions: { فرحان:10, غاضب:15, زعلان:10, ساخر:10, متحمس:25, متضايق:10, خايف:10, مبسوط:10 },
    sentiment: "neutral", intensity: 2,
  },
  "والله عظيم": {
    translation: "I swear to God / I mean it seriously",
    explanation: "A very strong oath used to emphasize that something is absolutely true",
    tone: "تحمس",
    emotions: { فرحان:20, غاضب:10, زعلان:0, ساخر:0, متحمس:40, متضايق:0, خايف:5, مبسوط:25 },
    sentiment: "positive", intensity: 4,
  },
};

// ── Smart lookup ──────────────────────────────────────────────────────────────
export function lookupPhrase(input: string): PhraseData | null {
  const clean = input.trim();

  // 1. Exact match
  if (DICTIONARY[clean]) return DICTIONARY[clean];

  // 2. Case-insensitive exact
  const lower = clean.toLowerCase();
  for (const [key, val] of Object.entries(DICTIONARY)) {
    if (key.toLowerCase() === lower) return val;
  }

  // 3. Input contains dictionary phrase or vice versa
  for (const [key, val] of Object.entries(DICTIONARY)) {
    if (clean.includes(key) || key.includes(clean)) return val;
  }

  // 4. Word overlap scoring
  const inputWords = clean.split(/\s+/).filter(w => w.length > 1);
  let bestScore = 0;
  let bestMatch: PhraseData | null = null;

  for (const [key, val] of Object.entries(DICTIONARY)) {
    const keyWords = key.split(/\s+/);
    const overlap = inputWords.filter(w =>
      keyWords.some(kw => kw.includes(w) || w.includes(kw))
    ).length;
    const score = overlap / Math.max(inputWords.length, keyWords.length);
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = val;
    }
  }

  return bestMatch;
}

// ── Keyword-based emotion fallback ────────────────────────────────────────────
export function analyzeEmotionKeywords(text: string): {
  فرحان: number; غاضب: number; زعلان: number; ساخر: number;
  متحمس: number; متضايق: number; خايف: number; مبسوط: number;
  primary: string;
  sentiment: "positive" | "neutral" | "negative";
  intensity: 1 | 2 | 3 | 4 | 5;
} {
  const base = { فرحان:0, غاضب:0, زعلان:0, ساخر:0, متحمس:0, متضايق:0, خايف:0, مبسوط:0 };

  const rules = [
    { pattern: /غاضب|اتخنقت|كفاية|مستفز|بضيع/, emotions: { غاضب:60, متضايق:25, زعلان:15 } },
    { pattern: /حزين|زعلان|كسرت|تعبت|ماليش/,   emotions: { زعلان:55, متضايق:25, خايف:20 } },
    { pattern: /طبعاً|أكيد|واضح|ناصح|استعبط/,  emotions: { ساخر:65, متضايق:20, غاضب:15 } },
    { pattern: /فرحان|تمام|ممتاز|حلو|تجنن/,     emotions: { فرحان:50, مبسوط:30, متحمس:20 } },
    { pattern: /حبيبي|وحشتني|أحبك|تسلم/,        emotions: { مبسوط:55, فرحان:30, متحمس:15 } },
    { pattern: /معقول|إيه ده|مش معقول|نهار/,    emotions: { متحمس:35, خايف:25, ساخر:20, مبسوط:20 } },
    { pattern: /خايف|قلقان|متوتر|يا رب/,         emotions: { خايف:60, زعلان:20, متضايق:20 } },
    { pattern: /متحمس|يالا|نروح|والله عظيم/,     emotions: { متحمس:60, فرحان:25, مبسوط:15 } },
  ];

  let matched = false;
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      Object.assign(base, rule.emotions);
      matched = true;
      break;
    }
  }

  if (!matched) {
    base.مبسوط = 40; base.فرحان = 25; base.متحمس = 20; base.ساخر = 15;
  }

  // Fix to sum 100
  const total = Object.values(base).reduce((s, v) => s + v, 0);
  if (total !== 100 && total > 0) {
    const diff = 100 - total;
    const topKey = Object.entries(base).sort(([, a], [, b]) => b - a)[0][0];
    (base as any)[topKey] += diff;
  }

  const sorted = Object.entries(base).sort(([, a], [, b]) => b - a);
  const primary = sorted[0][0];
  const primaryVal = sorted[0][1];

  const sentiment: "positive" | "neutral" | "negative" =
    ["فرحان", "مبسوط", "متحمس"].includes(primary) ? "positive" :
    ["غاضب", "زعلان", "متضايق", "خايف"].includes(primary) ? "negative" : "neutral";

  const intensity = (
    primaryVal >= 70 ? 5 : primaryVal >= 55 ? 4 :
    primaryVal >= 40 ? 3 : primaryVal >= 25 ? 2 : 1
  ) as 1 | 2 | 3 | 4 | 5;

  return { ...base, primary, sentiment, intensity };
}