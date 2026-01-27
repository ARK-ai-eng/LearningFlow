import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState } from "react";
import { Users, UserPlus, Search, Trash2, ArrowLeft } from "lucide-react";
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

export default function EmployeeList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: employees, isLoading, refetch } = trpc.employee.list.useQuery();
  
  const deleteMutation = trpc.employee.delete.useMutation({
    onSuccess: () => {
      toast.success("Mitarbeiter gelöscht");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredEmployees = employees?.filter(emp => {
    const searchLower = search.toLowerCase();
    return (
      emp.firstName?.toLowerCase().includes(searchLower) ||
      emp.lastName?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.personnelNumber?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation('/company')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mitarbeiter</h1>
              <p className="text-muted-foreground">
                {employees?.length || 0} Mitarbeiter registriert
              </p>
            </div>
            <Button onClick={() => setLocation('/company/employees/invite')}>
              <UserPlus className="w-4 h-4 mr-2" />
              Einladen
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Name, E-Mail oder Personalnummer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Employee Table */}
        {isLoading ? (
          <div className="glass-card p-6 animate-pulse">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </div>
        ) : filteredEmployees && filteredEmployees.length > 0 ? (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">E-Mail</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Personal-Nr.</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Registriert</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </span>
                        </div>
                        <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{emp.email}</td>
                    <td className="p-4 text-muted-foreground">{emp.personnelNumber || '-'}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(emp.createdAt).toLocaleDateString('de-DE')}
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDeleteId(emp.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search ? 'Keine Ergebnisse' : 'Keine Mitarbeiter'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {search 
                ? 'Versuchen Sie eine andere Suche.'
                : 'Laden Sie Ihre ersten Mitarbeiter ein.'}
            </p>
            {!search && (
              <Button onClick={() => setLocation('/company/employees/invite')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Mitarbeiter einladen
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitarbeiter löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Fortschrittsdaten 
              des Mitarbeiters werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ userId: deleteId })}
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
