import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, BookOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

// Fisher-Yates Shuffle (client-side)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type ShuffledQuestion = {
  id: number;
  questionText: string;
  options: Array<{ label: 'A' | 'B' | 'C' | 'D'; text: string }>;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  originalCorrectAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
};

export default function TopicView() {
  const { courseId, topicId } = useParams<{ courseId: string; topicId: string }>();
  const [, setLocation] = useLocation();
  const cId = parseInt(courseId || "0");
  const tId = parseInt(topicId || "0");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [topicCompleted, setTopicCompleted] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);

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
  const totalQuestions = shuffledQuestions.length;
  const question = shuffledQuestions[currentQuestion];
  const isLearningMode = course?.courseType === 'learning' || course?.courseType === 'sensitization';

  // Shuffle questions when loaded
  useEffect(() => {
    if (questions && questions.length > 0) {
      const shuffled = questions.map(q => {
        // Create array of options with their original labels
        const options = [
          { label: 'A' as const, text: q.optionA },
          { label: 'B' as const, text: q.optionB },
          { label: 'C' as const, text: q.optionC },
          { label: 'D' as const, text: q.optionD },
        ];

        // Shuffle the options
        const shuffledOptions = shuffleArray(options);

        // Find where the correct answer ended up
        const correctIndex = shuffledOptions.findIndex(opt => opt.label === q.correctAnswer);
        const newCorrectAnswer = ['A', 'B', 'C', 'D'][correctIndex] as 'A' | 'B' | 'C' | 'D';

        return {
          id: q.id,
          questionText: q.questionText,
          options: shuffledOptions,
          correctAnswer: newCorrectAnswer,
          originalCorrectAnswer: q.correctAnswer,
          explanation: q.explanation || undefined,
        };
      });

      setShuffledQuestions(shuffled);
    }
  }, [questions]);

  // Klick auf Antwort - sofortiges Feedback
  const handleAnswerClick = (answer: string) => {
    if (answered) return; // Bereits beantwortet
    setSelectedAnswer(answer);
    setAnswered(true);
  };

  // Nächste Frage oder Thema abschließen
  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      // Nächste Frage
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      // Alle Fragen bearbeitet - Thema abschließen
      setTopicCompleted(true);
      completeMutation.mutate({
        courseId: cId,
        topicId: tId,
        score: 100, // Im Lernmodus immer 100% (es geht ums Lernen, nicht ums Bestehen)
      });
    }
  };

  // Zum nächsten Thema navigieren
  const goToNextTopic = () => {
    if (!course?.topics) return;
    const currentIndex = course.topics.findIndex(t => t.id === tId);
    if (currentIndex < course.topics.length - 1) {
      const nextTopic = course.topics[currentIndex + 1];
      setLocation(`/course/${cId}/topic/${nextTopic.id}`);
    } else {
      // Letztes Thema - zurück zum Kurs
      setLocation(`/course/${cId}`);
    }
  };

  if (isLoading || shuffledQuestions.length === 0) {
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
          {isLearningMode && (
            <p className="text-sm text-muted-foreground mt-1">
              Lernmodus: Beantworten Sie jede Frage und sehen Sie sofort das Feedback.
            </p>
          )}
        </div>

        {/* Content */}
        {topic?.content && (
          <div className="glass-card p-6">
            <div className="prose prose-invert max-w-none">
              {topic.content}
            </div>
          </div>
        )}

        {/* Fragen-Bereich (Lernmodus) */}
        {shuffledQuestions.length > 0 && !topicCompleted && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {isLearningMode ? 'Lernfragen' : 'Quiz'}
              </h2>
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

            {/* Frage */}
            <div className="mb-6">
              <p className="text-lg font-medium mb-4">{question?.questionText}</p>
              
              <div className="space-y-3">
                {question?.options.map((option, idx) => {
                  const displayLabel = ['A', 'B', 'C', 'D'][idx];
                  const isSelected = selectedAnswer === displayLabel;
                  const isCorrect = question.correctAnswer === displayLabel;
                  
                  let className = "quiz-option";
                  if (answered) {
                    // Nach Beantwortung: Feedback zeigen
                    if (isCorrect) {
                      className += " correct"; // Richtige Antwort immer grün
                    } else if (isSelected && !isCorrect) {
                      className += " incorrect"; // Falsch gewählte rot
                    }
                  } else if (isSelected) {
                    className += " selected";
                  }

                  return (
                    <div
                      key={displayLabel}
                      className={`${className} ${answered ? 'pointer-events-none' : 'cursor-pointer'}`}
                      onClick={() => handleAnswerClick(displayLabel)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-medium">
                          {displayLabel}
                        </span>
                        <span className="flex-1">{option.text}</span>
                        {answered && isCorrect && (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        )}
                        {answered && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feedback-Meldung */}
            {answered && (
              <div className={`p-4 rounded-lg mb-6 ${
                selectedAnswer === question?.correctAnswer 
                  ? 'bg-emerald-500/10 border border-emerald-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {selectedAnswer === question?.correctAnswer ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="font-medium text-emerald-400">Richtig!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="font-medium text-red-400">
                        Falsch - Die richtige Antwort ist {question?.correctAnswer}
                      </span>
                    </>
                  )}
                </div>
                {question?.explanation && (
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                )}
              </div>
            )}

            {/* Nächste Frage Button */}
            <div className="flex justify-end">
              {answered && (
                <Button onClick={handleNext}>
                  {currentQuestion < totalQuestions - 1 ? (
                    <>
                      Nächste Frage
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    'Thema abschließen'
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Thema abgeschlossen */}
        {topicCompleted && (
          <div className="glass-card p-8 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-emerald-500/10">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Thema abgeschlossen!</h2>
            
            <p className="text-muted-foreground mb-6">
              Sie haben alle {totalQuestions} Fragen zu diesem Thema bearbeitet.
            </p>

            <div className="flex justify-center gap-3">
              <Button 
                variant="outline"
                onClick={() => setLocation(`/course/${cId}`)}
              >
                Zurück zur Übersicht
              </Button>
              {course?.topics && course.topics.findIndex(t => t.id === tId) < course.topics.length - 1 && (
                <Button onClick={goToNextTopic}>
                  Nächstes Thema
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
