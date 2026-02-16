import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { GraduationCap, Loader2, Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
// OAuth entfernt - alle nutzen E-Mail + Passwort

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      // Prüfe ob Passwort-Änderung erzwungen wird
      if (data.forcePasswordChange) {
        // Temporäres Token speichern
        if (data.tempToken) {
          localStorage.setItem('auth_token', data.tempToken);
        }
        // Redirect zu Passwort-Änderung
        setLocation('/change-password');
        return;
      }
      
      // Token in localStorage speichern (Hauptmethode, da Cookies im Proxy nicht funktionieren)
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      // Redirect based on role (Client-side Navigation für Performance)
      if (data.role === 'sysadmin') {
        setLocation('/admin');
      } else if (data.role === 'companyadmin') {
        setLocation('/company');
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle>Anmelden</CardTitle>
          <CardDescription>
            Melden Sie sich mit Ihrer E-Mail-Adresse und Passwort an.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.de"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ihr Passwort"
                  required
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button 
              type="submit"
              className="w-full" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird angemeldet...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Anmelden
                </>
              )}
            </Button>
          </form>

          

          <div className="mt-4 text-center">
            <Button 
              variant="link"
              className="text-sm text-muted-foreground"
              onClick={() => setLocation('/')}
            >
              Zurück zur Startseite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
