import { GraduationCap } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Datenschutz() {
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
        <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Datenschutz auf einen Blick</h2>
            
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Allgemeine Hinweise</h3>
            <p className="mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
              passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
              persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen 
              Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Datenerfassung auf dieser Website</h3>
            <p className="mb-4">
              <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
              können Sie dem Impressum dieser Website entnehmen.
            </p>
            <p className="mb-4">
              <strong>Wie erfassen wir Ihre Daten?</strong><br />
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich 
              z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben oder bei der Registrierung angeben.
            </p>
            <p className="mb-4">
              Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere 
              IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder 
              Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
            </p>
            <p className="mb-4">
              <strong>Wofür nutzen wir Ihre Daten?</strong><br />
              Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. 
              Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
            </p>
            <p className="mb-4">
              <strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong><br />
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
              gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung 
              oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt 
              haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das 
              Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten 
              zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Hosting</h2>
            <p className="mb-4">
              Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
            </p>
            <p className="mb-4">
              <strong>Platform</strong><br />
              Die Website wird auf der Platform gehostet. Die Datenverarbeitung erfolgt auf Servern 
              innerhalb der EU. Weitere Informationen entnehmen Sie der Datenschutzerklärung der Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Allgemeine Hinweise und Pflichtinformationen</h2>
            
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Datenschutz</h3>
            <p className="mb-4">
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln 
              Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften 
              sowie dieser Datenschutzerklärung.
            </p>
            <p className="mb-4">
              Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene 
              Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende 
              Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert 
              auch, wie und zu welchem Zweck das geschieht.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Hinweis zur verantwortlichen Stelle</h3>
            <p className="mb-4">
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
            </p>
            <div className="mb-4 p-4 rounded-lg bg-muted/50">
              <p>AISmarterFlow UG (haftungsbeschränkt)</p>
              <p>Köllestr. 43</p>
              <p>89077 Ulm</p>
              <p className="mt-2">E-Mail: info@aismarterflow.de</p>
            </div>
            <p className="mb-4">
              Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit 
              anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B. Namen, 
              E-Mail-Adressen o. Ä.) entscheidet.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Speicherdauer</h3>
            <p className="mb-4">
              Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben 
              Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein 
              berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, 
              werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung 
              Ihrer personenbezogenen Daten haben (z.B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im 
              letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
            <p className="mb-4">
              Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können 
              eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf 
              erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
            <p className="mb-4">
              Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer 
              Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres 
              Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht 
              unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Recht auf Datenübertragbarkeit</h3>
            <p className="mb-4">
              Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines 
              Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, 
              maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten 
              an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Auskunft, Löschung und Berichtigung</h3>
            <p className="mb-4">
              Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche 
              Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den 
              Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu 
              sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Datenerfassung auf dieser Website</h2>
            
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Server-Log-Dateien</h3>
            <p className="mb-4">
              Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten 
              Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-1">
              <li>Browsertyp und Browserversion</li>
              <li>verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>Uhrzeit der Serveranfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p className="mb-4">
              Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung 
              dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein 
              berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website 
              – hierzu müssen die Server-Log-Files erfasst werden.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Registrierung auf dieser Website</h3>
            <p className="mb-4">
              Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen zu nutzen. Die dazu 
              eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes, 
              für den Sie sich registriert haben. Die bei der Registrierung abgefragten Pflichtangaben müssen 
              vollständig angegeben werden. Anderenfalls werden wir die Registrierung ablehnen.
            </p>
            <p className="mb-4">
              Für wichtige Änderungen etwa beim Angebotsumfang oder bei technisch notwendigen Änderungen nutzen 
              wir die bei der Registrierung angegebene E-Mail-Adresse, um Sie auf diesem Wege zu informieren.
            </p>
            <p className="mb-4">
              Die Verarbeitung der bei der Registrierung eingegebenen Daten erfolgt zum Zwecke der Durchführung 
              des durch die Registrierung begründeten Nutzungsverhältnisses und ggf. zur Anbahnung weiterer 
              Verträge (Art. 6 Abs. 1 lit. b DSGVO).
            </p>
            <p className="mb-4">
              Die bei der Registrierung erfassten Daten werden von uns gespeichert, solange Sie auf dieser Website 
              registriert sind und werden anschließend gelöscht. Gesetzliche Aufbewahrungsfristen bleiben unberührt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Analyse-Tools und Werbung</h2>
            
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Umami Analytics</h3>
            <p className="mb-4">
              Diese Website nutzt Umami Analytics zur Analyse des Nutzerverhaltens. Umami ist eine 
              datenschutzfreundliche Analytics-Lösung, die keine Cookies verwendet und keine personenbezogenen 
              Daten speichert. Es werden lediglich anonymisierte Nutzungsstatistiken erhoben.
            </p>
            <p className="mb-4">
              Die Datenverarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber 
              hat ein berechtigtes Interesse an der Analyse des Nutzerverhaltens, um sein Webangebot zu optimieren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Plugins und Tools</h2>
            
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Google Fonts (lokales Hosting)</h3>
            <p className="mb-4">
              Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte Google Fonts, die von 
              Google bereitgestellt werden. Die Google Fonts sind lokal installiert. Eine Verbindung zu Servern 
              von Google findet dabei nicht statt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Compliance</h2>
            <p className="mb-4">
              LearningFlow ist eine Marke der AISmarterFlow UG (haftungsbeschränkt) und erfüllt folgende 
              Compliance-Standards:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-1">
              <li><strong>DSGVO:</strong> Vollständige Einhaltung der EU-Datenschutz-Grundverordnung</li>
              <li><strong>DIN SPEC 27076:</strong> Anforderungen an KI-Systeme</li>
              <li><strong>AI-Compliance:</strong> Ethische und rechtskonforme KI-Nutzung</li>
            </ul>
          </section>

          <section className="mt-8 p-4 rounded-lg bg-muted/50">
            <p className="text-sm">
              <strong>Stand:</strong> Februar 2026<br />
              <strong>Letzte Aktualisierung:</strong> 15.02.2026
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
