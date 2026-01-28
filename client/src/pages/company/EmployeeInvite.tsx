import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, UserPlus, CheckCircle, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function EmployeeInvite() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    personnelNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const createMutation = trpc.employee.create.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Mitarbeiter erstellt!");
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
            
            <h1 className="text-2xl font-bold mb-2">Mitarbeiter erstellt!</h1>
            <p className="text-muted-foreground mb-6">
              {formData.firstName} {formData.lastName} kann sich jetzt anmelden.
            </p>

            <div className="p-4 rounded-lg bg-muted/50 mb-6 text-left space-y-2">
              <p className="text-sm"><strong>E-Mail:</strong> {formData.email}</p>
              <p className="text-sm"><strong>Passwort:</strong> {formData.password}</p>
              <p className="text-xs text-muted-foreground mt-4">
                Bitte teilen Sie diese Zugangsdaten telefonisch mit dem Mitarbeiter.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => {
                setSuccess(false);
                setFormData({ email: "", password: "", firstName: "", lastName: "", personnelNumber: "" });
              }}>
                Weiteren Mitarbeiter anlegen
              </Button>
              <Button onClick={() => setLocation('/company')}>
                Zur Übersicht
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
              <h1 className="text-xl font-bold">Neuer Mitarbeiter</h1>
              <p className="text-sm text-muted-foreground">
                Erstellen Sie einen neuen Mitarbeiter-Zugang
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
              <Label htmlFor="password">Passwort *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
                Dieses Passwort teilen Sie telefonisch mit dem Mitarbeiter.
              </p>
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
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Wird erstellt...' : 'Mitarbeiter erstellen'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
