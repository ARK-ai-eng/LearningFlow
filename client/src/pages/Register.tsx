import { getLoginUrl } from "@/const";
import { useEffect } from "react";

export default function Register() {
  useEffect(() => {
    window.location.href = getLoginUrl();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Weiterleitung zur Registrierung...</p>
      </div>
    </div>
  );
}
