# Sprint 8 - Schritt 2.2: Einzelfrage-Ansicht

**Datum**: 29.01.2026  
**Status**: In Arbeit  
**Ziel**: Einzelfrage-Ansicht mit Shuffle, submitAnswer und Navigation zurück zur Liste

---

## Kontext

**Problem**: User klickt auf Frage in der Liste, aber nichts passiert (TODO in Code).  
**Lösung**: Separate Komponente für Einzelfrage mit Antwort-Shuffle und submitAnswer.

---

## Architektur-Entscheidung

### Option 1: Modal (Dialog)
- ✅ Schneller Wechsel
- ✅ Kontext bleibt erhalten (Liste im Hintergrund)
- ❌ Komplexe State-Verwaltung
- ❌ Mobile UX nicht optimal

### Option 2: Separate Route
- ✅ Saubere URL (`/course/:id/topic/:id/question/:id`)
- ✅ Browser Back-Button funktioniert
- ✅ Shareable Links
- ❌ Langsamer (Page-Load)

### Option 3: Inline-Expansion
- ✅ Keine Navigation
- ✅ Einfach zu implementieren
- ❌ Scrolling-Probleme
- ❌ Unübersichtlich bei vielen Fragen

**Entscheidung**: **Option 1 (Modal)** - Beste UX, schnell, kein Page-Reload

---

## Komponenten-Struktur

```
TopicView.tsx (Fragen-Liste)
  ↓
  onClick → setSelectedQuestionId(id)
  ↓
QuestionDetailDialog (Modal)
  - Props: questionId, topicId, onClose
  - Lädt Frage mit trpc.question.getById
  - Shuffled Antworten
  - submitAnswer Mutation
  - onClose → invalidate progress → zurück zur Liste
```

---

## Datenfluss

```
1. User klickt Frage in Liste
   ↓
2. setSelectedQuestionId(questionId)
   ↓
3. QuestionDetailDialog öffnet sich
   ↓
4. Lädt Frage: trpc.question.getById({ id })
   ↓
5. Shuffle Antworten (Fisher-Yates)
   ↓
6. User wählt Antwort
   ↓
7. Feedback anzeigen (grün/rot)
   ↓
8. User klickt "Nächste Frage"
   ↓
9. submitAnswer Mutation:
   - Speichert in questionProgress
   - Invalidate progress Query
   ↓
10. Dialog schließt
    ↓
11. Fragen-Liste aktualisiert sich (Status-Icon ändert sich)
```

---

## Shuffle-Algorithmus

```typescript
// Fisher-Yates Shuffle (client-side)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Antworten shufflen
const options = [
  { label: 'A', text: question.optionA },
  { label: 'B', text: question.optionB },
  { label: 'C', text: question.optionC },
  { label: 'D', text: question.optionD },
];

const shuffledOptions = shuffleArray(options);

// Neue korrekte Antwort finden
const correctIndex = shuffledOptions.findIndex(
  opt => opt.label === question.correctAnswer
);
const newCorrectAnswer = ['A', 'B', 'C', 'D'][correctIndex];
```

---

## submitAnswer Mutation

```typescript
const submitMutation = trpc.question.submitAnswer.useMutation({
  onSuccess: () => {
    // Invalidate progress Query → Fragen-Liste aktualisiert sich
    utils.question.getProgress.invalidate({ topicId });
    
    // Dialog schließen
    onClose();
    
    // Toast
    toast.success('Antwort gespeichert');
  },
  onError: (error) => {
    toast.error(`Fehler: ${error.message}`);
  },
});

// Aufrufen
submitMutation.mutate({
  questionId,
  topicId,
  isCorrect: selectedAnswer === correctAnswer,
});
```

---

## UI-Komponenten

### QuestionDetailDialog

```tsx
<Dialog open={!!selectedQuestionId} onOpenChange={() => onClose()}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>{question.questionText}</DialogTitle>
    </DialogHeader>
    
    {/* Antworten */}
    <div className="space-y-3">
      {shuffledOptions.map((opt, idx) => (
        <div
          key={idx}
          className={`quiz-option ${getClassName(opt)}`}
          onClick={() => handleAnswer(opt.label)}
        >
          <span>{opt.label}</span>
          <span>{opt.text}</span>
        </div>
      ))}
    </div>
    
    {/* Feedback */}
    {answered && (
      <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
        {isCorrect ? '✅ Richtig!' : '❌ Falsch - Richtig wäre ' + correctAnswer}
      </div>
    )}
    
    {/* Actions */}
    <DialogFooter>
      {answered && (
        <Button onClick={handleNext}>
          Nächste Frage
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Risiken & Mitigationen

| Risiko | Mitigation |
|--------|-----------|
| **Race Condition**: submitAnswer vor Dialog-Close | onSuccess callback wartet auf invalidate |
| **Stale Data**: Progress nicht aktuell | Invalidate Query nach submitAnswer |
| **Performance**: Shuffle bei jedem Render | useMemo für shuffledOptions |
| **UX**: User klickt zu schnell "Nächste Frage" | Disabled während Mutation |

---

## Lessons Learned

### ✅ Was funktioniert

- **Modal statt Route**: Schneller, bessere UX
- **Invalidate nach Mutation**: Automatische Aktualisierung der Liste
- **Shuffle client-side**: Keine Server-Last

### ❌ Was vermieden wurde

- **Server-side Shuffle**: Zu langsam, unnötige API-Calls
- **Optimistic Updates**: Zu fehleranfällig bei submitAnswer
- **Komplexe State-Maschine**: Zu viele Edge-Cases

---

## Nächste Schritte

1. **Schritt 2.3**: Dialog für Wiederholung (nur nach letzter Frage)
2. **Schritt 2.4**: Fortschritt-Dashboard (% pro Thema)
3. **Performance-Optimierung**: Virtualisierung bei 100+ Fragen

---

## Dokumentations-Standort

Alle Dokumentation für Sprint 8 befindet sich in:
- `/home/ubuntu/aismarterflow-academy/docs/sprint-8-*.md`
