import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Users, UserPlus, Upload, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: employees, isLoading: employeesLoading } = trpc.employee.list.useQuery();
  const { data: pendingInvitations } = trpc.employee.pendingInvitations.useQuery();

  const activeEmployees = employees?.filter(e => e.role === 'user') || [];
  const completedCount = 0; // TODO: Calculate from progress

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Firmenverwaltung
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Mitarbeiter und überwachen Sie den Schulungsfortschritt.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stats-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeEmployees.length}</p>
                <p className="text-sm text-muted-foreground">Mitarbeiter</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingInvitations?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Ausstehend</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Abgeschlossen</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Überfällig</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            className="course-card cursor-pointer"
            onClick={() => setLocation('/company/employees/invite')}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Mitarbeiter einladen</h3>
                <p className="text-sm text-muted-foreground">
                  Einzelnen Mitarbeiter per E-Mail einladen
                </p>
              </div>
            </div>
          </div>
          
          <div 
            className="course-card cursor-pointer"
            onClick={() => setLocation('/company/employees/import')}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Upload className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">CSV Import</h3>
                <p className="text-sm text-muted-foreground">
                  Mehrere Mitarbeiter per CSV-Datei importieren
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Ausstehende Einladungen</h2>
            <div className="glass-card divide-y divide-border">
              {pendingInvitations.map(inv => (
                <div key={inv.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {inv.firstName} {inv.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{inv.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Läuft ab: {new Date(inv.expiresAt).toLocaleDateString('de-DE')}
                    </span>
                    <Button variant="ghost" size="sm">
                      Erneut senden
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employee List Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Mitarbeiter</h2>
            <Button variant="outline" onClick={() => setLocation('/company/employees')}>
              Alle anzeigen
            </Button>
          </div>
          
          {employeesLoading ? (
            <div className="glass-card p-6 animate-pulse">
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </div>
          ) : activeEmployees.length > 0 ? (
            <div className="glass-card divide-y divide-border">
              {activeEmployees.slice(0, 5).map(emp => (
                <div key={emp.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                      <p className="text-sm text-muted-foreground">{emp.email}</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {emp.personnelNumber && `#${emp.personnelNumber}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Noch keine Mitarbeiter. Laden Sie Ihre ersten Mitarbeiter ein.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
