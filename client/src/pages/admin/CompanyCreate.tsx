import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, Building2, CheckCircle, Copy } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function CompanyCreate() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    adminEmail: "",
    adminFirstName: "",
    adminLastName: "",
  });
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const createMutation = trpc.company.create.useMutation({
    onSuccess: (data) => {
      setInviteToken(data.token);
      toast.success("Firma erstellt!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
            
            <h1 className="text-2xl font-bold mb-2">Firma erstellt!</h1>
            <p className="text-muted-foreground mb-6">
              Teilen Sie den folgenden Einladungslink mit dem Firmenadministrator.
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
              <Button onClick={() => setLocation('/admin/companies')}>
                Zur Firmenliste
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
          onClick={() => setLocation('/admin/companies')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>

        <div className="glass-card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Neue Firma erstellen</h1>
              <p className="text-sm text-muted-foreground">
                Erstellen Sie eine neue Firma und laden Sie den Administrator ein
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Firmenname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Musterfirma GmbH"
                required
              />
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-medium mb-4">Firmenadministrator</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminFirstName">Vorname</Label>
                    <Input
                      id="adminFirstName"
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminFirstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminLastName">Nachname</Label>
                    <Input
                      id="adminLastName"
                      value={formData.adminLastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminLastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">E-Mail-Adresse *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                    placeholder="admin@firma.de"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    An diese Adresse wird der Einladungslink gesendet.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Wird erstellt...' : 'Firma erstellen'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
