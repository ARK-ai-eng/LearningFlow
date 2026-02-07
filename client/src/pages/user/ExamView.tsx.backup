import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, CheckCircle, XCircle, Award } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ExamView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const courseId = parseInt(id || "0");

  const [examStarted, setExamStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null);

  const { data: course } = trpc.course.get.useQuery({ id: courseId }, { enabled: courseId > 0 });
  
  const startMutation = trpc.exam.start.useMutation({
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setTimeLeft(data.timeLimit * 60);
      setExamStarted(true);
    },
  });

  const submitMutation = trpc.exam.submit.useMutation({
    onSuccess: (data) => {
      setResult(data);
    },
  });

  // Timer
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId.toString()]: answer as "A" | "B" | "C" | "D" }));
  };

  const handleSubmit = () => {
    if (!attemptId) return;
    submitMutation.mutate({ attemptId, answers });
  };

  const question = questions[currentQuestion];

  if (result) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 text-center">
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
              result.passed ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}>
              {result.passed ? (
                <Award className="w-12 h-12 text-emerald-400" />
              ) : (
                <XCircle className="w-12 h-12 text-red-400" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">
              {result.passed ? 'Herzlichen Glückwunsch!' : 'Leider nicht bestanden'}
            </h1>
            
            <p className="text-muted-foreground mb-6">
              {result.passed 
                ? 'Sie haben die Jahresprüfung erfolgreich bestanden.'
                : 'Sie haben die erforderliche Punktzahl nicht erreicht.'}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold gradient-text">{result.score}%</p>
                <p className="text-sm text-muted-foreground">Ergebnis</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{result.correct}</p>
                <p className="text-sm text-muted-foreground">Richtig</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{result.total}</p>
                <p className="text-sm text-muted-foreground">Gesamt</p>
              </div>
            </div>

            {result.passed && (
              <p className="text-emerald-400 mb-6">
                Ihr Zertifikat wurde erstellt und ist unter "Zertifikate" verfügbar.
              </p>
            )}

            <div className="flex justify-center gap-3">
              {!result.passed && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setExamStarted(false);
                    setAttemptId(null);
                    setQuestions([]);
                    setAnswers({});
                    setCurrentQuestion(0);
                  }}
                >
                  Erneut versuchen
                </Button>
              )}
              <Button onClick={() => setLocation('/dashboard')}>
                Zum Dashboard
              </Button>
              {result.passed && (
                <Button variant="outline" onClick={() => setLocation('/certificates')}>
                  Zertifikate anzeigen
                </Button>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!examStarted) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => setLocation(`/course/${courseId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Kurs
          </Button>

          <div className="glass-card p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 mx-auto mb-6 flex items-center justify-center">
              <Award className="w-10 h-10 text-emerald-400" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Jahresprüfung</h1>
            <p className="text-muted-foreground mb-6">
              {course?.title}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">20</p>
                <p className="text-sm text-muted-foreground">Fragen</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{course?.passingScore || 80}%</p>
                <p className="text-sm text-muted-foreground">Bestehensgrenze</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{course?.timeLimit || 15}</p>
                <p className="text-sm text-muted-foreground">Minuten</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6 text-left">
              <p className="text-sm text-amber-400">
                <strong>Wichtig:</strong> Sobald Sie die Prüfung starten, läuft die Zeit. 
                Stellen Sie sicher, dass Sie ungestört sind und eine stabile Internetverbindung haben.
              </p>
            </div>

            <Button 
              size="lg"
              onClick={() => startMutation.mutate({ courseId })}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? 'Wird geladen...' : 'Prüfung starten'}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header with Timer */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Jahresprüfung</h1>
            <p className="text-sm text-muted-foreground">
              Frage {currentQuestion + 1} von {questions.length}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeLeft < 60 ? 'bg-red-500/10 text-red-400' : 'bg-muted'
          }`}>
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-bar mb-6">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="glass-card p-6 mb-6">
          <p className="text-lg font-medium mb-6">{question?.questionText}</p>
          
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map(option => {
              const optionText = question?.[`option${option}`];
              const isSelected = answers[question?.id?.toString()] === option;
              
              return (
                <div
                  key={option}
                  className={`quiz-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(question.id, option)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-medium">
                      {option}
                    </span>
                    <span className="flex-1">{optionText}</span>
                    {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                idx === currentQuestion
                  ? 'bg-primary text-primary-foreground'
                  : answers[q.id.toString()]
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            Zurück
          </Button>
          
          {currentQuestion < questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(prev => prev + 1)}>
              Weiter
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Wird ausgewertet...' : 'Prüfung abgeben'}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
