export type DemoScenario = "early-blight" | "low-confidence";
export type Prediction = {
  crop: "tomato";
  disease: "early-blight" | "inconclusive";
  confidence: number;
  symptoms: string[];
  prevention: string[];
  isMock: true;
};
export const LOW_CONFIDENCE_THRESHOLD = 60;
export function getMockPrediction(scenario: DemoScenario): Prediction {
  if (scenario === "low-confidence")
    return {
      crop: "tomato",
      disease: "inconclusive",
      confidence: 42,
      symptoms: [],
      prevention: [],
      isMock: true,
    };
  return {
    crop: "tomato",
    disease: "early-blight",
    confidence: 94,
    symptoms: ["symptom1", "symptom2"],
    prevention: ["tip1", "tip2", "tip3"],
    isMock: true,
  };
}
export function isLowConfidence(prediction: Prediction) {
  return prediction.confidence < LOW_CONFIDENCE_THRESHOLD;
}
export async function analyzeImage(scenario: DemoScenario): Promise<Prediction> {
  await new Promise((resolve) => setTimeout(resolve, 1300));
  return getMockPrediction(scenario);
}
export function validateImage(file: Pick<File, "type" | "size">) {
  return (
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
    file.size > 0 &&
    file.size <= 10 * 1024 * 1024
  );
}
