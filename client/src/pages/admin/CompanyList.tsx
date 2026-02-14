import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState } from "react";
import { Building2, Plus, Search, ArrowLeft, Trash2 } from "lucide-react";
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

export default function CompanyList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();
  
  const deleteMutation = trpc.company.delete.useMutation({
    onSuccess: () => {
      toast.success("Firma gelöscht");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredCompanies = companies?.filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Firmen</h1>
              <p className="text-muted-foreground">
                {companies?.length || 0} Firmen registriert
              </p>
            </div>
            <Button onClick={() => setLocation('/admin/companies/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Neue Firma
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Firma suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Company List */}
        {isLoading ? (
          <div className="glass-card p-6 animate-pulse">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i: any) => (
                <div key={i} className="h-20 bg-muted rounded" />
              ))}
            </div>
          </div>
        ) : filteredCompanies && filteredCompanies.length > 0 ? (
          <div className="glass-card divide-y divide-border">
            {filteredCompanies.map((company: any) => (
              <div 
                key={company.id} 
                className="p-4 flex items-center justify-between hover:bg-muted/50"
              >
                <div 
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => setLocation(`/admin/companies/${company.id}`)}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Erstellt: {new Date(company.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    company.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : company.status === 'suspended'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {company.status === 'active' ? 'Aktiv' : 
                     company.status === 'suspended' ? 'Gesperrt' : 'Inaktiv'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(company.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search ? 'Keine Ergebnisse' : 'Keine Firmen'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {search 
                ? 'Versuchen Sie eine andere Suche.'
                : 'Erstellen Sie Ihre erste Firma.'}
            </p>
            {!search && (
              <Button onClick={() => setLocation('/admin/companies/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Neue Firma
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Firma löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Benutzer und 
              Fortschrittsdaten der Firma werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
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
