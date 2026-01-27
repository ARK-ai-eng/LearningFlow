import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { 
  Users, UserPlus, Upload, Clock, CheckCircle, AlertTriangle,
  GraduationCap, Shield, Award, ArrowRight, BookOpen
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Mitarbeiter-Daten
  const { data: employees, isLoading: employeesLoading } = trpc.employee.list.useQuery();
  const { data: pendingInvitations } = trpc.employee.pendingInvitations.useQuery();

  // Kurs-Daten (wie beim User)
  const { data: courses, isLoading: coursesLoading } = trpc.course.listActive.useQuery();
  const { data: progress } = trpc.progress.my.useQuery();
  const { data: certificates } = trpc.certificate.my.useQuery();

  const activeEmployees = employees?.filter(e => e.role === 'user') || [];
  const completedCount = 0; // TODO: Calculate from progress

  // Kurs-Hilfsfunktionen
  const getCourseProgress = (courseId: number) => {
    if (!progress) return 0;
    const courseProgress = progress.filter(p => p.courseId === courseId);
    const completed = courseProgress.filter(p => p.status === 'completed').length;
    return courseProgress.length > 0 ? Math.round((completed / courseProgress.length) * 100) : 0;
  };

  const getCourseIcon = (type: string) => {
    switch (type) {
      case 'learning': return <BookOpen className="w-6 h-6" />;
      case 'sensitization': return <Shield className="w-6 h-6" />;
      case 'certification': return <Award className="w-6 h-6" />;
      default: return <GraduationCap className="w-6 h-6" />;
    }
  };

  const getCourseTypeLabel = (type: string) => {
    switch (type) {
      case 'learning': return 'Learning';
      case 'sensitization': return 'Sensitization';
      case 'certification': return 'Certification';
      default: return type;
    }
  };

  const getCourseTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'learning': return 'badge-learning';
      case 'sensitization': return 'badge-sensitization';
      case 'certification': return 'badge-certification';
      default: return 'badge-learning';
    }
  };

  const getIconBgClass = (type: string) => {
    switch (type) {
      case 'learning': return 'bg-primary/10 text-primary';
      case 'sensitization': return 'bg-amber-500/10 text-amber-400';
      case 'certification': return 'bg-emerald-500/10 text-emerald-400';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Willkommen, {user?.firstName || user?.name || 'Administrator'}!
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Mitarbeiter und absolvieren Sie Ihre eigenen Schulungen.
          </p>
        </div>

        {/* Stats Overview - Mitarbeiter */}
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

        {/* Quick Actions - Mitarbeiterverwaltung */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Mitarbeiterverwaltung</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <div 
              className="course-card cursor-pointer"
              onClick={() => setLocation('/company/employees')}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Mitarbeiterliste</h3>
                  <p className="text-sm text-muted-foreground">
                    Alle Mitarbeiter und deren Fortschritt
                  </p>
                </div>
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

        {/* Meine Kurse - Lernmodule für FirmenAdmin */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Meine Schulungen</h2>
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="course-card animate-pulse">
                  <div className="h-14 w-14 rounded-2xl bg-muted mb-6" />
                  <div className="h-4 w-20 bg-muted rounded mb-4" />
                  <div className="h-6 w-3/4 bg-muted rounded mb-3" />
                  <div className="h-4 w-full bg-muted rounded mb-6" />
                  <div className="h-2 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => {
                const progressPercent = getCourseProgress(course.id);
                return (
                  <div key={course.id} className="course-card">
                    <div className={`w-14 h-14 rounded-2xl ${getIconBgClass(course.courseType)} flex items-center justify-center mb-6`}>
                      {getCourseIcon(course.courseType)}
                    </div>
                    <span className={`${getCourseTypeBadgeClass(course.courseType)} mb-4 inline-block`}>
                      {getCourseTypeLabel(course.courseType)}
                    </span>
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
                      {course.description || 'Keine Beschreibung verfügbar.'}
                    </p>
                    
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Fortschritt</span>
                        <span className="font-medium">{progressPercent}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => setLocation(`/course/${course.id}`)}
                    >
                      {progressPercent === 0 ? 'Kurs starten' : 'Fortsetzen'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 glass-card">
              <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Kurse verfügbar</h3>
              <p className="text-muted-foreground">
                Es sind derzeit keine Kurse für Sie freigeschaltet.
              </p>
            </div>
          )}
        </div>

        {/* Certificates Section */}
        {certificates && certificates.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Meine Zertifikate</h2>
              <Button variant="outline" onClick={() => setLocation('/certificates')}>
                Alle anzeigen
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.slice(0, 3).map(cert => (
                <div key={cert.id} className="glass-card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{cert.certificateNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(cert.issuedAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
