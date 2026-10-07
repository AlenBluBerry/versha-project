import { Upload, ScanLine, Sprout } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
export function Steps() {
  const { t } = useLanguage();
  const steps = [
    { icon: Upload, title: "uploadTitle", desc: "uploadDesc" },
    { icon: ScanLine, title: "analyzeTitle", desc: "analyzeDesc" },
    { icon: Sprout, title: "careTitle", desc: "careDesc" },
  ] as const;
  return (
    <div className="steps-grid">
      {steps.map((s, i) => (
        <article key={s.title} className="step-card">
          <div className="step-icon">
            <s.icon size={23} />
          </div>
          <span className="step-number">0{i + 1}</span>
          <h3>{t(s.title)}</h3>
          <p>{t(s.desc)}</p>
        </article>
      ))}
    </div>
  );
}
