import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams, useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2, GraduationCap, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { data: invitation, isLoading } = trpc.invitation.validate.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const acceptMutation = trpc.invitation.accept.useMutation({
    onSuccess: () => {
      // Redirect based on role
      if (invitation?.type === 'companyadmin') {
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

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Passwort muss mindestens einen Großbuchstaben enthalten");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Passwort muss mindestens einen Kleinbuchstaben enthalten");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Passwort muss mindestens eine Zahl enthalten");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    acceptMutation.mutate({ token: token || "", password });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Einladung wird geprüft...</p>
        </div>
      </div>
    );
  }

  if (!invitation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle>Einladung ungültig</CardTitle>
            <CardDescription>
              {invitation?.error || "Diese Einladung ist nicht mehr gültig oder wurde bereits verwendet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => setLocation('/')}
            >
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle>Konto erstellen</CardTitle>
          <CardDescription>
            Setzen Sie Ihr Passwort um Ihr Konto zu aktivieren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 mb-4">
              <p className="text-sm text-muted-foreground mb-1">Eingeladen als</p>
              <p className="font-medium">
                {invitation.type === 'companyadmin' ? 'Firmenadministrator' : 'Mitarbeiter'}
              </p>
              {invitation.companyName && (
                <>
                  <p className="text-sm text-muted-foreground mt-3 mb-1">Firma</p>
                  <p className="font-medium">{invitation.companyName}</p>
                </>
              )}
              <p className="text-sm text-muted-foreground mt-3 mb-1">E-Mail</p>
              <p className="font-medium text-primary">{invitation.email}</p>
              {invitation.firstName && (
                <>
                  <p className="text-sm text-muted-foreground mt-3 mb-1">Name</p>
                  <p className="font-medium">{invitation.firstName} {invitation.lastName}</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen"
                  required
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
              <p className="text-xs text-muted-foreground">
                Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button 
              type="submit"
              className="w-full" 
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Konto aktivieren
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
