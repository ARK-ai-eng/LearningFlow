import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Award, Download, Calendar, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Certificates() {
  const [, setLocation] = useLocation();
  const { data: certificates, isLoading } = trpc.certificate.my.useQuery();

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
            {certificates.map(cert => (
              <div key={cert.id} className="glass-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Award className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      Zertifikat
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {cert.certificateNumber}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(cert.issuedAt).toLocaleDateString('de-DE')}
                      </span>
                      {cert.expiresAt && (
                        <span>
                          Gültig bis: {new Date(cert.expiresAt).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    PDF herunterladen
                  </Button>
                </div>
              </div>
            ))}
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
