import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Leaf, ShieldCheck, Languages, Check, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Steps } from "@/components/agro/steps";
import { useLanguage } from "@/lib/i18n";
import { pageHead } from "@/lib/metadata";
import farm from "@/assets/farm-hero.jpg";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "AI-Based Crop Disease Detection",
      "Explore beginner-friendly crop disease screening with clearly labeled demo results in English, Hindi, and Marathi.",
    ),
  component: Home,
});
function Home() {
  const { t } = useLanguage();
  return (
    <main>
      <section className="hero">
        <img
          src={farm}
          width={1920}
          height={1024}
          className="hero-photo"
          alt="Healthy green crops growing in sunlit agricultural fields"
        />
        <div className="container hero-inner">
          <div className="hero-copy animate-enter">
            <span className="hero-kicker">
              <Leaf size={14} />
              {t("kicker")}
            </span>
            <h1>
              {t("heroTitle")}
              <br />
              <em>{t("heroEm")}</em>
            </h1>
            <p className="hero-description">{t("heroDesc")}</p>
            <div className="hero-cta">
              <Button variant="hero" size="hero" asChild>
                <Link to="/detect">
                  {t("start")}
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button variant="heroOutline" size="hero" asChild>
                <Link to="/about">
                  <Play size={15} />
                  {t("how")}
                </Link>
              </Button>
            </div>
            <p className="hero-footnote">
              <Check size={13} />
              {t("noAccount")}
              <span className="mx-2">•</span>
              {t("demoOnly")}
            </p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">{t("simple")}</span>
            <h2>{t("howTitle")}</h2>
            <p>{t("howDesc")}</p>
          </div>
          <Steps />
        </div>
      </section>
      <section className="trust-band">
        <div className="container trust-inner">
          <div className="trust-item">
            <Leaf size={20} />
            {t("easy")}
          </div>
          <div className="trust-item">
            <Languages size={20} />
            {t("languages")}
          </div>
          <div className="trust-item">
            <ShieldCheck size={20} />
            {t("private")}
          </div>
          <Button variant="link" asChild className="text-xs">
            <Link to="/detect">
              {t("start")}
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
