import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, CheckCircle2, Cpu, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const methods = ["PyMuPDF", "OCR", "HYBRID"] as const;

const ProcessingPage = () => {
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [method, setMethod] = useState<typeof methods[number]>("PyMuPDF");
  const [totalPages] = useState(24);
  const [countdown, setCountdown] = useState(3);
  const startTime = useRef(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        const next = prev + Math.random() * 3;
        setCurrentPage(Math.min(Math.ceil((next / 100) * totalPages), totalPages));
        if (next > 40 && next < 70) setMethod("OCR");
        else if (next >= 70) setMethod("HYBRID");
        return Math.min(next, 100);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [totalPages]);

  const isComplete = progress >= 100;

  useEffect(() => {
    if (!isComplete) return;
    if (countdown <= 0) { navigate("/result"); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isComplete, countdown, navigate]);

  const elapsed = Math.max(1, (Date.now() - startTime.current) / 1000);
  const estimatedTotal = progress > 5 ? (elapsed / progress) * 100 : null;
  const remaining = estimatedTotal ? Math.max(0, estimatedTotal - elapsed) : null;

  const methodBadge: Record<string, string> = {
    PyMuPDF: "bg-primary/8 text-primary border-primary/25",
    OCR:     "bg-accent/8 text-accent border-accent/25",
    HYBRID:  "bg-success/8 text-success border-success/25",
  };

  const stages = [
    { label: "Файл уншиж байна",             threshold: 20 },
    { label: "Текст ялгаж байна",             threshold: 50 },
    { label: "Шинж чанар тооцоолж байна",     threshold: 80 },
    { label: "AI таамаглал гаргаж байна",     threshold: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="pb-5 border-b border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
          <span>PitchAI</span><ChevronRight className="h-3 w-3" /><span className="text-foreground font-medium">Боловсруулалт</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Боловсруулалт</h1>
        <p className="text-sm text-muted-foreground mt-1">PDF файлыг задлан шинжилж байна</p>
      </div>

      {/* Main progress */}
      <Card className="border-border shadow-md bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {isComplete ? (
              <><CheckCircle2 className="h-5 w-5 text-success" /> Боловсруулалт дууслаа</>
            ) : (
              <><Loader2 className="h-5 w-5 text-primary animate-spin" /> Боловсруулж байна...</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Ерөнхий явц</span>
              <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <FileText className="h-3.5 w-3.5" /> Одоогийн хуудас
              </div>
              <p className="text-xl font-bold text-foreground">{currentPage}<span className="text-muted-foreground text-sm font-normal">/{totalPages}</span></p>
            </div>
            <div className="rounded border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <Cpu className="h-3.5 w-3.5" /> Ашиглаж буй арга
              </div>
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${methodBadge[method]}`}>{method}</Badge>
            </div>
            <div className="rounded border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <Clock className="h-3.5 w-3.5" /> {isComplete ? "Төлөв" : "Үлдсэн хугацаа"}
              </div>
              {isComplete
                ? <p className="text-sm font-semibold text-success">Дууссан</p>
                : <p className="text-sm font-semibold text-foreground">{remaining !== null ? `~${Math.ceil(remaining)}с` : "..."}</p>}
            </div>
          </div>

          {isComplete && (
            <div className="rounded border border-success/25 bg-success/5 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Боловсруулалт амжилттай дууслаа</p>
                <p className="text-xs text-muted-foreground mt-0.5">{countdown} секундын дараа автоматаар шилжинэ...</p>
              </div>
              <Button onClick={() => navigate("/result")} size="sm" className="bg-primary hover:bg-primary/90 text-white shrink-0">
                Үр дүнг харах
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage timeline */}
      <Card className="border-border shadow-md bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Үе шатууд</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {stages.map((s, i) => {
              const done   = progress >= s.threshold;
              const active = !done && (i === 0 || progress >= stages[i - 1].threshold);
              return (
                <div key={s.label} className="flex items-center gap-3 py-1">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-smooth ${
                    done   ? "bg-success text-white" :
                    active ? "bg-primary text-white animate-pulse-glow" :
                             "bg-muted text-muted-foreground"
                  }`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm ${done || active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                  {done && <CheckCircle2 className="h-3.5 w-3.5 text-success ml-auto shrink-0" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingPage;
