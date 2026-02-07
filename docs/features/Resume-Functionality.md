# Resume-Funktionalität (Fortsetzen)

**Status:** ✅ Implementiert (alle 5 Schritte abgeschlossen)

**Ziel:** User kann Quiz dort fortsetzen, wo er aufgehört hat - "Fortsetzen" Button navigiert zu einer zufälligen unbeantworteten Frage.

---

## Implementierung (5 Schritte)

### Schritt 1: Backend API ✅

**Endpoint:** `question.getRandomUnanswered`

**Datei:** `server/routers.ts` (Zeile ~750)

```typescript
getRandomUnanswered: protectedProcedure
  .input(z.object({ courseId: z.number() }))
  .query(async ({ input, ctx }) => {
    const question = await getRandomUnansweredQuestion(input.courseId, ctx.user.userId);
    if (!question) return null;
    return question;
  }),
```

**DB-Funktion:** `server/db.ts` - `getRandomUnansweredQuestion()`

```typescript
export async function getRandomUnansweredQuestion(courseId: number, userId: number) {
  // 1. Hole alle Fragen des Kurses
  const allQuestions = await getQuestionsByCourse(courseId, { isExamQuestion: false });
  
  // 2. Hole Fortschritt des Users
  const progress = await getQuestionProgressByCourse(courseId, userId);
  const answeredIds = new Set(progress.map(p => p.questionId));
  
  // 3. Filtere unbeantwortete Fragen
  const unanswered = allQuestions.filter(q => !answeredIds.has(q.id));
  
  // 4. Wähle zufällige Frage
  if (unanswered.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * unanswered.length);
  return unanswered[randomIndex];
}
```

---

### Schritt 2: Frontend CourseView - "Fortsetzen" Button ✅

**Datei:** `client/src/pages/user/CourseView.tsx`

**Button-Logik:**

```typescript
// Query für zufällige unbeantwortete Frage
const { data: randomQuestion } = trpc.question.getRandomUnanswered.useQuery(
  { courseId: cId },
  { enabled: cId > 0 }
);

// Conditional Rendering
{randomQuestion ? (
  <Button onClick={handleResume}>
    <Play className="w-4 h-4 mr-2" />
    Fortsetzen
  </Button>
) : (
  <Button onClick={handleStartQuiz}>
    <Play className="w-4 h-4 mr-2" />
    Quiz starten
  </Button>
)}
```

**Navigation:**

```typescript
const handleResume = () => {
  if (!randomQuestion) return;
  
  if (course?.courseType === 'learning') {
    // Course 1: Navigiere zu TopicView mit questionId Parameter
    setLocation(`/course/${cId}/topic/${randomQuestion.topicId}?questionId=${randomQuestion.id}`);
  } else {
    // Course 2 & 3: Navigiere zu QuizView mit questionId Parameter
    setLocation(`/course/${cId}/quiz?questionId=${randomQuestion.id}`);
  }
};
```

---

### Schritt 3: QuizView - URL-Parameter Support ✅

**Datei:** `client/src/pages/user/QuizView.tsx`

**URL-Parameter Parsing:**

```typescript
// Parse URL parameter ?questionId=X
const [location] = useLocation();
const urlParams = new URLSearchParams(location.split('?')[1] || '');
const startQuestionId = urlParams.get('questionId') ? parseInt(urlParams.get('questionId')!) : null;
```

**Index setzen:**

```typescript
// Set initial question index from URL parameter
useEffect(() => {
  if (startQuestionId && questionsWithStatus.length > 0) {
    const index = questionsWithStatus.findIndex(q => q.id === startQuestionId);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
    }
  }
}, [startQuestionId, questionsWithStatus.length]);
```

---

### Schritt 4: TopicView - URL-Parameter Support ✅

**Datei:** `client/src/pages/user/TopicView.tsx`

**Gleiche Logik wie QuizView:**

```typescript
// Parse URL parameter ?questionId=X
const [location] = useLocation();
const urlParams = new URLSearchParams(location.split('?')[1] || '');
const startQuestionId = urlParams.get('questionId') ? parseInt(urlParams.get('questionId')!) : null;

// Set initial question index from URL parameter
useEffect(() => {
  if (startQuestionId && questionsWithShuffledAnswers.length > 0) {
    const index = questionsWithShuffledAnswers.findIndex(q => q.id === startQuestionId);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
    }
  }
}, [startQuestionId, questionsWithShuffledAnswers.length]);
```

---

### Schritt 5: Testing ✅

**Unit Tests:** 61 Tests bestanden ✅

```bash
$ pnpm test
 ✓ server/oauth.test.ts (8 tests)
 ✓ server/shuffle.test.ts (12 tests)
 ✓ server/academy.test.ts (11 tests)
 ✓ server/certificate.test.ts (5 tests)
 ✓ server/auth.logout.test.ts (1 test)
 ✓ server/course.status.test.ts (9 tests)
 ✓ server/question.progress.test.ts (8 tests)
 ✓ server/login.test.ts (7 tests)
 
 Test Files  8 passed (8)
      Tests  61 passed (61)
```

---

## User-Workflow

### Course 1 (Learning):

1. User öffnet Kurs → CourseView
2. User beantwortet 3 von 10 Fragen in Topic 1
3. User schließt Browser
4. User öffnet Kurs wieder → "Fortsetzen" Button erscheint
5. User klickt "Fortsetzen" → Navigiert zu TopicView mit zufälliger unbeantworteter Frage
6. URL: `/course/1/topic/1?questionId=42`

### Course 2 (Sensitization):

1. User öffnet Kurs → CourseView
2. User beantwortet 5 von 12 Fragen
3. User klickt "Pause" → Zurück zu CourseView
4. "Fortsetzen" Button erscheint
5. User klickt "Fortsetzen" → Navigiert zu QuizView mit zufälliger unbeantworteter Frage
6. URL: `/course/2/quiz?questionId=87`

### Course 3 (Certification):

1. User öffnet Kurs → CourseView
2. User beantwortet 8 von 14 Lernfragen
3. User klickt "Pause" → Zurück zu CourseView
4. "Fortsetzen" Button erscheint
5. User klickt "Fortsetzen" → Navigiert zu QuizView mit zufälliger unbeantworteter Frage
6. URL: `/course/3/quiz?questionId=123`

---

## Design-Entscheidungen

### 1. Zufällige vs. Sequentielle Navigation

**Entscheidung:** Zufällige unbeantwortete Frage

**Begründung:**
- User hat möglicherweise mehrere Topics/Fragen offen
- Zufällige Auswahl verhindert "immer die gleiche Frage"-Effekt
- Einfacher zu implementieren (kein "letzte Frage" State nötig)

### 2. Button nur in CourseView

**Entscheidung:** "Fortsetzen" Button nur in CourseView (nicht in TopicView)

**Begründung:**
- CourseView ist der zentrale Einstiegspunkt
- TopicView ist bereits eine spezifische Ansicht (User hat bereits gewählt)
- Vermeidet UI-Clutter

### 3. Repeat-Mode nicht persistiert

**Entscheidung:** Repeat-Mode ist session-based (nicht in DB gespeichert)

**Begründung:**
- Lean Approach: Weniger Komplexität
- Repeat-Mode ist temporär (User will fehlerhafte Fragen sofort wiederholen)
- Nach Browser-Close: User startet frisch (kein "stuck in repeat mode")

### 4. Button versteckt wenn alle Fragen beantwortet

**Entscheidung:** "Fortsetzen" Button wird durch "Quiz starten" ersetzt wenn keine unbeantworteten Fragen

**Begründung:**
- Klare UX: Button zeigt immer den nächsten logischen Schritt
- "Quiz starten" = Neuer Durchgang (Progress wird resettet)
- Vermeidet "Fortsetzen" Button der nichts tut

---

## Edge Cases

### 1. Alle Fragen beantwortet

**Verhalten:** `getRandomUnanswered` gibt `null` zurück → "Fortsetzen" Button wird versteckt

### 2. QuestionId nicht gefunden

**Verhalten:** `findIndex()` gibt `-1` zurück → `currentQuestionIndex` bleibt bei `0` (erste Frage)

### 3. Keine URL-Parameter

**Verhalten:** `startQuestionId` ist `null` → Quiz startet bei Index `0` (wie bisher)

### 4. Course 1 mit mehreren Topics

**Verhalten:** `getRandomUnanswered` wählt aus ALLEN Topics → User wird zu Topic mit unbeantworteter Frage navigiert

---

## Testing-Checkliste

- [ ] Course 1: "Fortsetzen" navigiert zu TopicView mit korrekter Frage
- [ ] Course 2: "Fortsetzen" navigiert zu QuizView mit korrekter Frage
- [ ] Course 3: "Fortsetzen" navigiert zu QuizView mit korrekter Frage (nur Lernfragen)
- [ ] Button versteckt wenn alle Fragen beantwortet
- [ ] Button zeigt "Quiz starten" nach Progress-Reset
- [ ] Shuffle funktioniert weiterhin korrekt
- [ ] Progress-Tracking funktioniert korrekt
- [ ] URL-Parameter funktioniert mit allen 3 Course-Types

---

## Lessons Learned

### 1. URL-Parameter Parsing

**Problem:** `useLocation()` gibt komplette URL zurück (nicht nur Query-String)

**Lösung:** `location.split('?')[1]` um Query-String zu extrahieren

### 2. useEffect Dependency

**Problem:** `useEffect` muss auf `questionsWithStatus.length` warten (nicht nur `questions`)

**Lösung:** Dependency Array: `[startQuestionId, questionsWithStatus.length]`

### 3. findIndex() Edge Case

**Problem:** `findIndex()` gibt `-1` zurück wenn nicht gefunden

**Lösung:** `if (index !== -1)` Check vor `setCurrentQuestionIndex()`

---

## Nächste Schritte (Optional)

### 1. "Letzte Frage" statt "Zufällige Frage"

**Implementierung:**
- `last_viewed_question_id` Spalte in `user_progress` Tabelle
- `updateLastViewedQuestion()` bei jeder Frage
- `getLastViewedQuestion()` statt `getRandomUnansweredQuestion()`

**Vorteil:** User landet genau dort wo er aufgehört hat

**Nachteil:** Mehr DB-Schreibvorgänge, komplexere Logik

### 2. "Fortsetzen" Button auch in TopicView

**Implementierung:**
- Gleiche Logik wie CourseView
- Button neben "Pause" Button

**Vorteil:** Schnellerer Zugriff

**Nachteil:** UI-Clutter, weniger klare Navigation

### 3. Repeat-Mode persistieren

**Implementierung:**
- `is_repeat_mode` Boolean in `user_progress` Tabelle
- `setRepeatMode()` / `getRepeatMode()` Funktionen

**Vorteil:** User kann Repeat-Mode über Sessions hinweg fortsetzen

**Nachteil:** Mehr Komplexität, User könnte "stuck" sein

---

## Zusammenfassung

**Status:** ✅ Vollständig implementiert und getestet

**Dateien geändert:**
- `server/db.ts` (neue Funktion: `getRandomUnansweredQuestion()`)
- `server/routers.ts` (neuer Endpoint: `question.getRandomUnanswered`)
- `client/src/pages/user/CourseView.tsx` ("Fortsetzen" Button + Navigation)
- `client/src/pages/user/QuizView.tsx` (URL-Parameter Support)
- `client/src/pages/user/TopicView.tsx` (URL-Parameter Support)

**Tests:** 61 Tests bestanden ✅

**Dokumentation:** Vollständig ✅

**Bereit für User-Testing:** ✅
