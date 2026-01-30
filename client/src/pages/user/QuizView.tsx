import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Pause } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function QuizView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const courseId = parseInt(id || "0");

  const { data: course } = trpc.course.get.useQuery({ id: courseId }, { enabled: courseId > 0 });
  const { data: questions, isLoading: questionsLoading } = trpc.question.listByCourse.useQuery(
    { courseId },
    { enabled: courseId > 0 }
  );
  const { data: progress, isLoading: progressLoading } = trpc.question.getProgressByCourse.useQuery(
    { courseId },
    { enabled: courseId > 0 }
  );
  const isLoading = questionsLoading || progressLoading;
  const utils = trpc.useUtils();

  // Shuffle trigger: Increments on repeat to trigger new shuffle
  // Only changes when user clicks "Ja, wiederholen" button
  const [shuffleTrigger, setShuffleTrigger] = useState(0);

  // Shuffle answers for each question (memoized per question)
  // Dependency: [questions, shuffleTrigger] - NOT questionsWithStatus
  // This ensures shuffle only happens on load and repeat, NOT after every answer
  const questionsWithShuffledAnswers = useMemo(() => {
    if (!questions) return [];
    
    return questions.map(q => {
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
  }, [questions, shuffleTrigger]);

  // Merge shuffled questions with progress status
  // This updates status without triggering shuffle
  const questionsWithStatus = useMemo(() => {
    if (!progress) return questionsWithShuffledAnswers;
    
    return questionsWithShuffledAnswers.map(q => {
      const p = progress.find(pr => pr.questionId === q.id);
      return {
        ...q,
        status: p?.status || 'unanswered' as 'correct' | 'incorrect' | 'unanswered',
        attemptCount: p?.attemptCount || 0,
      };
    });
  }, [questionsWithShuffledAnswers, progress]);

  // Current question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showRepeatDialog, setShowRepeatDialog] = useState(false);
  const [isRepeatMode, setIsRepeatMode] = useState(false);

  // Filter questions based on mode: all questions or only incorrect ones
  const activeQuestions = useMemo(() => {
    if (isRepeatMode) {
      // Repeat mode: only show incorrect questions
      return questionsWithStatus.filter(q => q.status === 'incorrect');
    }
    // Normal mode: show all questions
    return questionsWithStatus;
  }, [isRepeatMode, questionsWithStatus]);

  const currentQuestion = activeQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === activeQuestions.length - 1;

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

  const submitMutation = trpc.question.submitAnswer.useMutation({
    onSuccess: () => {
      utils.question.getProgressByCourse.invalidate({ courseId });
      toast.success('Antwort gespeichert');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleAnswerClick = (answer: string) => {
    if (hasAnswered || !currentQuestion) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);

    // Submit answer
    submitMutation.mutate({
      questionId: currentQuestion.id,
      topicId: currentQuestion.topicId, // Keep topicId for DB schema compatibility
      isCorrect: answer === currentQuestion.correctAnswer,
    });
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Show repeat dialog if there are incorrect answers
      if (stats.incorrect > 0) {
        setShowRepeatDialog(true);
      } else {
        // All correct - go back to course
        setLocation(`/course/${courseId}`);
      }
    } else {
      // Go to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    }
  };

  const handleRepeatIncorrect = () => {
    // Trigger shuffle for repeat mode
    setShuffleTrigger(prev => prev + 1);
    
    // Enter repeat mode: filter to show only incorrect questions
    setIsRepeatMode(true);
    
    // Reset to first question (will be first incorrect question due to filter)
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setShowRepeatDialog(false);
  };

  const handleFinish = () => {
    setLocation(`/course/${courseId}`);
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

  if (!currentQuestion) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">Keine Fragen verfügbar</p>
          <Button className="mt-4" onClick={() => setLocation(`/course/${courseId}`)}>
            Zurück zum Kurs
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation(`/course/${courseId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Kurs
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{course?.title || 'Quiz'}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Frage {currentQuestionIndex + 1} von {activeQuestions.length}
                {isRepeatMode && <span className="ml-2 text-orange-500">(Wiederholung)</span>}
              </p>
            </div>
            {!isLastQuestion && (
              <Button 
                variant="outline"
                onClick={() => setLocation(`/course/${cId}`)}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
          </div>
        </div>

        {/* Question Card */}
        <div className="glass-card p-8">
          {/* Question */}
          <h2 className="text-xl font-medium mb-8">
            {currentQuestion.questionText}
          </h2>

          {/* Answers */}
          <div className="space-y-4">
            {currentQuestion.shuffledOptions.map((option, idx) => {
              const displayLabel = ['A', 'B', 'C', 'D'][idx];
              const isSelected = selectedAnswer === displayLabel;
              const isCorrectOption = currentQuestion.correctAnswer === displayLabel;

              let className = "quiz-option";
              if (hasAnswered) {
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
                  className={`${className} ${hasAnswered ? 'pointer-events-none' : 'cursor-pointer'}`}
                  onClick={() => handleAnswerClick(displayLabel)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-medium">
                      {displayLabel}
                    </span>
                    <span className="flex-1">{option.text}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation (after answer) */}
          {hasAnswered && currentQuestion.explanation && (
            <div className={`mt-6 p-4 rounded-lg ${
              isCorrect
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <p className="text-sm">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Next Question Button */}
          {hasAnswered && (
            <div className="mt-8 flex justify-end">
              <Button onClick={handleNextQuestion} size="lg">
                {isLastQuestion ? 'Abschließen' : 'Nächste Frage'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Repeat Dialog */}
      <Dialog open={showRepeatDialog} onOpenChange={setShowRepeatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stats.incorrect === 0 ? '🎉 Perfekt!' : 'Fehlerhafte Fragen wiederholen?'}
            </DialogTitle>
            <DialogDescription>
              {stats.incorrect === 0 ? (
                <>
                  Du hast alle {stats.total} Fragen richtig beantwortet!
                </>
              ) : (
                <>
                  Du hast {stats.incorrect} von {stats.total} Fragen falsch beantwortet.
                  Möchtest du nur die {stats.incorrect} fehlerhaften Fragen wiederholen,
                  um dein Wissen zu vertiefen?
                  <br /><br />
                  <span className="text-xs text-muted-foreground">
                    (Dein Score wird nicht geändert)
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {stats.incorrect === 0 ? (
              <Button onClick={handleFinish}>
                Zurück zur Kursübersicht
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleFinish}>
                  Nein, nicht jetzt
                </Button>
                <Button onClick={handleRepeatIncorrect}>
                  Ja, wiederholen
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
