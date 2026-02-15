import { GraduationCap } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Impressum() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => setLocation('/')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">LearningFlow</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Impressum</h1>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Angaben gemäß § 5 TMG</h2>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">LearningFlow</p>
              <p>Eine Marke der AISmarterFlow UG (haftungsbeschränkt)</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Vertreten durch</h2>
            <p>Arton Ritter Kodra (Geschäftsführer)</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Kontakt</h2>
            <div className="space-y-1">
              <p>Adresse: Köllestr. 43, 89077 Ulm</p>
              <p>E-Mail: <a href="mailto:info@aismarterflow.de" className="text-primary hover:underline">info@aismarterflow.de</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Registereintrag</h2>
            <div className="space-y-1">
              <p>Registergericht: Amtsgericht Ulm</p>
              <p>Registernummer: HRB 747568</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Umsatzsteuer-ID</h2>
            <p>USt-IdNr.: DE367495868</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Compliance</h2>
            <p>DSGVO • DIN SPEC 27076 • AI-Compliance</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <div className="space-y-1">
              <p>Arton Ritter Kodra</p>
              <p>Köllestr. 43, 89077 Ulm</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Hinweis</h2>
            <p>
              LearningFlow ist eine Marke der AISmarterFlow UG (haftungsbeschränkt). 
              Alle Rechte an der Marke und dem geistigen Eigentum liegen bei der AISmarterFlow UG.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Haftungsausschluss</h2>
            
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Haftung für Inhalte</h3>
            <p className="mb-4">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den 
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht 
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen 
              zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="mb-4">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen 
              Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt 
              der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden 
              Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Haftung für Links</h3>
            <p className="mb-4">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der 
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Urheberrecht</h3>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem 
              deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung 
              außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen 
              Autors bzw. Erstellers.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border mt-16">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">LearningFlow</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Datenschutz</a>
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
