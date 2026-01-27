import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Award, Download, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { useState } from "react";

export default function Certificates() {
  const [, setLocation] = useLocation();
  const { data: certificates, isLoading } = trpc.certificate.my.useQuery();
  const generatePdf = trpc.certificate.generatePdf.useMutation();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (certId: number) => {
    setDownloadingId(certId);
    try {
      const result = await generatePdf.mutateAsync({ certificateId: certId });
      if (result.url) {
        // PDF in neuem Tab öffnen
        window.open(result.url, '_blank');
        toast.success("Zertifikat wird heruntergeladen");
      }
    } catch (error) {
      toast.error("Fehler beim Generieren des Zertifikats");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-3xl font-bold">Meine Zertifikate</h1>
          <p className="text-muted-foreground">
            Übersicht aller erworbenen Zertifikate
          </p>
        </div>

        {/* Certificates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-16 w-16 bg-muted rounded-xl mb-4" />
                <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : certificates && certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map(cert => {
              const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();
              
              return (
                <div key={cert.id} className={`glass-card p-6 ${isExpired ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      isExpired ? 'bg-red-500/10' : 'bg-emerald-500/10'
                    }`}>
                      <Award className={`w-8 h-8 ${isExpired ? 'text-red-400' : 'text-emerald-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {cert.courseName}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {cert.certificateNumber}
                      </p>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Ausgestellt: {new Date(cert.issuedAt).toLocaleDateString('de-DE')}
                        </span>
                        {cert.expiresAt && (
                          <span className={isExpired ? 'text-red-400' : ''}>
                            {isExpired ? 'Abgelaufen: ' : 'Gültig bis: '}
                            {new Date(cert.expiresAt).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleDownload(cert.id)}
                      disabled={downloadingId === cert.id}
                    >
                      {downloadingId === cert.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generiere PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          PDF herunterladen
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {isExpired && (
                    <div className="mt-3 p-3 bg-red-500/10 rounded-lg text-sm text-red-400">
                      Dieses Zertifikat ist abgelaufen. Bitte absolvieren Sie die Jahresprüfung erneut.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Noch keine Zertifikate</h3>
            <p className="text-muted-foreground mb-6">
              Schließen Sie einen Zertifizierungskurs ab, um Ihr erstes Zertifikat zu erhalten.
            </p>
            <Button onClick={() => setLocation('/dashboard')}>
              Zu den Kursen
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
