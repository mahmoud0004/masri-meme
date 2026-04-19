import * as Tesseract from "tesseract.js";

async function recognizeSource(source: string) {
  const { data } = await Tesseract.recognize(source, "ara", {
    logger: (message: { progress?: number; status?: string }) => {
      if (message.progress !== undefined) {
        console.log("OCR:", message.status, message.progress);
      }
    },
  });

  return data.text.trim();
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

    const checkpoints = [0.2, 0.5, 0.8].map((ratio) => (video.duration || 1) * ratio);
    const results: string[] = [];

    for (const checkpoint of checkpoints) {
      const frame = await captureFrame(video, checkpoint);
      const text = await recognizeSource(frame);
      if (text) results.push(text);
    }

    return results.sort((a, b) => b.length - a.length)[0] ?? "";
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
