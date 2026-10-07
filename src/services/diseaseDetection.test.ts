import { describe, it, expect } from "vitest";
import { getMockPrediction, isLowConfidence, validateImage } from "./diseaseDetection";
import { readHistory, saveScan, clearHistory } from "./scanHistory";
describe("Demo crop detection", () => {
  it("provides crop, disease, confidence, symptoms and prevention in a mock result", () => {
    const p = getMockPrediction("early-blight");
    expect(p).toMatchObject({
      crop: "tomato",
      disease: "early-blight",
      confidence: 94,
      isMock: true,
    });
    expect(p.symptoms).toHaveLength(2);
    expect(p.prevention).toHaveLength(3);
  });
  it("marks the low-confidence scenario as inconclusive", () => {
    const p = getMockPrediction("low-confidence");
    expect(p.confidence).toBe(42);
    expect(p.disease).toBe("inconclusive");
    expect(isLowConfidence(p)).toBe(true);
    expect(isLowConfidence(getMockPrediction("early-blight"))).toBe(false);
  });
  it("accepts supported image uploads and rejects non-images", () => {
    expect(validateImage({ type: "image/jpeg", size: 1024 })).toBe(true);
    expect(validateImage({ type: "application/pdf", size: 1024 })).toBe(false);
    expect(validateImage({ type: "image/png", size: 11 * 1024 * 1024 })).toBe(false);
  });
  it("stores and reads previous demo scans using localStorage", () => {
    clearHistory();
    const scan = {
      id: "test-scan",
      createdAt: "2026-10-07T16:52:00Z",
      image: "data:image/jpeg;base64,test",
      fileName: "leaf.jpg",
      prediction: getMockPrediction("early-blight"),
    };
    expect(saveScan(scan)).toBe(true);
    expect(readHistory()).toEqual([scan]);
    expect(clearHistory()).toBe(true);
    expect(readHistory()).toEqual([]);
  });
  it("recovers from malformed local demo history", () => {
    localStorage.setItem("agrovision-demo-scans", "invalid");
    expect(readHistory()).toEqual([]);
    clearHistory();
  });
});
