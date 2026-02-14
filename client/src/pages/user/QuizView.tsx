import { useMemo, useState, useEffect } from "react";
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
import { seededShuffleArray } from "@/lib/seededShuffle";

type ShuffledOption = {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
};

export default function QuizView() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const courseId = parseInt(id || "0");
  
  // Parse URL parameter ?questionId=X
  // Note: wouter's useLocation() doesn't include query string, use window.location.search
  const urlParams = new URLSearchParams(window.location.search);
  const startQuestionId = urlParams.get('questionId') ? parseInt(urlParams.get('questionId')!) : null;

  const { data: course } = trpc.course.get.useQuery({ id: courseId }, { enabled: courseId > 0 });
  // Load unanswered questions (first time) OR incorrect questions (repeat mode)
  const { data: questions, isLoading: questionsLoading } = trpc.question.getUnansweredQuestionsByCourse.useQuery(
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
    
    return questions.map((q: any) => {
      const options: ShuffledOption[] = [
        { label: 'A', text: q.optionA },
        { label: 'B', text: q.optionB },
        { label: 'C', text: q.optionC },
        { label: 'D', text: q.optionD },
      ];

      // Use questionId as seed for deterministic shuffling
      // This ensures answers stay in the same order on repeat
      const shuffled = seededShuffleArray(options, q.id);
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
    if (!progress) return questionsWithShuffledAnswers.sort((a: any, b: any) => a.id - b.id);
    
    const withStatus = questionsWithShuffledAnswers.map((q: any) => {
      const p = progress.find((pr: any) => pr.questionId === q.id);
      return {
        ...q,
        status: p?.status || 'unanswered' as 'correct' | 'incorrect' | 'unanswered',
        firstAttemptStatus: p?.firstAttemptStatus || 'unanswered' as 'correct' | 'incorrect' | 'unanswered',
        lastAttemptCorrect: p?.lastAttemptCorrect,
        attemptCount: p?.attemptCount || 0,
      };
    });
    // Sort by ID for consistent order
    return withStatus.sort((a: any, b: any) => a.id - b.id);
  }, [questionsWithShuffledAnswers, progress]);

  // Current question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Set initial question index from URL parameter
  useEffect(() => {
    if (startQuestionId && questionsWithStatus.length > 0) {
      const index = questionsWithStatus.findIndex((q: any) => q.id === startQuestionId);
      if (index !== -1) {
        setCurrentQuestionIndex(index);
      }
    }
  }, [startQuestionId, questionsWithStatus.length]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showRepeatDialog, setShowRepeatDialog] = useState(false);
  const [isRepeatMode, setIsRepeatMode] = useState(false);
  const [initialRepeatCount, setInitialRepeatCount] = useState<number | null>(null);

  // Filter questions based on mode: all questions or only incorrect ones
  const activeQuestions = useMemo(() => {
    if (isRepeatMode) {
      // Repeat mode: show incorrect questions + current question (even if just answered correctly)
      // This prevents the list from changing while user is still viewing feedback
      // WICHTIG: Filter auf firstAttemptStatus, nicht status! (ADR-013)
      const incorrectQuestions = questionsWithStatus.filter((q: any) => q.firstAttemptStatus === 'incorrect');
      const currentQ = questionsWithStatus[currentQuestionIndex];
      
      // If current question is not in incorrect list (was just answered correctly),
      // keep it in the list until user clicks "Nächste Frage"
      if (currentQ && !incorrectQuestions.find((q: any) => q.id === currentQ.id)) {
        // Insert current question at its original position
        const result = [...incorrectQuestions];
        // Find where to insert based on ID order
        const insertIndex = result.findIndex(q => q.id > currentQ.id);
        if (insertIndex === -1) {
          result.push(currentQ);
        } else {
          result.splice(insertIndex, 0, currentQ);
        }
        return result;
      }
      
      return incorrectQuestions;
    }
    // Normal mode: show all questions (already sorted by ID)
    return questionsWithStatus;
  }, [isRepeatMode, questionsWithStatus, currentQuestionIndex]);

  const currentQuestion = activeQuestions[currentQuestionIndex];
  
  // isLastQuestion: In repeat mode, use initialRepeatCount to determine if we're at the last question
  // This prevents "4 von 3" bug where activeQuestions.length temporarily includes just-answered question
  const isLastQuestion = isRepeatMode && initialRepeatCount !== null
    ? currentQuestionIndex === initialRepeatCount - 1
    : currentQuestionIndex === activeQuestions.length - 1;

  // Calculate stats
  // WICHTIG: Stats basieren auf firstAttemptStatus, nicht status! (ADR-013)
  const stats = useMemo(() => {
    const total = questionsWithStatus.length;
    const answered = questionsWithStatus.filter((q: any) => q.firstAttemptStatus !== 'unanswered').length;
    const correct = questionsWithStatus.filter((q: any) => q.firstAttemptStatus === 'correct').length;
    const incorrect = questionsWithStatus.filter((q: any) => q.firstAttemptStatus === 'incorrect').length;
    
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
      toast.success('Antwort gespeichert');
      // Invalidate progress IMMEDIATELY after submit to ensure fresh data for dialog check
      utils.question.getProgressByCourse.invalidate({ courseId });
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
      topicId: currentQuestion.topicId,
      courseId: courseId,
      isCorrect: answer === currentQuestion.correctAnswer,
    });
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Check BEFORE invalidate to avoid race condition
      // In repeat mode: Check if all repeat questions are now correct
      if (isRepeatMode) {
        // Refresh stats to check current state
        // WICHTIG: Filter auf firstAttemptStatus! (ADR-013)
        const currentIncorrect = questionsWithStatus.filter((q: any) => q.firstAttemptStatus === 'incorrect').length;
        
        // Show dialog immediately (before invalidate clears currentQuestion)
        setShowRepeatDialog(true);
      } else {
        // Normal mode: Show repeat dialog if there are incorrect answers
        if (stats.incorrect > 0) {
          setShowRepeatDialog(true);
        } else {
          // All correct - go back to course
          setLocation(`/course/${courseId}`);
        }
      }
    } else {
      // Go to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    }
    
    // Invalidate is now done in submitMutation.onSuccess to ensure fresh data
    // No need to invalidate here anymore
  };

  const handleRepeatIncorrect = () => {
    // Trigger shuffle for repeat mode
    setShuffleTrigger(prev => prev + 1);
    
    // Store initial count of incorrect questions for stable display
    // WICHTIG: Filter auf firstAttemptStatus! (ADR-013)
    const incorrectCount = questionsWithStatus.filter((q: any) => q.firstAttemptStatus === 'incorrect').length;
    setInitialRepeatCount(incorrectCount);
    
    // Enter repeat mode: filter to show only incorrect questions
    setIsRepeatMode(true);
    
    // Reset to first question (will be first incorrect question due to filter)
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setShowRepeatDialog(false);
  };

  const resetMutation = trpc.question.resetCourseProgress.useMutation({
    onSuccess: () => {
      utils.question.getProgressByCourse.invalidate({ courseId });
      utils.question.getCourseStats.invalidate({ courseId });
      toast.success('Fortschritt zurückgesetzt');
      setLocation(`/course/${courseId}`);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
      setLocation(`/course/${courseId}`);
    },
  });

  const handleFinish = () => {
    // Reset progress when user finishes quiz (clicks "Nein" or all correct)
    resetMutation.mutate({ courseId });
  };

  const handleRestartAll = () => {
    // "Alles nochmal von vorne" - Reset progress + Shuffle
    resetMutation.mutate({ courseId });
  };

  const handleContinueLater = () => {
    // "Später fortsetzen" - Keep progress, go back to course
    setLocation(`/course/${courseId}`);
  };

  const handleStartExam = () => {
    // "Prüfung ablegen" - Navigate to ExamView
    setLocation(`/course/${courseId}/exam`);
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
                Frage {currentQuestionIndex + 1} von {isRepeatMode && initialRepeatCount !== null ? initialRepeatCount : activeQuestions.length}
                {isRepeatMode && <span className="ml-2 text-orange-500">(Wiederholung)</span>}
              </p>
            </div>
            {!isLastQuestion && (
              <Button 
                variant="outline"
                onClick={() => setLocation(`/course/${courseId}`)}
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
            {currentQuestion.shuffledOptions.map((option: any, idx: any) => {
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
              {isRepeatMode && stats.incorrect === 0
                ? '🎉 Glückwunsch! Alle Fragen korrekt beantwortet!'
                : isRepeatMode && stats.incorrect > 0
                ? '🔄 Nochmal wiederholen?'
                : stats.incorrect === 0
                ? '🎉 Perfekt!'
                : 'Fehlerhafte Fragen wiederholen?'}
            </DialogTitle>
            <DialogDescription>
              {isRepeatMode && stats.incorrect === 0 ? (
                <>
                  Super! Du hast alle Wiederholungs-Fragen korrekt beantwortet.
                  Was möchtest du jetzt tun?
                </>
              ) : isRepeatMode && stats.incorrect > 0 ? (
                <>
                  Du hast noch {stats.incorrect} fehlerhafte Frage{stats.incorrect > 1 ? 'n' : ''}.
                  Möchtest du diese nochmal wiederholen?
                </>
              ) : stats.incorrect === 0 ? (
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
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isRepeatMode && stats.incorrect === 0 ? (
              // Repeat mode completed successfully - all correct!
              <>
                <Button onClick={handleFinish} className="w-full sm:w-auto">
                  ✅ Abschließen
                </Button>
                <Button variant="outline" onClick={handleRestartAll} className="w-full sm:w-auto">
                  🔄 Nochmal machen
                </Button>
                <Button variant="ghost" onClick={handleContinueLater} className="w-full sm:w-auto">
                  ⏸️ Später
                </Button>
              </>
            ) : isRepeatMode && stats.incorrect > 0 ? (
              // Repeat mode but still some incorrect - ask to repeat again
              <>
                <Button onClick={handleRepeatIncorrect} className="w-full sm:w-auto">
                  🔄 Ja, nochmal wiederholen
                </Button>
                <Button variant="outline" onClick={handleContinueLater} className="w-full sm:w-auto">
                  ⏸️ Später fortsetzen
                </Button>
              </>
            ) : stats.incorrect === 0 ? (
              // Alle richtig (100%)
              <>
                <Button variant="outline" onClick={handleRestartAll}>
                  Alles nochmal von vorne
                </Button>
                <Button onClick={handleFinish}>
                  Zurück zur Kursübersicht
                </Button>
              </>
            ) : (
              // Einige falsch - Check if Course 3 (Certification) und Score ≥80%
              <>
                {course?.type === 'certification' && ((stats.correct / stats.total) * 100) >= 80 ? (
                  // Course 3 + ≥80% → 4 Optionen
                  <>
                    <Button onClick={handleStartExam} className="w-full sm:w-auto">
                      🎯 Prüfung ablegen
                    </Button>
                    <Button variant="outline" onClick={handleRepeatIncorrect} className="w-full sm:w-auto">
                      Fehlerhafte wiederholen
                    </Button>
                    <Button variant="outline" onClick={handleRestartAll} className="w-full sm:w-auto">
                      Alles nochmal
                    </Button>
                    <Button variant="ghost" onClick={handleContinueLater} className="w-full sm:w-auto">
                      Später
                    </Button>
                  </>
                ) : course?.type === 'certification' ? (
                  // Course 3 + <80% → 3 Optionen (kein "Prüfung ablegen")
                  <>
                    <Button variant="outline" onClick={handleRepeatIncorrect} className="w-full sm:w-auto">
                      Fehlerhafte wiederholen
                    </Button>
                    <Button variant="outline" onClick={handleRestartAll} className="w-full sm:w-auto">
                      Alles nochmal von vorne
                    </Button>
                    <Button variant="ghost" onClick={handleContinueLater} className="w-full sm:w-auto">
                      Später fortsetzen
                    </Button>
                  </>
                ) : (
                  // Course 1 & 2 (Learning/Sensitization) → Original Logik
                  <>
                    <Button variant="outline" onClick={handleFinish}>
                      Nein, nicht jetzt
                    </Button>
                    <Button onClick={handleRepeatIncorrect}>
                      Ja, wiederholen
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
