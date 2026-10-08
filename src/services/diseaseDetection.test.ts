import { describe, it, expect } from "vitest";
import { isLowConfidence, validateImage } from "./diseaseDetection";
import { readHistory, saveScan, clearHistory } from "./scanHistory";
import type { Prediction } from "./diseaseDetection";

const realPrediction: Prediction = {
  isPlant: true,
  crop: "Tomato",
  disease: "Early Blight",
  confidence: 72,
  severity: "moderate",
  healthStatus: "diseased",
  symptoms: ["Brown lesions", "Yellowing"],
  prevention: ["Avoid overhead watering"],
  treatment: ["Remove affected leaves"],
  observations: ["Concentric lesions visible"],
  possibleCauses: ["Fungal infection"],
  alternatives: [{ name: "Septoria Leaf Spot", confidence: 0.18 }],
  imageUsable: true,
  imageIssues: [],
  limitations: ["Image-based analysis is not laboratory certainty"],
  isMock: false,
};

describe("Disease detection service", () => {
  it("accepts supported image uploads and rejects non-images", () => {
    expect(validateImage({ type: "image/jpeg", size: 1024 })).toBe(true);
    expect(validateImage({ type: "application/pdf", size: 1024 })).toBe(false);
    expect(validateImage({ type: "image/png", size: 11 * 1024 * 1024 })).toBe(false);
  });

  it("flags low-confidence predictions below the threshold", () => {
    expect(isLowConfidence({ confidence: 42 })).toBe(true);
    expect(isLowConfidence({ confidence: 88 })).toBe(false);
  });

  it("stores and reads real scans using localStorage", () => {
    clearHistory();
    const scan = {
      id: "test-scan",
      createdAt: "2026-10-07T16:52:00Z",
      image: "data:image/jpeg;base64,test",
      fileName: "leaf.jpg",
      prediction: realPrediction,
    };
    expect(saveScan(scan)).toBe(true);
    expect(readHistory()).toEqual([scan]);
    expect(clearHistory()).toBe(true);
    expect(readHistory()).toEqual([]);
  });

  it("recovers from malformed local history", () => {
    localStorage.setItem("agrovision-demo-scans", "invalid");
    expect(readHistory()).toEqual([]);
    clearHistory();
  });

  it("filters out legacy mock scans", () => {
    clearHistory();
    localStorage.setItem(
      "agrovision-demo-scans",
      JSON.stringify([
        {
          id: "old",
          createdAt: "2026-01-01T00:00:00Z",
          image: "data:image/jpeg;base64,old",
          fileName: "old.jpg",
          prediction: {
            crop: "tomato",
            disease: "early-blight",
            confidence: 94,
            symptoms: [],
            prevention: [],
            isMock: true,
          },
        },
      ]),
    );
    expect(readHistory()).toEqual([]);
    clearHistory();
  });
});
