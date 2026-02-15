import { useState } from 'react';
import { GraduationCap, Mail, Send, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function Kontakt() {
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const sendContactMutation = trpc.public.sendContactEmail.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      // Success handled by submitted state
    },
    onError: (error: any) => {
      alert('Fehler: ' + (error.message || 'Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validierung
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }

    sendContactMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Kontakt</h1>
          <p className="text-xl text-muted-foreground">
            Haben Sie Fragen oder möchten Sie mehr über LearningFlow erfahren? Wir freuen uns auf Ihre Nachricht.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Kontaktformular */}
          <Card>
            <CardHeader>
              <CardTitle>Nachricht senden</CardTitle>
              <CardDescription>
                Füllen Sie das Formular aus und wir melden uns schnellstmöglich bei Ihnen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nachricht gesendet!</h3>
                  <p className="text-muted-foreground mb-4">
                    Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze bei Ihnen.
                  </p>
                  <Button onClick={() => setSubmitted(false)}>
                    Weitere Nachricht senden
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Ihr Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      E-Mail *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="ihre@email.de"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Betreff *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="Worum geht es?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Nachricht *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Ihre Nachricht..."
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={sendContactMutation.isPending}
                  >
                    {sendContactMutation.isPending ? (
                      <>Wird gesendet...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Nachricht senden
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Kontaktinformationen */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kontaktinformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">E-Mail</p>
                    <a 
                      href="mailto:info@aismarterflow.com" 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      info@aismarterflow.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-muted-foreground">
                      AISmarterFlow UG (haftungsbeschränkt)<br />
                      Köllestr. 43<br />
                      89077 Ulm
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Häufig gestellte Fragen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium mb-1">Wie schnell erhalte ich eine Antwort?</p>
                  <p className="text-sm text-muted-foreground">
                    Wir antworten in der Regel innerhalb von 24 Stunden (Werktage).
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Gibt es eine Demo-Version?</p>
                  <p className="text-sm text-muted-foreground">
                    Ja! Registrieren Sie sich kostenlos und testen Sie LearningFlow unverbindlich.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Ist LearningFlow DSGVO-konform?</p>
                  <p className="text-sm text-muted-foreground">
                    Ja, LearningFlow erfüllt alle DSGVO-Anforderungen und ist nach DIN SPEC 27076 zertifiziert.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
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
              <a href="/kontakt" className="hover:text-foreground transition-colors">Kontakt</a>
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
