import { Leaf, ShieldCheck, CircleAlert, ArrowRight, ScanLine } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { isLowConfidence, type Prediction } from "@/services/diseaseDetection";

export function Result({ prediction }: { prediction: Prediction }) {
  const { t } = useLanguage();
  const low = isLowConfidence(prediction) || !prediction.isPlant || !prediction.imageUsable;

  if (!prediction.isPlant || !prediction.imageUsable) {
    return (
      <div className="animate-enter result-low">
        <span className="eyebrow">
          <CircleAlert size={13} />
          {t("notPlantBadge")}
        </span>
        <p className="result-label mt-5">{t("possibleDisease")}</p>
        <h2 className="result-disease">{t("uncertain")}</h2>
        <div className="demo-notice mb-0" role="status">
          <CircleAlert className="shrink-0" size={18} />
          <div>
            <h3 className="font-semibold mb-1">{t("lowBadge")}</h3>
            <p>
              {prediction.imageIssues.length
                ? prediction.imageIssues.join(" ")
                : t("notPlantMessage")}
            </p>
          </div>
        </div>
        <div className="result-list result-next-step">
          <h3>
            <ArrowRight size={16} className="text-primary" />
            {t("nextStep")}
          </h3>
          <p className="result-copy">{t("lowNextStep")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`animate-enter ${low ? "result-low" : ""}`}>
      <span className="eyebrow">
        <ScanLine size={13} />
        {t("aiAnalyzed")}
      </span>
      <p className="text-xs text-muted-foreground mt-5">
        {t("crop")} · {prediction.crop}
      </p>
      <p className="result-label">{t("possibleDisease")}</p>
      <h2 className="result-disease">{prediction.disease}</h2>
      <div className="confidence-row">
        <span>{t("confidence")}</span>
        <strong>{prediction.confidence}%</strong>
      </div>
      <div className="confidence-track">
        <progress max={100} value={prediction.confidence} aria-label={t("confidence")} />
      </div>
      {low ? (
        <>
          <div className="demo-notice mb-0" role="status">
            <CircleAlert className="shrink-0" size={18} />
            <div>
              <h3 className="font-semibold mb-1">{t("lowBadge")}</h3>
              <p>{t("lowMessage")}</p>
            </div>
          </div>
          <div className="result-list">
            <h3>
              <Leaf size={16} className="text-primary" />
              {t("symptoms")}
            </h3>
            <p className="result-copy">{t("notDetermined")}</p>
          </div>
          <div className="result-list">
            <h3>
              <ShieldCheck size={16} className="text-primary" />
              {t("prevention")}
            </h3>
            <p className="result-copy">{t("lowPrevention")}</p>
          </div>
        </>
      ) : (
        <>
          {prediction.observations.length > 0 && (
            <div className="result-list">
              <h3>
                <ScanLine size={16} className="text-primary" />
                {t("observations")}
              </h3>
              <ul>
                {prediction.observations.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="result-list">
            <h3>
              <Leaf size={16} className="text-primary" />
              {t("symptoms")}
            </h3>
            <ul>
              {prediction.symptoms.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          {prediction.treatment.length > 0 && (
            <div className="result-list">
              <h3>
                <ShieldCheck size={16} className="text-primary" />
                {t("treatment")}
              </h3>
              <ul>
                {prediction.treatment.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="result-list">
            <h3>
              <ShieldCheck size={16} className="text-primary" />
              {t("prevention")}
            </h3>
            <ul>
              {prediction.prevention.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          {prediction.alternatives.length > 0 && (
            <div className="result-list">
              <h3>
                <ArrowRight size={16} className="text-primary" />
                {t("alternatives")}
              </h3>
              <ul>
                {prediction.alternatives.map((a, i) => (
                  <li key={i}>
                    {a.name} · {Math.round(a.confidence * 100)}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <div className="result-list result-next-step">
        <h3>
          <ArrowRight size={16} className="text-primary" />
          {t("nextStep")}
        </h3>
        <p className="result-copy">{t(low ? "lowNextStep" : "nextStepDesc")}</p>
      </div>
      {prediction.limitations.length > 0 && (
        <p className="text-xs text-muted-foreground mt-4">{prediction.limitations[0]}</p>
      )}
    </div>
  );
}
