import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, CheckCircle, XCircle, Circle, Pause, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import QuestionDetailDialog from "@/components/QuestionDetailDialog";
import RepeatIncorrectDialog from "@/components/RepeatIncorrectDialog";

export default function TopicView() {
  const { courseId, topicId } = useParams<{ courseId: string; topicId: string }>();
  const [, setLocation] = useLocation();
  const cId = parseInt(courseId || "0");
  const tId = parseInt(topicId || "0");

  const { data: course } = trpc.course.get.useQuery({ id: cId }, { enabled: cId > 0 });
  const { data: questions, isLoading: questionsLoading } = trpc.question.listByTopic.useQuery(
    { topicId: tId },
    { enabled: tId > 0 }
  );
  const { data: progress, isLoading: progressLoading } = trpc.question.getProgress.useQuery(
    { topicId: tId },
    { enabled: tId > 0 }
  );

  const topic = course?.topics?.find(t => t.id === tId);
  const isLoading = questionsLoading || progressLoading;
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [showRepeatDialog, setShowRepeatDialog] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);

  // Merge questions with progress
  const questionsWithStatus = useMemo(() => {
    if (!questions || !progress) return [];
    
    return questions.map(q => {
      const p = progress.find(pr => pr.questionId === q.id);
      return {
        ...q,
        status: p?.status || 'unanswered' as 'correct' | 'incorrect' | 'unanswered',
        attemptCount: p?.attemptCount || 0,
      };
    });
  }, [questions, progress]);

  // Sort: unanswered first, then answered
  const sortedQuestions = useMemo(() => {
    return [...questionsWithStatus].sort((a, b) => {
      // Unanswered first
      if (a.status === 'unanswered' && b.status !== 'unanswered') return -1;
      if (a.status !== 'unanswered' && b.status === 'unanswered') return 1;
      
      // Then by ID (original order)
      return a.id - b.id;
    });
  }, [questionsWithStatus]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = questionsWithStatus.length;
    const answered = questionsWithStatus.filter(q => q.status !== 'unanswered').length;
    const correct = questionsWithStatus.filter(q => q.status === 'correct').length;
    const incorrect = questionsWithStatus.filter(q => q.status === 'incorrect').length;
    
    return {
      total,
      answered,
      correct,
      incorrect,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }, [questionsWithStatus]);

  // Open question
  const openQuestion = (question: any) => {
    setSelectedQuestion(question);
  };

  // Close question dialog
  const closeQuestion = () => {
    setSelectedQuestion(null);
    
    // Check if all questions are answered (and not in repeat mode)
    if (!repeatMode && stats.answered === stats.total && stats.total > 0) {
      setShowRepeatDialog(true);
    }
  };

  // Handle repeat incorrect questions
  const handleRepeat = () => {
    setShowRepeatDialog(false);
    setRepeatMode(true);
    // Open first incorrect question
    const firstIncorrect = sortedQuestions.find(q => q.status === 'incorrect');
    if (firstIncorrect) {
      setSelectedQuestion(firstIncorrect);
    }
  };

  // Handle skip repeat
  const handleSkipRepeat = () => {
    setShowRepeatDialog(false);
    setLocation(`/course/${cId}`);
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation(`/course/${cId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Kurs
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{topic?.title || 'Thema'}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.answered} von {stats.total} Fragen beantwortet
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setLocation(`/course/${cId}`)}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Fortschritt</span>
            <span className="text-sm text-muted-foreground">
              {stats.percentage}% abgeschlossen
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${(stats.answered / stats.total) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{stats.correct} richtig</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>{stats.incorrect} falsch</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-muted-foreground" />
              <span>{stats.total - stats.answered} offen</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {topic?.content && (
          <div className="glass-card p-6">
            <div className="prose prose-invert max-w-none">
              {topic.content}
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Fragen</h2>
          
          {sortedQuestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Circle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine Fragen verfügbar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedQuestions.map((q, idx) => {
                const StatusIcon = 
                  q.status === 'correct' ? CheckCircle :
                  q.status === 'incorrect' ? XCircle :
                  Circle;
                
                const iconColor = 
                  q.status === 'correct' ? 'text-emerald-400' :
                  q.status === 'incorrect' ? 'text-red-400' :
                  'text-muted-foreground';
                
                const borderColor =
                  q.status === 'correct' ? 'border-emerald-500/30' :
                  q.status === 'incorrect' ? 'border-red-500/30' :
                  'border-border';

                return (
                  <div
                    key={q.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border ${borderColor} cursor-pointer hover:bg-accent transition-colors`}
                    onClick={() => openQuestion(q)}
                  >
                    <StatusIcon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{q.questionText}</p>
                      {q.attemptCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {q.attemptCount} {q.attemptCount === 1 ? 'Versuch' : 'Versuche'}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Repeat Incorrect Dialog */}
        <RepeatIncorrectDialog
          isOpen={showRepeatDialog}
          incorrectCount={stats.incorrect}
          onRepeat={handleRepeat}
          onSkip={handleSkipRepeat}
        />
      </div>

      {/* Question Detail Dialog */}
      <QuestionDetailDialog
        question={selectedQuestion}
        topicId={tId}
        onClose={closeQuestion}
      />
    </DashboardLayout>
  );
}
