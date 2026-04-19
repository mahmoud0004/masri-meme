"use client";

import { extractTextFromImage, extractTextFromVideo } from "./ocr";

export type MediaTranscriptResult = {
  text: string;
  method: "image-ocr" | "video-audio" | "video-ocr";
  note: string;
};

type FFmpegModule = typeof import("@ffmpeg/ffmpeg");
type FFmpegUtilModule = typeof import("@ffmpeg/util");
type TransformersModule = typeof import("@xenova/transformers");

let ffmpegLoadPromise: Promise<InstanceType<FFmpegModule["FFmpeg"]>> | null = null;
let asrPipelinePromise: Promise<any> | null = null;

function cleanTranscript(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s?!،؛:.]/gu, " ")
    .replace(/\s+([?!،؛:.])/g, "$1")
    .trim();
}

function scoreTranscript(text: string) {
  const cleaned = cleanTranscript(text);
  if (!cleaned) return 0;

  const arabicCount = (cleaned.match(/[\u0600-\u06FF]/g) ?? []).length;
  const latinCount = (cleaned.match(/[A-Za-z]/g) ?? []).length;
  const digitCount = (cleaned.match(/\d/g) ?? []).length;
  const tokenCount = cleaned.split(/\s+/).filter(Boolean).length;

  return arabicCount * 4 + latinCount * 2 + tokenCount * 2 - digitCount * 2;
}

async function getFFmpeg() {
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);

      const ffmpeg = new FFmpeg();
      const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      return ffmpeg;
    })();
  }

  return ffmpegLoadPromise;
}

async function getAudioTranscriber() {
  if (!asrPipelinePromise) {
    asrPipelinePromise = (async () => {
      const { env, pipeline } = (await import("@xenova/transformers")) as TransformersModule;

      env.backends.onnx.wasm.proxy = false;

      return pipeline("automatic-speech-recognition", "Xenova/whisper-tiny");
    })();
  }

  return asrPipelinePromise;
}

async function decodeWaveform(data: Uint8Array) {
  const AudioContextCtor =
    window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error("This browser cannot decode audio files.");
  }

  const audioContext = new AudioContextCtor({ sampleRate: 16000 });

  try {
    const buffer = await audioContext.decodeAudioData(data.slice().buffer);

    if (buffer.numberOfChannels === 1) {
      return new Float32Array(buffer.getChannelData(0));
    }

    const channelData = [];
    for (let index = 0; index < buffer.numberOfChannels; index += 1) {
      channelData.push(buffer.getChannelData(index));
    }

    const mono = new Float32Array(buffer.length);
    for (let sample = 0; sample < buffer.length; sample += 1) {
      let total = 0;
      for (const channel of channelData) total += channel[sample];
      mono[sample] = total / channelData.length;
    }

    return mono;
  } finally {
    await audioContext.close();
  }
}

async function extractVideoWaveform(file: File) {
  const [ffmpeg, { fetchFile }] = await Promise.all([getFFmpeg(), import("@ffmpeg/util") as Promise<FFmpegUtilModule>]);
  const safeName = `input.${file.name.split(".").pop()?.toLowerCase() || "mp4"}`;
  const outputName = "audio.wav";

  await ffmpeg.writeFile(safeName, await fetchFile(file));

  try {
    const exitCode = await ffmpeg.exec([
      "-i",
      safeName,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-f",
      "wav",
      outputName,
    ]);

    if (exitCode !== 0) {
      throw new Error("FFmpeg could not extract the video audio.");
    }

    const data = await ffmpeg.readFile(outputName);
    if (!(data instanceof Uint8Array)) {
      throw new Error("The extracted audio could not be read.");
    }

    return decodeWaveform(data);
  } finally {
    await Promise.allSettled([ffmpeg.deleteFile(safeName), ffmpeg.deleteFile(outputName)]);
  }
}

async function transcribeVideoAudio(file: File) {
  const [waveform, transcriber] = await Promise.all([extractVideoWaveform(file), getAudioTranscriber()]);
  const result = await transcriber(waveform, {
    language: "arabic",
    task: "transcribe",
    return_timestamps: false,
    chunk_length_s: 20,
    stride_length_s: 4,
  });

  const text = cleanTranscript(Array.isArray(result) ? result[0]?.text ?? "" : result?.text ?? "");
  return text;
}

export async function extractTranscriptFromMedia(file: File): Promise<MediaTranscriptResult> {
  const rootType = file.type.split("/")[0];

  if (rootType === "image") {
    const text = cleanTranscript(await extractTextFromImage(file));
    return {
      text,
      method: "image-ocr",
      note: "What the app read from visible text in the uploaded image before interpretation.",
    };
  }

  if (rootType === "video") {
    try {
      const audioTranscript = await transcribeVideoAudio(file);
      if (scoreTranscript(audioTranscript) >= 10) {
        return {
          text: audioTranscript,
          method: "video-audio",
          note: "What the app heard and transcribed from the uploaded video before interpretation.",
        };
      }
    } catch {}

    const visualTranscript = cleanTranscript(await extractTextFromVideo(file));
    return {
      text: visualTranscript,
      method: "video-ocr",
      note: "Audio transcription was not usable, so the app fell back to visible subtitle text in the video frames.",
    };
  }

  throw new Error("Only images and videos are supported.");
}
