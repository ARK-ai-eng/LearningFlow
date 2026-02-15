import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { GraduationCap, Shield, Award, ArrowRight, BookOpen, Clock, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function UserDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: courses, isLoading: coursesLoading } = trpc.course.listActive.useQuery();
  const { data: progress } = trpc.progress.my.useQuery();
  const { data: certificates } = trpc.certificate.my.useQuery();

  const getCourseProgress = (courseId: number) => {
    if (!progress) return 0;
    
    // Zähle completed Topics aus user_progress (nur Topics mit topicId !== null)
    const courseProgress = progress.filter((p: any) => p.courseId === courseId && p.topicId !== null);
    const completedTopics = courseProgress.filter((p: any) => p.status === 'completed').length;
    
    // Wenn keine Topics in user_progress, dann 0%
    if (courseProgress.length === 0) return 0;
    
    // WICHTIG: Wir zählen nur die Topics die in user_progress sind
    // Nach dem Fix sollten ALLE Topics in user_progress sein (12/12)
    return Math.round((completedTopics / courseProgress.length) * 100);
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
            Willkommen zurück, {user?.firstName || user?.name || 'Lernender'}!
          </h1>
          <p className="text-muted-foreground">
            Setzen Sie Ihre Compliance-Schulungen fort und erreichen Sie Ihre Lernziele.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stats-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Verfügbare Kurse</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {courses?.filter((course: any) => {
                    const progressPercent = getCourseProgress(course.id);
                    return progressPercent > 0 && progressPercent < 100;
                  }).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">In Bearbeitung</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificates?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Zertifikate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ihre Kurse</h2>
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i: any) => (
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
              {courses.map((course: any) => {
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
              <h2 className="text-xl font-semibold">Ihre Zertifikate</h2>
              <Button variant="outline" onClick={() => setLocation('/certificates')}>
                Alle anzeigen
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.slice(0, 3).map((cert: any) => (
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
