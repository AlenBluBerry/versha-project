import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sprout, Languages, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, DemoNotice } from "@/components/agro/site-shell";
import { Steps } from "@/components/agro/steps";
import { useLanguage } from "@/lib/i18n";
import { pageHead } from "@/lib/metadata";
import farm from "@/assets/farm-hero.jpg";
export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "About AgroVision AI",
      "Learn about our crop health screening concept, how the demo works, and our commitment to accessible agricultural information.",
    ),
  component: About,
});
function About() {
  const { t } = useLanguage();
  const values = [
    { icon: Sprout, title: "mission", desc: "missionDesc" },
    { icon: Languages, title: "accessible", desc: "accessibleDesc" },
    { icon: ShieldCheck, title: "honest", desc: "honestDesc" },
  ] as const;
  return (
    <main className="container page-main">
      <PageHeading title="about" description="aboutDesc" />
      <div className="about-intro">
        <div className="about-text">
          <span className="eyebrow">{t("purpose")}</span>
          <h2>{t("aboutTitle")}</h2>
          <p>{t("aboutText")}</p>
          <p>{t("aboutText2")}</p>
          <Button asChild className="mt-6">
            <Link to="/detect">
              {t("start")}
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <img
          src={farm}
          width={1920}
          height={1024}
          alt="Sunlit farm with healthy green crop rows"
          className="about-image"
        />
      </div>
      <div className="steps-grid about-values">
        {values.map((v) => (
          <article key={v.title} className="step-card">
            <div className="step-icon">
              <v.icon size={24} />
            </div>
            <h3>{t(v.title)}</h3>
            <p>{t(v.desc)}</p>
          </article>
        ))}
      </div>
      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">{t("simple")}</span>
          <h2>{t("howTitle")}</h2>
        </div>
        <Steps />
      </section>
      <DemoNotice />
    </main>
  );
}
