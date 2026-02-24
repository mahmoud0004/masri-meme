import * as Tesseract from "tesseract.js";

export async function extractTextFromImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const { data } = await Tesseract.recognize(
          e.target?.result as string,
          "ara",
          { logger: (m: any) => console.log("OCR:", m.progress) }
        );
        resolve(data.text);
      } catch {
        reject(new Error("فشل استخراج النص من الصورة"));
      }
    };
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
    reader.readAsDataURL(file);
  });
}

export async function extractTextFromFile(file: File): Promise<string> {
  const type = file.type.split("/")[0];
  if (type === "image") return extractTextFromImage(file);
  throw new Error("ارفع صورة بس — الفيديو مش متدعوم في النسخة دي");
}