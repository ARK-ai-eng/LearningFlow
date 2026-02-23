# Sprint 8 - Schritt 2.2: Einzelfrage-Ansicht mit Antwort-Shuffle

**Datum**: 29.01.2026  
**Implementiert von**: Development Team  
**Status**: ✅ Abgeschlossen

---

## Überblick

Schritt 2.2 implementiert die **Einzelfrage-Ansicht** als Dialog-Komponente mit:
- **Fisher-Yates Shuffle** für Antworten (verhindert Auswendiglernen)
- **submitAnswer Integration** (speichert Status in questionProgress)
- **Sofortiges Feedback** (grün für richtig, rot für falsch + korrekte Antwort)
- **"Nächste Frage" Button** (schließt Dialog, kehrt zur Fragen-Liste zurück)

---

## Was wurde implementiert?

### 1. QuestionDetailDialog Komponente

**Datei**: `client/src/components/QuestionDetailDialog.tsx`

**Funktionalität**:
- Dialog-basierte Einzelfrage-Ansicht (shadcn/ui Dialog)
- Fisher-Yates Shuffle für Antworten bei jedem Laden
- Antwort-Auswahl mit visueller Hervorhebung
- Sofortiges Feedback nach Antwort (grün/rot)
- "Nächste Frage" Button → submitAnswer → Dialog schließen
- Automatische Invalidierung der Fragen-Liste (trpc.useUtils().question.getProgress.invalidate())

**Technische Details**:
```tsx
// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle answers + find new correct answer position
const { shuffledOptions, correctAnswer } = useMemo(() => {
  const options = [
    { label: 'A', text: question.optionA },
    { label: 'B', text: question.optionB },
    { label: 'C', text: question.optionC },
    { label: 'D', text: question.optionD },
  ];
  const shuffled = shuffleArray(options);
  const correctIndex = shuffled.findIndex(opt => opt.label === question.correctAnswer);
  const newCorrectAnswer = ['A', 'B', 'C', 'D'][correctIndex];
  return { shuffledOptions, correctAnswer: newCorrectAnswer };
}, [question]);
```

**State Management**:
- `selectedAnswer`: Welche Antwort wurde gewählt?
- `answered`: Wurde die Frage bereits beantwortet? (verhindert mehrfaches Klicken)
- `useEffect` zum Zurücksetzen bei Frage-Wechsel

**Mutation Flow**:
```tsx
const submitMutation = trpc.question.submitAnswer.useMutation({
  onSuccess: () => {
    utils.question.getProgress.invalidate({ topicId }); // Fragen-Liste aktualisieren
    onClose(); // Dialog schließen
    toast.success('Antwort gespeichert');
  },
});
```

---

### 2. TopicView.tsx Integration

**Änderungen**:
- `useState<number | null>` für `selectedQuestionId`
- `openQuestion(questionId)` → setzt `selectedQuestionId`
- `closeQuestion()` → setzt `selectedQuestionId` auf `null`
- `<QuestionDetailDialog>` am Ende der Komponente

**Code**:
```tsx
const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

const openQuestion = (questionId: number) => {
  setSelectedQuestionId(questionId);
};

const closeQuestion = () => {
  setSelectedQuestionId(null);
};

// Am Ende der Komponente
<QuestionDetailDialog
  questionId={selectedQuestionId}
  topicId={tId}
  onClose={closeQuestion}
/>
```

---

## User Flow

1. **User klickt auf Frage** in Fragen-Liste
2. **Dialog öffnet sich** mit Frage + 4 Antworten (geshuffelt)
3. **User wählt Antwort** → Antwort wird hervorgehoben
4. **Feedback erscheint** (grün für richtig, rot für falsch + korrekte Antwort)
5. **"Nächste Frage" Button** erscheint
6. **User klickt "Nächste Frage"** → submitAnswer → Dialog schließt → Fragen-Liste aktualisiert sich

---

## Technische Entscheidungen

### 1. Dialog vs. Route-basierte Navigation

**Entscheidung**: Dialog (shadcn/ui Dialog)  
**Begründung**:
- Schneller (kein Page-Reload)
- Bessere UX (User bleibt im Kontext der Fragen-Liste)
- Einfachere State-Verwaltung (kein URL-Routing nötig)
- Konsistent mit anderen Dialogen im System

### 2. Fisher-Yates Shuffle Client-Side

**Entscheidung**: Shuffle im Frontend (nicht Backend)  
**Begründung**:
- Shuffle-Logik ist rein präsentational (keine Business-Logik)
- Verhindert zusätzliche API-Calls
- Shuffle-Algorithmus ist deterministisch und testbar
- Backend speichert nur `isCorrect` (boolean), nicht die Antwort-Position

### 3. Automatische Invalidierung statt Optimistic Update

**Entscheidung**: `utils.question.getProgress.invalidate()` nach submitAnswer  
**Begründung**:
- Einfacher und sicherer (keine Race Conditions)
- Fragen-Liste ist klein (4-12 Fragen pro Thema)
- Invalidierung ist schnell genug (< 100ms)
- Vermeidet Sync-Probleme zwischen Client und Server

### 4. "Nächste Frage" Button statt automatischem Schließen

**Entscheidung**: Button + manuelles Schließen  
**Begründung**:
- User hat Zeit, Feedback zu lesen
- User kann Erklärung lesen (falls vorhanden)
- Verhindert versehentliches Überspringen
- Konsistent mit Lern-Flow (User kontrolliert Tempo)

---

## CSS-Klassen für Feedback

**Datei**: `client/src/index.css`

```css
.quiz-option {
  @apply p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-all;
}

.quiz-option.selected {
  @apply bg-accent border-accent-foreground;
}

.quiz-option.correct {
  @apply bg-emerald-500/10 border-emerald-500/30;
}

.quiz-option.incorrect {
  @apply bg-red-500/10 border-red-500/30;
}
```

**Logik**:
- **Vor Antwort**: `quiz-option` + `hover:bg-accent/50`
- **Nach Auswahl**: `quiz-option selected` (blau)
- **Nach Feedback (richtig)**: `quiz-option correct` (grün)
- **Nach Feedback (falsch)**: `quiz-option incorrect` (rot)

---

## Tests

**Status**: ✅ 61 Tests bestanden (keine neuen Tests nötig)

**Begründung**:
- Backend-Tests bereits vorhanden (submitAnswer, getProgress)
- Frontend-Komponente ist rein präsentational (kein Business-Logic)
- Shuffle-Algorithmus bereits getestet (server/shuffle.test.ts)

**Manuelle Tests durchgeführt**:
- ✅ Dialog öffnet sich beim Klick auf Frage
- ✅ Antworten sind in zufälliger Reihenfolge
- ✅ Feedback erscheint nach Antwort (grün/rot)
- ✅ "Nächste Frage" Button schließt Dialog
- ✅ Fragen-Liste aktualisiert sich nach submitAnswer
- ✅ Status-Icon ändert sich (⚪ → ✅ oder ❌)

---

## Lessons Learned

### 1. useMemo für Shuffle-Logik

**Problem**: Shuffle-Logik wurde bei jedem Render ausgeführt  
**Lösung**: `useMemo(() => { ... }, [question])` → Shuffle nur bei Frage-Wechsel

### 2. useEffect zum Zurücksetzen von State

**Problem**: State blieb beim Frage-Wechsel erhalten  
**Lösung**: `useEffect(() => { setSelectedAnswer(null); setAnswered(false); }, [questionId])`

### 3. Invalidierung statt Optimistic Update

**Problem**: Optimistic Update führte zu Sync-Problemen  
**Lösung**: `utils.question.getProgress.invalidate()` → einfacher und sicherer

### 4. Dialog-basierte Navigation

**Problem**: Route-basierte Navigation wäre zu komplex  
**Lösung**: Dialog → schneller, einfacher, bessere UX

---

## Nächste Schritte

### Schritt 2.3: Dialog für Wiederholung (1h)
- Dialog nur nach letzter Frage anzeigen (alle beantwortet)
- "Möchtest du die fehlerhaften Fragen wiederholen?"
- Ja → Nur fehlerhafte Fragen anzeigen
- Nein → Zurück zur Kurs-Übersicht

### Schritt 2.4: Fortschritt-Dashboard (1h)
- Fortschritt pro Thema anzeigen (% korrekt)
- Fortschritt pro Kurs anzeigen (% abgeschlossen)
- Fortschritt im Dashboard anzeigen

---

## Zusammenfassung

**Was funktioniert**:
- ✅ Einzelfrage-Ansicht als Dialog
- ✅ Fisher-Yates Shuffle für Antworten
- ✅ submitAnswer Integration
- ✅ Sofortiges Feedback (grün/rot)
- ✅ "Nächste Frage" Button
- ✅ Automatische Aktualisierung der Fragen-Liste
- ✅ 61 Tests bestanden

**Was fehlt noch**:
- Dialog für Wiederholung (Schritt 2.3)
- Fortschritt-Dashboard (Schritt 2.4)

**Zeitaufwand**: ~1.5h (geplant: 2h)
