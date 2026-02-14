import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Toast functionality removed - using console.log for now
import { seededShuffleArray } from "@/lib/seededShuffle";

export default function ExamView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  // const { toast } = useToast();
  const courseId = parseInt(id || "0");

  // Timer state (15 minutes = 900 seconds)
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [timerActive, setTimerActive] = useState(true);

  // Question state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<number, { answer: string; correct: boolean }>>({});

  // Dialog state
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [examPassed, setExamPassed] = useState(false);

  // Record completion mutation
  const recordCompletionMutation = trpc.exam.recordCompletion.useMutation({
    onSuccess: () => {
      console.log("Exam completion recorded");
    },
  });

  // Load course and exam questions
  const { data: course } = trpc.course.get.useQuery({ id: courseId }, { enabled: courseId > 0 });
  const { data: allExamQuestions, isLoading: questionsLoading } = trpc.question.listByCourse.useQuery(
    { 
      courseId,
      isExamQuestion: true // Nur Prüfungsfragen
    },
    { enabled: courseId > 0 }
  );

  // Select 20 random questions from pool
  const examQuestions = useMemo(() => {
    if (!allExamQuestions || allExamQuestions.length === 0) return [];
    
    // Shuffle questions using exam ID as seed (consistent per exam)
    const examSeed = courseId * 1000;
    const shuffled = seededShuffleArray(allExamQuestions, examSeed);
    const selected = shuffled.slice(0, Math.min(20, shuffled.length));
    
    // Shuffle options for each question using questionId as seed
    return selected.map((q: any) => ({
      ...q,
      shuffledOptions: seededShuffleArray([
        { label: 'A', text: q.optionA },
        { label: 'B', text: q.optionB },
        { label: 'C', text: q.optionC },
        { label: 'D', text: q.optionD },
      ], q.id)
    }));
  }, [allExamQuestions]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = examQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === examQuestions.length - 1;

  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    // Store answer
    setExamAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        answer: selectedAnswer,
        correct: isCorrect
      }
    }));

    setHasAnswered(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Exam finished
      calculateAndShowResults();
    } else {
      // Next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    }
  };

  const handleTimeUp = () => {
    console.log("Zeit abgelaufen! Die Prüfungszeit ist abgelaufen.");
    calculateAndShowResults();
  };

  const calculateAndShowResults = () => {
    setTimerActive(false);
    
    const correctCount = Object.values(examAnswers).filter((a: any) => a.correct).length;
    const totalQuestions = examQuestions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 80;

    setExamScore(score);
    setExamPassed(passed);
    setShowResultDialog(true);

    // Record completion in DB (DSGVO-konform: kein PDF gespeichert)
    recordCompletionMutation.mutate({
      courseId,
      score,
      passed,
    });
  };

  const handleReturnToCourse = () => {
    setLocation(`/course/${courseId}`);
  };

  if (questionsLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!examQuestions || examQuestions.length === 0) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Keine Prüfungsfragen verfügbar</h2>
          <p className="text-muted-foreground mb-6">
            Für diesen Kurs sind noch keine Prüfungsfragen hinterlegt.
          </p>
          <Button onClick={handleReturnToCourse}>
            Zurück zum Kurs
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentQuestion) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">Frage nicht gefunden</p>
          <Button className="mt-4" onClick={handleReturnToCourse}>
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
            onClick={handleReturnToCourse}
            disabled={timerActive}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Prüfung abbrechen
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🎯 Prüfung: {course?.title || 'KI-Kompetenz'}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Frage {currentQuestionIndex + 1} von {examQuestions.length}
              </p>
            </div>
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>
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
            {currentQuestion.shuffledOptions.map((option: any) => {
              const displayLabel = option.label;
              const isSelected = selectedAnswer === displayLabel;
              const isCorrectOption = currentQuestion.correctAnswer === displayLabel;

              let className = "quiz-option";
              if (hasAnswered) {
                if (isCorrectOption) {
                  className += " quiz-option-correct";
                } else if (isSelected && !isCorrect) {
                  className += " quiz-option-incorrect";
                }
              } else if (isSelected) {
                className += " quiz-option-selected";
              }

              return (
                <button
                  key={displayLabel}
                  onClick={() => handleAnswerSelect(displayLabel)}
                  disabled={hasAnswered}
                  className={className}
                >
                  <span className="quiz-option-label">{displayLabel}</span>
                  <span className="quiz-option-text">{option.text}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {hasAnswered && currentQuestion.explanation && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium mb-2">Erklärung:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8">
            {!hasAnswered ? (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
              >
                Antwort bestätigen
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                {isLastQuestion ? 'Prüfung abschließen' : 'Nächste Frage'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {examPassed ? '🎉 Herzlichen Glückwunsch!' : '😔 Leider nicht bestanden'}
            </DialogTitle>
            <DialogDescription className="text-base pt-4">
              {examPassed ? (
                <>
                  Du hast die Prüfung mit <strong>{examScore}%</strong> bestanden!
                  <br /><br />
                  Du kannst jetzt dein Zertifikat herunterladen.
                </>
              ) : (
                <>
                  Du hast <strong>{examScore}%</strong> erreicht.
                  <br /><br />
                  Für das Zertifikat benötigst du mindestens 80%.
                  <br />
                  Wiederhole die Lernfragen und versuche es erneut.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {examPassed ? (
              <>
                <Button variant="outline" onClick={handleReturnToCourse}>
                  Zurück zum Kurs
                </Button>
                <Button onClick={() => {
                  // Phase 8: Certificate generation
                  setLocation(`/course/${courseId}/certificate`);
                }}>
                  Zertifikat herunterladen
                </Button>
              </>
            ) : (
              <Button onClick={handleReturnToCourse}>
                Zurück zum Kurs
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
