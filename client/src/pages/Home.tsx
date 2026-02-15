import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
// OAuth entfernt - alle nutzen /login
import { useLocation, useSearch } from "wouter";
import { useEffect, useState } from "react";
import { GraduationCap, Shield, Award, ArrowRight, Sparkles, AlertCircle, X, Briefcase, Rocket, Smartphone, Palette } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // exchangeToken läuft jetzt über REST, nicht mehr über tRPC

  // Check for exchange_token or error parameter in URL - runs ONCE on mount
  useEffect(() => {
    // Direkt window.location.search verwenden statt wouter hook
    const params = new URLSearchParams(window.location.search);
    const exchangeToken = params.get("exchange_token");
    const error = params.get("error");
    
    console.log("[Home] URL params:", { exchangeToken: !!exchangeToken, error });
    
    // Exchange-Token verarbeiten
    if (exchangeToken) {
      console.log("[Home] Processing exchange token...");
      // URL sofort bereinigen
      window.history.replaceState({}, "", "/");
      
      // REST-Call für Auth-Bootstrap (nicht tRPC!)
      fetch("/api/auth/exchange-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchangeToken }),
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("[Home] Exchange response:", data);
          if (data.success) {
            // Seite neu laden um Auth-State zu aktualisieren
            window.location.href = "/";
          } else {
            setShowError(true);
            setErrorMessage(data.error || "Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
          }
        })
        .catch((err) => {
          console.error("[Home] Exchange error:", err);
          setShowError(true);
          setErrorMessage("Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
        });
      return;
    }
    
    if (error === "no_invitation") {
      setShowError(true);
      setErrorMessage("Sie haben keine gültige Einladung. Bitte wenden Sie sich an Ihren Administrator, um eine Einladung zu erhalten.");
      window.history.replaceState({}, "", "/");
    }
  }, []); // Empty deps - run once on mount

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'sysadmin') {
        setLocation('/admin');
      } else if (user.role === 'companyadmin') {
        setLocation('/company');
      } else {
        setLocation('/dashboard');
      }
    }
  }, [isAuthenticated, user, setLocation]);

  // Show nothing while redirecting
  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Error Banner */}
      {showError && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-destructive/90 text-destructive-foreground p-4">
          <div className="container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button 
              onClick={() => setShowError(false)}
              className="p-1 hover:bg-destructive-foreground/10 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className={`relative overflow-hidden ${showError ? 'pt-16' : ''}`}>
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        
        {/* Navigation */}
        <nav className="relative z-10 container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">LearningFlow</span>
            </div>
            <Button 
              onClick={() => setLocation('/login')}
              className="bg-primary hover:bg-primary/90"
            >
              Anmelden
            </Button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">KI-gestützte Compliance-Schulungen</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Compliance-Schulungen
              <span className="block gradient-text text-glow">neu gedacht</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Moderne Lernplattform für Datenschutz, IT-Sicherheit und Compliance. 
              Interaktive Kurse, Zertifizierungen und Jahresprüfungen für Ihr Unternehmen.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => setLocation('/login')}
                className="bg-primary hover:bg-primary/90 text-lg px-8"
              >
                Jetzt starten
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Kurstypen für jeden Bedarf</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Von optionalen Lernmodulen bis zu zertifizierten Pflichtschulungen
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Learning Card */}
            <div className="course-card">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <span className="badge-learning mb-4 inline-block">Learning</span>
              <h3 className="text-xl font-semibold mb-3">Optionale Weiterbildung</h3>
              <p className="text-muted-foreground">
                Freiwillige Lernmodule zur persönlichen Weiterentwicklung. 
                Lernen Sie in Ihrem eigenen Tempo ohne Prüfungsdruck.
              </p>
            </div>

            {/* Sensitization Card */}
            <div className="course-card">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-amber-400" />
              </div>
              <span className="badge-sensitization mb-4 inline-block">Sensitization</span>
              <h3 className="text-xl font-semibold mb-3">Sensibilisierung</h3>
              <p className="text-muted-foreground">
                Awareness-Schulungen mit interaktiven Fragen und sofortigem Feedback.
              </p>
            </div>

            {/* Certification Card */}
            <div className="course-card">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <Award className="w-7 h-7 text-emerald-400" />
              </div>
              <span className="badge-certification mb-4 inline-block">Certification</span>
              <h3 className="text-xl font-semibold mb-3">Zertifizierung</h3>
              <p className="text-muted-foreground">
                Pflichtschulungen mit Jahresprüfung. 
                20 Fragen, 80% Bestehensgrenze, 15 Minuten Zeitlimit.
              </p>
            </div>

            {/* Arbeitsschutz Card */}
            <div className="course-card">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Briefcase className="w-7 h-7 text-blue-400" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">Arbeitsschutz</span>
              <h3 className="text-xl font-semibold mb-3">Unterweisung Arbeitssicherheit</h3>
              <p className="text-muted-foreground">
                Firmen-spezifische Unterweisungen nach §12 ArbSchG mit digitaler Unterschrift und Audit-Trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-24 bg-gradient-to-br from-accent/5 via-background to-primary/5">
        <div className="container">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Rocket className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent">In Entwicklung</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Was kommt als nächstes?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wir arbeiten kontinuierlich an neuen Features, um Ihre Lernerfahrung zu verbessern
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Multi-Portal Integration */}
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Portal-Integration</h3>
              <p className="text-muted-foreground mb-4">
                Zentrale Übersicht aller Lernaktivitäten: Udemy, LinkedIn Learning, SAP SuccessFactors und mehr.
              </p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                Q3 2026
              </span>
            </div>

            {/* Mobile App */}
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mobile App</h3>
              <p className="text-muted-foreground mb-4">
                Lernen Sie unterwegs mit unserer iOS & Android App. Offline-Modus inklusive.
              </p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Q2 2026
              </span>
            </div>

            {/* White-Label */}
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">White-Label Option</h3>
              <p className="text-muted-foreground mb-4">
                Passen Sie die Plattform an Ihr Corporate Design an. Logo, Farben und Domain.
              </p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Q4 2026
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="stats-card">
              <span className="stats-value">100%</span>
              <span className="stats-label">DSGVO-konform</span>
            </div>
            <div className="stats-card">
              <span className="stats-value">24/7</span>
              <span className="stats-label">Verfügbarkeit</span>
            </div>
            <div className="stats-card">
              <span className="stats-value">PDF</span>
              <span className="stats-label">Zertifikate</span>
            </div>
            <div className="stats-card">
              <span className="stats-value">CSV</span>
              <span className="stats-label">Mitarbeiter-Import</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">LearningFlow</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</a>
              <a href="/impressum" className="hover:text-foreground transition-colors">Impressum</a>
              <a href="#" className="hover:text-foreground transition-colors">Kontakt</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LearningFlow. Eine Marke der AISmarterFlow UG (haftungsbeschränkt). Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
