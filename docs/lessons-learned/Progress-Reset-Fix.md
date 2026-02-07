# Progress Reset Fix - Lessons Learned

**Datum:** 06.02.2026  
**Problem:** Progress wird nach Quiz-Abschluss nicht zurückgesetzt  
**Status:** ✅ Gelöst

---

## Problem-Beschreibung

### Symptome

**User-Szenario:**
1. User beantwortet alle 14 Fragen eines Kurses
2. Dialog erscheint: "Möchtest du fehlerhafte Fragen wiederholen?"
3. User klickt "Nein" (oder alle Fragen waren richtig)
4. Zurück zu CourseView
5. **Problem:** Zeigt immer noch "14 von 14 Fragen beantwortet"

**Erwartetes Verhalten:**
- Nach "Nein" klicken: Progress sollte zurückgesetzt werden
- CourseView sollte "0 von 14 Fragen beantwortet" zeigen
- User kann Quiz frisch starten

### Root Cause

**`question_progress` Tabelle wurde NIEMALS gelöscht!**

```typescript
// QuizView.tsx - VORHER
const handleFinish = () => {
  setLocation(`/course/${courseId}`); // Nur Navigation, kein Reset!
};
```

**Problem:**
- `question_progress` Einträge bleiben für immer in der Datenbank
- Bei erneutem Quiz-Start: Alte Daten werden geladen
- User sieht alte Fortschritte statt frischen Start

---

## Zusätzliches Problem: Versuche statt Fragen zählen

### Symptom

**CourseView zeigte "14 von 14 Fragen beantwortet" obwohl User nur 2 Fragen beantwortet hatte!**

### Root Cause

```typescript
// getCourseStats - VORHER
const answered = progress.length; // Zählt ALLE Einträge (inkl. Wiederholungen!)
```

**Problem:**
- `question_progress` speichert JEDEN Versuch (attemptCount)
- Wenn User eine Frage 7x beantwortet: 7 Einträge in DB
- `progress.length` = 7 (statt 1!)

**Beispiel aus Datenbank:**
```
Question 60001: incorrect (attempts: 19) ← 19 Einträge!
Question 30003: correct (attempts: 20)   ← 20 Einträge!
Question 60003: incorrect (attempts: 14) ← 14 Einträge!
```

**Resultat:** `progress.length` = 53 (statt 3 unique Fragen!)

---

## Lösung

### 1. Backend API: `resetCourseProgress`

**Neue API in `server/routers.ts`:**

```typescript
// Setzt Fortschritt für einen Kurs zurück (löscht alle question_progress Einträge)
resetCourseProgress: protectedProcedure
  .input(z.object({ courseId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    await db.resetQuestionProgressByCourse(ctx.user.id, input.courseId);
    return { success: true };
  }),
```

**Neue DB-Funktion in `server/db.ts`:**

```typescript
export async function resetQuestionProgressByCourse(userId: number, courseId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Hole alle Fragen des Kurses
  const courseQuestions = await getQuestionsByCourse(courseId);
  const questionIds = courseQuestions.map(q => q.id);
  
  if (questionIds.length === 0) {
    return;
  }
  
  // Lösche alle question_progress Einträge für diese Fragen
  await db
    .delete(questionProgress)
    .where(and(
      eq(questionProgress.userId, userId),
      inArray(questionProgress.questionId, questionIds)
    ));
}
```

### 2. Frontend: `handleFinish()` erweitern

**QuizView.tsx - NACHHER:**

```typescript
const resetMutation = trpc.question.resetCourseProgress.useMutation({
  onSuccess: () => {
    utils.question.getProgressByCourse.invalidate({ courseId });
    utils.question.getCourseStats.invalidate({ courseId });
    toast.success('Fortschritt zurückgesetzt');
    setLocation(`/course/${courseId}`);
  },
  onError: (error) => {
    toast.error(`Fehler: ${error.message}`);
    setLocation(`/course/${courseId}`);
  },
});

const handleFinish = () => {
  // Reset progress when user finishes quiz (clicks "Nein" or all correct)
  resetMutation.mutate({ courseId });
};
```

**Wichtig:**
- Cache-Invalidierung für `getProgressByCourse` und `getCourseStats`
- Toast-Benachrichtigung "Fortschritt zurückgesetzt"
- Navigation erst nach erfolgreichem Reset

### 3. Fix: Unique Fragen zählen

**getCourseStats - NACHHER:**

```typescript
const total = questions.length;
// Zähle unique Fragen (nicht Versuche!)
const uniqueQuestions = new Set(progress.map((p: any) => p.questionId));
const answered = uniqueQuestions.size;
const correct = progress.filter((p: any) => p.status === 'correct').length;
```

**Auch für Topic-Fortschritt:**

```typescript
// Zähle unique Fragen pro Topic
const uniqueTopicQuestions = new Set(topicProg.map((p: any) => p.questionId));
return {
  topicId: topic.id,
  topicTitle: topic.title,
  total: topicQuestions.length,
  answered: uniqueTopicQuestions.size, // ← Nicht topicProg.length!
  correct: topicProg.filter((p: any) => p.status === 'correct').length,
  percentage: topicQuestions.length > 0 ? Math.round((topicProg.filter((p: any) => p.status === 'correct').length / topicQuestions.length) * 100) : 0,
};
```

---

## Testing

### Test-Szenario 1: Progress Reset nach "Nein"

**Schritte:**
1. User startet Quiz (frisch, keine alten Daten)
2. Beantwortet alle 14 Fragen (einige falsch)
3. Dialog: "Möchtest du fehlerhafte Fragen wiederholen?"
4. User klickt **"Nein"**
5. `resetCourseProgress` wird aufgerufen
6. Zurück zu CourseView

**Resultat:** ✅
- CourseView zeigt "0 von 14 Fragen beantwortet"
- "Quiz starten" Button (nicht "Fortsetzen")
- Toast: "Fortschritt zurückgesetzt"

### Test-Szenario 2: Progress Reset nach perfektem Quiz

**Schritte:**
1. User beantwortet alle 14 Fragen richtig
2. Dialog: "🎉 Perfekt! Alle Fragen richtig beantwortet!"
3. User klickt **"Abschließen"**
4. `resetCourseProgress` wird aufgerufen
5. Zurück zu CourseView

**Resultat:** ✅
- CourseView zeigt "0 von 14 Fragen beantwortet"
- User kann Quiz erneut starten

### Test-Szenario 3: Pause-Funktionalität

**Schritte:**
1. Datenbank für User 180002 gelöscht (frischer Start)
2. Quiz gestartet
3. 4 Fragen beantwortet
4. "Pause" geklickt
5. Zurück zu CourseView

**Resultat:** ✅
- CourseView zeigt **"4 von 14 Fragen beantwortet"** (korrekt!)
- "Fortsetzen" Button sichtbar
- Keine alten Daten mehr

---

## Wichtige Erkenntnisse

### 1. Set() für Unique Counts verwenden

**Anti-Pattern:**
```typescript
const answered = progress.length; // ❌ Zählt Versuche, nicht Fragen!
```

**Best Practice:**
```typescript
const uniqueQuestions = new Set(progress.map(p => p.questionId));
const answered = uniqueQuestions.size; // ✅ Zählt unique Fragen
```

### 2. Cleanup nach Quiz-Abschluss

**Regel:** Wenn User Quiz abschließt (ohne Wiederholung), muss Progress gelöscht werden!

**Wann löschen:**
- User klickt "Nein" bei Wiederholung
- User hat alle Fragen richtig (kein Wiederholungs-Dialog)
- User möchte Quiz neu starten

**Wann NICHT löschen:**
- User klickt "Pause" (Progress behalten!)
- User klickt "Ja, wiederholen" (nur falsche Fragen zeigen)

### 3. Cache-Invalidierung nach Mutations

**Wichtig:** Nach `resetCourseProgress` müssen alle relevanten Queries invalidiert werden:

```typescript
utils.question.getProgressByCourse.invalidate({ courseId });
utils.question.getCourseStats.invalidate({ courseId });
```

**Sonst:** Frontend zeigt alte Daten aus Cache!

### 4. Test-Daten bereinigen

**Problem:** Alte Test-Daten in Datenbank verfälschen Tests!

**Lösung:**
```sql
DELETE FROM question_progress WHERE userId = 180002;
```

**Best Practice:** Vor jedem Test alte Daten löschen für reproduzierbare Ergebnisse.

---

## Offene Punkte

### Resume-Funktionalität

**Aktuell:** "Fortsetzen" Button startet bei Frage 1

**Soll:** "Fortsetzen" Button startet bei erster unbeantworteter Frage (z.B. Frage 5)

**Implementierung:**
1. Backend: Erste unbeantwortete Frage ermitteln
2. Frontend: `startIndex` Parameter an QuizView übergeben
3. QuizView: `currentQuestionIndex` initial auf `startIndex` setzen

---

## Dateien geändert

**Backend:**
- `server/routers.ts` - `resetCourseProgress` API hinzugefügt
- `server/routers.ts` - `getCourseStats` unique questionId Zählung
- `server/db.ts` - `resetQuestionProgressByCourse()` Funktion

**Frontend:**
- `client/src/pages/user/QuizView.tsx` - `handleFinish()` erweitert

**Dokumentation:**
- `docs/lessons-learned/Progress-Reset-Fix.md` (diese Datei)
- `todo.md` - Tasks als erledigt markiert

---

## Zusammenfassung

**Problem:** Progress wurde nie zurückgesetzt + Versuche statt Fragen gezählt

**Lösung:**
1. `resetCourseProgress` API zum Löschen von `question_progress`
2. `Set()` zum Zählen unique Fragen (nicht Versuche)
3. Cache-Invalidierung nach Reset

**Resultat:** ✅
- Progress wird korrekt zurückgesetzt nach Quiz-Abschluss
- CourseView zeigt korrekte Anzahl beantworteter Fragen
- Pause-Funktionalität funktioniert perfekt

**Testing:** ✅ Alle Szenarien erfolgreich getestet
