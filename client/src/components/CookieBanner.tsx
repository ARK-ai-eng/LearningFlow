import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Prüfe ob Consent bereits vorhanden
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    // Umami Analytics laden
    loadUmamiAnalytics();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  const loadUmamiAnalytics = () => {
    // Umami Script dynamisch laden
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://cloud.umami.is/script.js';
    script.setAttribute('data-website-id', import.meta.env.VITE_ANALYTICS_WEBSITE_ID || '');
    document.head.appendChild(script);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="container max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">🍪 Cookies & Datenschutz</h3>
            <p className="text-sm text-muted-foreground">
              Wir verwenden Umami Analytics, um die Nutzung unserer Website zu analysieren und zu verbessern. 
              Umami ist DSGVO-konform, speichert keine personenbezogenen Daten und verwendet keine Cookies. 
              Weitere Informationen finden Sie in unserer{' '}
              <a href="/datenschutz" className="underline hover:text-primary">
                Datenschutzerklärung
              </a>.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="min-w-[100px]"
            >
              Ablehnen
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="min-w-[100px]"
            >
              Akzeptieren
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
