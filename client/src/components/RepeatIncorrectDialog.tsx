import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RepeatIncorrectDialogProps {
  isOpen: boolean;
  incorrectCount: number;
  onRepeat: () => void;
  onSkip: () => void;
}

export default function RepeatIncorrectDialog({
  isOpen,
  incorrectCount,
  onRepeat,
  onSkip,
}: RepeatIncorrectDialogProps) {
  if (incorrectCount === 0) {
    // Alle Fragen richtig beantwortet
    return (
      <AlertDialog open={isOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🎉 Perfekt!</AlertDialogTitle>
            <AlertDialogDescription>
              Du hast alle Fragen richtig beantwortet. Weiter so!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onSkip}>
              Zurück zum Kurs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fehlerhafte Fragen wiederholen?</AlertDialogTitle>
          <AlertDialogDescription>
            Du hast {incorrectCount} {incorrectCount === 1 ? 'Frage' : 'Fragen'} falsch beantwortet. 
            Möchtest du diese Fragen jetzt wiederholen, um dein Wissen zu festigen?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onSkip}>
            Nein, später
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRepeat}>
            Ja, wiederholen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
