"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { detectEmotions } from "@/lib/emotions";
import { extractTextFromFile } from "@/lib/ocr";
import { buildLiteralGloss, getEmotionFromDictionary, translateMeme } from "@/lib/translations";
import type { EmotionResult } from "@/lib/emotions";
import type { TranslationMode, TranslationResult } from "@/lib/translations";

type PageView = "translate" | "dictionary" | "history";
type InputMode = "text" | "voice" | "media";
type ThemeMode = "light" | "dark";

type CustomEntry = {
  id: string;
  slang: string;
  meaning: string;
  context: string;
  formality: string;
  offensiveness: string;
  createdAt: string;
};

type HistoryEntry = {
  id: string;
  input: string;
  translation: string;
  tone: string;
  source: InputMode;
  mode: TranslationMode;
  createdAt: string;
};

type SpeechRecognitionResultLike = {
  transcript: string;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const STORAGE_KEYS = {
  theme: "slangy-theme",
  dictionary: "slangy-custom-dictionary",
  history: "slangy-history",
} as const;

const FORMALITY_OPTIONS = [
  "1 - Very Casual",
  "2 - Neutral",
  "3 - Common Street Use",
  "4 - Formal-ish",
  "5 - Very Formal",
];

const OFFENSIVENESS_OPTIONS = [
  "1 - Clean",
  "2 - Not Offensive",
  "3 - Slightly Harsh",
  "4 - Offensive",
  "5 - Very Offensive",
];

const EXAMPLES = [
  "يا اسطى الدنيا ماشية ازاي؟",
  "انا مخنوق من الشغل النهارده",
  "متعملش فيها ناصح",
  "دي حاجة تجنن",
  "هو ايه اللي بيحصل ده؟",
];

const EMOTION_META: Record<string, { emoji: string; color: string }> = {
  فرحان: { emoji: "Happy", color: "#f59e0b" },
  غاضب: { emoji: "Angry", color: "#f97316" },
  زعلان: { emoji: "Upset", color: "#60a5fa" },
  ساخر: { emoji: "Sarcastic", color: "#fb7185" },
  متحمس: { emoji: "Excited", color: "#14b8a6" },
  متضايق: { emoji: "Annoyed", color: "#a78bfa" },
  خايف: { emoji: "Afraid", color: "#94a3b8" },
  مبسوط: { emoji: "Glad", color: "#22c55e" },
};

const TONE_LABELS: Record<string, string> = {
  سخرية: "Sarcasm",
  غضب: "Anger",
  فرح: "Joy",
  حب: "Love",
  تحمس: "Excitement",
  حزن: "Sadness",
  تعجب: "Surprise",
  عادي: "Neutral",
};

const TONE_COLORS: Record<string, string> = {
  سخرية: "#fb7185",
  غضب: "#f97316",
  فرح: "#eab308",
  حب: "#f43f5e",
  تحمس: "#14b8a6",
  حزن: "#60a5fa",
  تعجب: "#a78bfa",
  عادي: "#94a3b8",
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ً-ْ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function detectSource(file: File | null): "image" | "video" | null {
  if (!file) return null;
  const root = file.type.split("/")[0];
  return root === "image" || root === "video" ? root : null;
}

function parseBulkEntries(raw: string, extension: string): Omit<CustomEntry, "id" | "createdAt">[] {
  if (extension === "json") {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("JSON import expects an array of entries.");
    }

    return parsed
      .map((item) => ({
        slang: String(item.slang ?? item.term ?? "").trim(),
        meaning: String(item.meaning ?? item.translation ?? "").trim(),
        context: String(item.context ?? item.usage ?? "").trim(),
        formality: String(item.formality ?? "2 - Neutral").trim(),
        offensiveness: String(item.offensiveness ?? "2 - Not Offensive").trim(),
      }))
      .filter((item) => item.slang && item.meaning);
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const rows = lines.map((line) => line.split(",").map((cell) => cell.trim()));
  const hasHeader = rows[0][0]?.toLowerCase().includes("slang");
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((row) => ({
      slang: row[0] ?? "",
      meaning: row[1] ?? "",
      context: row[2] ?? "",
      formality: row[3] ?? "2 - Neutral",
      offensiveness: row[4] ?? "2 - Not Offensive",
    }))
    .filter((item) => item.slang && item.meaning);
}

function LogoMark() {
  return (
    <div className="relative h-12 w-16">
      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#fff7ed] text-[1.9rem] font-black leading-none text-[#ff8a1d] shadow-[0_8px_20px_rgba(255,138,29,0.16)]">
        A
        <div className="absolute -bottom-1.5 left-3 h-3 w-3 rotate-45 rounded-[2px] bg-[#fff7ed]" />
      </div>
      <div className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#ff8a1d] text-[1.5rem] font-black leading-none text-white shadow-[0_10px_22px_rgba(255,138,29,0.24)]">
        文
        <div className="absolute -bottom-1.5 right-3 h-3 w-3 rotate-45 rounded-[2px] bg-[#ff8a1d]" />
      </div>
    </div>
  );
}

function IconWrap({
  children,
  active,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center ${
        active ? "text-[#171717]" : "text-current"
      }`}
    >
      {children}
    </span>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.72-.34-3.88-.94L3 21l1.99-5.17A8.47 8.47 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3h.5A8.5 8.5 0 0 1 21 11.5Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 6.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3c0 5 4 9 9 9 .27 0 .53-.01.79-.21Z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="5" width="13" height="14" rx="2" />
      <path d="m16 10 5-3v10l-5-3z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 16.5v2A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-14 w-14">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[#fff1e3] text-[#ff8a1d]">
          {icon}
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#ff8a1d] sm:text-4xl">{title}</h2>
          <p className="mt-1 text-lg text-[#8d6b4c]">{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  );
}

function StatCard({ total, recent }: { total: number; recent: number }) {
  return (
    <div className="flex min-w-[220px] items-center justify-between rounded-[20px] border border-[#e8dacb] bg-white px-8 py-5 shadow-[0_10px_25px_rgba(84,48,14,0.08)]">
      <div className="flex-1 text-center">
        <div className="text-5xl font-black leading-none text-[#ff9a1f]">{total}</div>
        <div className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-[#7d634d]">Total</div>
      </div>
      <div className="mx-6 h-14 w-px bg-[#eadbcf]" />
      <div className="flex-1 text-center">
        <div className="text-5xl font-black leading-none text-[#f6c019]">{recent}</div>
        <div className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-[#7d634d]">Recent</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-lg font-semibold text-[#21160f]">{label}</span>
      {children}
    </label>
  );
}

function InputShell({
  value,
  onChange,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  if (rows) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        dir="rtl"
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#e6d8ca] bg-white px-5 py-4 text-lg text-[#4d3724] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] outline-none transition focus:border-[#ffb86a] focus:ring-4 focus:ring-[#ffedd6]"
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      dir="rtl"
      placeholder={placeholder}
      className="w-full rounded-2xl border border-[#e6d8ca] bg-white px-5 py-4 text-lg text-[#4d3724] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] outline-none transition focus:border-[#ffb86a] focus:ring-4 focus:ring-[#ffedd6]"
    />
  );
}

function buildCulturalContext(result: TranslationResult) {
  const original = result.original.trim();

  if (result.translation === "Don't overthink it / Don't stress yourself about it") {
    return `In Egyptian Arabic, "${original}" is a common everyday phrase said to calm someone down or tell them not to worry too much. It can sound supportive like "relax, it's not worth the stress," or slightly dismissive depending on tone, more like "leave it, don't bother." It is usually used in casual situations with friends, family, or coworkers.`;
  }

  if (result.found) {
    return `In Egyptian Arabic, "${original}" is used as a natural social expression, not just a direct sentence. The important part is the attitude, relationship, and tone behind it, which is why the app gives the intended meaning instead of only translating the words.`;
  }

  return `This phrase is being interpreted as Egyptian everyday speech rather than formal Arabic. The wording suggests a social, emotional, or culture-specific meaning, so the app focuses on what the speaker is trying to convey in context.`;
}

function buildEnglishEquivalent(result: TranslationResult) {
  if (result.translation === "Don't overthink it / Don't stress yourself about it") {
    return {
      phrase: "Don't sweat it",
      note: "Both are used to tell someone to relax and stop worrying or overthinking something that is not worth the stress.",
    };
  }

  if (result.tone === "Ø³Ø®Ø±ÙŠØ©") {
    return {
      phrase: "Yeah, right",
      note: "This carries a sarcastic social meaning more than a literal one.",
    };
  }

  if (result.tone === "Ø­Ø¨") {
    return {
      phrase: "You mean a lot to me",
      note: "This captures the emotional warmth better than a direct translation.",
    };
  }

  if (result.tone === "ØºØ¶Ø¨") {
    return {
      phrase: "I've had enough",
      note: "This reflects the frustration or fed-up tone behind the phrase.",
    };
  }

  return {
    phrase: result.translation,
    note: "This is the closest natural English equivalent based on meaning and tone.",
  };
}

function buildToneBreakdown(result: TranslationResult, emotion: EmotionResult) {
  if (result.translation === "Don't overthink it / Don't stress yourself about it") {
    return [
      { label: "Reassurance", value: 45, color: "#ff9a3c" },
      { label: "Calm", value: 30, color: "#ffb35f" },
      { label: "Casual support", value: 25, color: "#ffc980" },
    ];
  }

  function mapEmotionLabel(label: string) {
    if (label === "فرحان") return "Joy";
    if (label === "غاضب") return "Anger";
    if (label === "زعلان") return "Sadness";
    if (label === "ساخر") return "Sarcasm";
    if (label === "متحمس") return "Excitement";
    if (label === "متضايق") return "Annoyance";
    if (label === "خايف") return "Worry";
    if (label === "مبسوط") return "Comfort";
    return label;
  }

  return Object.entries(emotion.percentages)
    .sort(([, a], [, b]) => b - a)
    .filter(([, value]) => value > 0)
    .slice(0, 3)
    .map(([label, value]) => ({
      label: mapEmotionLabel(label),
      value,
      color: EMOTION_META[label]?.color ?? "#ff9a3c",
    }));
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [view, setView] = useState<PageView>("translate");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [literalMode, setLiteralMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [textInput, setTextInput] = useState("");
  const [voiceInput, setVoiceInput] = useState("");
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "done">("idle");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaExtracted, setMediaExtracted] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const mediaKind = detectSource(mediaFile);

  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [emotion, setEmotion] = useState<EmotionResult | null>(null);
  const [analyzedSource, setAnalyzedSource] = useState<InputMode>("text");

  const [customEntries, setCustomEntries] = useState<CustomEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [dictTerm, setDictTerm] = useState("");
  const [dictMeaning, setDictMeaning] = useState("");
  const [dictContext, setDictContext] = useState("");
  const [dictFormality, setDictFormality] = useState(FORMALITY_OPTIONS[1]);
  const [dictOffensiveness, setDictOffensiveness] = useState(OFFENSIVENESS_OPTIONS[1]);

  const importRef = useRef<HTMLInputElement | null>(null);

  const recentDictionaryAdds = customEntries.filter((entry) => {
    return Date.now() - new Date(entry.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const primaryEmotion = emotion ? EMOTION_META[emotion.primary] : null;
  const toneColor = translation ? TONE_COLORS[translation.tone] ?? "#94a3b8" : "#94a3b8";
  const literalGloss = translation ? buildLiteralGloss(translation.original) : "";
  const culturalContext = translation ? buildCulturalContext(translation) : "";
  const englishEquivalent = translation ? buildEnglishEquivalent(translation) : null;
  const toneBreakdown = translation && emotion ? buildToneBreakdown(translation, emotion) : [];
  const transcriptMeta =
    analyzedSource === "voice"
      ? {
          label: "Voice Transcription",
          note: "What the app heard and transcribed from spoken Egyptian Arabic.",
        }
      : analyzedSource === "media"
        ? {
            label: "Media Transcription",
            note: "What the app extracted from the uploaded image or video before interpretation.",
          }
        : {
            label: "Text Transcription",
            note: "The exact phrase the app analyzed from your typed Egyptian Arabic input.",
          };

  useEffect(() => {
    setMounted(true);

    try {
      const storedTheme = window.localStorage.getItem(STORAGE_KEYS.theme);
      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
      }

      const storedEntries = window.localStorage.getItem(STORAGE_KEYS.dictionary);
      if (storedEntries) {
        setCustomEntries(JSON.parse(storedEntries));
      }

      const storedHistory = window.localStorage.getItem(STORAGE_KEYS.history);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [mounted, theme]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEYS.dictionary, JSON.stringify(customEntries));
  }, [mounted, customEntries]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [mounted, history]);

  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  function resolveCustomEntry(input: string) {
    const normalizedInput = normalizeText(input);

    return [...customEntries]
      .sort((a, b) => b.slang.length - a.slang.length)
      .find((entry) => {
        const normalizedTerm = normalizeText(entry.slang);
        return normalizedTerm && normalizedInput.includes(normalizedTerm);
      });
  }

  function rememberHistory(result: TranslationResult, source: InputMode) {
    setHistory((current) => [
      {
        id: uid("hist"),
        input: result.original,
        translation: result.translation,
        tone: result.tone,
        source,
        mode: result.mode,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 20));
  }

  function analyzeText(input: string, source: InputMode) {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Enter an Egyptian phrase first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const custom = resolveCustomEntry(trimmed);
      let nextTranslation: TranslationResult;

      if (custom) {
        nextTranslation = {
          original: trimmed,
          translation: custom.meaning,
          explanation: custom.context || "This meaning comes from your custom dictionary.",
          tone: "عادي",
          found: true,
          confidence: 0.99,
          mode: "dictionary",
          matchedPhrases: [custom.slang],
        };
      } else {
        nextTranslation = translateMeme(trimmed);
      }

      const nextEmotion = nextTranslation.found ? getEmotionFromDictionary(trimmed) : detectEmotions(trimmed);

      setTranslation(nextTranslation);
      setEmotion(nextEmotion);
      setAnalyzedSource(source);
      rememberHistory(nextTranslation, source);
    } catch {
      setError("Something went wrong during analysis.");
    } finally {
      setLoading(false);
    }
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setVoiceState("done");
  }

  function startVoice() {
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setError("This browser does not support voice input. Try Chrome or Edge.");
      return;
    }

    setError(null);
    const recognition = new RecognitionCtor();
    recognition.lang = "ar-EG";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let transcript = "";
      for (const result of Array.from(event.results)) {
        transcript += result[0]?.transcript ?? "";
      }
      setVoiceInput(transcript.trim());
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("Microphone access was blocked.");
      } else if (event.error === "no-speech") {
        setError("No clear speech was detected. Try again.");
      } else {
        setError("A speech recognition error occurred.");
      }
      setVoiceState("idle");
    };

    recognition.onend = () => {
      setVoiceState((current) => (current === "recording" ? "done" : current));
    };

    recognitionRef.current = recognition;
    setVoiceInput("");
    setVoiceState("recording");
    recognition.start();
  }

  function loadMedia(file: File | null) {
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      setError("The file is larger than 30MB.");
      return;
    }

    const kind = detectSource(file);
    if (!kind) {
      setError("Upload an image or video only.");
      return;
    }

    setError(null);
    setMediaFile(file);
    setMediaExtracted("");

    setMediaUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  async function processMedia() {
    if (!mediaFile) {
      setError("Upload an image or video first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const extracted = await extractTextFromFile(mediaFile);
      if (!extracted.trim()) {
        setError("I could not read clear text from the file. Try a clearer file.");
        setLoading(false);
        return;
      }

      setMediaExtracted(extracted);
      analyzeText(extracted, "media");
    } catch {
      setLoading(false);
      setError("Failed to analyze the file.");
    }
  }

  function addDictionaryEntry() {
    if (!dictTerm.trim() || !dictMeaning.trim()) {
      setError("Add at least a slang term and its meaning.");
      return;
    }

    const nextEntry: CustomEntry = {
      id: uid("entry"),
      slang: dictTerm.trim(),
      meaning: dictMeaning.trim(),
      context: dictContext.trim(),
      formality: dictFormality,
      offensiveness: dictOffensiveness,
      createdAt: new Date().toISOString(),
    };

    setCustomEntries((current) => [nextEntry, ...current]);
    setDictTerm("");
    setDictMeaning("");
    setDictContext("");
    setDictFormality(FORMALITY_OPTIONS[1]);
    setDictOffensiveness(OFFENSIVENESS_OPTIONS[1]);
    setError(null);
  }

  async function importDictionaryFile(file: File | null) {
    if (!file) return;

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (extension !== "json" && extension !== "csv") {
        throw new Error("Upload a CSV or JSON file.");
      }

      const raw = await file.text();
      const parsed = parseBulkEntries(raw, extension);

      const withMeta: CustomEntry[] = parsed.map((entry) => ({
        ...entry,
        id: uid("entry"),
        createdAt: new Date().toISOString(),
      }));

      setCustomEntries((current) => {
        const known = new Set(current.map((item) => normalizeText(item.slang)));
        const unique = withMeta.filter((item) => !known.has(normalizeText(item.slang)));
        return [...unique, ...current];
      });

      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Failed to import file.");
    }
  }

  const pageBg =
    theme === "light"
      ? "bg-[radial-gradient(circle_at_top,#fff8ef_0%,#fffaf5_34%,#fffdf9_100%)] text-[#1d140e]"
      : "bg-[radial-gradient(circle_at_top,#3d250f_0%,#1a130f_35%,#120d0a_100%)] text-[#fff7ef]";
  const frameClass =
    theme === "light"
      ? "border-[#e8d8c7] bg-white/90 shadow-[0_14px_30px_rgba(88,52,17,0.08)]"
      : "border-[#483224] bg-[#1c140f]/92 shadow-[0_14px_30px_rgba(0,0,0,0.22)]";
  const textMuted = theme === "light" ? "text-[#8d6b4c]" : "text-[#d4b89e]";
  const inputPanel =
    theme === "light"
      ? "border-[#eadacc] bg-white shadow-[0_14px_30px_rgba(88,52,17,0.08)]"
      : "border-[#483224] bg-[#201712]";

  return (
    <main className={`min-h-screen ${pageBg}`}>
      <div className={`border-b ${theme === "light" ? "border-[#eadccf] bg-white/90" : "border-[#433024] bg-[#1a130f]/90"} backdrop-blur`}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="text-[2rem] font-black tracking-tight text-[#ff8a1d]">Slangy</div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {[
              { id: "translate", label: "Translate", icon: <ChatIcon /> },
              { id: "dictionary", label: "Dictionary", icon: <BookIcon /> },
              { id: "history", label: "History", icon: <HistoryIcon /> },
            ].map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as PageView)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-base font-semibold transition ${
                    active
                      ? "border-[#eb9411] bg-[#ffc62e] text-[#21160f] shadow-[0_6px_14px_rgba(255,198,46,0.24)]"
                      : theme === "light"
                        ? "border-transparent bg-transparent text-[#2f2318] hover:bg-[#fff3e4]"
                        : "border-transparent bg-transparent text-[#f5d8b9] hover:bg-[#2c2018]"
                  }`}
                >
                  <IconWrap active={active}>{item.icon}</IconWrap>
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
              theme === "light"
                ? "border-[#eadccf] bg-white text-[#2f2318] hover:bg-[#fff3e4]"
                : "border-[#4a3628] bg-[#241a14] text-[#f5d8b9] hover:bg-[#2d2119]"
            }`}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {view === "translate" && (
          <>
            <section className="mx-auto max-w-4xl text-center">
              <h1 className="text-[clamp(3rem,9vw,5.8rem)] font-black leading-[0.95] tracking-tight text-[#ff8a1d]">
                Understand the <span className="text-[#ffc62e]">Streets</span>
              </h1>
              <p className={`mx-auto mt-6 max-w-3xl text-[1.1rem] leading-9 sm:text-[1.2rem] ${textMuted}`}>
                Bridge the gap between Egyptian colloquial street slang and English with deep cultural context.
              </p>
            </section>

            <section className={`mx-auto mt-10 max-w-5xl rounded-[26px] border p-7 ${frameClass}`}>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                {[
                  { id: "text", label: "Text", icon: <ChatIcon /> },
                  { id: "voice", label: "Voice", icon: <MicIcon /> },
                  { id: "media", label: "Media", icon: <ImageIcon /> },
                ].map((item) => {
                  const active = inputMode === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setInputMode(item.id as InputMode)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                        active
                          ? "border-[#eb9411] bg-[#ffc62e] text-[#21160f]"
                          : theme === "light"
                            ? "border-[#eadccf] bg-[#fff8f1] text-[#7a5a3a] hover:bg-[#fff1de]"
                            : "border-[#4a3628] bg-[#241a14] text-[#d6b392] hover:bg-[#2c2018]"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {inputMode === "text" && (
                <div className={`rounded-[22px] border p-5 ${inputPanel}`}>
                  <textarea
                    value={textInput}
                    onChange={(event) => setTextInput(event.target.value)}
                    dir="rtl"
                    rows={6}
                    placeholder="Type Egyptian slang here in Arabic or Arabizi (e.g. يا اسطى, ya sosta)..."
                    className={`w-full resize-none rounded-2xl border px-5 py-4 text-[1.05rem] leading-8 outline-none transition ${
                      theme === "light"
                        ? "border-[#e6d8ca] bg-white text-[#5a4029] placeholder:text-[#9d7d61] focus:border-[#ffb25a] focus:ring-4 focus:ring-[#fff0dd]"
                        : "border-[#4a3628] bg-[#1a120d] text-[#fae4ce] placeholder:text-[#b58b68] focus:border-[#ffb25a]"
                    }`}
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {EXAMPLES.map((example) => (
                      <button
                        key={example}
                        onClick={() => setTextInput(example)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${
                          theme === "light"
                            ? "border-[#eadccf] bg-[#fffaf4] text-[#8d6b4c] hover:border-[#ffbe72] hover:text-[#5b4028]"
                            : "border-[#4a3628] bg-[#241912] text-[#d8b89d] hover:border-[#ffbe72]"
                        }`}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {inputMode === "voice" && (
                <div className={`rounded-[22px] border p-6 ${inputPanel}`}>
                  <div className="text-center">
                    <button
                      onClick={voiceState === "recording" ? stopVoice : startVoice}
                      disabled={loading}
                      className={`mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full border-4 text-[#2f2318] transition ${
                        voiceState === "recording"
                          ? "border-[#ffb3a8] bg-[#ff8e78] text-white shadow-[0_12px_25px_rgba(255,142,120,0.24)]"
                          : "border-[#ffe2bf] bg-[#fff2df] text-[#ff8a1d] shadow-[0_12px_25px_rgba(255,185,92,0.18)]"
                      }`}
                    >
                      <MicIcon />
                    </button>
                    <p className={`mt-4 text-lg font-semibold ${theme === "light" ? "text-[#5b4028]" : "text-[#fae4ce]"}`}>
                      {voiceState === "recording"
                        ? "Listening..."
                        : voiceState === "done"
                          ? "Voice captured"
                          : "Tap to start speaking"}
                    </p>
                  </div>

                  <div className="mt-6">
                    <Field label="Transcript">
                      <InputShell
                        value={voiceInput}
                        onChange={setVoiceInput}
                        placeholder="The detected speech will appear here."
                        rows={4}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {inputMode === "media" && (
                <div className={`rounded-[22px] border p-5 ${inputPanel}`}>
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                      loadMedia(event.dataTransfer.files[0] ?? null);
                    }}
                    className={`relative rounded-[24px] border-2 border-dashed px-6 py-10 text-center transition ${
                      dragActive ? "border-[#ffb25a] bg-[#fff6ea]" : "border-[#ebddcf] bg-[#fffdfa]"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(event) => loadMedia(event.target.files?.[0] ?? null)}
                    />

                    {mediaUrl ? (
                      <div className="space-y-3">
                        {mediaKind === "image" ? (
                          <img src={mediaUrl} alt="preview" className="mx-auto max-h-64 rounded-2xl object-contain" />
                        ) : (
                          <video src={mediaUrl} controls className="mx-auto max-h-64 rounded-2xl object-contain" />
                        )}
                        <p className="font-medium text-[#7d634d]">{mediaFile?.name}</p>
                      </div>
                    ) : (
                      <>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1e3] text-[#ff8a1d]">
                          <UploadIcon />
                        </div>
                        <h3 className="mt-5 text-3xl font-black text-[#1f150f]">Upload Visual Slang</h3>
                        <p className="mt-2 text-lg text-[#8d6b4c]">Drop an image or a short video and we will read the visible Arabic text.</p>
                      </>
                    )}
                  </div>

                  {mediaExtracted && (
                    <div className="mt-5 rounded-2xl border border-[#eadacc] bg-[#fffdfa] p-5">
                      <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#b28b68]">Extracted Text</div>
                      <p className="mt-3 text-lg leading-8 text-[#5a4029]">{mediaExtracted}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setInputMode("voice")}
                    className={`inline-flex h-[60px] w-[60px] items-center justify-center rounded-full border ${
                      theme === "light" ? "border-[#eadacc] bg-white text-[#2e2218]" : "border-[#4a3628] bg-[#211711] text-[#f2d9bc]"
                    }`}
                  >
                    <MicIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("media")}
                    className={`inline-flex h-[60px] w-[60px] items-center justify-center rounded-full border ${
                      theme === "light" ? "border-[#eadacc] bg-white text-[#2e2218]" : "border-[#4a3628] bg-[#211711] text-[#f2d9bc]"
                    }`}
                  >
                    <ImageIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("media")}
                    className={`inline-flex h-[60px] w-[60px] items-center justify-center rounded-full border ${
                      theme === "light" ? "border-[#eadacc] bg-white text-[#2e2218]" : "border-[#4a3628] bg-[#211711] text-[#f2d9bc]"
                    }`}
                  >
                    <VideoIcon />
                  </button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <label className="inline-flex items-center gap-3 text-lg font-semibold text-[#2b2017]">
                    <button
                      type="button"
                      onClick={() => setLiteralMode((current) => !current)}
                      className={`relative h-8 w-14 rounded-full transition ${literalMode ? "bg-[#ffbf61]" : "bg-[#e6ddd4]"}`}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${literalMode ? "left-7" : "left-1"}`}
                      />
                    </button>
                    Literal Translation
                  </label>

                  <button
                    onClick={() => {
                      if (inputMode === "text") analyzeText(textInput, "text");
                      if (inputMode === "voice") analyzeText(voiceInput, "voice");
                      if (inputMode === "media") void processMedia();
                    }}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#ffc391] px-7 py-4 text-xl font-black text-white shadow-[0_14px_24px_rgba(255,150,55,0.26)] transition hover:bg-[#ffb46d] disabled:opacity-60"
                  >
                    <SendIcon />
                    {loading ? "Translating..." : "Translate"}
                  </button>
                </div>
              </div>
            </section>

            {error && (
              <div className="mx-auto mt-5 max-w-5xl rounded-2xl border border-[#f7c1bc] bg-[#fff0ee] px-5 py-4 text-base text-[#8c3a32]">
                {error}
              </div>
            )}

            <section className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className={`rounded-[26px] border p-6 ${frameClass}`}>
                <div className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#b38c68]">Translation Result</div>
                {translation ? (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-[#ffe0bc] bg-[linear-gradient(180deg,#fff8ee_0%,#fff2df_100%)] p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full border px-3 py-1 text-xs font-black"
                          style={{
                            color: toneColor,
                            borderColor: `${toneColor}33`,
                            backgroundColor: `${toneColor}12`,
                          }}
                        >
                          {TONE_LABELS[translation.tone] ?? translation.tone}
                        </span>
                        <span className="rounded-full border border-[#ecd8c5] bg-white px-3 py-1 text-xs font-bold text-[#7f6650]">
                          {Math.round(translation.confidence * 100)}% confidence
                        </span>
                        <span className="rounded-full border border-[#ecd8c5] bg-white px-3 py-1 text-xs font-bold text-[#7f6650]">
                          {translation.mode}
                        </span>
                      </div>

                      <div className="mt-5 space-y-4">
                        <div className="rounded-2xl border border-[#ecdccf] bg-white p-4">
                          <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#b28b68]">{transcriptMeta.label}</div>
                          <p className="mt-2 text-lg leading-8 text-[#5a4029]">{translation.original}</p>
                          <p className="mt-3 text-sm leading-7 text-[#8d6b4c]">{transcriptMeta.note}</p>
                        </div>

                        <div className="rounded-2xl border p-4" style={{ borderColor: `${toneColor}30`, backgroundColor: `${toneColor}10` }}>
                          <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: toneColor }}>
                            Meaning
                          </div>
                          <p className="mt-2 text-[2rem] font-black leading-tight text-[#21160f]">{translation.translation}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-xl border border-[#9a4f1d] bg-[#3f2214] px-3 py-1.5 text-sm font-semibold text-[#ffd7b0]">
                              Informal
                            </span>
                            <span className="rounded-xl border border-[#1f774d] bg-[#133726] px-3 py-1.5 text-sm font-semibold text-[#b8f0d1]">
                              {translation.tone === "ØºØ¶Ø¨" ? "Can Be Sharp" : "Not Offensive"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {literalMode && (
                      <div className="rounded-2xl border border-[#eadacc] bg-white p-5">
                        <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b28b68]">Literal Translation</div>
                        <p className="mt-4 text-2xl italic leading-9 text-[#74604d]">"{literalGloss}"</p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-[#eadacc] bg-white p-5">
                      <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b28b68]">Cultural Context</div>
                      <p className="mt-4 text-lg leading-9 text-[#5e4733]">{culturalContext}</p>
                    </div>

                    {englishEquivalent && (
                      <div className="rounded-2xl border border-[#7a2e2e]/30 bg-[#3a1f1a] p-5">
                        <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#ff5a5a]">English Equivalent</div>
                        <p className="mt-4 text-4xl font-black leading-tight text-white">{englishEquivalent.phrase}</p>
                        <p className="mt-3 text-lg leading-8 text-[#f5d2c8]">{englishEquivalent.note}</p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-[#eadacc] bg-white p-5">
                      <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b28b68]">Why this result</div>
                      <p className="mt-4 text-base leading-8 text-[#6f5540]">{translation.explanation}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-[#eadacc] bg-white text-center">
                    <div>
                      <div className="text-5xl font-black text-[#ffd083]">A</div>
                      <h3 className="mt-4 text-2xl font-black text-[#1f150f]">Ready to translate</h3>
                      <p className="mt-3 max-w-md text-lg leading-8 text-[#8d6b4c]">
                        Enter slang in text, voice, or media form and we will explain the meaning, tone, and emotional vibe.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className={`rounded-[26px] border p-6 ${frameClass}`}>
                <div className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#b38c68]">Emotion Insight</div>
                {emotion && primaryEmotion ? (
                  <div className="space-y-4">
                    <div
                      className="rounded-3xl border p-6 text-center"
                      style={{
                        borderColor: `${primaryEmotion.color}33`,
                        backgroundColor: `${primaryEmotion.color}10`,
                      }}
                    >
                      <div className="text-sm font-bold uppercase tracking-[0.16em]" style={{ color: primaryEmotion.color }}>
                        Emotional Tone
                      </div>
                      <div className="mt-4 text-3xl font-black text-[#20160f]">
                        {primaryEmotion.emoji} {emotion.primary}
                      </div>
                      <p className="mt-3 text-base text-[#715845]">Intensity {emotion.intensity}/5</p>
                    </div>

                    <div className="rounded-2xl border border-[#eadacc] bg-white p-5">
                      <div className="space-y-4">
                        {toneBreakdown.map((item) => {
                            return (
                              <div key={item.label}>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                  <span className="font-semibold text-[#352519]">{item.label}</span>
                                  <span className="font-bold text-[#8d6b4c]">{item.value}%</span>
                                </div>
                                <div className="h-3 rounded-full bg-[#f6ede5]">
                                  <div className="h-3 rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#eadacc] bg-white p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-base text-[#8d6b4c]">Overall sentiment</span>
                        <span className="text-lg font-black text-[#21160f]">{emotion.sentiment}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-[#eadacc] bg-white text-center">
                    <div>
                      <div className="mx-auto h-16 w-16 rounded-full bg-[#fff1e3]" />
                      <h3 className="mt-4 text-2xl font-black text-[#1f150f]">Tone and emotion</h3>
                      <p className="mt-3 max-w-sm text-lg leading-8 text-[#8d6b4c]">
                        Once you translate a phrase, this panel will show the emotional intent behind it.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {view === "dictionary" && (
          <>
            <SectionHeader
              icon={<BookIcon />}
              title="Custom Dictionary"
              subtitle="Manage and contribute to the community slang database."
              right={<StatCard total={customEntries.length} recent={recentDictionaryAdds} />}
            />

            <div className="grid gap-6">
              <section className={`rounded-[26px] border ${frameClass}`}>
                <div className="border-b border-[#eadccf] px-8 py-8">
                  <h3 className="text-4xl font-black text-[#1f150f]">Add New Entry</h3>
                  <p className="mt-2 text-lg text-[#8d6b4c]">Contribute a new phrase to the dictionary.</p>
                </div>

                <div className="grid gap-6 px-8 py-8">
                  <Field label="Slang Term (Arabic/Arabizi)">
                    <InputShell value={dictTerm} onChange={setDictTerm} placeholder="e.g. قشطة" />
                  </Field>

                  <Field label="Meaning (English)">
                    <InputShell value={dictMeaning} onChange={setDictMeaning} placeholder="e.g. Cool / Awesome" />
                  </Field>

                  <Field label="Context / Usage">
                    <InputShell value={dictContext} onChange={setDictContext} placeholder="When is this typically used?" rows={3} />
                  </Field>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Field label="Formality">
                      <select
                        value={dictFormality}
                        onChange={(event) => setDictFormality(event.target.value)}
                        className="w-full rounded-2xl border border-[#e6d8ca] bg-white px-5 py-4 text-lg text-[#4d3724] outline-none focus:border-[#ffb86a] focus:ring-4 focus:ring-[#ffedd6]"
                      >
                        {FORMALITY_OPTIONS.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Offensiveness">
                      <select
                        value={dictOffensiveness}
                        onChange={(event) => setDictOffensiveness(event.target.value)}
                        className="w-full rounded-2xl border border-[#e6d8ca] bg-white px-5 py-4 text-lg text-[#4d3724] outline-none focus:border-[#ffb86a] focus:ring-4 focus:ring-[#ffedd6]"
                      >
                        {OFFENSIVENESS_OPTIONS.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <button
                    onClick={addDictionaryEntry}
                    className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#ff8a1d] px-8 py-4 text-xl font-black text-white shadow-[0_14px_24px_rgba(255,138,29,0.24)] transition hover:bg-[#f37f12]"
                  >
                    <PlusIcon />
                    Add to Dictionary
                  </button>
                </div>
              </section>

              <section className={`rounded-[26px] border border-dashed p-8 text-center ${frameClass}`}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1e3] text-[#ff8a1d]">
                  <UploadIcon />
                </div>
                <h3 className="mt-5 text-3xl font-black text-[#1f150f]">Bulk Import</h3>
                <p className="mt-2 text-lg text-[#8d6b4c]">Upload a CSV or JSON file containing multiple entries.</p>
                <button
                  onClick={() => importRef.current?.click()}
                  className="mt-6 inline-flex min-w-[240px] items-center justify-center rounded-xl border border-[#e6d8ca] bg-white px-6 py-4 text-xl font-bold text-[#21160f] shadow-[0_6px_15px_rgba(84,48,14,0.06)]"
                >
                  Select File
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={(event) => void importDictionaryFile(event.target.files?.[0] ?? null)}
                />
              </section>

              <section className={`rounded-[26px] border ${frameClass}`}>
                <div className="border-b border-[#eadccf] px-8 py-8">
                  <h3 className="text-4xl font-black text-[#1f150f]">Dictionary Entries</h3>
                  <p className="mt-2 text-lg text-[#8d6b4c]">Browse the custom dataset entries.</p>
                </div>

                {customEntries.length === 0 ? (
                  <div className="flex min-h-[260px] items-center justify-center px-8 py-12 text-center">
                    <div>
                      <div className="mx-auto text-[#ded6cf]">
                        <EmptyIcon />
                      </div>
                      <p className="mt-6 text-3xl font-medium text-[#7b6048]">The dictionary is currently empty.</p>
                      <p className="mt-3 text-xl text-[#a07f61]">Add a new entry to get started.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 px-8 py-8">
                    {customEntries.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-[#eadccf] bg-white p-5 shadow-[0_6px_15px_rgba(84,48,14,0.04)]">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h4 className="text-2xl font-black text-[#21160f]">{entry.slang}</h4>
                            <p className="mt-1 text-lg font-semibold text-[#ff8a1d]">{entry.meaning}</p>
                            {entry.context && <p className="mt-3 text-base leading-7 text-[#765c46]">{entry.context}</p>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#fff3e2] px-3 py-1 text-sm font-semibold text-[#8a6948]">{entry.formality}</span>
                            <span className="rounded-full bg-[#fff3e2] px-3 py-1 text-sm font-semibold text-[#8a6948]">{entry.offensiveness}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {view === "history" && (
          <>
            <SectionHeader
              icon={<HistoryIcon />}
              title="Translation History"
              subtitle="Your private recent slang translations."
            />

            {!mounted ? (
              <div className="py-24 text-center text-3xl text-[#8d6b4c]">Loading history...</div>
            ) : history.length === 0 ? (
              <div className={`rounded-[26px] border px-8 py-20 text-center ${frameClass}`}>
                <div className="mx-auto text-[#ded6cf]">
                  <EmptyIcon />
                </div>
                <h3 className="mt-6 text-3xl font-black text-[#1f150f]">No translations yet</h3>
                <p className="mt-3 text-xl text-[#8d6b4c]">Your recent slang lookups will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {history.map((item) => (
                  <div key={item.id} className={`rounded-[22px] border p-6 ${frameClass}`}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#fff3e2] px-3 py-1 text-sm font-semibold text-[#8a6948]">{item.source}</span>
                          <span className="rounded-full bg-[#fff3e2] px-3 py-1 text-sm font-semibold text-[#8a6948]">{item.mode}</span>
                          <span className="rounded-full bg-[#fff3e2] px-3 py-1 text-sm font-semibold text-[#8a6948]">{TONE_LABELS[item.tone] ?? item.tone}</span>
                        </div>
                        <h3 className="text-2xl font-black text-[#21160f]">{item.input}</h3>
                        <p className="mt-2 text-lg leading-8 text-[#765c46]">{item.translation}</p>
                      </div>
                      <div className="text-sm font-semibold text-[#9c7a5a]">{formatRelativeDate(item.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

