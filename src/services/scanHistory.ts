import type { Prediction } from "./diseaseDetection";

export type Scan = {
  id: string;
  createdAt: string;
  image: string;
  fileName: string;
  prediction: Prediction;
};

const KEY = "agrovision-demo-scans";

function isValidPrediction(value: unknown): value is Prediction {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.crop === "string" &&
    typeof p.disease === "string" &&
    typeof p.confidence === "number" &&
    Array.isArray(p.symptoms) &&
    Array.isArray(p.prevention) &&
    p.isMock === false
  );
}

export function readHistory(): Scan[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is Scan =>
        !!item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.image === "string" &&
        typeof item.fileName === "string" &&
        isValidPrediction(item.prediction),
    );
  } catch {
    return [];
  }
}

export function saveScan(scan: Scan) {
  try {
    localStorage.setItem(KEY, JSON.stringify([scan, ...readHistory()]));
    return true;
  } catch {
    return false;
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

export function createThumbnail(source: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 480 / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    image.onerror = () => reject(new Error("Invalid image"));
    image.src = source;
  });
}
