import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type SecurityAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGED"
  | "ADMIN_PASSWORD_RESET"
  | "INVITATION_ACCEPTED"
  | "EXAM_COMPLETED"
  | "CERTIFICATE_CREATED"
  | "RATE_LIMIT_EXCEEDED";

const ACTION_COLORS: Record<SecurityAction, string> = {
  LOGIN_SUCCESS: "bg-green-500",
  LOGIN_FAILED: "bg-red-500",
  PASSWORD_CHANGED: "bg-blue-500",
  ADMIN_PASSWORD_RESET: "bg-orange-500",
  INVITATION_ACCEPTED: "bg-purple-500",
  EXAM_COMPLETED: "bg-cyan-500",
  CERTIFICATE_CREATED: "bg-emerald-500",
  RATE_LIMIT_EXCEEDED: "bg-yellow-500",
};

const ACTION_LABELS: Record<SecurityAction, string> = {
  LOGIN_SUCCESS: "Login Erfolgreich",
  LOGIN_FAILED: "Login Fehlgeschlagen",
  PASSWORD_CHANGED: "Passwort Geändert",
  ADMIN_PASSWORD_RESET: "Admin Passwort-Reset",
  INVITATION_ACCEPTED: "Einladung Angenommen",
  EXAM_COMPLETED: "Prüfung Abgeschlossen",
  CERTIFICATE_CREATED: "Zertifikat Erstellt",
  RATE_LIMIT_EXCEEDED: "Rate Limit Überschritten",
};

export default function SecurityLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data: logs, isLoading } = trpc.admin.getSecurityLogs.useQuery({
    limit,
    offset,
    action: actionFilter === "all" ? undefined : actionFilter,
    userId: userIdFilter ? parseInt(userIdFilter) : undefined,
  });

  const totalPages = logs ? Math.ceil(logs.total / limit) : 1;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Security Audit Log</CardTitle>
          <CardDescription>
            Übersicht aller sicherheitsrelevanten Events (Login, Passwort-Änderungen, Prüfungen, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Events</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">Login Erfolgreich</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Login Fehlgeschlagen</SelectItem>
                  <SelectItem value="PASSWORD_CHANGED">Passwort Geändert</SelectItem>
                  <SelectItem value="ADMIN_PASSWORD_RESET">Admin Passwort-Reset</SelectItem>
                  <SelectItem value="INVITATION_ACCEPTED">Einladung Angenommen</SelectItem>
                  <SelectItem value="EXAM_COMPLETED">Prüfung Abgeschlossen</SelectItem>
                  <SelectItem value="CERTIFICATE_CREATED">Zertifikat Erstellt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                placeholder="User-ID filtern..."
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                type="number"
              />
            </div>
          </div>

          {/* Tabelle */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Lade Security-Logs...</div>
          ) : logs && logs.logs.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zeitpunkt</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>User-ID</TableHead>
                      <TableHead>Firma-ID</TableHead>
                      <TableHead>IP-Adresse</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.createdAt).toLocaleString("de-DE")}
                        </TableCell>
                        <TableCell>
                          <Badge className={ACTION_COLORS[log.action as SecurityAction]}>
                            {ACTION_LABELS[log.action as SecurityAction] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.userId || "-"}</TableCell>
                        <TableCell>{log.companyId || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{log.ipAddress || "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Seite {page} von {totalPages} ({logs.total} Einträge gesamt)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Zurück
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Weiter
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Keine Security-Logs gefunden.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details-Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Security-Log Details</DialogTitle>
            <DialogDescription>
              Vollständige Informationen zu diesem Event
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Event</div>
                  <Badge className={ACTION_COLORS[selectedLog.action as SecurityAction]}>
                    {ACTION_LABELS[selectedLog.action as SecurityAction] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Zeitpunkt</div>
                  <div className="font-mono text-sm">
                    {new Date(selectedLog.createdAt).toLocaleString("de-DE")}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">User-ID</div>
                  <div>{selectedLog.userId || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Firma-ID</div>
                  <div>{selectedLog.companyId || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">IP-Adresse</div>
                  <div className="font-mono text-sm">{selectedLog.ipAddress || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">User-Agent</div>
                  <div className="font-mono text-xs truncate" title={selectedLog.userAgent}>
                    {selectedLog.userAgent || "-"}
                  </div>
                </div>
              </div>
              
              {selectedLog.metadata && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Metadata</div>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
