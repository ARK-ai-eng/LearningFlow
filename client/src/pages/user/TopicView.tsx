import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function TopicView() {
  const { courseId, topicId } = useParams<{ courseId: string; topicId: string }>();
  const [, setLocation] = useLocation();
  const cId = parseInt(courseId || "0");
  const tId = parseInt(topicId || "0");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const { data: course } = trpc.course.get.useQuery({ id: cId }, { enabled: cId > 0 });
  const { data: questions, isLoading } = trpc.question.listByTopic.useQuery(
    { topicId: tId },
    { enabled: tId > 0 }
  );

  const completeMutation = trpc.progress.completeTopic.useMutation({
    onSuccess: () => {
      toast.success("Thema abgeschlossen!");
    },
  });

  const topic = course?.topics?.find(t => t.id === tId);
  const question = questions?.[currentQuestion];
  const totalQuestions = questions?.length || 0;

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer || !question) return;
    setShowResult(true);
    if (selectedAnswer === question.correctAnswer) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      const score = Math.round(((correctCount + (selectedAnswer === question?.correctAnswer ? 1 : 0)) / totalQuestions) * 100);
      
      // Check if passed based on course type
      let passed = true;
      if (course?.courseType === 'sensitization') {
        passed = correctCount + (selectedAnswer === question?.correctAnswer ? 1 : 0) >= 3;
      } else if (course?.courseType === 'certification') {
        passed = score >= 100;
      }

      if (passed) {
        completeMutation.mutate({
          courseId: cId,
          topicId: tId,
          score,
        });
      }
    }
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
          <h1 className="text-2xl font-bold">{topic?.title || 'Thema'}</h1>
        </div>

        {/* Content */}
        {topic?.content && (
          <div className="glass-card p-6">
            <div className="prose prose-invert max-w-none">
              {topic.content}
            </div>
          </div>
        )}

        {/* Quiz Section */}
        {questions && questions.length > 0 && !quizCompleted && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Quiz</h2>
              <span className="text-sm text-muted-foreground">
                Frage {currentQuestion + 1} von {totalQuestions}
              </span>
            </div>

            {/* Progress */}
            <div className="progress-bar mb-6">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Question */}
            <div className="mb-6">
              <p className="text-lg font-medium mb-4">{question?.questionText}</p>
              
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map(option => {
                  const optionText = question?.[`option${option}` as keyof typeof question] as string;
                  const isSelected = selectedAnswer === option;
                  const isCorrect = question?.correctAnswer === option;
                  
                  let className = "quiz-option";
                  if (showResult) {
                    if (isCorrect) className += " correct";
                    else if (isSelected && !isCorrect) className += " incorrect";
                  } else if (isSelected) {
                    className += " selected";
                  }

                  return (
                    <div
                      key={option}
                      className={className}
                      onClick={() => handleAnswerSelect(option)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-medium">
                          {option}
                        </span>
                        <span className="flex-1">{optionText}</span>
                        {showResult && isCorrect && (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            {showResult && question?.explanation && (
              <div className="p-4 rounded-lg bg-muted/50 mb-6">
                <p className="text-sm font-medium mb-1">Erklärung:</p>
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {!showResult ? (
                <Button 
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswer}
                >
                  Antwort prüfen
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  {currentQuestion < totalQuestions - 1 ? (
                    <>
                      Nächste Frage
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    'Quiz abschließen'
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Quiz Completed */}
        {quizCompleted && (
          <div className="glass-card p-8 text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
              correctCount >= (course?.courseType === 'sensitization' ? 3 : totalQuestions)
                ? 'bg-emerald-500/10'
                : 'bg-amber-500/10'
            }`}>
              {correctCount >= (course?.courseType === 'sensitization' ? 3 : totalQuestions) ? (
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              ) : (
                <XCircle className="w-10 h-10 text-amber-400" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold mb-2">
              {correctCount >= (course?.courseType === 'sensitization' ? 3 : totalQuestions)
                ? 'Bestanden!'
                : 'Nicht bestanden'}
            </h2>
            
            <p className="text-muted-foreground mb-6">
              Sie haben {correctCount} von {totalQuestions} Fragen richtig beantwortet.
            </p>

            <div className="flex justify-center gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setCurrentQuestion(0);
                  setSelectedAnswer(null);
                  setShowResult(false);
                  setCorrectCount(0);
                  setQuizCompleted(false);
                }}
              >
                Quiz wiederholen
              </Button>
              <Button onClick={() => setLocation(`/course/${cId}`)}>
                Zurück zum Kurs
              </Button>
            </div>
          </div>
        )}

        {/* No Questions */}
        {(!questions || questions.length === 0) && (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Dieses Thema hat kein Quiz.
            </p>
            <Button onClick={() => {
              completeMutation.mutate({ courseId: cId, topicId: tId });
              setLocation(`/course/${cId}`);
            }}>
              Als gelesen markieren
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
