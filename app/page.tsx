"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { detectEmotions } from "@/lib/emotions";
import { translateMeme, getEmotionFromDictionary } from "@/lib/translations";
import { extractTextFromFile } from "@/lib/ocr";
import type { EmotionResult } from "@/lib/emotions";
import type { TranslationResult } from "@/lib/translations";

type Tab = "text" | "voice" | "media";

const EMOTION_META: Record<string, { emoji: string; color: string }> = {
  فرحان:   { emoji: "😄", color: "#FFD700" },
  غاضب:    { emoji: "😤", color: "#FF4444" },
  زعلان:   { emoji: "😢", color: "#6B8CFF" },
  ساخر:    { emoji: "😏", color: "#FF8C42" },
  متحمس:   { emoji: "🤩", color: "#00E5A0" },
  متضايق:  { emoji: "😒", color: "#C084FC" },
  خايف:    { emoji: "😰", color: "#94A3B8" },
  مبسوط:   { emoji: "😂", color: "#FB923C" },
};

const TONE_COLORS: Record<string, string> = {
  سخرية: "#FF8C42",
  غضب:   "#FF4444",
  فرح:   "#FFD700",
  حب:    "#F472B6",
  تحمس:  "#00E5A0",
  حزن:   "#6B8CFF",
  تعجب:  "#A78BFA",
  عادي:  "#94A3B8",
};

const EXAMPLES = [
  "متعملش فيها ناصح",
  "إيه ده يسطا",
  "أنا اتخنقت",
  "يا روح قلبي",
  "ده أنا مبسوطه",
  "كسرت بخاطري",
  "يا عم ده اكتشاف",
  "حاجة تجنن",
];

function Spinner() {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-white/15 border-t-violet-400 animate-spin flex-shrink-0" />
  );
}

function WaveViz({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10 my-3">
      {[...Array(14)].map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-150"
          style={{
            background: active ? "#a78bfa" : "rgba(167,139,250,.2)",
            height: active ? `${10 + ((i * 7 + 5) % 24)}px` : "3px",
            animation: active
              ? `waveBar .7s ease-in-out ${i * 0.055}s infinite alternate`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

function EmotionBar({ label, value, color, emoji }: {
  label: string; value: number; color: string; emoji: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <span className="text-lg w-6 text-center flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-white/55 font-semibold">{label}</span>
          <span className="text-xs font-black tabular-nums" style={{ color }}>{value}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}50, ${color})` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // text
  const [txt, setTxt] = useState("");

  // voice
  const [vState, setVState] = useState<"idle" | "rec" | "done">("idle");
  const [vText, setVText] = useState("");
  const [micPerm, setMicPerm] = useState<"unknown" | "granted" | "denied">("unknown");
  const recRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // media
  const [mFile, setMFile] = useState<File | null>(null);
  const [mUrl, setMUrl] = useState<string | null>(null);
  const [mExtracted, setMExtracted] = useState("");
  const [drag, setDrag] = useState(false);

  // results
  const [trans, setTrans] = useState<TranslationResult | null>(null);
  const [emo, setEmo] = useState<EmotionResult | null>(null);

  useEffect(() => {
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((s) => {
        setMicPerm(s.state === "granted" ? "granted" : s.state === "denied" ? "denied" : "unknown");
        s.onchange = () =>
          setMicPerm(s.state === "granted" ? "granted" : s.state === "denied" ? "denied" : "unknown");
      })
      .catch(() => {});
  }, []);

  // ── process ──────────────────────────────────────────────────────────────────
  function process(input: string) {
    if (!input.trim()) { setError("من فضلك أدخل نص أولاً"); return; }
    setLoading(true);
    setError(null);
    setTrans(null);
    setEmo(null);

    setTimeout(() => {
      try {
        const t = translateMeme(input);
        const e = t.found
          ? getEmotionFromDictionary(input)
          : detectEmotions(input);
        setTrans(t);
        setEmo(e);
      } catch (err: any) {
        setError(err?.message ?? "حصل خطأ");
      }
      setLoading(false);
    }, 500);
  }

  // ── voice ─────────────────────────────────────────────────────────────────────
  async function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("المتصفح مش بيدعم الصوت — استخدم Chrome أو Edge"); return; }
    setError(null); setTrans(null); setEmo(null); setVText("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicPerm("granted");
    } catch (err: any) {
      setMicPerm("denied");
      setError(
        err?.name === "NotAllowedError"
          ? "الميكروفون محجوب — اضغط أيقونة القفل في المتصفح واسمح"
          : err?.name === "NotFoundError"
          ? "مفيش ميكروفون على الجهاز ده"
          : "مش قادر يوصل للميكروفون: " + (err?.message ?? "")
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
      let t = "";
      for (let i = event.resultIndex; i < event.results.length; i++)
        t += event.results[i][0].transcript;
      if (t.trim()) setVText(t);
    };

    rec.onerror = (event: any) => {
      const msgs: Record<string, string> = {
        "not-allowed": "الميكروفون محجوب — سمح من إعدادات المتصفح",
        "no-speech": "مسمعتش صوت، جرب تاني",
        "audio-capture": "الميكروفون شغال مع تطبيق تاني",
        "network": "خطأ في الشبكة",
      };
      setError(msgs[event.error] ?? `خطأ: ${event.error}`);
      setVState("idle");
      stopStream();
    };

    rec.onend = () => { setVState("done"); stopStream(); };

    try { rec.start(); } catch (err: any) {
      setError("فشل التسجيل: " + (err?.message ?? ""));
      setVState("idle");
      stopStream();
    }
  }

  function stopVoice() { recRef.current?.stop(); stopStream(); setVState("done"); }
  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // ── media ─────────────────────────────────────────────────────────────────────
  function loadFile(file: File | null) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setError("الملف أكبر من 15MB"); return; }
    if (!file.type.startsWith("image/")) {
      setError("ارفع صورة بس — الفيديو مش متدعوم في النسخة دي");
      return;
    }
    setMFile(file);
    setMUrl(URL.createObjectURL(file));
    setMExtracted("");
    setTrans(null);
    setEmo(null);
    setError(null);
  }

  async function processMedia() {
    if (!mFile) { setError("ارفع صورة أولاً"); return; }
    setLoading(true);
    setError(null);
    setTrans(null);
    setEmo(null);
    setMExtracted("");

    try {
      const extracted = await extractTextFromFile(mFile);
      if (!extracted.trim()) throw new Error("مش لاقي نص في الصورة — جرب صورة أوضح");
      setMExtracted(extracted);
      const t = translateMeme(extracted);
      const e = t.found ? getEmotionFromDictionary(extracted) : detectEmotions(extracted);
      setTrans(t);
      setEmo(e);
    } catch (err: any) {
      setError(err?.message ?? "فشل تحليل الصورة");
    }
    setLoading(false);
  }

  // ── helpers ───────────────────────────────────────────────────────────────────
  const primMeta = emo ? (EMOTION_META[emo.primary] ?? { emoji: "🎭", color: "#888" }) : null;
  const toneColor = trans ? (TONE_COLORS[trans.tone] ?? "#94A3B8") : "#94A3B8";

  const tabCls = (id: Tab) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
      tab === id
        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
        : "bg-white/4 text-white/45 hover:bg-white/8 hover:text-white border border-white/8"
    }`;

  // ── JSX ───────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white" dir="rtl">
      <style>{`
        @keyframes waveBar { from { transform:scaleY(.3); } to { transform:scaleY(1); } }
        @keyframes shimmer { 100% { transform:translateX(200%); } }
        textarea:focus { outline:none; border-color:rgba(124,58,237,.5) !important; }
      `}</style>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-8 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[110px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-fuchsia-600/8 blur-[100px]" />
      </div>

      <div className="max-w-xl mx-auto px-4 py-10 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-9"
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-[11px] text-violet-300 mb-4 font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            مجاني 100% · بدون API · بدون إنترنت
          </div>
          <h1 className="text-[clamp(2rem,8vw,2.8rem)] font-black leading-[1.1] mb-3">
            <span className="text-white">مترجم </span>
            <span className="bg-gradient-to-l from-violet-400 to-fuchsia-400 text-transparent bg-clip-text">
              الميمز المصرية
            </span>
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
            ترجمة ذكية للهجة المصرية — نص أو صوت أو صور
            <br />
            <span className="text-violet-400">+ تحليل المشاعر بالنسبة المئوية 🧠</span>
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-5 flex-wrap">
          <button className={tabCls("text")}  onClick={() => setTab("text")} >✍️ نص</button>
          <button className={tabCls("voice")} onClick={() => setTab("voice")}>🎤 صوت</button>
          <button className={tabCls("media")} onClick={() => setTab("media")}>🖼️ صورة</button>
        </div>

        {/* Input card */}
        <motion.div
          layout
          className="bg-[#111118] border border-white/7 rounded-2xl p-5 mb-3 shadow-2xl shadow-black/50"
        >
          <AnimatePresence mode="wait">

            {/* TEXT */}
            {tab === "text" && (
              <motion.div key="text" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <p className="text-[11px] text-white/30 font-bold tracking-wider mb-2">اكتب الميم أو العبارة المصرية</p>
                <textarea
                  value={txt}
                  onChange={(e) => setTxt(e.target.value)}
                  onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") process(txt); }}
                  placeholder={"مثال: \"متعملش فيها ناصح\"\nأو: \"إيه ده يسطا!\"\nأو: \"أنا اتخنقت\""}
                  rows={4}
                  className="w-full bg-black/25 border border-white/7 rounded-xl p-4 text-white placeholder-white/18 resize-none text-[15px] leading-relaxed transition-colors font-[inherit]"
                />
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setTxt(ex)}
                      className="text-[11px] bg-white/3 border border-white/7 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300 px-2.5 py-1 rounded-full text-white/40 transition-all"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setTxt("")}
                    className="px-4 py-2.5 rounded-xl bg-white/4 border border-white/7 text-sm text-white/45 hover:bg-white/7 transition-all font-semibold"
                  >
                    مسح
                  </button>
                  <button
                    onClick={() => process(txt)}
                    disabled={loading}
                    className="mr-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm font-black shadow-lg shadow-violet-500/25 transition-all"
                  >
                    {loading ? <Spinner /> : "✨"}
                    {loading ? "بيترجم..." : "ترجم الميم"}
                  </button>
                </div>
                <p className="text-center text-[10px] text-white/15 mt-2">Ctrl + Enter</p>
              </motion.div>
            )}

            {/* VOICE */}
            {tab === "voice" && (
              <motion.div key="voice" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <p className="text-sm text-white/40 text-center mb-4 leading-relaxed">
                  اتكلم بالعربي المصري — هيترجم ويحلل مشاعرك
                  <br />
                  <span className="text-violet-400 text-xs">المتصفح هيطلب إذن الميكروفون أول مرة</span>
                </p>

                {micPerm === "denied" && (
                  <div className="mb-4 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200 text-center">
                    🔒 الميكروفون محجوب — اضغط أيقونة القفل في المتصفح واسمح
                  </div>
                )}

                <WaveViz active={vState === "rec"} />

                <p className={`text-center text-sm my-3 font-bold transition-colors ${vState === "rec" ? "text-red-400" : "text-white/30"}`}>
                  {vState === "idle" && "اضغط الزر وابدأ الكلام"}
                  {vState === "rec"  && "🔴 بيسمعك... اتكلم"}
                  {vState === "done" && "✅ خلصت — اضغط ترجم"}
                </p>

                <div className="flex justify-center mb-5">
                  {vState !== "rec" ? (
                    <button
                      onClick={startVoice}
                      disabled={loading || micPerm === "denied"}
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

                {vText && (
                  <div className="bg-black/20 border border-white/7 rounded-xl p-4 mb-4">
                    <p className="text-[11px] text-white/30 mb-1">اللي اتسمع:</p>
                    <p className="text-white text-sm leading-relaxed">{vText}</p>
                  </div>
                )}

                <div className="border-t border-white/7 pt-4">
                  <p className="text-[11px] text-white/25 text-center mb-2">أو اكتب يدوي</p>
                  <textarea
                    value={vText}
                    onChange={(e) => setVText(e.target.value)}
                    placeholder="اكتب هنا..."
                    rows={2}
                    className="w-full bg-black/20 border border-white/7 rounded-xl p-3 text-white placeholder-white/18 resize-none text-sm transition-colors font-[inherit]"
                  />
                </div>

                <button
                  onClick={() => process(vText)}
                  disabled={loading || !vText.trim()}
                  className="w-full mt-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-all"
                >
                  {loading ? <Spinner /> : "🎭"}
                  {loading ? "بيحلل..." : "ترجم وحلل المشاعر"}
                </button>
              </motion.div>
            )}

            {/* MEDIA */}
            {tab === "media" && (
              <motion.div key="media" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <p className="text-sm text-white/40 text-center mb-4">
                  ارفع صورة ميم — هيستخرج النص ويترجمه
                </p>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); loadFile(e.dataTransfer.files[0]); }}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                    ${drag ? "border-violet-500 bg-violet-500/10" : "border-white/10 hover:border-violet-500/40 hover:bg-white/[0.015]"}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => loadFile(e.target.files?.[0] ?? null)}
                  />
                  {mUrl ? (
                    <div className="space-y-2">
                      <img src={mUrl} alt="preview" className="max-h-44 mx-auto rounded-xl object-contain" />
                      <p className="text-[11px] text-white/30">{mFile?.name}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl mb-2">🖼️</p>
                      <p className="text-white/50 text-sm font-semibold">اسحب الصورة هنا أو اضغط للاختيار</p>
                      <p className="text-white/22 text-xs mt-1">JPG · PNG · WEBP · GIF (max 15MB)</p>
                    </>
                  )}
                </div>

                {mExtracted && (
                  <div className="mt-3 bg-black/20 border border-white/7 rounded-xl p-3">
                    <p className="text-[11px] text-white/30 mb-1">النص المستخرج:</p>
                    <p className="text-white/65 text-sm leading-relaxed">{mExtracted}</p>
                  </div>
                )}

                <button
                  onClick={processMedia}
                  disabled={loading || !mFile}
                  className="w-full mt-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-all"
                >
                  {loading ? <Spinner /> : "🔍"}
                  {loading ? "بيحلل الصورة..." : "استخرج وترجم"}
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity:0, y:6 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0 }}
                className="mt-4 bg-red-500/8 border border-red-500/20 rounded-xl p-3 text-sm text-red-300"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              className="bg-[#111118] border border-white/7 rounded-2xl p-5 mb-3"
            >
              <div className="flex items-center gap-3 mb-4">
                <Spinner />
                <p className="text-sm text-white/40">بيحلل الميم...</p>
              </div>
              {["w-3/4","w-1/2","w-5/6"].map((w, i) => (
                <div key={i} className={`h-3 ${w} rounded bg-white/6 mb-3 overflow-hidden relative`}>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/8 to-transparent animate-[shimmer_1.5s_infinite]" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {trans && !loading && (
            <motion.div
              initial={{ opacity:0, y:12 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              className="space-y-3"
            >
              {/* Not found warning */}
              {!trans.found && (
                <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200">
                  💡 العبارة دي مش موجودة في القاموس بالظبط — اللي جاي هو أقرب تحليل ممكن
                </div>
              )}

              {/* Translation */}
              <div className="bg-[#111118] border border-violet-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🎭</span>
                  <h2 className="font-black text-sm text-white">الترجمة</h2>
                  <span
                    className="mr-auto text-[11px] px-2.5 py-0.5 rounded-full border font-bold"
                    style={{
                      background: `${toneColor}15`,
                      borderColor: `${toneColor}30`,
                      color: toneColor,
                    }}
                  >
                    {trans.tone}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="bg-black/25 rounded-xl p-3.5">
                    <p className="text-[11px] text-white/30 mb-1">الأصل</p>
                    <p className="text-white/75 text-sm leading-relaxed">{trans.original}</p>
                  </div>
                  <div
                    className="rounded-xl p-3.5"
                    style={{ background:"rgba(124,58,237,.1)", border:"1px solid rgba(124,58,237,.18)" }}
                  >
                    <p className="text-[11px] text-violet-300/60 mb-1">الترجمة</p>
                    <p className="text-white font-bold text-[15px] leading-relaxed">{trans.translation}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(trans.translation)}
                      className="mt-2 text-[11px] text-violet-400/55 hover:text-violet-300 transition-colors"
                    >
                      📋 نسخ
                    </button>
                  </div>
                  {trans.explanation && (
                    <div className="bg-white/[0.025] rounded-xl p-3.5">
                      <p className="text-[11px] text-white/30 mb-1">الشرح</p>
                      <p className="text-white/55 text-xs leading-relaxed">{trans.explanation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emotion */}
              {emo && primMeta && (
                <div className="bg-[#111118] border border-white/7 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🧠</span>
                    <h2 className="font-black text-sm text-white">تحليل المشاعر</h2>
                  </div>

                  {/* Hero */}
                  <div
                    className="rounded-xl p-5 text-center mb-4 border"
                    style={{
                      background: `${primMeta.color}10`,
                      borderColor: `${primMeta.color}25`,
                    }}
                  >
                    <p className="text-5xl mb-2">{primMeta.emoji}</p>
                    <p className="text-2xl font-black mb-1" style={{ color: primMeta.color }}>
                      {emo.primary}
                    </p>
                    {emo.secondary && (
                      <p className="text-white/38 text-xs">+ {emo.secondary}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <div className="h-1.5 w-24 rounded-full bg-white/8 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(emo.intensity / 5) * 100}%` }}
                          transition={{ duration: 0.9 }}
                          className="h-full rounded-full"
                          style={{ background: primMeta.color }}
                        />
                      </div>
                      <span className="text-[11px] text-white/30 font-semibold">
                        شدة {emo.intensity}/5
                      </span>
                    </div>
                  </div>

                  {/* Bars */}
                  <p className="text-[11px] text-white/30 font-bold tracking-wider mb-3">توزيع المشاعر</p>
                  {Object.entries(emo.percentages)
                    .sort(([, a], [, b]) => b - a)
                    .filter(([, v]) => v > 0)
                    .map(([name, pct]) => (
                      <EmotionBar
                        key={name}
                        label={name}
                        value={pct}
                        color={EMOTION_META[name]?.color ?? "#888"}
                        emoji={EMOTION_META[name]?.emoji ?? "🎭"}
                      />
                    ))}

                  {/* Sentiment */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/7">
                    <span className="text-xs text-white/30">التوجه العام:</span>
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                        emo.sentiment === "positive"
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : emo.sentiment === "negative"
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : "bg-white/4 border-white/8 text-white/40"
                      }`}
                    >
                      {emo.sentiment === "positive"
                        ? "😊 إيجابي"
                        : emo.sentiment === "negative"
                        ? "😞 سلبي"
                        : "😐 محايد"}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty */}
        {!trans && !loading && !error && (
          <p className="text-center py-10 text-white/12 text-sm">
            اختار طريقة الإدخال وابدأ 🎭
          </p>
        )}

        <footer className="mt-12 text-center text-white/12 text-[11px]">
          مترجم الميمز المصرية · مجاني 100% · بدون API
        </footer>
      </div>
    </main>
  );
}