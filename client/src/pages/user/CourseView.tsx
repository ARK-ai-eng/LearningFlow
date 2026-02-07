import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, Clock, Play } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const courseId = parseInt(id || "0");

  const { data: course, isLoading } = trpc.course.get.useQuery(
    { id: courseId },
    { enabled: courseId > 0 }
  );
  const { data: progress } = trpc.progress.byCourse.useQuery(
    { courseId },
    { enabled: courseId > 0 }
  );
  const { data: courseProgress } = trpc.question.getCourseStats.useQuery(
    { courseId },
    { enabled: courseId > 0 }
  );
  const { data: randomUnanswered } = trpc.question.getRandomUnanswered.useQuery(
    { courseId },
    { enabled: courseId > 0 && (courseProgress?.answered || 0) < (courseProgress?.total || 0) }
  );

  const getTopicStatus = (topicId: number) => {
    if (!progress) return 'not_started';
    const topicProgress = progress.find(p => p.topicId === topicId);
    return topicProgress?.status || 'not_started';
  };

  const getTopicProgressPercentage = (topicId: number) => {
    if (!courseProgress?.topicProgress) return 0;
    const topicProg = courseProgress.topicProgress.find(t => t.topicId === topicId);
    return topicProg?.percentage || 0;
  };

  const getTopicProgressText = (topicId: number) => {
    if (!courseProgress?.topicProgress) return '0 von 0 Fragen richtig';
    const topicProg = courseProgress.topicProgress.find(t => t.topicId === topicId);
    if (!topicProg) return '0 von 0 Fragen richtig';
    return `${topicProg.correct} von ${topicProg.total} Fragen richtig`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Kurs nicht gefunden</h2>
          <Button onClick={() => setLocation('/dashboard')}>
            Zurück zum Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const completedTopics = course.topics?.filter(t => getTopicStatus(t.id) === 'completed').length || 0;
  const totalTopics = course.topics?.length || 0;
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <span className={`badge-${course.courseType} mb-3 inline-block`}>
                {course.courseType === 'learning' ? 'Learning' : 
                 course.courseType === 'sensitization' ? 'Sensitization' : 'Certification'}
              </span>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-muted-foreground max-w-2xl">
                {course.description || 'Keine Beschreibung verfügbar.'}
              </p>
            </div>
            
            {course.courseType === 'certification' && progressPercent === 100 && (
              <Button 
                size="lg"
                onClick={() => setLocation(`/course/${courseId}/exam`)}
              >
                Zur Jahresprüfung
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Kursfortschritt</h3>
              <p className="text-sm text-muted-foreground">
                {completedTopics} von {totalTopics} Themen bearbeitet
              </p>
            </div>
            <span className="text-2xl font-bold gradient-text">{progressPercent}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quiz Start Button */}
        <div className="glass-card p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">Quiz starten</h2>
          <p className="text-muted-foreground mb-6">
            {courseProgress?.total || 0} Fragen warten auf dich
          </p>
          {randomUnanswered ? (
            <Button 
              size="lg" 
              onClick={() => {
                // Course 1 (courseType='learning'): Navigate to /topic/{topicId}?questionId=X
                // Course 2 & 3 (courseType='sensitization'/'certification'): Navigate to /quiz?questionId=X
                if (course?.courseType === 'learning' && randomUnanswered.topicId) {
                  setLocation(`/course/${courseId}/topic/${randomUnanswered.topicId}?questionId=${randomUnanswered.id}`);
                } else {
                  setLocation(`/course/${courseId}/quiz?questionId=${randomUnanswered.id}`);
                }
              }}
              className="min-w-[200px]"
            >
              <Play className="w-5 h-5 mr-2" />
              Fortsetzen
            </Button>
          ) : (
            <Button 
              size="lg" 
              onClick={() => setLocation(`/course/${courseId}/quiz`)}
              className="min-w-[200px]"
            >
              <Play className="w-5 h-5 mr-2" />
              Starten
            </Button>
          )}
          {courseProgress && courseProgress.answered > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              {courseProgress.answered} von {courseProgress.total} Fragen beantwortet
            </p>
          )}
        </div>

        {/* Topics (nur zur Info, nicht klickbar) */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Themen in diesem Kurs</h2>
          <div className="space-y-3">
            {course.topics && course.topics.length > 0 ? (
              course.topics.map((topic, index) => {
                const percentage = getTopicProgressPercentage(topic.id);
                return (
                  <div 
                    key={topic.id}
                    className="glass-card p-4 flex items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      percentage === 100
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : percentage > 0
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {percentage === 100 ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : percentage > 0 ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <span className="font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getTopicProgressText(topic.id)}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Thema {index + 1}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 glass-card">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Keine Themen in diesem Kurs.</p>
              </div>
            )}
          </div>
        </div>

        {/* Exam Info for Certification Courses */}
        {course.courseType === 'certification' && (
          <div className="glass-card p-6 border-emerald-500/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Play className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Jahresprüfung</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Nach Abschluss aller Themen können Sie die Jahresprüfung ablegen. 
                  20 Fragen, {course.passingScore || 80}% Bestehensgrenze, {course.timeLimit || 15} Minuten Zeitlimit.
                </p>
                {progressPercent < 100 ? (
                  <p className="text-sm text-amber-400">
                    Schließen Sie zuerst alle Themen ab, um die Prüfung freizuschalten.
                  </p>
                ) : (
                  <Button onClick={() => setLocation(`/course/${courseId}/exam`)}>
                    Prüfung starten
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
