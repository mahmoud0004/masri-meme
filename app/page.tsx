"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { detectEmotions } from "@/lib/emotions";
import { translateMeme } from "@/lib/translations";
import { extractTextFromFile } from "@/lib/ocr";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "text" | "voice" | "media";

type EmotionResult = {
  primary: string;
  secondary?: string;
  percentages: Record<string, number>;
  intensity: 1 | 2 | 3 | 4 | 5;
  sentiment: "positive" | "neutral" | "negative";
};

type TranslationResult = {
  original: string;
  translation: string;
  explanation: string;
  tone: string;
};

// ─── Emotion metadata ─────────────────────────────────────────────────────────
const EMOTION_META: Record<string, { emoji: string; color: string }> = {
  فرحان:          { emoji: "😄", color: "#FFD700" },
  غاضب:           { emoji: "😤", color: "#FF4444" },
  زعلان:          { emoji: "😢", color: "#6B8CFF" },
  ساخر:           { emoji: "😏", color: "#FF8C42" },
  متحمس:          { emoji: "🤩", color: "#00E5A0" },
  متضايق:         { emoji: "😒", color: "#C084FC" },
  خايف:           { emoji: "😰", color: "#94A3B8" },
  مبسوط:          { emoji: "😂", color: "#FB923C" },
  neutral:        { emoji: "😐", color: "#888888" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clsx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function TabButton({ id, label, icon, active, onClick }: {
  id: Tab; label: string; icon: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200",
        active
          ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Spinner() {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-400 animate-spin" />
  );
}

function WaveViz({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-violet-400 transition-all"
          style={{
            height: active ? `${20 + Math.random() * 24}px` : "4px",
            opacity: active ? 1 : 0.3,
            animation: active ? `waveBar 0.6s ease-in-out ${i * 0.05}s infinite alternate` : "none",
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

function EmotionBar({ label, value, color, emoji }: {
  label: string; value: number; color: string; emoji: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-7 text-center">{emoji}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-white/70 font-medium">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{value}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState<Tab>("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Text
  const [textInput, setTextInput] = useState("");

  // Voice
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "done">("idle");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const recognitionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Media
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaB64, setMediaB64] = useState<string | null>(null);
  const [mediaMime, setMediaMime] = useState<string | null>(null);
  const [mediaExtracted, setMediaExtracted] = useState("");
  const [drag, setDrag] = useState(false);

  // Results
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [emotion, setEmotion] = useState<EmotionResult | null>(null);

  // Check mic permission on mount
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((s) => {
        setMicPermission(s.state === "granted" ? "granted" : s.state === "denied" ? "denied" : "unknown");
        s.onchange = () =>
          setMicPermission(s.state === "granted" ? "granted" : s.state === "denied" ? "denied" : "unknown");
      })
      .catch(() => {});
  }, []);

  // ── Process any text input ──────────────────────────────────────────────────
  async function processText(input: string) {
    if (!input.trim()) { setError("من فضلك أدخل نص أو ميم أولاً"); return; }
    setLoading(true);
    setError(null);
    setTranslation(null);
    setEmotion(null);

    try {
      const [trans, emo] = await Promise.all([
        translateMeme(input),
        detectEmotions(input),
      ]);
      setTranslation(trans);
      setEmotion(emo);
    } catch (e: any) {
      setError(e?.message ?? "حصل خطأ، جرب تاني");
    } finally {
      setLoading(false);
    }
  }

  // ── Voice ───────────────────────────────────────────────────────────────────
  async function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("المتصفح مش بيدعم التعرف على الصوت، استخدم Chrome أو Edge"); return; }

    setError(null);
    setTranslation(null);
    setEmotion(null);
    setVoiceTranscript("");

    // Request mic permission explicitly first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicPermission("granted");
    } catch (err: any) {
      setMicPermission("denied");
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setError("الميكروفون محجوب — اضغط على أيقونة القفل في المتصفح وسمح بالميكروفون");
      } else if (err?.name === "NotFoundError") {
        setError("مفيش ميكروفون على الجهاز ده");
      } else {
        setError("مش قادر يوصل للميكروفون: " + (err?.message ?? "خطأ غير معروف"));
      }
      return;
    }

    // Fresh instance every time to avoid stale handler bugs
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "ar-EG";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    setVoiceState("recording");

    rec.onresult = (event: any) => {
      let t = "";
      for (let i = event.resultIndex; i < event.results.length; i++) t += event.results[i][0].transcript;
      if (t.trim()) setVoiceTranscript(t);
    };

    rec.onerror = (event: any) => {
      const msgs: Record<string, string> = {
        "not-allowed": "الميكروفون محجوب — سمح بالميكروفون من إعدادات المتصفح",
        "no-speech": "مسمعتش صوت، جرب تاني",
        "audio-capture": "الميكروفون شغال مع تطبيق تاني",
        "network": "خطأ في الشبكة",
        "aborted": "وقف التسجيل",
      };
      setError(msgs[event.error] ?? `خطأ صوتي: ${event.error}`);
      setVoiceState("idle");
      stopMicStream();
    };

    rec.onend = () => {
      setVoiceState("done");
      stopMicStream();
    };

    try {
      rec.start();
    } catch (e: any) {
      setError("فشل بدء التسجيل: " + (e?.message ?? "خطأ غير معروف"));
      setVoiceState("idle");
      stopMicStream();
    }
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    stopMicStream();
    setVoiceState("done");
  }

  function stopMicStream() {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
  }

  // ── Media ───────────────────────────────────────────────────────────────────
  function handleFileInput(file: File | null) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setError("الملف أكبر من 15MB"); return; }
    const isImg = file.type.startsWith("image/");
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaExtracted("");
    setTranslation(null);
    setEmotion(null);
    setError(null);

    if (isImg) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaB64((e.target?.result as string).split(",")[1]);
        setMediaMime(file.type);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaB64(null);
      setMediaMime(null);
    }
  }

  async function processMedia() {
    if (!mediaFile) { setError("ارفع صورة أو فيديو أولاً"); return; }
    setLoading(true);
    setError(null);
    setTranslation(null);
    setEmotion(null);
    setMediaExtracted("");

    try {
      let extracted = "";
      if (mediaFile.type.startsWith("image/") && mediaB64) {
        // Use Claude vision for images
        const { translateMemeFromImage } = await import("@/lib/translations");
        const result = await translateMemeFromImage(mediaB64, mediaFile.type);
        setTranslation(result.translation);
        setEmotion(result.emotion);
        setMediaExtracted(result.extractedText);
        setLoading(false);
        return;
      } else {
        // OCR for video
        extracted = await extractTextFromFile(mediaFile);
        if (!extracted.trim()) throw new Error("مش لاقي نص في الفيديو ده");
        setMediaExtracted(extracted);
        await Promise.all([
          translateMeme(extracted).then(setTranslation),
          detectEmotions(extracted).then(setEmotion),
        ]);
      }
    } catch (e: any) {
      setError(e?.message ?? "فشل تحليل الملف");
    } finally {
      setLoading(false);
    }
  }

  // ─── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white" dir="rtl">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-fuchsia-600/8 blur-[120px]" />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-blue-600/8 blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            مجاني 100% — بدون API
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight">
            <span className="text-white">مترجم </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-violet-400 to-fuchsia-400">
              الميمز المصرية
            </span>
          </h1>

          <p className="text-white/50 text-base max-w-md mx-auto leading-relaxed">
            ترجمة ذكية للهجة المصرية — مش ترجمة حرفية. نص أو صوت أو صور أو فيديو.
            <br />
            <span className="text-violet-400">+ تحليل المشاعر بالنسبة المئوية من النبرة الصوتية</span>
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          <TabButton id="text"  label="نص"         icon="✍️"  active={tab === "text"}  onClick={() => setTab("text")} />
          <TabButton id="voice" label="صوت"         icon="🎤"  active={tab === "voice"} onClick={() => setTab("voice")} />
          <TabButton id="media" label="صورة / فيديو" icon="🖼️" active={tab === "media"} onClick={() => setTab("media")} />
        </div>

        {/* Input Card */}
        <motion.div
          layout
          className="bg-[#111118] border border-white/8 rounded-2xl p-5 mb-4 shadow-xl shadow-black/40"
        >
          <AnimatePresence mode="wait">

            {/* ── TEXT ── */}
            {tab === "text" && (
              <motion.div key="text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <label className="block text-xs text-white/40 mb-2 font-medium">اكتب الميم أو العبارة المصرية</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={'مثال: "متعملش فيها ناصح" أو "إنت بتستهبل؟" أو "يا عم ده اكتشاف!"'}
                  rows={4}
                  className="w-full bg-black/30 border border-white/8 rounded-xl p-4 text-white placeholder-white/25 resize-none outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 text-base leading-relaxed transition-all"
                />

                {/* Example chips */}
                <div className="flex gap-2 flex-wrap mt-3">
                  {["متعملش فيها ناصح", "إيه ده يسطا!", "ده أنا مبسوطه", "يا عم بلاش كده"].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setTextInput(ex)}
                      className="text-xs bg-white/5 border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/10 px-3 py-1.5 rounded-full text-white/60 hover:text-violet-300 transition-all"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => setTextInput("")} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 transition-all">
                    مسح
                  </button>
                  <button
                    onClick={() => processText(textInput)}
                    disabled={loading}
                    className="mr-auto px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-violet-500/25"
                  >
                    {loading ? <Spinner /> : "✨"}
                    {loading ? "بيترجم..." : "ترجم الميم"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── VOICE ── */}
            {tab === "voice" && (
              <motion.div key="voice" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <p className="text-sm text-white/50 mb-4 text-center leading-relaxed">
                  اتكلم بالعربي المصري — هيترجم ويحلل مشاعرك من نبرة صوتك
                  <br />
                  <span className="text-violet-400 text-xs">المتصفح هيطلب إذن الميكروفون أول مرة</span>
                </p>

                {micPermission === "denied" && (
                  <div className="mb-4 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-xs text-amber-200 text-center">
                    🔒 الميكروفون محجوب — اضغط على أيقونة القفل في المتصفح واسمح بالميكروفون
                  </div>
                )}

                <WaveViz active={voiceState === "recording"} />

                <p className={`text-center text-sm mt-2 mb-4 transition-colors ${voiceState === "recording" ? "text-red-400" : "text-white/40"}`}>
                  {voiceState === "idle" && "اضغط الزر وابدأ الكلام"}
                  {voiceState === "recording" && "🔴 بيسمعك... اتكلم"}
                  {voiceState === "done" && "✅ خلصت — اضغط ترجم"}
                </p>

                <div className="flex gap-3 justify-center mb-4">
                  {voiceState !== "recording" ? (
                    <button
                      onClick={startVoice}
                      disabled={loading || micPermission === "denied"}
                      className="w-16 h-16 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-2xl shadow-lg shadow-violet-500/30 transition-all hover:scale-105 active:scale-95"
                    >
                      🎤
                    </button>
                  ) : (
                    <button
                      onClick={stopVoice}
                      className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 text-2xl shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95 animate-pulse"
                    >
                      ⏹️
                    </button>
                  )}
                </div>

                {voiceTranscript && (
                  <div className="bg-black/30 border border-white/8 rounded-xl p-4 mb-4">
                    <p className="text-xs text-white/40 mb-1">اللي اتسمع:</p>
                    <p className="text-white text-base">{voiceTranscript}</p>
                  </div>
                )}

                {/* Type fallback */}
                <div className="border-t border-white/8 pt-4 mt-2">
                  <p className="text-xs text-white/30 mb-2 text-center">أو اكتب يدوي</p>
                  <textarea
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    placeholder="اكتب هنا..."
                    rows={2}
                    className="w-full bg-black/20 border border-white/8 rounded-xl p-3 text-white placeholder-white/20 resize-none outline-none focus:border-violet-500/50 text-sm transition-all"
                  />
                </div>

                <button
                  onClick={() => processText(voiceTranscript)}
                  disabled={loading || !voiceTranscript.trim()}
                  className="w-full mt-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25"
                >
                  {loading ? <Spinner /> : "🎭"}
                  {loading ? "بيحلل..." : "ترجم وحلل المشاعر"}
                </button>
              </motion.div>
            )}

            {/* ── MEDIA ── */}
            {tab === "media" && (
              <motion.div key="media" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <p className="text-sm text-white/50 mb-4 text-center">
                  ارفع صورة ميم أو فيديو — هيستخرج النص ويترجمه بالذكاء الاصطناعي
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); handleFileInput(e.dataTransfer.files[0]); }}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                    ${drag ? "border-violet-500 bg-violet-500/10" : "border-white/15 hover:border-violet-500/40 hover:bg-white/[0.02]"}`}
                >
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => handleFileInput(e.target.files?.[0] ?? null)}
                  />
                  {mediaPreview ? (
                    <div className="space-y-2">
                      {mediaFile?.type.startsWith("image/") ? (
                        <img src={mediaPreview} alt="preview" className="max-h-48 mx-auto rounded-xl object-contain" />
                      ) : (
                        <video src={mediaPreview} controls className="max-h-48 mx-auto rounded-xl w-full" />
                      )}
                      <p className="text-xs text-white/40">{mediaFile?.name}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl mb-2">📁</p>
                      <p className="text-white/60 text-sm font-medium">اسحب الملف هنا أو اضغط لاختياره</p>
                      <p className="text-white/25 text-xs mt-1">صور: JPG, PNG, WEBP — فيديو: MP4, MOV (أقصى 15MB)</p>
                    </div>
                  )}
                </div>

                {mediaExtracted && (
                  <div className="mt-3 bg-black/30 border border-white/8 rounded-xl p-3">
                    <p className="text-xs text-white/40 mb-1">النص المستخرج:</p>
                    <p className="text-white/80 text-sm">{mediaExtracted}</p>
                  </div>
                )}

                <button
                  onClick={processMedia}
                  disabled={loading || !mediaFile}
                  className="w-full mt-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25"
                >
                  {loading ? <Spinner /> : "🔍"}
                  {loading ? "بيحلل الميم..." : "استخرج وترجم"}
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="mt-4 bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-sm text-red-300"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Loading skeleton */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#111118] border border-white/8 rounded-2xl p-5 mb-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                <p className="text-sm text-white/50">Claude بيحلل الميم...</p>
              </div>
              {[["w-3/4"], ["w-1/2"], ["w-5/6"]].map(([w], i) => (
                <div key={i} className={`h-3 ${w} rounded bg-white/8 mb-3 overflow-hidden relative`}>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
                </div>
              ))}
              <style>{`@keyframes shimmer { 100% { transform: translateX(200%); } }`}</style>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {translation && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-4"
            >
              {/* Translation Card */}
              <div className="bg-[#111118] border border-violet-500/20 rounded-2xl p-5 shadow-xl shadow-violet-500/5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🎭</span>
                  <h2 className="font-bold text-white">الترجمة الذكية</h2>
                  <span className="mr-auto text-xs bg-violet-500/15 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full">
                    {translation.tone}
                  </span>
                </div>

                <div className="grid gap-3">
                  <div className="bg-black/30 rounded-xl p-4">
                    <p className="text-xs text-white/40 mb-1">الأصل</p>
                    <p className="text-white/80 text-base leading-relaxed">{translation.original}</p>
                  </div>
                  <div className="bg-violet-500/8 border border-violet-500/15 rounded-xl p-4">
                    <p className="text-xs text-violet-300/70 mb-1">الترجمة</p>
                    <p className="text-white text-base font-medium leading-relaxed">{translation.translation}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(translation.translation)}
                      className="mt-2 text-xs text-violet-400/70 hover:text-violet-300 transition-colors flex items-center gap-1"
                    >
                      📋 نسخ
                    </button>
                  </div>
                  {translation.explanation && (
                    <div className="bg-white/[0.03] rounded-xl p-4">
                      <p className="text-xs text-white/40 mb-1">الشرح</p>
                      <p className="text-white/65 text-sm leading-relaxed">{translation.explanation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emotion Card */}
              {emotion && (
                <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 shadow-xl shadow-black/40">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-lg">🧠</span>
                    <h2 className="font-bold text-white">تحليل المشاعر</h2>
                  </div>

                  {/* Primary emotion hero */}
                  <div
                    className="rounded-xl p-4 mb-5 text-center border"
                    style={{
                      background: `${(EMOTION_META[emotion.primary] ?? EMOTION_META.neutral)?.color}12`,
                      borderColor: `${(EMOTION_META[emotion.primary] ?? EMOTION_META.neutral)?.color}30`,
                    }}
                  >
                    <p className="text-5xl mb-2">{EMOTION_META[emotion.primary]?.emoji ?? "🎭"}</p>
                    <p className="text-2xl font-black" style={{ color: EMOTION_META[emotion.primary]?.color ?? "#888" }}>
                      {emotion.primary}
                    </p>
                    {emotion.secondary && (
                      <p className="text-white/50 text-sm mt-1">+ {emotion.secondary}</p>
                    )}
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(emotion.intensity / 5) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: EMOTION_META[emotion.primary]?.color ?? "#888" }}
                        />
                      </div>
                      <span className="text-xs text-white/40">شدة {emotion.intensity}/5</span>
                    </div>
                  </div>

                  {/* Emotion breakdown bars */}
                  <div className="space-y-3">
                    <p className="text-xs text-white/40 font-medium mb-3">توزيع المشاعر</p>
                    {Object.entries(emotion.percentages)
                      .sort(([, a], [, b]) => b - a)
                      .filter(([, v]) => v > 0)
                      .map(([emo, pct]) => (
                        <EmotionBar
                          key={emo}
                          label={emo}
                          value={pct}
                          color={EMOTION_META[emo]?.color ?? "#888"}
                          emoji={EMOTION_META[emo]?.emoji ?? "🎭"}
                        />
                      ))}
                  </div>

                  {/* Sentiment badge */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-white/40">التوجه العام:</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      emotion.sentiment === "positive"
                        ? "bg-green-500/10 border-green-500/25 text-green-400"
                        : emotion.sentiment === "negative"
                        ? "bg-red-500/10 border-red-500/25 text-red-400"
                        : "bg-white/5 border-white/10 text-white/50"
                    }`}>
                      {emotion.sentiment === "positive" ? "😊 إيجابي" : emotion.sentiment === "negative" ? "😞 سلبي" : "😐 محايد"}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!translation && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-white/20 text-sm"
          >
            اختار طريقة الإدخال فوق وابدأ 🎭
          </motion.div>
        )}

        <footer className="mt-12 text-center text-white/20 text-xs">
          مترجم الميمز المصرية • مدعوم بـ Claude AI • مجاني 100%
        </footer>
      </div>
    </main>
  );
}