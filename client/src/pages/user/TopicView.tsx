import { useMemo, useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, CheckCircle, XCircle, Circle, Pause } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type ShuffledOption = {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
};

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
  const utils = trpc.useUtils();

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

  // Shuffle answers for each question (memoized per question)
  const questionsWithShuffledAnswers = useMemo(() => {
    return questionsWithStatus.map(q => {
      const options: ShuffledOption[] = [
        { label: 'A', text: q.optionA },
        { label: 'B', text: q.optionB },
        { label: 'C', text: q.optionC },
        { label: 'D', text: q.optionD },
      ];

      const shuffled = shuffleArray(options);
      const correctIndex = shuffled.findIndex(opt => opt.label === q.correctAnswer);
      const newCorrectAnswer = ['A', 'B', 'C', 'D'][correctIndex] as 'A' | 'B' | 'C' | 'D';

      return {
        ...q,
        shuffledOptions: shuffled,
        correctAnswer: newCorrectAnswer,
      };
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

  // Track selected answers and answered state per question
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  const submitMutation = trpc.question.submitAnswer.useMutation({
    onSuccess: () => {
      utils.question.getProgress.invalidate({ topicId: tId });
      toast.success('Antwort gespeichert');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleAnswerClick = (questionId: number, answer: string, correctAnswer: string) => {
    if (answeredQuestions.has(questionId)) return;

    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
    setAnsweredQuestions(prev => new Set(prev).add(questionId));

    // Submit answer
    submitMutation.mutate({
      questionId,
      topicId: tId,
      isCorrect: answer === correctAnswer,
    });

    // Scroll to next question after short delay
    setTimeout(() => {
      const nextQuestion = questionsWithShuffledAnswers.find(
        q => q.id > questionId && !answeredQuestions.has(q.id)
      );
      if (nextQuestion) {
        const element = document.getElementById(`question-${nextQuestion.id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 1000);
  };

  // Auto-scroll to first unanswered question on load
  const hasScrolled = useRef(false);
  useEffect(() => {
    if (!hasScrolled.current && questionsWithShuffledAnswers.length > 0) {
      const firstUnanswered = questionsWithShuffledAnswers.find(q => q.status === 'unanswered');
      if (firstUnanswered) {
        setTimeout(() => {
          const element = document.getElementById(`question-${firstUnanswered.id}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
      hasScrolled.current = true;
    }
  }, [questionsWithShuffledAnswers]);

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

        {/* Questions */}
        {questionsWithShuffledAnswers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Circle className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Keine Fragen verfügbar</p>
          </div>
        ) : (
          <div className="space-y-8">
            {questionsWithShuffledAnswers.map((q, qIdx) => {
              const selectedAnswer = selectedAnswers[q.id];
              const isAnswered = answeredQuestions.has(q.id) || q.status !== 'unanswered';
              const isCorrect = selectedAnswer === q.correctAnswer;

              return (
                <div
                  key={q.id}
                  id={`question-${q.id}`}
                  className="glass-card p-6 scroll-mt-24"
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                      {qIdx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-2">{q.questionText}</h3>
                      {q.status !== 'unanswered' && (
                        <div className="flex items-center gap-2 text-sm">
                          {q.status === 'correct' ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400">Richtig beantwortet</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-red-400">Falsch beantwortet</span>
                            </>
                          )}
                          {q.attemptCount > 1 && (
                            <span className="text-muted-foreground">
                              · {q.attemptCount} Versuche
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Answers */}
                  <div className="space-y-3">
                    {q.shuffledOptions.map((option, idx) => {
                      const displayLabel = ['A', 'B', 'C', 'D'][idx];
                      const isSelected = selectedAnswer === displayLabel;
                      const isCorrectOption = q.correctAnswer === displayLabel;

                      let className = "quiz-option";
                      if (isAnswered) {
                        if (isCorrectOption) {
                          className += " correct";
                        } else if (isSelected && !isCorrectOption) {
                          className += " incorrect";
                        }
                      } else if (isSelected) {
                        className += " selected";
                      }

                      return (
                        <div
                          key={idx}
                          className={`${className} ${isAnswered ? 'pointer-events-none' : 'cursor-pointer'}`}
                          onClick={() => handleAnswerClick(q.id, displayLabel, q.correctAnswer)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-medium">
                              {displayLabel}
                            </span>
                            <span className="flex-1">{option.text}</span>
                            {isAnswered && isCorrectOption && (
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            )}
                            {isAnswered && isSelected && !isCorrectOption && (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {isAnswered && q.explanation && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      isCorrect
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <p className="text-sm text-muted-foreground">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Completion Message */}
        {stats.answered === stats.total && stats.total > 0 && (
          <div className="glass-card p-8 text-center">
            {stats.incorrect === 0 ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2">Perfekt!</h2>
                <p className="text-muted-foreground mb-6">
                  Du hast alle Fragen richtig beantwortet!
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold mb-2">Thema abgeschlossen!</h2>
                <p className="text-muted-foreground mb-6">
                  Du hast {stats.correct} von {stats.total} Fragen richtig beantwortet ({stats.percentage}%)
                </p>
              </>
            )}
            <Button onClick={() => setLocation(`/course/${cId}`)}>
              Zurück zur Kursübersicht
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
