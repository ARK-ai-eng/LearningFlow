import { useEffect } from "react";

export default function Register() {
  useEffect(() => {
    // Registrierung läuft über Einladung - hier nur Redirect zu Login
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Weiterleitung zur Anmeldung...</p>
      </div>
    </div>
  );
}
