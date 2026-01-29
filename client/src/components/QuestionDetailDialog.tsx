import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";
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

interface QuestionDetailDialogProps {
  questionId: number | null;
  topicId: number;
  onClose: () => void;
}

export default function QuestionDetailDialog({ 
  questionId, 
  topicId, 
  onClose 
}: QuestionDetailDialogProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const utils = trpc.useUtils();

  const { data: question, isLoading } = trpc.question.getById.useQuery(
    { id: questionId! },
    { enabled: !!questionId }
  );

  const submitMutation = trpc.question.submitAnswer.useMutation({
    onSuccess: () => {
      // Invalidate progress → Fragen-Liste aktualisiert sich
      utils.question.getProgress.invalidate({ topicId });
      
      // Dialog schließen
      onClose();
      
      toast.success('Antwort gespeichert');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Shuffle answers
  const { shuffledOptions, correctAnswer } = useMemo(() => {
    if (!question) return { shuffledOptions: [], correctAnswer: 'A' as const };

    const options: ShuffledOption[] = [
      { label: 'A', text: question.optionA },
      { label: 'B', text: question.optionB },
      { label: 'C', text: question.optionC },
      { label: 'D', text: question.optionD },
    ];

    const shuffled = shuffleArray(options);

    // Find new correct answer position
    const correctIndex = shuffled.findIndex(opt => opt.label === question.correctAnswer);
    const newCorrectAnswer = ['A', 'B', 'C', 'D'][correctIndex] as 'A' | 'B' | 'C' | 'D';

    return {
      shuffledOptions: shuffled,
      correctAnswer: newCorrectAnswer,
    };
  }, [question]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
  }, [questionId]);

  const handleAnswerClick = (answer: string) => {
    if (answered) return;
    setSelectedAnswer(answer);
    setAnswered(true);
  };

  const handleNext = () => {
    if (!questionId) return;

    submitMutation.mutate({
      questionId,
      topicId,
      isCorrect: selectedAnswer === correctAnswer,
    });
  };

  const isOpen = !!questionId;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        {isLoading || !question ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{question.questionText}</DialogTitle>
            </DialogHeader>

            {/* Antworten */}
            <div className="space-y-3 my-6">
              {shuffledOptions.map((option, idx) => {
                const displayLabel = ['A', 'B', 'C', 'D'][idx];
                const isSelected = selectedAnswer === displayLabel;
                const isCorrect = correctAnswer === displayLabel;

                let className = "quiz-option";
                if (answered) {
                  if (isCorrect) {
                    className += " correct";
                  } else if (isSelected && !isCorrect) {
                    className += " incorrect";
                  }
                } else if (isSelected) {
                  className += " selected";
                }

                return (
                  <div
                    key={idx}
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

            {/* Feedback */}
            {answered && (
              <div className={`p-4 rounded-lg mb-4 ${
                selectedAnswer === correctAnswer
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {selectedAnswer === correctAnswer ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="font-medium text-emerald-400">Richtig!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="font-medium text-red-400">
                        Falsch - Die richtige Antwort ist {correctAnswer}
                      </span>
                    </>
                  )}
                </div>
                {question.explanation && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {question.explanation}
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              {answered && (
                <Button 
                  onClick={handleNext}
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? 'Speichern...' : 'Nächste Frage'}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
