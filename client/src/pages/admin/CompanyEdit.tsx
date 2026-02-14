import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Building2, Users, UserPlus, Trash2, Copy } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CompanyEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const companyId = parseInt(id || "0");

  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [showInviteAdmin, setShowInviteAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const { data: company, isLoading, refetch } = trpc.company.get.useQuery(
    { id: companyId },
    { enabled: companyId > 0 }
  );
  const { data: admins, refetch: refetchAdmins } = trpc.company.getAdmins.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );
  const { data: employees, refetch: refetchEmployees } = trpc.employee.listByCompany.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );

  const updateMutation = trpc.company.update.useMutation({
    onSuccess: () => {
      toast.success("Firma aktualisiert");
      refetch();
    },
  });

  const inviteAdminMutation = trpc.company.inviteAdmin.useMutation({
    onSuccess: (data) => {
      setInviteToken(data.token);
      toast.success("Einladung erstellt");
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Benutzer gelöscht");
      refetchAdmins();
      refetchEmployees();
      setDeleteUserId(null);
    },
  });

  const handleStatusChange = (status: string) => {
    updateMutation.mutate({ id: companyId, status: status as any });
  };

  const handleInviteAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    inviteAdminMutation.mutate({ companyId, email: adminEmail });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/invite/${inviteToken}`;
    navigator.clipboard.writeText(link);
    toast.success("Link kopiert!");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Firma nicht gefunden</h2>
          <Button onClick={() => setLocation('/admin/companies')}>
            Zurück zur Liste
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation('/admin/companies')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground">
                Erstellt: {new Date(company.createdAt).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4">Status</h2>
          <div className="flex items-center gap-4">
            <Select value={company.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
                <SelectItem value="suspended">Gesperrt</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {company.status === 'suspended' && 'Gesperrte Firmen können nicht auf die Plattform zugreifen.'}
              {company.status === 'inactive' && 'Inaktive Firmen werden nicht in Berichten berücksichtigt.'}
            </p>
          </div>
        </div>

        {/* Admins */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Firmenadministratoren</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInviteAdmin(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Admin hinzufügen
            </Button>
          </div>

          {inviteToken && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <p className="text-sm font-medium text-emerald-400 mb-2">Einladungslink erstellt:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded overflow-auto">
                  {window.location.origin}/invite/{inviteToken}
                </code>
                <Button size="sm" variant="outline" onClick={copyInviteLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {showInviteAdmin && !inviteToken && (
            <form onSubmit={handleInviteAdmin} className="p-4 rounded-lg bg-muted/50 mb-4">
              <Label htmlFor="adminEmail">E-Mail des neuen Administrators</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@firma.de"
                  required
                />
                <Button type="submit" disabled={inviteAdminMutation.isPending}>
                  Einladen
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowInviteAdmin(false)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          )}

          {admins && admins.length > 0 ? (
            <div className="divide-y divide-border">
              {admins.map((admin: any) => (
                <div key={admin.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {admin.firstName?.[0]}{admin.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{admin.firstName} {admin.lastName}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDeleteUserId(admin.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Keine Administratoren</p>
          )}
        </div>

        {/* Employees */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Mitarbeiter ({employees?.length || 0})</h2>
          </div>

          {employees && employees.length > 0 ? (
            <div className="divide-y divide-border max-h-96 overflow-auto">
              {employees.map((emp: any) => (
                <div key={emp.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                      <p className="text-sm text-muted-foreground">{emp.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDeleteUserId(emp.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Keine Mitarbeiter</p>
          )}
        </div>
      </div>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteUserMutation.mutate({ userId: deleteUserId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
