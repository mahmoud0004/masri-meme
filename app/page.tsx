"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { detectEmotions } from "@/lib/emotions";
import { extractTextFromFile } from "@/lib/ocr";
import { getEmotionFromDictionary, translateMeme } from "@/lib/translations";
import type { EmotionResult } from "@/lib/emotions";
import type { TranslationResult } from "@/lib/translations";

type Tab = "text" | "voice" | "media";
type UiLanguage = "en" | "ar";

const EMOTION_META: Record<string, { emoji: string; color: string }> = {
  فرحان: { emoji: "😄", color: "#F59E0B" },
  غاضب: { emoji: "😤", color: "#F97316" },
  زعلان: { emoji: "🥲", color: "#60A5FA" },
  ساخر: { emoji: "😏", color: "#FB7185" },
  متحمس: { emoji: "🤩", color: "#14B8A6" },
  متضايق: { emoji: "😒", color: "#A78BFA" },
  خايف: { emoji: "😰", color: "#94A3B8" },
  مبسوط: { emoji: "😊", color: "#22C55E" },
};

const TONE_COLORS: Record<string, string> = {
  سخرية: "#FB7185",
  غضب: "#F97316",
  فرح: "#EAB308",
  حب: "#F43F5E",
  تحمس: "#14B8A6",
  حزن: "#60A5FA",
  تعجب: "#A78BFA",
  عادي: "#94A3B8",
};

const UI_COPY = {
  en: {
    langLabel: "Language",
    langSwitch: "العربية",
    badge: "Studio for Egyptian Meme Intelligence",
    titleLead: "Egyptian Meme",
    titleAccent: "Translator",
    hero:
      "Turn the project into a smarter tool that understands full sentences, listens to voice, extracts text from images or video, and presents translation, tone, and emotion in a polished interface.",
    inputStudio: "Input Studio",
    inputTitle: "Enter your meme any way you like",
    tabText: "Text",
    tabVoice: "Voice",
    tabMedia: "Image / Video",
    writeAnything: "WRITE ANYTHING",
    textPlaceholder:
      'Example: "أنا مخنوق من الشغل النهارده"\nOr: "إيه اللي بيحصل ده؟"\nOr: "يا روح قلبي وحشتني"',
    clear: "Clear",
    analyze: "Analyze Meaning",
    voiceBody: "Speak in Egyptian Arabic and the app will convert the speech into text, then interpret it.",
    micDenied: "Microphone access is blocked. Allow it in the browser first.",
    voiceIdle: "Tap and start speaking",
    voiceRec: "Listening...",
    voiceDone: "Voice captured",
    transcript: "VOICE TRANSCRIPT",
    transcriptPlaceholder: "The heard text will appear here, and you can edit it manually.",
    analyzeVoice: "Analyze Voice Text",
    mediaBody: "Upload a meme image or a short video and the app will extract visible text locally, then interpret it.",
    dropTitle: "Drag a file here or click to browse",
    extracted: "EXTRACTED TEXT",
    processMedia: "Extract Text and Analyze Meaning",
    insights: "Insight Panel",
    insightsTitle: "Smart Result",
    loading: "Preparing translation and analysis...",
    confidence: "Confidence",
    flexible: "Flexible interpretation",
    original: "ORIGINAL",
    interpretation: "INTERPRETATION",
    why: "WHY THIS RESULT",
    matched: "MATCHED EXPRESSIONS",
    intensity: "Emotion intensity",
    sentiment: "Overall sentiment",
    positive: "Positive",
    negative: "Negative",
    neutral: "Neutral",
    ready: "Ready to analyze",
    readyBody:
      "Type a sentence, record voice, or upload an image or video, and the app will show meaning, tone, and emotion analysis.",
    modeLabels: {
      dictionary: "Precise dictionary",
      hybrid: "Smart hybrid",
      inference: "Flexible inference",
    },
    toneLabels: {
      سخرية: "Sarcasm",
      غضب: "Anger",
      فرح: "Joy",
      حب: "Love",
      تحمس: "Excitement",
      حزن: "Sadness",
      تعجب: "Surprise",
      عادي: "Neutral",
    },
    emotionLabels: {
      فرحان: "Happy",
      غاضب: "Angry",
      زعلان: "Upset",
      ساخر: "Sarcastic",
      متحمس: "Excited",
      متضايق: "Annoyed",
      خايف: "Afraid",
      مبسوط: "Glad",
    },
    examples: [
      "متعملش فيها ناصح",
      "أنا تعبان ومش قادر أكمل",
      "هو إيه اللي بيحصل ده؟",
      "يا روح قلبي",
      "حاجة تجنن",
      "أنا مخنوق من الشغل النهارده",
    ],
    errors: {
      emptyInput: "Write a sentence or phrase first.",
      browserVoice: "This browser does not support voice input. Try Chrome or Edge.",
      micBlocked: "Microphone access is blocked. Allow it from your browser settings.",
      micMissing: "No microphone is available on this device.",
      micAccess: "Could not access the microphone: ",
      micRejected: "Microphone use was denied.",
      noSpeech: "No clear speech was detected. Try again.",
      audioCapture: "The microphone is in use by another app or unavailable.",
      voiceIssue: "A speech recognition error occurred.",
      voiceStart: "Failed to start recording: ",
      fileTooLarge: "The file is larger than 30MB.",
      fileType: "Upload an image or video only.",
      noMedia: "Upload an image or video first.",
      unclearText: "I could not read clear text from the file. Try a clearer file.",
      fileFailed: "Failed to analyze the file.",
      analysisFailed: "Something went wrong during analysis.",
    },
  },
  ar: {
    langLabel: "اللغة",
    langSwitch: "English",
    badge: "منصة ذكية لفهم الميمز المصرية",
    titleLead: "مترجم",
    titleAccent: "الميمز المصرية",
    hero:
      "خلّينا نحوّل المشروع إلى أداة أذكى تفهم الجمل، تلتقط الكلام من الصوت، تستخرج النص من الصور أو الفيديو، وتعرض الترجمة والنبرة والمشاعر في واجهة احترافية.",
    inputStudio: "منطقة الإدخال",
    inputTitle: "أدخل الميم بأي طريقة تحبها",
    tabText: "نص",
    tabVoice: "صوت",
    tabMedia: "صورة / فيديو",
    writeAnything: "اكتب أي شيء",
    textPlaceholder:
      'مثال: "أنا مخنوق من الشغل النهارده"\nأو: "إيه اللي بيحصل ده؟"\nأو: "يا روح قلبي وحشتني"',
    clear: "مسح",
    analyze: "حلّل المعنى",
    voiceBody: "اتكلم بالمصري، وسيتم تحويل الكلام إلى نص ثم تفسيره.",
    micDenied: "الميكروفون مقفول. اسمح بالوصول من المتصفح أولًا.",
    voiceIdle: "اضغط وابدأ الكلام",
    voiceRec: "جاري الاستماع...",
    voiceDone: "تم تسجيل الصوت",
    transcript: "النص الصوتي",
    transcriptPlaceholder: "النص الذي تم سماعه سيظهر هنا، ويمكنك تعديله يدويًا.",
    analyzeVoice: "حلّل النص الصوتي",
    mediaBody: "ارفع صورة ميم أو فيديو قصير، وسيتم استخراج النص المرئي محليًا ثم تفسيره.",
    dropTitle: "اسحب الملف هنا أو اضغط للاختيار",
    extracted: "النص المستخرج",
    processMedia: "استخرج النص وحلّل المعنى",
    insights: "لوحة النتائج",
    insightsTitle: "النتيجة الذكية",
    loading: "جاري تجهيز الترجمة والتحليل...",
    confidence: "ثقة",
    flexible: "تفسير مرن",
    original: "الأصل",
    interpretation: "التفسير",
    why: "سبب النتيجة",
    matched: "العبارات المتطابقة",
    intensity: "شدة الإحساس",
    sentiment: "التوجه العام",
    positive: "إيجابي",
    negative: "سلبي",
    neutral: "محايد",
    ready: "جاهز للتحليل",
    readyBody:
      "اكتب جملة، سجّل صوتًا، أو ارفع صورة أو فيديو، وسيعرض التطبيق المعنى والنبرة وتحليل المشاعر.",
    modeLabels: {
      dictionary: "قاموس دقيق",
      hybrid: "هجين ذكي",
      inference: "استنتاج مرن",
    },
    toneLabels: {
      سخرية: "سخرية",
      غضب: "غضب",
      فرح: "فرح",
      حب: "حب",
      تحمس: "تحمس",
      حزن: "حزن",
      تعجب: "تعجب",
      عادي: "عادي",
    },
    emotionLabels: {
      فرحان: "فرحان",
      غاضب: "غاضب",
      زعلان: "زعلان",
      ساخر: "ساخر",
      متحمس: "متحمس",
      متضايق: "متضايق",
      خايف: "خايف",
      مبسوط: "مبسوط",
    },
    examples: [
      "متعملش فيها ناصح",
      "أنا تعبان ومش قادر أكمل",
      "هو إيه اللي بيحصل ده؟",
      "يا روح قلبي",
      "حاجة تجنن",
      "أنا مخنوق من الشغل النهارده",
    ],
    errors: {
      emptyInput: "اكتب جملة أو phrase الأول.",
      browserVoice: "المتصفح الحالي لا يدعم الإدخال الصوتي. جرّب Chrome أو Edge.",
      micBlocked: "الميكروفون مقفول. اسمح بالوصول من إعدادات المتصفح.",
      micMissing: "مفيش ميكروفون متاح على الجهاز.",
      micAccess: "تعذر الوصول للميكروفون: ",
      micRejected: "تم رفض استخدام الميكروفون.",
      noSpeech: "مافيش صوت واضح. جرّب مرة تانية.",
      audioCapture: "الميكروفون مستخدم من تطبيق تاني أو غير متاح.",
      voiceIssue: "حصلت مشكلة أثناء التعرف الصوتي.",
      voiceStart: "فشل تشغيل التسجيل: ",
      fileTooLarge: "الملف أكبر من 30MB.",
      fileType: "ارفع صورة أو فيديو فقط.",
      noMedia: "ارفع صورة أو فيديو الأول.",
      unclearText: "لم أتمكن من قراءة نص واضح من الملف. جرّب ملفًا أوضح.",
      fileFailed: "فشل تحليل الملف.",
      analysisFailed: "حصل خطأ أثناء التحليل.",
    },
  },
} as const;

function Spinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-[#14B8A6]" />;
}

function WaveViz({ active }: { active: boolean }) {
  return (
    <div className="my-4 flex h-12 items-center justify-center gap-1">
      {Array.from({ length: 18 }).map((_, index) => (
        <div
          key={index}
          className="w-1 rounded-full transition-all duration-200"
          style={{
            height: active ? `${14 + ((index * 11 + 7) % 28)}px` : "4px",
            background: active ? "#14B8A6" : "rgba(255,255,255,.16)",
            animation: active ? `waveBar .8s ease-in-out ${index * 0.04}s infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
}

function EmotionBar({
  label,
  value,
  color,
  emoji,
}: {
  label: string;
  value: number;
  color: string;
  emoji: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="w-7 text-center text-lg">{emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="truncate text-xs font-semibold text-white/65">{label}</span>
          <span className="text-xs font-black tabular-nums" style={{ color }}>
            {value}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [uiLang, setUiLang] = useState<UiLanguage>("en");
  const [tab, setTab] = useState<Tab>("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [txt, setTxt] = useState("");

  const [vState, setVState] = useState<"idle" | "rec" | "done">("idle");
  const [vText, setVText] = useState("");
  const [micPerm, setMicPerm] = useState<"unknown" | "granted" | "denied">("unknown");
  const recRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mFile, setMFile] = useState<File | null>(null);
  const [mUrl, setMUrl] = useState<string | null>(null);
  const [mExtracted, setMExtracted] = useState("");
  const [drag, setDrag] = useState(false);

  const [trans, setTrans] = useState<TranslationResult | null>(null);
  const [emo, setEmo] = useState<EmotionResult | null>(null);

  const copy = UI_COPY[uiLang];
  const dir = uiLang === "ar" ? "rtl" : "ltr";
  const textAlignClass = uiLang === "ar" ? "text-right" : "text-left";

  useEffect(() => {
    const savedLang = window.localStorage.getItem("ui-language");
    if (savedLang === "en" || savedLang === "ar") {
      setUiLang(savedLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = uiLang;
    document.documentElement.dir = dir;
    window.localStorage.setItem("ui-language", uiLang);
  }, [dir, uiLang]);

  useEffect(() => {
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((status) => {
        const syncState = () =>
          setMicPerm(
            status.state === "granted" ? "granted" : status.state === "denied" ? "denied" : "unknown",
          );

        syncState();
        status.onchange = syncState;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (mUrl) URL.revokeObjectURL(mUrl);
    };
  }, [mUrl]);

  function toggleLanguage() {
    setUiLang((current) => (current === "en" ? "ar" : "en"));
  }

  function runAnalysis(input: string) {
    if (!input.trim()) {
      setError(copy.errors.emptyInput);
      return;
    }

    setLoading(true);
    setError(null);
    setTrans(null);
    setEmo(null);

    window.setTimeout(() => {
      try {
        const nextTranslation = translateMeme(input);
        const nextEmotion = nextTranslation.found ? getEmotionFromDictionary(input) : detectEmotions(input);
        setTrans(nextTranslation);
        setEmo(nextEmotion);
      } catch (err: any) {
        setError(err?.message ?? copy.errors.analysisFailed);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  async function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError(copy.errors.browserVoice);
      return;
    }

    setError(null);
    setTrans(null);
    setEmo(null);
    setVText("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicPerm("granted");
    } catch (err: any) {
      setMicPerm("denied");
      setError(
        err?.name === "NotAllowedError"
          ? copy.errors.micBlocked
          : err?.name === "NotFoundError"
            ? copy.errors.micMissing
            : `${copy.errors.micAccess}${err?.message ?? ""}`,
      );
      return;
    }

    const rec = new SR();
    recRef.current = rec;
    rec.lang = "ar-EG";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    setVState("rec");

    rec.onresult = (event: any) => {
      let heard = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        heard += event.results[index][0].transcript;
      }
      if (heard.trim()) setVText(heard);
    };

    rec.onerror = (event: any) => {
      const messages: Record<string, string> = {
        "not-allowed": copy.errors.micRejected,
        "no-speech": copy.errors.noSpeech,
        "audio-capture": copy.errors.audioCapture,
        network: copy.errors.voiceIssue,
      };

      setError(messages[event.error] ?? `${copy.errors.voiceIssue}: ${event.error}`);
      setVState("idle");
      stopStream();
    };

    rec.onend = () => {
      setVState("done");
      stopStream();
    };

    try {
      rec.start();
    } catch (err: any) {
      setError(`${copy.errors.voiceStart}${err?.message ?? ""}`);
      setVState("idle");
      stopStream();
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopVoice() {
    recRef.current?.stop();
    stopStream();
    setVState("done");
  }

  function loadFile(file: File | null) {
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      setError(copy.errors.fileTooLarge);
      return;
    }

    const topLevelType = file.type.split("/")[0];
    if (!["image", "video"].includes(topLevelType)) {
      setError(copy.errors.fileType);
      return;
    }

    setError(null);
    setTrans(null);
    setEmo(null);
    setMExtracted("");
    setMFile(file);
    setMUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  async function processMedia() {
    if (!mFile) {
      setError(copy.errors.noMedia);
      return;
    }

    setLoading(true);
    setError(null);
    setTrans(null);
    setEmo(null);
    setMExtracted("");

    try {
      const extracted = await extractTextFromFile(mFile);
      if (!extracted.trim()) {
        throw new Error(copy.errors.unclearText);
      }

      setMExtracted(extracted);
      const nextTranslation = translateMeme(extracted);
      const nextEmotion = nextTranslation.found ? getEmotionFromDictionary(extracted) : detectEmotions(extracted);
      setTrans(nextTranslation);
      setEmo(nextEmotion);
    } catch (err: any) {
      setError(err?.message ?? copy.errors.fileFailed);
    } finally {
      setLoading(false);
    }
  }

  const primaryEmotion = emo ? EMOTION_META[emo.primary] ?? { emoji: "🎭", color: "#94A3B8" } : null;
  const toneColor = trans ? TONE_COLORS[trans.tone] ?? "#94A3B8" : "#94A3B8";
  const modeMeta = trans
    ? { label: copy.modeLabels[trans.mode], color: trans.mode === "dictionary" ? "#14B8A6" : trans.mode === "hybrid" ? "#F59E0B" : "#A78BFA" }
    : null;
  const mediaKind = mFile?.type.startsWith("video/") ? "video" : "image";

  const tabClassName = (id: Tab) =>
    `rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
      tab === id
        ? "bg-[#0F766E] text-white shadow-[0_12px_30px_rgba(20,184,166,0.35)]"
        : "border border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111A] text-white" dir={dir}>
      <style>{`
        @keyframes waveBar { from { transform: scaleY(.35); } to { transform: scaleY(1); } }
        @keyframes glowFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,.18),_transparent_32%),radial-gradient(circle_at_85%_15%,_rgba(244,63,94,.16),_transparent_26%),radial-gradient(circle_at_50%_100%,_rgba(96,165,250,.14),_transparent_30%),linear-gradient(180deg,#07111A_0%,#0B1220_100%)]" />
        <div className="absolute left-[6%] top-24 h-48 w-48 rounded-full bg-[#14B8A6]/10 blur-3xl [animation:glowFloat_8s_ease-in-out_infinite]" />
        <div className="absolute right-[8%] top-40 h-56 w-56 rounded-full bg-[#F43F5E]/10 blur-3xl [animation:glowFloat_10s_ease-in-out_infinite]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-4 py-1.5 text-xs font-bold text-[#99F6E4]">
              <span className="h-2 w-2 rounded-full bg-[#5EEAD4]" />
              {copy.badge}
            </div>

            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              <span className="text-white/55">{copy.langLabel}</span>
              <span>{copy.langSwitch}</span>
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-1 lg:items-center">
            <div className={textAlignClass}>
              <h1 className="max-w-3xl text-[clamp(2.4rem,7vw,5rem)] font-black leading-[0.95] tracking-tight">
                {copy.titleLead}
                <span className="block bg-[linear-gradient(135deg,#67E8F9_0%,#14B8A6_45%,#F9A8D4_100%)] bg-clip-text text-transparent">
                  {copy.titleAccent}
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">{copy.hero}</p>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:p-6"
          >
            <div className={`mb-5 flex flex-wrap items-center justify-between gap-3 ${textAlignClass}`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/35">{copy.inputStudio}</p>
                <h2 className="mt-1 text-2xl font-black">{copy.inputTitle}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={tabClassName("text")} onClick={() => setTab("text")}>{copy.tabText}</button>
                <button className={tabClassName("voice")} onClick={() => setTab("voice")}>{copy.tabVoice}</button>
                <button className={tabClassName("media")} onClick={() => setTab("media")}>{copy.tabMedia}</button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {tab === "text" && (
                <motion.div key="text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className={`rounded-[24px] border border-white/10 bg-[#09131D] p-4 ${textAlignClass}`}>
                    <p className="mb-3 text-xs font-bold tracking-[0.24em] text-white/35">{copy.writeAnything}</p>
                    <textarea
                      dir="rtl"
                      value={txt}
                      onChange={(event) => setTxt(event.target.value)}
                      onKeyDown={(event) => {
                        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") runAnalysis(txt);
                      }}
                      placeholder={copy.textPlaceholder}
                      rows={6}
                      className="w-full resize-none rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-base leading-8 text-white placeholder:text-white/20 focus:border-[#14B8A6]/60 focus:outline-none"
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                      {copy.examples.map((example) => (
                        <button
                          key={example}
                          onClick={() => setTxt(example)}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/60 transition hover:border-[#14B8A6]/45 hover:text-white"
                        >
                          {example}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => setTxt("")}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/10"
                      >
                        {copy.clear}
                      </button>
                      <button
                        onClick={() => runAnalysis(txt)}
                        disabled={loading}
                        className="rounded-full bg-[linear-gradient(135deg,#14B8A6_0%,#0F766E_100%)] px-5 py-2.5 text-sm font-black text-white shadow-[0_16px_30px_rgba(20,184,166,0.25)] transition hover:scale-[1.01] disabled:opacity-50"
                      >
                        {loading ? copy.loading : copy.analyze}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === "voice" && (
                <motion.div key="voice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className={`rounded-[24px] border border-white/10 bg-[#09131D] p-5 text-center ${textAlignClass}`}>
                    <p className="text-sm leading-7 text-white/65">{copy.voiceBody}</p>
                    {micPerm === "denied" && (
                      <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                        {copy.micDenied}
                      </div>
                    )}

                    <WaveViz active={vState === "rec"} />

                    <p className={`mb-4 text-sm font-bold ${vState === "rec" ? "text-[#5EEAD4]" : "text-white/45"}`}>
                      {vState === "idle" && copy.voiceIdle}
                      {vState === "rec" && copy.voiceRec}
                      {vState === "done" && copy.voiceDone}
                    </p>

                    <button
                      onClick={vState === "rec" ? stopVoice : startVoice}
                      disabled={loading || micPerm === "denied"}
                      className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl shadow-lg transition ${
                        vState === "rec"
                          ? "bg-[#F43F5E] text-white shadow-[0_18px_40px_rgba(244,63,94,0.35)]"
                          : "bg-[linear-gradient(135deg,#14B8A6_0%,#0F766E_100%)] text-white shadow-[0_18px_40px_rgba(20,184,166,0.35)]"
                      } disabled:opacity-40`}
                    >
                      {vState === "rec" ? "⏹" : "🎙️"}
                    </button>

                    <div className={`mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 ${textAlignClass}`}>
                      <p className="mb-2 text-xs font-bold tracking-[0.2em] text-white/35">{copy.transcript}</p>
                      <textarea
                        dir="rtl"
                        value={vText}
                        onChange={(event) => setVText(event.target.value)}
                        rows={4}
                        placeholder={copy.transcriptPlaceholder}
                        className="w-full resize-none bg-transparent text-base leading-8 text-white placeholder:text-white/20 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => runAnalysis(vText)}
                      disabled={loading || !vText.trim()}
                      className="mt-5 w-full rounded-full bg-[linear-gradient(135deg,#14B8A6_0%,#0F766E_100%)] px-5 py-3 text-sm font-black text-white shadow-[0_16px_30px_rgba(20,184,166,0.25)] transition disabled:opacity-50"
                    >
                      {loading ? copy.loading : copy.analyzeVoice}
                    </button>
                  </div>
                </motion.div>
              )}

              {tab === "media" && (
                <motion.div key="media" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className={`rounded-[24px] border border-white/10 bg-[#09131D] p-4 ${textAlignClass}`}>
                    <p className="mb-4 text-sm leading-7 text-white/65">{copy.mediaBody}</p>

                    <div
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDrag(true);
                      }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDrag(false);
                        loadFile(event.dataTransfer.files[0] ?? null);
                      }}
                      className={`relative rounded-[24px] border border-dashed p-6 text-center transition ${
                        drag ? "border-[#14B8A6] bg-[#14B8A6]/10" : "border-white/15 bg-white/[0.03]"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        onChange={(event) => loadFile(event.target.files?.[0] ?? null)}
                      />

                      {mUrl ? (
                        <div className="space-y-3">
                          {mediaKind === "image" ? (
                            <img src={mUrl} alt="preview" className="mx-auto max-h-60 rounded-2xl object-contain" />
                          ) : (
                            <video src={mUrl} controls className="mx-auto max-h-60 rounded-2xl object-contain" />
                          )}
                          <p className="text-sm text-white/65">{mFile?.name}</p>
                        </div>
                      ) : (
                        <>
                          <p className="mb-2 text-4xl">🎞️</p>
                          <p className="text-base font-bold text-white">{copy.dropTitle}</p>
                          <p className="mt-2 text-sm text-white/45">JPG / PNG / WEBP / GIF / MP4 / MOV</p>
                        </>
                      )}
                    </div>

                    {mExtracted && (
                      <div className={`mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 ${textAlignClass}`}>
                        <p className="mb-2 text-xs font-bold tracking-[0.2em] text-white/35">{copy.extracted}</p>
                        <p className="text-sm leading-8 text-white/75">{mExtracted}</p>
                      </div>
                    )}

                    <button
                      onClick={processMedia}
                      disabled={loading || !mFile}
                      className="mt-5 w-full rounded-full bg-[linear-gradient(135deg,#14B8A6_0%,#0F766E_100%)] px-5 py-3 text-sm font-black text-white shadow-[0_16px_30px_rgba(20,184,166,0.25)] transition disabled:opacity-50"
                    >
                      {loading ? copy.loading : copy.processMedia}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:p-6"
          >
            <div className={`mb-5 flex items-center justify-between gap-3 ${textAlignClass}`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/35">{copy.insights}</p>
                <h2 className="mt-1 text-2xl font-black">{copy.insightsTitle}</h2>
              </div>
              {trans && modeMeta && (
                <span
                  className="rounded-full border px-3 py-1 text-xs font-black"
                  style={{
                    color: modeMeta.color,
                    borderColor: `${modeMeta.color}55`,
                    background: `${modeMeta.color}15`,
                  }}
                >
                  {modeMeta.label}
                </span>
              )}
            </div>

            {loading ? (
              <div className="rounded-[24px] border border-white/10 bg-[#09131D] p-5">
                <div className="mb-5 flex items-center gap-3 text-white/70">
                  <Spinner />
                  <p className="text-sm">{copy.loading}</p>
                </div>
                <div className="space-y-3">
                  {["w-4/5", "w-full", "w-3/5"].map((width) => (
                    <div key={width} className={`h-3 ${width} animate-pulse rounded-full bg-white/8`} />
                  ))}
                </div>
              </div>
            ) : trans ? (
              <div className="space-y-4">
                <div className={`rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,22,34,.95),rgba(7,17,26,.95))] p-5 ${textAlignClass}`}>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full border px-3 py-1 text-xs font-black"
                      style={{
                        color: toneColor,
                        borderColor: `${toneColor}44`,
                        background: `${toneColor}18`,
                      }}
                    >
                      {copy.toneLabels[trans.tone as keyof typeof copy.toneLabels] ?? trans.tone}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/60">
                      {copy.confidence} {Math.round(trans.confidence * 100)}%
                    </span>
                    {!trans.found && (
                      <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">
                        {copy.flexible}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                      <p className="mb-2 text-xs font-bold tracking-[0.2em] text-white/35">{copy.original}</p>
                      <p className="text-sm leading-8 text-white/75">{trans.original}</p>
                    </div>

                    <div className="rounded-[20px] border p-4" style={{ borderColor: `${toneColor}33`, background: `${toneColor}12` }}>
                      <p className="mb-2 text-xs font-bold tracking-[0.2em]" style={{ color: toneColor }}>
                        {copy.interpretation}
                      </p>
                      <p className="text-base font-bold leading-8 text-white">{trans.translation}</p>
                    </div>

                    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                      <p className="mb-2 text-xs font-bold tracking-[0.2em] text-white/35">{copy.why}</p>
                      <p className="text-sm leading-8 text-white/70">{trans.explanation}</p>
                    </div>
                  </div>
                </div>

                {trans.matchedPhrases.length > 0 && (
                  <div className={`rounded-[24px] border border-white/10 bg-[#09131D] p-4 ${textAlignClass}`}>
                    <p className="mb-3 text-xs font-bold tracking-[0.2em] text-white/35">{copy.matched}</p>
                    <div className="flex flex-wrap gap-2">
                      {trans.matchedPhrases.map((phrase) => (
                        <span key={phrase} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">
                          {phrase}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {emo && primaryEmotion && (
                  <div className={`rounded-[24px] border border-white/10 bg-[#09131D] p-5 ${textAlignClass}`}>
                    <div
                      className="mb-5 rounded-[22px] border p-5 text-center"
                      style={{
                        borderColor: `${primaryEmotion.color}33`,
                        background: `${primaryEmotion.color}12`,
                      }}
                    >
                      <p className="mb-2 text-5xl">{primaryEmotion.emoji}</p>
                      <p className="text-2xl font-black" style={{ color: primaryEmotion.color }}>
                        {copy.emotionLabels[emo.primary as keyof typeof copy.emotionLabels] ?? emo.primary}
                      </p>
                      {emo.secondary && (
                        <p className="mt-1 text-sm text-white/45">
                          + {copy.emotionLabels[emo.secondary as keyof typeof copy.emotionLabels] ?? emo.secondary}
                        </p>
                      )}
                      <p className="mt-3 text-xs font-bold text-white/45">
                        {copy.intensity}: {emo.intensity}/5
                      </p>
                    </div>

                    {Object.entries(emo.percentages)
                      .sort(([, a], [, b]) => b - a)
                      .filter(([, value]) => value > 0)
                      .map(([label, value]) => (
                        <EmotionBar
                          key={label}
                          label={copy.emotionLabels[label as keyof typeof copy.emotionLabels] ?? label}
                          value={value}
                          color={EMOTION_META[label]?.color ?? "#94A3B8"}
                          emoji={EMOTION_META[label]?.emoji ?? "🎭"}
                        />
                      ))}

                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <span className="text-sm text-white/55">{copy.sentiment}</span>
                      <span className="text-sm font-black text-white">
                        {emo.sentiment === "positive" ? copy.positive : emo.sentiment === "negative" ? copy.negative : copy.neutral}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-white/10 bg-[#09131D] p-8 text-center">
                <div>
                  <p className="mb-3 text-5xl">🧠</p>
                  <h3 className="text-xl font-black">{copy.ready}</h3>
                  <p className="mt-3 max-w-md text-sm leading-7 text-white/55">{copy.readyBody}</p>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      </div>
    </main>
  );
}
