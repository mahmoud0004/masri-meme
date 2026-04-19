import * as Tesseract from "tesseract.js";

const UI_NOISE_PATTERNS = [
  /for you/i,
  /following/i,
  /explore/i,
  /friends/i,
  /profile/i,
  /inbox/i,
  /home/i,
  /live/i,
  /search/i,
  /png|jpg|jpeg|mp4|mov/i,
  /^\d{1,2}:\d{2}/,
  /^\d+\s*%$/,
];

function scoreTextLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return -100;

  const arabicCount = (trimmed.match(/[\u0600-\u06FF]/g) ?? []).length;
  const latinCount = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  const digitCount = (trimmed.match(/\d/g) ?? []).length;
  const symbolCount = (trimmed.match(/[^\p{L}\p{N}\s]/gu) ?? []).length;
  const noisePenalty = UI_NOISE_PATTERNS.some((pattern) => pattern.test(trimmed)) ? 25 : 0;
  const shortPenalty = trimmed.length < 4 ? 12 : 0;

  return arabicCount * 4 + latinCount * 1.5 - digitCount * 2 - symbolCount * 1.5 - noisePenalty - shortPenalty;
}

function cleanRecognizedText(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const kept = lines.filter((line) => scoreTextLine(line) >= 6);
  const unique = Array.from(new Set((kept.length ? kept : lines).map((line) => line.trim())));

  return unique.join("\n").trim();
}

function scoreFullText(text: string) {
  return text
    .split(/\r?\n/)
    .reduce((total, line) => total + Math.max(scoreTextLine(line), 0), 0);
}

async function preprocessImageSource(source: string) {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, img.width * scale);
      canvas.height = Math.max(1, img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to create OCR canvas"));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let index = 0; index < data.length; index += 4) {
        const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
        const boosted = gray > 165 ? 255 : gray < 95 ? 0 : gray;
        data[index] = boosted;
        data[index + 1] = boosted;
        data[index + 2] = boosted;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to load image for OCR"));
    img.src = source;
  });
}

async function cropImageSource(
  source: string,
  crop: { x: number; y: number; width: number; height: number },
) {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(img.width * crop.width));
      canvas.height = Math.max(1, Math.floor(img.height * crop.height));

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to create crop canvas"));
        return;
      }

      ctx.drawImage(
        img,
        Math.floor(img.width * crop.x),
        Math.floor(img.height * crop.y),
        Math.floor(img.width * crop.width),
        Math.floor(img.height * crop.height),
        0,
        0,
        canvas.width,
        canvas.height,
      );

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to crop image"));
    img.src = source;
  });
}

async function buildRecognitionVariants(source: string) {
  const variants = [source];

  const crops = [
    { x: 0.12, y: 0.1, width: 0.76, height: 0.78 },
    { x: 0.16, y: 0.12, width: 0.68, height: 0.32 },
    { x: 0.1, y: 0.58, width: 0.8, height: 0.22 },
  ];

  for (const crop of crops) {
    try {
      variants.push(await cropImageSource(source, crop));
    } catch {}
  }

  const preprocessed: string[] = [];
  for (const variant of variants) {
    try {
      preprocessed.push(await preprocessImageSource(variant));
    } catch {
      preprocessed.push(variant);
    }
  }

  return Array.from(new Set([...variants, ...preprocessed]));
}

async function recognizeSource(source: string) {
  const attempts = await buildRecognitionVariants(source);
  const results: string[] = [];

  for (const item of attempts) {
    const { data } = await Tesseract.recognize(item, "ara+eng", {
      logger: (message: { progress?: number; status?: string }) => {
        if (message.progress !== undefined) {
          console.log("OCR:", message.status, message.progress);
        }
      },
    });

    const text = cleanRecognizedText(data.text.replace(/[|]/g, " "));

    if (text) results.push(text);
  }

  return results.sort((a, b) => scoreFullText(b) - scoreFullText(a))[0] ?? "";
}

export async function extractTextFromImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        resolve(await recognizeSource(event.target?.result as string));
      } catch {
        reject(new Error("Failed to extract text from image"));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function captureFrame(video: HTMLVideoElement, atSeconds: number) {
  return new Promise<string>((resolve, reject) => {
    const canvas = document.createElement("canvas");

    const handleSeeked = () => {
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to create video frame canvas"));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };

    video.currentTime = Math.max(0, Math.min(atSeconds, Math.max((video.duration || 0) - 0.1, 0)));
    video.addEventListener("seeked", handleSeeked, { once: true });
  });
}

export async function extractTextFromVideo(file: File): Promise<string> {
  const url = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load video"));
    });

    const checkpoints = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((ratio) => (video.duration || 1) * ratio);
    const results: string[] = [];

    for (const checkpoint of checkpoints) {
      const frame = await captureFrame(video, checkpoint);
      const text = await recognizeSource(frame);
      if (text && text.length > 1) results.push(text);
    }

    const unique = Array.from(new Set(results.map((item) => item.trim()))).sort((a, b) => b.length - a.length);
    return unique[0] ?? "";
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const type = file.type.split("/")[0];

  if (type === "image") return extractTextFromImage(file);
  if (type === "video") return extractTextFromVideo(file);

  throw new Error("Only images and videos are supported");
}
