import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Building2, BookOpen, Users, Plus, Settings, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: companies, isLoading: companiesLoading } = trpc.company.list.useQuery();
  const { data: courses, isLoading: coursesLoading } = trpc.course.listActive.useQuery();

  const cleanupMutation = trpc.invitation.cleanupExpired.useMutation();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            System-Administration
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie Firmen, Kurse und Systemeinstellungen.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stats-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Firmen</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Kurse</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {companies?.reduce((acc: any, c: any) => acc + 0, 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Benutzer gesamt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            className="course-card cursor-pointer"
            onClick={() => setLocation('/admin/companies/new')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Neue Firma</p>
                <p className="text-xs text-muted-foreground">Firma anlegen</p>
              </div>
            </div>
          </div>
          
          <div 
            className="course-card cursor-pointer"
            onClick={() => setLocation('/admin/courses/new')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">Neuer Kurs</p>
                <p className="text-xs text-muted-foreground">Kurs erstellen</p>
              </div>
            </div>
          </div>

          <div 
            className="course-card cursor-pointer"
            onClick={() => setLocation('/admin/companies')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Firmen</p>
                <p className="text-xs text-muted-foreground">Verwalten</p>
              </div>
            </div>
          </div>

          <div 
            className="course-card cursor-pointer"
            onClick={() => cleanupMutation.mutate()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-medium">Aufräumen</p>
                <p className="text-xs text-muted-foreground">Abgelaufene Einladungen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Firmen</h2>
            <Button variant="outline" onClick={() => setLocation('/admin/companies')}>
              Alle anzeigen
            </Button>
          </div>
          
          {companiesLoading ? (
            <div className="glass-card p-6 animate-pulse">
              <div className="space-y-4">
                {[1, 2, 3].map((i: any) => (
                  <div key={i} className="h-16 bg-muted rounded" />
                ))}
              </div>
            </div>
          ) : companies && companies.length > 0 ? (
            <div className="glass-card divide-y divide-border">
              {companies.slice(0, 5).map((company: any) => (
                <div 
                  key={company.id} 
                  className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                  onClick={() => setLocation(`/admin/companies/${company.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Benutzer
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    company.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : company.status === 'suspended'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {company.status === 'active' ? 'Aktiv' : 
                     company.status === 'suspended' ? 'Gesperrt' : 'Inaktiv'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Noch keine Firmen. Erstellen Sie Ihre erste Firma.
              </p>
            </div>
          )}
        </div>

        {/* Courses Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Kurse</h2>
            <Button variant="outline" onClick={() => setLocation('/admin/courses')}>
              Alle anzeigen
            </Button>
          </div>
          
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i: any) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courses.slice(0, 3).map((course: any) => (
                <div 
                  key={course.id} 
                  className="course-card cursor-pointer"
                  onClick={() => setLocation(`/admin/courses/${course.id}`)}
                >
                  <span className={`badge-${course.courseType} mb-3 inline-block`}>
                    {course.courseType === 'learning' ? 'Learning' : 
                     course.courseType === 'sensitization' ? 'Sensitization' : 'Certification'}
                  </span>
                  <h3 className="font-semibold mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description || 'Keine Beschreibung'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Noch keine Kurse. Erstellen Sie Ihren ersten Kurs.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
