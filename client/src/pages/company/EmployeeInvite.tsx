import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, UserPlus, CheckCircle, Copy } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function EmployeeInvite() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    personnelNumber: "",
  });
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const inviteMutation = trpc.employee.invite.useMutation({
    onSuccess: (data) => {
      setInviteToken(data.token);
      toast.success("Einladung erstellt!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(formData);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/invite/${inviteToken}`;
    navigator.clipboard.writeText(link);
    toast.success("Link kopiert!");
  };

  if (inviteToken) {
    const inviteLink = `${window.location.origin}/invite/${inviteToken}`;
    
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto">
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Einladung erstellt!</h1>
            <p className="text-muted-foreground mb-6">
              Teilen Sie den folgenden Link mit {formData.firstName} {formData.lastName}.
              Der Link ist 24 Stunden gültig.
            </p>

            <div className="p-4 rounded-lg bg-muted/50 mb-6">
              <p className="text-sm break-all font-mono">{inviteLink}</p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={copyInviteLink}>
                <Copy className="w-4 h-4 mr-2" />
                Link kopieren
              </Button>
              <Button onClick={() => {
                setInviteToken(null);
                setFormData({ email: "", firstName: "", lastName: "", personnelNumber: "" });
              }}>
                Weitere einladen
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/company')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>

        <div className="glass-card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Mitarbeiter einladen</h1>
              <p className="text-sm text-muted-foreground">
                Senden Sie eine Einladung per E-Mail
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personnelNumber">Personalnummer (optional)</Label>
              <Input
                id="personnelNumber"
                value={formData.personnelNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, personnelNumber: e.target.value }))}
                placeholder="z.B. MA-12345"
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? 'Wird erstellt...' : 'Einladung senden'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
