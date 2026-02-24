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
  "متعملش فيها ناصح": {
    translation: "Stop acting like you know better",
    explanation: "بيقولها لحد بيتصرف إنه عارف كل حاجة وهو مش كده",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:10, زعلان:5, ساخر:55, متحمس:0, متضايق:25, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "يا عم ده اكتشاف": {
    translation: "Wow, what a groundbreaking discovery! (sarcastic)",
    explanation: "سخرية لما حد يقول حاجة واضحة ومعروفة كأنها جديدة",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:5, زعلان:0, ساخر:75, متحمس:0, متضايق:15, خايف:0, مبسوط:5 },
    sentiment: "neutral", intensity: 3,
  },
  "لا يا شيخ؟ ده اكتشاف!": {
    translation: "No way! That's HUGE news! (heavy sarcasm)",
    explanation: "سخرية شديدة لما حد يقول حاجة بديهية",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:5, زعلان:0, ساخر:80, متحمس:0, متضايق:10, خايف:0, مبسوط:5 },
    sentiment: "neutral", intensity: 4,
  },
  "طبعاً أكيد": {
    translation: "Oh sure, absolutely (sarcastic)",
    explanation: "رد ساخر يعني العكس تماماً",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:5, زعلان:5, ساخر:70, متحمس:0, متضايق:15, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "حلوة دي كمل بقى": {
    translation: "That's cute... please continue (sarcastic)",
    explanation: "سخرية لما حد يقول كلام مش منطقي",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:5, زعلان:0, ساخر:70, متحمس:0, متضايق:20, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "معلش أصلنا أغبياء": {
    translation: "Sorry, I guess we're just dumb (self-deprecating sarcasm)",
    explanation: "سخرية من النفس لما الموقف يبقى مضحك",
    tone: "سخرية",
    emotions: { فرحان:5, غاضب:0, زعلان:10, ساخر:60, متحمس:0, متضايق:15, خايف:0, مبسوط:10 },
    sentiment: "neutral", intensity: 3,
  },
  "إيه ده يسطا": {
    translation: "What is this, man?!",
    explanation: "تعبير عن الاستغراب أو الانتقاد لحاجة مش تمام",
    tone: "تعجب",
    emotions: { فرحان:0, غاضب:20, زعلان:10, ساخر:30, متحمس:0, متضايق:30, خايف:0, مبسوط:10 },
    sentiment: "negative", intensity: 3,
  },
  "إنت بتضيع وقتي": {
    translation: "You're wasting my time",
    explanation: "إحساس بالإحباط من شخص مش جاد",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:55, زعلان:10, ساخر:10, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 4,
  },
  "هو أنا بكلم نفسي": {
    translation: "Am I talking to myself here?",
    explanation: "إحباط من شخص مش بيسمع أو مش بيرد",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:35, زعلان:15, ساخر:25, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 3,
  },
  "أنا اتخنقت": {
    translation: "I'm completely fed up / I've had it",
    explanation: "وصل لحد الانفجار من الضغط أو التعب",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:50, زعلان:20, ساخر:5, متحمس:0, متضايق:20, خايف:5, مبسوط:0 },
    sentiment: "negative", intensity: 5,
  },
  "كفاية بقى": {
    translation: "That's enough / Stop it",
    explanation: "طلب إيقاف حاجة بشكل حاسم",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:55, زعلان:10, ساخر:5, متحمس:0, متضايق:25, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 4,
  },
  "إنت مستفز جداً": {
    translation: "You're being really annoying",
    explanation: "تصريح مباشر بالانزعاج الشديد",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:65, زعلان:5, ساخر:10, متحمس:0, متضايق:20, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 4,
  },
  "بلاش تستعبط": {
    translation: "Stop acting dumb / Quit fooling around",
    explanation: "طلب من حد يوقف تصرف غبي أو مزعج",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:45, زعلان:10, ساخر:20, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 3,
  },
  "إنت بتستهبل": {
    translation: "Are you messing with me? / Are you serious right now?",
    explanation: "سؤال عن قصد الشخص — هل هو جاد ولا بيمزح",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:30, زعلان:10, ساخر:35, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 3,
  },
  "ولا بالهمس": {
    translation: "Not even close / Not a chance",
    explanation: "نفي قاطع — مش هيحصل خالص",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:20, زعلان:10, ساخر:40, متحمس:0, متضايق:25, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "ده أنا مبسوطه": {
    translation: "I'm so happy about this!",
    explanation: "تعبير عن فرح حقيقي بحاجة حصلت",
    tone: "فرح",
    emotions: { فرحان:50, غاضب:0, زعلان:0, ساخر:0, متحمس:25, متضايق:0, خايف:0, مبسوط:25 },
    sentiment: "positive", intensity: 4,
  },
  "تمام تمام": {
    translation: "Great / All good / Perfect",
    explanation: "تأكيد إن كل حاجة تمام",
    tone: "عادي",
    emotions: { فرحان:30, غاضب:0, زعلان:0, ساخر:0, متحمس:15, متضايق:0, خايف:0, مبسوط:55 },
    sentiment: "positive", intensity: 2,
  },
  "يا سلام على الذوق": {
    translation: "Now THAT'S class! / Wow, how tasteful!",
    explanation: "إعجاب حقيقي بحاجة جميلة أو ذوق عالي",
    tone: "تحمس",
    emotions: { فرحان:35, غاضب:0, زعلان:0, ساخر:10, متحمس:30, متضايق:0, خايف:0, مبسوط:25 },
    sentiment: "positive", intensity: 4,
  },
  "ممتاز": {
    translation: "Excellent / Outstanding",
    explanation: "مدح وإشادة بحاجة كويسة",
    tone: "فرح",
    emotions: { فرحان:35, غاضب:0, زعلان:0, ساخر:0, متحمس:25, متضايق:0, خايف:0, مبسوط:40 },
    sentiment: "positive", intensity: 3,
  },
  "الحمد لله": {
    translation: "Thank God / Praise be to God",
    explanation: "شكر وامتنان لله على نعمة",
    tone: "فرح",
    emotions: { فرحان:40, غاضب:0, زعلان:0, ساخر:0, متحمس:15, متضايق:0, خايف:0, مبسوط:45 },
    sentiment: "positive", intensity: 3,
  },
  "يا روح قلبي": {
    translation: "You're my heart and soul / You mean everything to me",
    explanation: "تعبير عن حب عميق جداً لشخص",
    tone: "حب",
    emotions: { فرحان:30, غاضب:0, زعلان:0, ساخر:0, متحمس:20, متضايق:0, خايف:0, مبسوط:50 },
    sentiment: "positive", intensity: 5,
  },
  "وحشتني والله": {
    translation: "I really missed you, I swear",
    explanation: "تعبير صادق عن الشوق لشخص غاب",
    tone: "حب",
    emotions: { فرحان:25, غاضب:0, زعلان:20, ساخر:0, متحمس:15, متضايق:0, خايف:0, مبسوط:40 },
    sentiment: "positive", intensity: 4,
  },
  "تسلم إيدك": {
    translation: "Bless your hands / Great job!",
    explanation: "شكر وتقدير لحد عمل حاجة كويسة",
    tone: "حب",
    emotions: { فرحان:30, غاضب:0, زعلان:0, ساخر:0, متحمس:20, متضايق:0, خايف:0, مبسوط:50 },
    sentiment: "positive", intensity: 3,
  },
  "ربنا يخليك": {
    translation: "God bless you / May God keep you",
    explanation: "دعاء وتمنيات طيبة لشخص عزيز",
    tone: "حب",
    emotions: { فرحان:30, غاضب:0, زعلان:0, ساخر:0, متحمس:10, متضايق:0, خايف:0, مبسوط:60 },
    sentiment: "positive", intensity: 3,
  },
  "إنت عشرة عمر": {
    translation: "You're worth a lifetime of friendship",
    explanation: "تعبير عن قيمة الشخص وأهميته",
    tone: "حب",
    emotions: { فرحان:25, غاضب:0, زعلان:0, ساخر:0, متحمس:15, متضايق:0, خايف:0, مبسوط:60 },
    sentiment: "positive", intensity: 4,
  },
  "كسرت بخاطري": {
    translation: "You broke my heart / You let me down badly",
    explanation: "تعبير عن ألم عميق من تصرف شخص قريب",
    tone: "حزن",
    emotions: { فرحان:0, غاضب:15, زعلان:55, ساخر:0, متحمس:0, متضايق:20, خايف:5, مبسوط:5 },
    sentiment: "negative", intensity: 5,
  },
  "تعبت والله": {
    translation: "I'm exhausted / I'm really tired of this",
    explanation: "تعبير عن إرهاق جسدي أو نفسي",
    tone: "حزن",
    emotions: { فرحان:0, غاضب:15, زعلان:40, ساخر:5, متحمس:0, متضايق:30, خايف:5, مبسوط:5 },
    sentiment: "negative", intensity: 4,
  },
  "كنت متوقع منك أكتر": {
    translation: "I expected more from you",
    explanation: "خيبة أمل من شخص فشل في توقعات",
    tone: "حزن",
    emotions: { فرحان:0, غاضب:20, زعلان:45, ساخر:10, متحمس:0, متضايق:20, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 4,
  },
  "ماليش نفس": {
    translation: "I'm not in the mood / I don't feel like it",
    explanation: "عدم الرغبة في عمل حاجة بسبب تعب نفسي",
    tone: "حزن",
    emotions: { فرحان:0, غاضب:10, زعلان:35, ساخر:5, متحمس:0, متضايق:35, خايف:10, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "معقول": {
    translation: "Really?! / Is that possible?!",
    explanation: "تعبير عن الاستغراب من حاجة غير متوقعة",
    tone: "تعجب",
    emotions: { فرحان:5, غاضب:5, زعلان:10, ساخر:15, متحمس:20, متضايق:10, خايف:15, مبسوط:20 },
    sentiment: "neutral", intensity: 3,
  },
  "يا نهار أبيض": {
    translation: "Oh my God! / Holy cow!",
    explanation: "تعجب شديد من حاجة مفاجئة",
    tone: "تعجب",
    emotions: { فرحان:10, غاضب:15, زعلان:10, ساخر:10, متحمس:25, متضايق:10, خايف:10, مبسوط:10 },
    sentiment: "neutral", intensity: 4,
  },
  "إيه الكلام ده": {
    translation: "What kind of talk is this?! / What are you saying?",
    explanation: "استنكار لكلام غريب أو غير منطقي",
    tone: "تعجب",
    emotions: { فرحان:0, غاضب:25, زعلان:10, ساخر:30, متحمس:5, متضايق:20, خايف:5, مبسوط:5 },
    sentiment: "negative", intensity: 3,
  },
  "يا عم": {
    translation: "Dude / Man / Come on",
    explanation: "نداء غير رسمي للتعبير عن مشاعر مختلفة",
    tone: "عادي",
    emotions: { فرحان:10, غاضب:15, زعلان:10, ساخر:20, متحمس:15, متضايق:15, خايف:5, مبسوط:10 },
    sentiment: "neutral", intensity: 2,
  },
  "يا عم بلاش كده": {
    translation: "Come on man, don't be like that",
    explanation: "طلب من شخص يوقف تصرف مزعج بطريقة ودية",
    tone: "عادي",
    emotions: { فرحان:5, غاضب:15, زعلان:10, ساخر:20, متحمس:5, متضايق:35, خايف:0, مبسوط:10 },
    sentiment: "negative", intensity: 2,
  },
  "يا عم ده انت فاهمها بالعكس": {
    translation: "Dude, you've got it completely backwards",
    explanation: "تصحيح لشخص فهم الموضوع عكس ما هو",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:10, زعلان:5, ساخر:50, متحمس:0, متضايق:25, خايف:0, مبسوط:10 },
    sentiment: "negative", intensity: 3,
  },
  "إن شاء الله": {
    translation: "God willing / Hopefully / Maybe (sometimes evasive)",
    explanation: "تعبير عن الأمل أو أحياناً تهرب من الالتزام",
    tone: "عادي",
    emotions: { فرحان:20, غاضب:0, زعلان:5, ساخر:10, متحمس:15, متضايق:5, خايف:15, مبسوط:30 },
    sentiment: "neutral", intensity: 2,
  },
  "ما شاء الله": {
    translation: "Wow / What a blessing / Impressive",
    explanation: "إعجاب وإشادة",
    tone: "تحمس",
    emotions: { فرحان:35, غاضب:0, زعلان:0, ساخر:0, متحمس:30, متضايق:0, خايف:0, مبسوط:35 },
    sentiment: "positive", intensity: 3,
  },
  "يا رب": {
    translation: "Oh God / Please God / Lord help me",
    explanation: "دعاء أو استغاثة أو توسل",
    tone: "عادي",
    emotions: { فرحان:5, غاضب:5, زعلان:15, ساخر:0, متحمس:10, متضايق:20, خايف:30, مبسوط:15 },
    sentiment: "neutral", intensity: 3,
  },
  "أيوه تاني": {
    translation: "Here we go again / Right, sure",
    explanation: "ضجر من تكرار موقف",
    tone: "سخرية",
    emotions: { فرحان:0, غاضب:15, زعلان:15, ساخر:45, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 3,
  },
  "حاجة تجنن": {
    translation: "It's insanely good / Mind-blowing",
    explanation: "إعجاب شديد بحاجة أو موقف مذهل",
    tone: "تحمس",
    emotions: { فرحان:30, غاضب:0, زعلان:0, ساخر:5, متحمس:45, متضايق:0, خايف:0, مبسوط:20 },
    sentiment: "positive", intensity: 5,
  },
  "زي الفل": {
    translation: "Perfect / Smooth as silk / Everything's great",
    explanation: "كل حاجة تمام ومش فيه مشاكل",
    tone: "فرح",
    emotions: { فرحان:40, غاضب:0, زعلان:0, ساخر:0, متحمس:25, متضايق:0, خايف:0, مبسوط:35 },
    sentiment: "positive", intensity: 3,
  },
  "أكل راسي": {
    translation: "He/she drove me crazy / They're so annoying",
    explanation: "شخص مزعج بالكلام أو التصرفات",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:40, زعلان:15, ساخر:20, متحمس:0, متضايق:25, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 4,
  },
  "شيل عيني عنك": {
    translation: "Get out of my sight / Leave me alone",
    explanation: "طلب إنهاء التفاعل مع شخص مزعج",
    tone: "غضب",
    emotions: { فرحان:0, غاضب:55, زعلان:15, ساخر:10, متحمس:0, متضايق:20, خايف:0, مبسوط:0 },
    sentiment: "negative", intensity: 4,
  },
  "والنبي": {
    translation: "I swear / I promise / Please",
    explanation: "قسم أو توسل أو تأكيد",
    tone: "تحمس",
    emotions: { فرحان:10, غاضب:5, زعلان:10, ساخر:0, متحمس:30, متضايق:10, خايف:15, مبسوط:20 },
    sentiment: "neutral", intensity: 3,
  },
  "مش معقول": {
    translation: "Unbelievable! / No way!",
    explanation: "تعبير عن عدم التصديق",
    tone: "تعجب",
    emotions: { فرحان:5, غاضب:15, زعلان:10, ساخر:15, متحمس:20, متضايق:10, خايف:15, مبسوط:10 },
    sentiment: "neutral", intensity: 4,
  },
  "بجد": {
    translation: "Seriously / For real / I mean it",
    explanation: "تأكيد الجدية",
    tone: "عادي",
    emotions: { فرحان:10, غاضب:15, زعلان:10, ساخر:10, متحمس:25, متضايق:10, خايف:10, مبسوط:10 },
    sentiment: "neutral", intensity: 2,
  },
  "صاحي ولا نايم": {
    translation: "Are you awake? / Are you paying attention?",
    explanation: "سؤال عن انتباه شخص",
    tone: "سخرية",
    emotions: { فرحان:5, غاضب:10, زعلان:5, ساخر:50, متحمس:5, متضايق:20, خايف:0, مبسوط:5 },
    sentiment: "negative", intensity: 2,
  },
};

export function lookupPhrase(input: string): PhraseData | null {
  const clean = input.trim();
  if (DICTIONARY[clean]) return DICTIONARY[clean];

  const lower = clean.toLowerCase();
  for (const [key, val] of Object.entries(DICTIONARY)) {
    if (key.toLowerCase() === lower) return val;
  }

  for (const [key, val] of Object.entries(DICTIONARY)) {
    if (clean.includes(key) || key.includes(clean)) return val;
  }

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

export function analyzeEmotionKeywords(text: string): {
  فرحان: number; غاضب: number; زعلان: number; ساخر: number;
  متحمس: number; متضايق: number; خايف: number; مبسوط: number;
  primary: string; sentiment: "positive" | "neutral" | "negative";
  intensity: 1 | 2 | 3 | 4 | 5;
} {
  const base = { فرحان:0, غاضب:0, زعلان:0, ساخر:0, متحمس:0, متضايق:0, خايف:0, مبسوط:0 };
  const rules = [
    { pattern: /غاضب|اتخنقت|كفاية|مستفز/, emotions: { غاضب:60, متضايق:25, زعلان:15 } },
    { pattern: /حزين|زعلان|كسرت|تعبت/,    emotions: { زعلان:55, متضايق:25, خايف:20 } },
    { pattern: /طبعاً|أكيد|واضح|ناصح/,    emotions: { ساخر:65, متضايق:20, غاضب:15 } },
    { pattern: /فرحان|تمام|ممتاز|حلو/,     emotions: { فرحان:50, مبسوط:30, متحمس:20 } },
    { pattern: /حبيبي|وحشتني|أحبك/,        emotions: { مبسوط:55, فرحان:30, متحمس:15 } },
    { pattern: /معقول|إيه ده|مش معقول/,    emotions: { متحمس:35, خايف:25, ساخر:20, مبسوط:20 } },
    { pattern: /خايف|قلقان|متوتر/,          emotions: { خايف:60, زعلان:20, متضايق:20 } },
    { pattern: /متحمس|يالا|نروح/,           emotions: { متحمس:60, فرحان:25, مبسوط:15 } },
  ];

  let matched = false;
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      Object.assign(base, rule.emotions);
      matched = true;
      break;
    }
  }

  if (!matched) { base.مبسوط = 40; base.فرحان = 25; base.متحمس = 20; base.ساخر = 15; }

  const total = Object.values(base).reduce((s, v) => s + v, 0);
  if (total !== 100 && total > 0) {
    const diff = 100 - total;
    const topKey = Object.entries(base).sort(([,a],[,b]) => b - a)[0][0];
    (base as any)[topKey] += diff;
  }

  const sorted = Object.entries(base).sort(([,a],[,b]) => b - a);
  const primary = sorted[0][0];
  const primaryVal = sorted[0][1];

  const sentiment: "positive" | "neutral" | "negative" =
    ["فرحان","مبسوط","متحمس"].includes(primary) ? "positive" :
    ["غاضب","زعلان","متضايق","خايف"].includes(primary) ? "negative" : "neutral";

  const intensity = (primaryVal >= 70 ? 5 : primaryVal >= 55 ? 4 : primaryVal >= 40 ? 3 : primaryVal >= 25 ? 2 : 1) as 1|2|3|4|5;

  return { ...base, primary, sentiment, intensity };
}