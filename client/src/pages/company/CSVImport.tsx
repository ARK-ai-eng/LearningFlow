import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, Download } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

interface ParsedEmployee {
  email: string;
  firstName: string;
  lastName: string;
  personnelNumber?: string;
}

export default function CSVImport() {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedEmployee[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; results: any[] } | null>(null);

  const importMutation = trpc.employee.importCSV.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      toast.success(`${data.imported} Mitarbeiter importiert!`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const employees: ParsedEmployee[] = [];
    const parseErrors: string[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/[,;]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      
      if (parts.length < 3) {
        parseErrors.push(`Zeile ${i + 1}: Nicht genügend Spalten`);
        continue;
      }

      const [email, firstName, lastName, personnelNumber] = parts;
      
      if (!email || !email.includes('@')) {
        parseErrors.push(`Zeile ${i + 1}: Ungültige E-Mail-Adresse`);
        continue;
      }

      employees.push({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        personnelNumber: personnelNumber || undefined,
      });
    }

    setParsedData(employees);
    setErrors(parseErrors);
  };

  const handleImport = () => {
    if (parsedData.length === 0) return;
    importMutation.mutate({ employees: parsedData });
  };

  const downloadTemplate = () => {
    const template = "email,vorname,nachname,personalnummer\nmax.mustermann@firma.de,Max,Mustermann,MA-001\nerika.muster@firma.de,Erika,Muster,MA-002";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mitarbeiter_vorlage.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (importResult) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Import abgeschlossen!</h1>
            <p className="text-muted-foreground mb-6">
              {importResult.imported} Mitarbeiter wurden erfolgreich eingeladen.
            </p>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => {
                setImportResult(null);
                setParsedData([]);
                setErrors([]);
              }}>
                Weitere importieren
              </Button>
              <Button onClick={() => setLocation('/company/employees')}>
                Zur Mitarbeiterliste
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
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
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold">CSV Import</h1>
              <p className="text-sm text-muted-foreground">
                Importieren Sie mehrere Mitarbeiter auf einmal
              </p>
            </div>
          </div>

          {/* Template Download */}
          <div className="p-4 rounded-lg bg-muted/50 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">CSV-Vorlage</p>
                <p className="text-sm text-muted-foreground">
                  Spalten: email, vorname, nachname, personalnummer
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Herunterladen
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {parsedData.length === 0 ? (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium mb-2">CSV-Datei auswählen</p>
              <p className="text-sm text-muted-foreground">
                Klicken Sie hier oder ziehen Sie eine Datei hierher
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Errors */}
              {errors.length > 0 && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-amber-400">Warnungen</span>
                  </div>
                  <ul className="text-sm text-amber-400 space-y-1">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}
              <div>
                <p className="font-medium mb-2">{parsedData.length} Mitarbeiter erkannt</p>
                <div className="max-h-64 overflow-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-2">E-Mail</th>
                        <th className="text-left p-2">Vorname</th>
                        <th className="text-left p-2">Nachname</th>
                        <th className="text-left p-2">Personal-Nr.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((emp, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="p-2">{emp.email}</td>
                          <td className="p-2">{emp.firstName}</td>
                          <td className="p-2">{emp.lastName}</td>
                          <td className="p-2">{emp.personnelNumber || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setParsedData([]);
                    setErrors([]);
                  }}
                >
                  Abbrechen
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending 
                    ? 'Wird importiert...' 
                    : `${parsedData.length} Mitarbeiter importieren`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
