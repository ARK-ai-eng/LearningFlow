# UX-Verbesserung: Lineare Quiz-Ansicht

**Datum**: 29.01.2026  
**Status**: ✅ Implementiert

## Problem

Die ursprüngliche Dialog-basierte Implementierung war umständlich und benutzerunfreundlich:

1. User sieht nur Fragenliste
2. User muss auf jede Frage klicken
3. Dialog öffnet sich
4. User sieht erst jetzt die Antworten
5. User wählt Antwort
6. Dialog schließt sich
7. Zurück zur Liste → Prozess wiederholt sich

**User-Feedback**: "Das verkompliziert das Ganze ungemein und macht die Benutzung zur Hölle"

## Lösung

Komplette Umgestaltung zu einer **linearen Quiz-Ansicht**:

### Neue Features

1. **Alle Fragen sofort sichtbar**: Fragen mit Antworten direkt inline angezeigt
2. **Auto-Scroll**: Erste unbeantwortete Frage wird automatisch fokussiert
3. **Smooth Navigation**: Nach Antwort automatisch zur nächsten Frage scrollen
4. **Visuelles Feedback**: Sofortige grün/rot Markierung nach Antwort
5. **Completion Message**: Abschlussmeldung mit Statistik am Ende

### Implementierung

**TopicView.tsx komplett neu geschrieben:**

```typescript
// Fragen mit geshuffelten Antworten
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

// Auto-Scroll zur nächsten Frage
const handleAnswerClick = (questionId: number, answer: string, correctAnswer: string) => {
  if (answeredQuestions.has(questionId)) return;

  setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  setAnsweredQuestions(prev => new Set(prev).add(questionId));

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
```

### Entfernte Komponenten

- ❌ `QuestionDetailDialog.tsx` (nicht mehr benötigt)
- ❌ `RepeatIncorrectDialog.tsx` (nicht mehr benötigt)

### UI-Struktur

```
TopicView
├── Header (Titel, Zurück-Button, Pause)
├── Progress Bar (Fortschritt, Statistik)
├── Content (Themen-Beschreibung)
├── Questions (Inline)
│   ├── Question 1
│   │   ├── Frage-Text
│   │   ├── Antwort A
│   │   ├── Antwort B
│   │   ├── Antwort C
│   │   ├── Antwort D
│   │   └── Erklärung (nach Antwort)
│   ├── Question 2
│   │   └── ...
│   └── Question N
└── Completion Message (nach letzter Frage)
```

## Vorteile

1. **Einfacher**: Keine zusätzlichen Klicks nötig
2. **Schneller**: Direkter Zugriff auf alle Fragen
3. **Übersichtlicher**: User sieht gesamten Fortschritt
4. **Intuitiver**: Natürlicher Quiz-Flow
5. **Weniger Code**: Weniger Komponenten, weniger Komplexität

## User Experience

### Vorher (Dialog-basiert)
```
Frage 1 → Klick → Dialog → Antworten → Auswahl → Schließen
Frage 2 → Klick → Dialog → Antworten → Auswahl → Schließen
Frage 3 → Klick → Dialog → Antworten → Auswahl → Schließen
```

### Nachher (Linear)
```
Frage 1 (Antworten sichtbar) → Auswahl → Auto-Scroll
Frage 2 (Antworten sichtbar) → Auswahl → Auto-Scroll
Frage 3 (Antworten sichtbar) → Auswahl → Fertig!
```

## Tests

- ✅ Alle Fragen mit Antworten sofort sichtbar
- ✅ Auto-Scroll zur ersten unbeantworteten Frage
- ✅ Auto-Scroll zur nächsten Frage nach Antwort
- ✅ Visuelles Feedback (grün/rot) funktioniert
- ✅ Fortschrittsbalken aktualisiert sich
- ✅ Completion Message erscheint am Ende
- ✅ 61 Unit Tests bestanden

## Betroffene Dateien

- `client/src/pages/user/TopicView.tsx` (komplett neu geschrieben)
- `client/src/components/QuestionDetailDialog.tsx` (gelöscht)
- `client/src/components/RepeatIncorrectDialog.tsx` (gelöscht)
- `todo.md` (aktualisiert)
