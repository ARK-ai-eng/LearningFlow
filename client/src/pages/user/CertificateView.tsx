import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Award } from "lucide-react";
// User info from trpc context

export default function CertificateView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  // Get user info from completion data (userName already in DB)
  const courseId = parseInt(id || "0");

  // Load course and latest exam completion
  const { data: course } = trpc.course.get.useQuery({ id: courseId }, { enabled: courseId > 0 });
  const { data: completion, isLoading } = trpc.exam.getLatestCompletion.useQuery(
    { courseId },
    { enabled: courseId > 0 }
  );

  const handleDownloadPDF = () => {
    if (!completion || !course) return;

    // Generate PDF on-the-fly (nicht speichern!)
    const pdf = generateCertificatePDF({
      userName: "Teilnehmer", // TODO: Get from user context
      courseName: course.title,
      score: completion.score,
      completedAt: new Date(completion.completedAt),
    });

    // Download PDF
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Zertifikat_${course.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!completion || !completion.passed) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Kein Zertifikat verfügbar</h2>
          <p className="text-muted-foreground mb-6">
            Du hast die Prüfung noch nicht bestanden oder noch nicht abgelegt.
          </p>
          <Button onClick={() => setLocation(`/course/${courseId}`)}>
            Zurück zum Kurs
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const expiresAt = new Date(completion.completedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation(`/course/${courseId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zum Kurs
        </Button>

        <div className="glass-card p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 mx-auto mb-6 flex items-center justify-center">
            <Award className="w-10 h-10 text-emerald-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">🎉 Herzlichen Glückwunsch!</h1>
          <p className="text-muted-foreground mb-8">
            Du hast die Prüfung erfolgreich bestanden.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold gradient-text">{completion.score}%</p>
              <p className="text-sm text-muted-foreground">Ergebnis</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{new Date(completion.completedAt).toLocaleDateString('de-DE')}</p>
              <p className="text-sm text-muted-foreground">Bestanden am</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{expiresAt.toLocaleDateString('de-DE')}</p>
              <p className="text-sm text-muted-foreground">Gültig bis</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6 text-left">
            <p className="text-sm text-amber-400">
              <strong>Wichtig:</strong> Das Zertifikat wird nicht gespeichert. 
              Bitte lade es jetzt herunter und bewahre es sicher auf.
            </p>
          </div>

          <Button 
            size="lg"
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto"
          >
            <Download className="w-5 h-5 mr-2" />
            Zertifikat herunterladen (PDF)
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============================================
// PDF GENERATION (On-the-fly, nicht gespeichert!)
// ============================================

function generateCertificatePDF(data: {
  userName: string;
  courseName: string;
  score: number;
  completedAt: Date;
}): string {
  const { userName, courseName, score, completedAt } = data;
  
  const expiresAt = new Date(completedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Simple PDF generation (using jsPDF or similar)
  // For now, return a placeholder text
  const certificateText = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           ZERTIFIKAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hiermit wird bescheinigt, dass

${userName}

die Schulung

"${courseName}"

erfolgreich abgeschlossen hat.

Prüfungsergebnis: ${score}%
Datum: ${completedAt.toLocaleDateString('de-DE')}

Gültig bis: ${expiresAt.toLocaleDateString('de-DE')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AISmarterFlow Academy
  `;

  return certificateText;
}
