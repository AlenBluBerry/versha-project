import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { History, Trash2, ArrowRight, FlaskConical, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { PageHeading, DemoNotice } from "@/components/agro/site-shell";
import { Result } from "@/components/agro/result";
import { useLanguage } from "@/lib/i18n";
import { pageHead } from "@/lib/metadata";
import { readHistory, clearHistory, type Scan } from "@/services/scanHistory";
import { isLowConfidence } from "@/services/diseaseDetection";
export const Route = createFileRoute("/history")({
  head: () =>
    pageHead(
      "Scan History",
      "Review your simulated crop disease scans saved privately in this browser on this device.",
    ),
  component: HistoryPage,
});
function HistoryPage() {
  const { t, language } = useLanguage();
  const [scans, setScans] = useState<Scan[]>([]);
  const [selected, setSelected] = useState<Scan | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    setScans(readHistory());
  }, []);
  return (
    <main className="container page-main">
      <PageHeading title="history" description="historyDesc" />
      <DemoNotice />
      {scans.length ? (
        <>
          <div className="history-toolbar">
            <p className="text-sm text-muted-foreground">
              {scans.length} {t("count")}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 />
                  {t("clear")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("clearTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("clearDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (clearHistory()) {
                        setScans([]);
                        setError(false);
                      } else setError(true);
                    }}
                  >
                    {t("clear")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {error && (
            <p role="alert" className="error-message mb-4">
              {t("storageError")}
            </p>
          )}
          <div className="history-grid">
            {scans.map((scan) => (
              <article className="history-card" key={scan.id}>
                <img
                  src={scan.image}
                  width={480}
                  height={480}
                  alt={t("leafImage")}
                  loading="lazy"
                  className="history-image"
                />
                <div className="history-body">
                  <span className="eyebrow">
                    <FlaskConical size={12} />
                    {t("simulated")}
                  </span>
                  <p className="text-xs text-muted-foreground mt-4">{t("tomato")}</p>
                  <h2>{t(isLowConfidence(scan.prediction) ? "uncertain" : "disease")}</h2>
                  <div className="history-meta">
                    <span>
                      {new Date(scan.createdAt).toLocaleString(
                        language === "en" ? "en-IN" : `${language}-IN`,
                        { dateStyle: "medium", timeStyle: "short" },
                      )}
                    </span>
                    <strong className="text-primary">{scan.prediction.confidence}%</strong>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-5"
                    onClick={() => setSelected(scan)}
                  >
                    <Eye />
                    {t("details")}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-history">
          <History className="mx-auto text-primary" size={38} />
          <h2>{t("empty")}</h2>
          <p className="text-muted-foreground mb-6">{t("emptyDesc")}</p>
          <Button asChild>
            <Link to="/detect">
              {t("firstScan")}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("details")}</DialogTitle>
            <DialogDescription>{t("demoOnly")}</DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <img
                src={selected.image}
                width={480}
                height={480}
                alt={t("leafImage")}
                className="preview-image h-44"
              />
              <Result prediction={selected.prediction} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
