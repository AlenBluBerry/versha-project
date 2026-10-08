// ============================================================================
// Types & Constants
// ============================================================================

export type DemoScenario = "early-blight" | "low-confidence";

export type Prediction = {
  crop: "tomato";
  disease: "early-blight" | "inconclusive";
  confidence: number;
  symptoms: string[];
  prevention: string[];
  isMock: true;
};

export type AnalysisRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const LOW_CONFIDENCE_THRESHOLD = 60;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

// ============================================================================
// Validation
// ============================================================================

export function validateImage(file: Pick<File, "type" | "size">) {
  return (
    ALLOWED_TYPES.includes(file.type as any) &&
    file.size > 0 &&
    file.size <= MAX_FILE_SIZE
  );
}

// ============================================================================
// Image Processing
// ============================================================================

export async function compressImage(
  file: File,
  maxWidth = 1024,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Maintain aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Compression failed"));
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// Mock Predictions (Demo)
// ============================================================================

export function getMockPrediction(scenario: DemoScenario): Prediction {
  if (scenario === "low-confidence") {
    return {
      crop: "tomato",
      disease: "inconclusive",
      confidence: 42,
      symptoms: [],
      prevention: [],
      isMock: true,
    };
  }
  
  return {
    crop: "tomato",
    disease: "early-blight",
    confidence: 94,
    symptoms: [
      "Dark brown spots with concentric rings on lower leaves",
      "Yellowing tissue surrounding lesions",
      "Leaf curling and premature defoliation"
    ],
    prevention: [
      "Rotate crops with non-solanaceous plants for 2-3 years",
      "Apply mulch to prevent soil splash onto lower leaves",
      "Use drip irrigation instead of overhead watering",
      "Ensure proper spacing for air circulation"
    ],
    isMock: true,
  };
}

export function isLowConfidence(prediction: Prediction) {
  return prediction.confidence < LOW_CONFIDENCE_THRESHOLD;
}

// ============================================================================
// Analysis Functions
// ============================================================================

export async function analyzeImage(scenario: DemoScenario): Promise<Prediction> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 1300));
  return getMockPrediction(scenario);
}

export async function analyzePlant(
  file: File,
  scenario: DemoScenario = "early-blight"
): Promise<Prediction> {
  if (!validateImage(file)) {
    throw new Error("Invalid image file. Please upload a JPEG, PNG, or WebP under 10MB.");
  }

  // In production: compress and upload to your ML API
  // const compressed = await compressImage(file);
  // const formData = new FormData();
  // formData.append("image", compressed);
  // const response = await fetch("/api/analyze", { method: "POST", body: formData });
  // return response.json();

  return analyzeImage(scenario);
}

export async function analyzeRegion(
  file: File,
  region: AnalysisRegion,
  scenario: DemoScenario = "early-blight"
): Promise<Prediction> {
  if (!validateImage(file)) {
    throw new Error("Invalid image file");
  }

  // Validate region bounds
  if (region.width <= 0 || region.height <= 0) {
    throw new Error("Invalid region dimensions");
  }

  // In production: crop region and analyze
  // const cropped = await cropImage(file, region);
  
  return analyzeImage(scenario);
}

// ============================================================================
// Retry Logic
// ============================================================================

export async function retryAnalysis<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  backoff = 2
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const waitTime = delayMs * Math.pow(backoff, attempt);
        console.warn(`Analysis attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Analysis failed after ${maxRetries} attempts: ${lastError?.message}`);
}

// Convenience wrapper for plant analysis with retry
export async function analyzePlantWithRetry(
  file: File,
  scenario: DemoScenario = "early-blight",
  maxRetries = 3
): Promise<Prediction> {
  return retryAnalysis(
    () => analyzePlant(file, scenario),
    maxRetries,
    1500,
    2
  );
}
