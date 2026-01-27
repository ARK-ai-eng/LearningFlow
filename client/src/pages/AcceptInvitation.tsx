import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useParams, useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2, GraduationCap } from "lucide-react";

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

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
  });

  if (isLoading || authLoading) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle>Einladung annehmen</CardTitle>
            <CardDescription>
              Sie wurden eingeladen, der AISmarterFlow Academy beizutreten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
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
              <p className="font-medium">{invitation.email}</p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = getLoginUrl()}
            >
              Anmelden um fortzufahren
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
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <CardTitle>Einladung bestätigen</CardTitle>
          <CardDescription>
            Bestätigen Sie Ihre Einladung um fortzufahren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Rolle</p>
            <p className="font-medium">
              {invitation.type === 'companyadmin' ? 'Firmenadministrator' : 'Mitarbeiter'}
            </p>
            {invitation.companyName && (
              <>
                <p className="text-sm text-muted-foreground mt-3 mb-1">Firma</p>
                <p className="font-medium">{invitation.companyName}</p>
              </>
            )}
          </div>
          <Button 
            className="w-full" 
            onClick={() => acceptMutation.mutate({ token: token || "" })}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird verarbeitet...
              </>
            ) : (
              "Einladung annehmen"
            )}
          </Button>
          {acceptMutation.isError && (
            <p className="text-sm text-destructive text-center">
              Fehler: {acceptMutation.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
