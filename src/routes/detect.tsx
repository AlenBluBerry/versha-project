import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import {
  Upload,
  ImagePlus,
  X,
  ScanLine,
  ArrowRight,
  LoaderCircle,
  FlaskConical,
  Leaf,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeading, DemoNotice } from "@/components/agro/site-shell";
import { Result } from "@/components/agro/result";
import { useLanguage } from "@/lib/i18n";
import { pageHead } from "@/lib/metadata";
import {
  analyzeImage,
  validateImage,
  type Prediction,
  type DemoScenario,
} from "@/services/diseaseDetection";
import { createThumbnail, saveScan } from "@/services/scanHistory";
import sample from "@/assets/tomato-leaf.jpg";
export const Route = createFileRoute("/detect")({
  head: () =>
    pageHead(
      "Detect Disease",
      "Upload a crop leaf image and explore a simulated disease report. Demo only: no real AI analysis.",
    ),
  component: Detect,
});
function Detect() {
  const { t } = useLanguage();
  const input = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scenario, setScenario] = useState<DemoScenario>("early-blight");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function receive(file?: File) {
    if (!file || busy) return;
    setError("");
    if (!validateImage(file)) {
      setError("invalidFile");
      return;
    }
    try {
      const source = URL.createObjectURL(file);
      try {
        const thumbnail = await createThumbnail(source);
        if (!alive.current) return;
        setPhoto(thumbnail);
        setFileName(file.name);
        setPrediction(null);
        setSaved(null);
      } finally {
        URL.revokeObjectURL(source);
      }
    } catch {
      setError("badImage");
    }
    if (input.current) input.current.value = "";
  }
  function remove() {
    setPhoto(null);
    setPrediction(null);
    setSaved(null);
    setError("");
    if (input.current) input.current.value = "";
  }
  async function analyze() {
    if (!photo || busy) return;
    setBusy(true);
    setPrediction(null);
    setError("");
    try {
      const result = await analyzeImage(scenario);
      if (!alive.current) return;
      const image = await createThumbnail(photo);
      if (!alive.current) return;
      setPrediction(result);
      setSaved(
        saveScan({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          image,
          fileName,
          prediction: result,
        }),
      );
    } catch {
      if (alive.current) setError("fileError");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <main className="container page-main">
      <PageHeading title="detect" description="detectDesc" />
      <DemoNotice />
      <div className="detection-grid">
        <section className="tool-panel">
          <div className="panel-title">
            <h2>{t("leafImage")}</h2>
            <ImagePlus size={19} className="text-primary" />
          </div>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label={t("choose")}
            onChange={(e) => receive(e.target.files?.[0])}
            disabled={busy}
          />
          {photo ? (
            <>
              <img
                src={photo}
                width={480}
                height={480}
                className="preview-image"
                alt={t("leafImage")}
              />
              <div className="file-row">
                <Leaf size={15} />
                <span>{fileName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("change")}
                  title={t("change")}
                  onClick={remove}
                  disabled={busy}
                >
                  <X />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div
                className={`dropzone ${dragging ? "dragging" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={t("choose")}
                onClick={() => input.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    input.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  receive(e.dataTransfer.files[0]);
                }}
              >
                <div className="step-icon">
                  <Upload size={28} />
                </div>
                <strong>{t("drag")}</strong>
                <p>{t("or")}</p>
                <span className="text-primary font-semibold text-xs flex gap-2 items-center">
                  {t("choose")}
                  <ArrowRight size={14} />
                </span>
                <p>{t("formats")}</p>
              </div>
              <Button
                variant="link"
                className="w-full mt-3 text-xs"
                onClick={() => {
                  setPhoto(sample);
                  setFileName(t("sample"));
                  setError("");
                  setPrediction(null);
                  setSaved(null);
                }}
                disabled={busy}
              >
                <Leaf />
                {t("trySample")}
              </Button>
            </>
          )}
          {error && (
            <p role="alert" className="error-message">
              {t(error as "invalidFile")}
            </p>
          )}
          <label className="form-label" htmlFor="scenario">
            {t("scenario")}
          </label>
          <Select
            value={scenario}
            onValueChange={(v) => {
              setScenario(v as DemoScenario);
              setPrediction(null);
              setSaved(null);
            }}
            disabled={busy}
          >
            <SelectTrigger id="scenario" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="early-blight">{t("regular")}</SelectItem>
              <SelectItem value="low-confidence">{t("low")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="lg"
            className="analyze-button h-12"
            disabled={!photo || busy}
            onClick={analyze}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <ScanLine />}
            {t(busy ? "analyzing" : "analyze")}
          </Button>
        </section>
        <section className="tool-panel" aria-live="polite" aria-busy={busy}>
          <div className="panel-title">
            <h2>{t("result")}</h2>
            <FlaskConical size={19} className="text-muted-foreground" />
          </div>
          {prediction ? (
            <>
              <Result prediction={prediction} />
              <p className="text-xs text-muted-foreground mt-6">
                {t(saved ? "saved" : "notSaved")}
              </p>
              <div className="flex gap-2 flex-wrap mt-5">
                <Button variant="outline" onClick={remove}>
                  <ImagePlus />
                  {t("newScan")}
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/history">
                    <History />
                    {t("viewHistory")}
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="result-empty">
              <div className="step-icon">
                {busy ? (
                  <LoaderCircle size={24} className="animate-spin" />
                ) : (
                  <ScanLine size={24} />
                )}
              </div>
              <h3>{t(busy ? "analyzing" : "awaiting")}</h3>
              <p>{t("awaitingDesc")}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
