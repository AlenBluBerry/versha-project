// Client-facing disease detection service.
// analyzeImage is a TanStack Start SERVER FUNCTION: it executes only on the
// server, so GEMINI_API_KEY never reaches the browser.
import { createServerFn } from "@tanstack/react-start";

export const LOW_CONFIDENCE_THRESHOLD = 60; // percent, matches existing UI behavior

export type Prediction = {
  isPlant: boolean;
  crop: string;
  disease: string;
  confidence: number; // 0–100 (integer), conservative
  severity: string;
  healthStatus: string;
  symptoms: string[];
  prevention: string[];
  treatment: string[];
  observations: string[];
  possibleCauses: string[];
  alternatives: { name: string; confidence: number }[];
  imageUsable: boolean;
  imageIssues: string[];
  limitations: string[];
  isMock: false;
};

export function isLowConfidence(prediction: Pick<Prediction, "confidence">) {
  return prediction.confidence < LOW_CONFIDENCE_THRESHOLD;
}

export function validateImage(file: Pick<File, "type" | "size">) {
  return (
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
    file.size > 0 &&
    file.size <= 10 * 1024 * 1024
  );
}

type ServerErrorShape = { code?: string; message?: string };

// --- Server function (runs only on the server) -----------------------------

const analyzeServer = createServerFn({ method: "POST" })
  .inputValidator((data: { image: File; language: string }) => data)
  .handler(async ({ data }): Promise<Prediction> => {
    const [{ validateAndReadImage, callGemini, resolveLanguage, AnalysisError }] =
      await Promise.all([import("@/server/gemini")]);
    try {
      const { base64, mimeType } = await validateAndReadImage(data.image);
      const language = resolveLanguage(data.language);
      const result = await callGemini(base64, mimeType, language);

      const toPercent = (c: number) => Math.round(Math.min(0.9, Math.max(0, c)) * 100);

      if (!result.isPlant || !result.imageQuality.usable) {
        return {
          isPlant: result.isPlant,
          crop: result.plant.commonName,
          disease: "Inconclusive",
          confidence: toPercent(result.diagnosis.primary.confidence),
          severity: "none",
          healthStatus: "uncertain",
          symptoms: [],
          prevention: [],
          treatment: [],
          observations: result.observations,
          possibleCauses: [],
          alternatives: [],
          imageUsable: result.imageQuality.usable,
          imageIssues: result.imageQuality.issues,
          limitations: result.limitations,
          isMock: false,
        };
      }

      const lowConfidence = result.diagnosis.primary.confidence < 0.5;
      return {
        isPlant: true,
        crop: result.plant.commonName,
        disease: lowConfidence ? "Inconclusive" : result.diagnosis.primary.name,
        confidence: toPercent(result.diagnosis.primary.confidence),
        severity: result.diagnosis.primary.severity,
        healthStatus: result.healthStatus,
        symptoms: result.symptoms,
        prevention: result.prevention,
        treatment: result.treatment,
        observations: result.observations,
        possibleCauses: result.possibleCauses,
        alternatives: result.diagnosis.alternatives,
        imageUsable: true,
        imageIssues: result.imageQuality.issues,
        limitations: result.limitations,
        isMock: false,
      };
    } catch (error) {
      if (error instanceof AnalysisError) {
        throw new Error(JSON.stringify({ code: error.code, message: error.message }));
      }
      throw new Error(
        JSON.stringify({
          code: "SERVER_ERROR",
          message: "Something went wrong while analyzing the image. Please try again.",
        }),
      );
    }
  });

// --- Client-facing wrapper --------------------------------------------------

export async function analyzeImage(file: File, language: string): Promise<Prediction> {
  try {
    return await analyzeServer({ data: { image: file, language } });
  } catch (error) {
    // Surface clean, server-shaped errors to the UI.
    const raw = error instanceof Error ? error.message : "";
    try {
      const parsed = JSON.parse(raw) as ServerErrorShape;
      if (parsed && typeof parsed.message === "string") {
        throw new Error(parsed.message);
      }
    } catch {
      // not JSON — fall through
    }
    throw new Error("Could not analyze this photo. Please try again.");
  }
}
