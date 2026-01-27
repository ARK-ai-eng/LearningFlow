import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { GraduationCap, Shield, Award, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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
      {/* Hero Section */}
      <div className="relative overflow-hidden">
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
              <span className="text-xl font-bold gradient-text">AISmarterFlow Academy</span>
            </div>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
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
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-primary hover:bg-primary/90 text-lg px-8"
              >
                Jetzt starten
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8"
              >
                Demo ansehen
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Drei Kurstypen für jeden Bedarf</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Von optionalen Lernmodulen bis zu zertifizierten Pflichtschulungen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
                Awareness-Schulungen mit Mini-Quiz. 
                Bestehen Sie mit mindestens 3 von 5 richtigen Antworten pro Thema.
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

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container">
          <div className="glass-card p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Bereit für moderne Compliance?</h2>
            <p className="text-muted-foreground mb-8">
              Starten Sie noch heute mit der AISmarterFlow Academy und bringen Sie 
              Ihre Compliance-Schulungen auf das nächste Level.
            </p>
            <Button 
              size="lg" 
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-primary hover:bg-primary/90"
            >
              Kostenlos testen
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
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
              <span className="font-semibold">AISmarterFlow Academy</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Datenschutz</a>
              <a href="#" className="hover:text-foreground transition-colors">Impressum</a>
              <a href="#" className="hover:text-foreground transition-colors">Kontakt</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AISmarterFlow. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
