import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, Building2, CheckCircle, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function CompanyCreate() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    adminEmail: "",
    adminPassword: "",
    adminFirstName: "",
    adminLastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const createMutation = trpc.company.create.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Firma und Administrator erstellt!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto">
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Firma erstellt!</h1>
            <p className="text-muted-foreground mb-6">
              Der Firmenadministrator kann sich jetzt anmelden.
            </p>

            <div className="p-4 rounded-lg bg-muted/50 mb-6 text-left space-y-2">
              <p className="text-sm"><strong>E-Mail:</strong> {formData.adminEmail}</p>
              <p className="text-sm"><strong>Passwort:</strong> {formData.adminPassword}</p>
              <p className="text-xs text-muted-foreground mt-4">
                Bitte teilen Sie diese Zugangsdaten telefonisch mit dem Administrator.
              </p>
            </div>

            <Button onClick={() => setLocation('/admin/companies')}>
              Zur Firmenliste
            </Button>
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
                Erstellen Sie eine neue Firma mit Administrator
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Passwort *</Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.adminPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                      placeholder="Min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl"
                      required
                      minLength={8}
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
                    Dieses Passwort teilen Sie telefonisch mit dem Administrator.
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
