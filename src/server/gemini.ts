// Server-only Gemini integration. Never import from client components.
import { GoogleGenAI, Type } from "@google/genai";
import {
  PLANT_ANALYSIS_SYSTEM_INSTRUCTION,
  isSupportedLanguage,
  type SupportedLanguage,
} from "./plantPrompt";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedMime = (typeof ALLOWED_MIME)[number];

const LOW_CONFIDENCE_THRESHOLD = 0.5;

export class AnalysisError extends Error {
  code:
    | "IMAGE_MISSING"
    | "IMAGE_INVALID"
    | "IMAGE_TOO_LARGE"
    | "IMAGE_UNSUPPORTED"
    | "API_KEY_MISSING"
    | "GEMINI_ERROR"
    | "GEMINI_TIMEOUT"
    | "GEMINI_MALFORMED"
    | "SERVER_ERROR";
  status: number;
  constructor(code: AnalysisError["code"], message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export type GeminiAnalysis = {
  isPlant: boolean;
  imageQuality: { usable: boolean; score: number; issues: string[] };
  plant: { commonName: string; scientificName: string | null; confidence: number };
  healthStatus: "healthy" | "diseased" | "pest" | "stressed" | "uncertain";
  diagnosis: {
    primary: { name: string; confidence: number; severity: string };
    alternatives: { name: string; confidence: number }[];
  };
  observations: string[];
  symptoms: string[];
  possibleCauses: string[];
  treatment: string[];
  prevention: string[];
  limitations: string[];
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isPlant: { type: Type.BOOLEAN },
    imageQuality: {
      type: Type.OBJECT,
      properties: {
        usable: { type: Type.BOOLEAN },
        score: { type: Type.NUMBER },
        issues: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["usable", "score", "issues"],
    },
    plant: {
      type: Type.OBJECT,
      properties: {
        commonName: { type: Type.STRING },
        scientificName: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
      },
      required: ["commonName", "confidence"],
    },
    healthStatus: { type: Type.STRING },
    diagnosis: {
      type: Type.OBJECT,
      properties: {
        primary: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            severity: { type: Type.STRING },
          },
          required: ["name", "confidence", "severity"],
        },
        alternatives: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
            },
            required: ["name", "confidence"],
          },
        },
      },
      required: ["primary", "alternatives"],
    },
    observations: { type: Type.ARRAY, items: { type: Type.STRING } },
    symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
    possibleCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
    treatment: { type: Type.ARRAY, items: { type: Type.STRING } },
    prevention: { type: Type.ARRAY, items: { type: Type.STRING } },
    limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "isPlant",
    "imageQuality",
    "plant",
    "healthStatus",
    "diagnosis",
    "observations",
    "symptoms",
    "possibleCauses",
    "treatment",
    "prevention",
    "limitations",
  ],
};

function clamp01(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.min(1, Math.max(0, v));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

/** Validate and normalize Gemini output into a safe, conservative shape. */
export function normalizeGeminiOutput(raw: unknown): GeminiAnalysis {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const imageQuality = (obj.imageQuality ?? {}) as Record<string, unknown>;
  const plant = (obj.plant ?? {}) as Record<string, unknown>;
  const diagnosis = (obj.diagnosis ?? {}) as Record<string, unknown>;
  const primary = (diagnosis.primary ?? {}) as Record<string, unknown>;

  const isPlant = obj.isPlant === true;
  const usable = imageQuality.usable === true && isPlant;

  const primaryConfidence = clamp01(primary.confidence);
  const lowConfidence = primaryConfidence < LOW_CONFIDENCE_THRESHOLD;

  return {
    isPlant,
    imageQuality: {
      usable,
      score: clamp01(imageQuality.score),
      issues: toStringArray(imageQuality.issues),
    },
    plant: {
      commonName: typeof plant.commonName === "string" ? plant.commonName : "Unknown plant",
      scientificName: typeof plant.scientificName === "string" ? plant.scientificName : null,
      confidence: clamp01(plant.confidence),
    },
    healthStatus: (["healthy", "diseased", "pest", "stressed", "uncertain"] as const).includes(
      obj.healthStatus as never,
    )
      ? (obj.healthStatus as GeminiAnalysis["healthStatus"])
      : "uncertain",
    diagnosis: {
      primary: {
        name:
          typeof primary.name === "string" && primary.name.trim()
            ? primary.name
            : "Inconclusive",
        confidence: primaryConfidence,
        severity: (["none", "mild", "moderate", "severe"] as const).includes(
          primary.severity as never,
        )
          ? (primary.severity as string)
          : "none",
      },
      alternatives: Array.isArray(diagnosis.alternatives)
        ? diagnosis.alternatives
            .map((a) => (a ?? {}) as Record<string, unknown>)
            .filter((a) => typeof a.name === "string")
            .map((a) => ({ name: a.name as string, confidence: clamp01(a.confidence) }))
        : [],
    },
    observations: toStringArray(obj.observations),
    symptoms: toStringArray(obj.symptoms),
    possibleCauses: toStringArray(obj.possibleCauses),
    treatment: toStringArray(obj.treatment),
    prevention: toStringArray(obj.prevention),
    limitations: toStringArray(obj.limitations),
  };
}

/**
 * Validate an uploaded image. Returns the base64 payload and MIME type.
 * NOTE: dimensions/corruption checks happen client-side in createThumbnail
 * (browser Image decode); server enforces MIME magic bytes + size.
 */
export async function validateAndReadImage(file: File): Promise<{
  base64: string;
  mimeType: AllowedMime;
}> {
  if (!file || file.size === 0) {
    throw new AnalysisError("IMAGE_MISSING", "No image was uploaded.", 400);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new AnalysisError(
      "IMAGE_TOO_LARGE",
      "Image is too large. Please upload an image under 10 MB.",
      413,
    );
  }
  const mime = file.type as AllowedMime;
  if (!ALLOWED_MIME.includes(mime)) {
    throw new AnalysisError(
      "IMAGE_UNSUPPORTED",
      "Please upload a clear JPG, PNG, or WebP plant image.",
      415,
    );
  }
  // Magic-byte sniffing — do not trust client MIME alone.
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isJpeg = head[0] === 0xff && head[1] === 0xd8;
  const isPng = head[0] === 0x89 && head[1] === 0x50;
  const isWebp =
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46; // "RIFF"
  const matchesDeclared =
    (mime === "image/jpeg" && isJpeg) ||
    (mime === "image/png" && isPng) ||
    (mime === "image/webp" && isWebp);
  if (!matchesDeclared) {
    throw new AnalysisError(
      "IMAGE_INVALID",
      "The uploaded file does not appear to be a valid image.",
      400,
    );
  }
  const buffer = await file.arrayBuffer();
  return { base64: Buffer.from(buffer).toString("base64"), mimeType: mime };
}

export async function callGemini(
  base64Image: string,
  mimeType: AllowedMime,
  language: SupportedLanguage,
): Promise<GeminiAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AnalysisError(
      "API_KEY_MISSING",
      "The analysis service is not configured. Please try again later.",
      500,
    );
  }
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const ai = new GoogleGenAI({ apiKey });

  const languageName =
    language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            {
              text: `Analyze this plant image. Write all user-facing explanatory text (observations, symptoms, possibleCauses, treatment, prevention, limitations) in ${languageName}. Field names stay in English.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: PLANT_ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });
    const text = response.text;
    if (!text) {
      throw new AnalysisError(
        "GEMINI_MALFORMED",
        "The analysis service returned an empty response.",
        502,
      );
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AnalysisError(
        "GEMINI_MALFORMED",
        "The analysis service returned an unreadable response.",
        502,
      );
    }
    return normalizeGeminiOutput(parsed);
  } catch (error) {
    if (error instanceof AnalysisError) throw error;
    const isAbort = error instanceof Error && error.name === "AbortError";
    const msg = error instanceof Error ? error.message : "";
    const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota");
    throw new AnalysisError(
      isAbort ? "GEMINI_TIMEOUT" : isRateLimit ? "GEMINI_ERROR" : "GEMINI_ERROR",
      isAbort
        ? "The analysis took too long. Please try again."
        : isRateLimit
          ? "The analysis service is busy right now. Please try again in a moment."
          : "The analysis service encountered an error. Please try again.",
      isAbort ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function resolveLanguage(value: unknown): SupportedLanguage {
  return isSupportedLanguage(value) ? value : "en";
}
