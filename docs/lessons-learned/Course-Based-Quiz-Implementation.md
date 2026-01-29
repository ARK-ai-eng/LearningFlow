# Lessons Learned: Kurs-basiertes Quiz Implementierung

**Datum:** 29.01.2026  
**Sprint:** 8 (Fortsetzung)  
**Thema:** Umstellung von Themen-basiertem zu Kurs-basiertem Quiz

---

## Problem

Das ursprüngliche Themen-basierte Quiz-System brach die User Experience:
- User musste jedes Thema einzeln öffnen
- Kein durchgehender Flow über alle 12 Fragen
- Komplexe Navigation (Thema → Kurs → Thema → Kurs...)

**Root Cause:**  
Admin legt Themen an, dann Fragen → Themen-Struktur erzwingt fragmentierten Quiz-Flow

---

## Entscheidungsprozess

### Schritt 1: Problem erkennen
User-Feedback: "Warum muss ich auf jede Frage klicken um Antworten zu sehen?"  
→ Führte zur Erkenntnis, dass Themen-Struktur das eigentliche Problem ist

### Schritt 2: Alternativen evaluieren

**Option 1:** Themen komplett entfernen  
- ❌ Datenbank-Migration nötig
- ❌ Admin verliert Organisations-Tool
- ❌ Risiko: Datenverlust

**Option 2:** Themen als Tags, Quiz über alle Fragen  
- ✅ Keine DB-Migration
- ✅ Admin behält Themen zur Organisation
- ✅ Minimales Risiko

### Schritt 3: Präsentation & Freigabe
Präsentationsskript erstellt mit:
- Problem-Beschreibung
- Alternativen-Vergleich (Tabelle)
- Risiken & Mitigation
- Zeitaufwand (2h vs 2 Tage)

**Ergebnis:** Freigabe für Option 2

---

## Implementierung

### Backend (30 min)

**Neue APIs:**
```typescript
// server/routers.ts
listByCourse: protectedProcedure
  .input(z.object({ courseId: z.number() }))
  .query(async ({ input, ctx }) => {
    const questions = await db.query.question.findMany({
      where: (q, { eq }) => eq(q.courseId, input.courseId),
    });
    return questions;
  });

getProgressByCourse: protectedProcedure
  .input(z.object({ courseId: z.number() }))
  .query(async ({ input, ctx }) => {
    return await getQuestionProgressByCourse(ctx.user.id, input.courseId);
  });
```

**Neue DB-Funktion:**
```typescript
// server/db.ts
export async function getQuestionProgressByCourse(userId: number, courseId: number) {
  // Get all questions for course
  const questions = await db.query.question.findMany({
    where: (q, { eq }) => eq(q.courseId, courseId),
  });
  
  // Get progress for all questions
  const progress = await db.query.questionProgress.findMany({
    where: (qp, { and, eq, inArray }) => and(
      eq(qp.userId, userId),
      inArray(qp.questionId, questions.map(q => q.id))
    ),
  });
  
  return {
    total: questions.length,
    answered: progress.length,
    correct: progress.filter(p => p.status === 'correct').length,
    incorrect: progress.filter(p => p.status === 'incorrect').length,
  };
}
```

### Frontend (1 Stunde)

**CourseView umgebaut:**
```tsx
// client/src/pages/user/CourseView.tsx
<div className="glass-card p-8 text-center">
  <BookOpen className="w-16 h-16 mx-auto mb-4 text-primary" />
  <h2 className="text-2xl font-semibold mb-2">Quiz starten</h2>
  <p className="text-muted-foreground mb-6">
    {courseProgress?.total || 0} Fragen warten auf dich
  </p>
  <Button 
    size="lg" 
    onClick={() => setLocation(`/course/${courseId}/quiz`)}
  >
    <Play className="w-5 h-5 mr-2" />
    {courseProgress && courseProgress.answered > 0 ? 'Fortsetzen' : 'Starten'}
  </Button>
</div>
```

**QuizView erstellt:**
```tsx
// client/src/pages/user/QuizView.tsx
export default function QuizView() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id || "0");

  const { data: questions } = trpc.question.listByCourse.useQuery({ courseId });
  const { data: progress } = trpc.question.getProgressByCourse.useQuery({ courseId });
  
  // Rest basierend auf TopicView
}
```

**Route hinzugefügt:**
```tsx
// client/src/App.tsx
import QuizView from "./pages/user/QuizView";

<Route path="/course/:id/quiz" component={QuizView} />
```

### Tests (30 min)

**Bestehende Tests:** 61 Tests bestanden ✅  
**Keine neuen Tests nötig:** Logik basiert auf TopicView (bereits getestet)

---

## Ergebnisse

### Was funktioniert ✅

1. **Quiz-Flow:** Ein durchgehender Quiz über alle 12 Fragen
2. **Fortschritt:** Korrekte Anzeige "X von Y Fragen beantwortet"
3. **Navigation:** "Quiz starten" → Frage 1 → ... → Frage 12 → Dialog
4. **Themen:** Bleiben zur Info sichtbar (nicht klickbar)

### Was noch fehlt ❌

1. **Dashboard-Fortschritt:** Kurs-Cards zeigen noch alte Themen-basierte %
2. **Wiederholungs-Logik:** "Ja, wiederholen" funktioniert noch nicht korrekt
3. **Pause-Funktion:** Noch nicht implementiert

---

## Lessons Learned

### Was gut lief ✅

1. **Alternativen-Evaluierung:** Tabelle mit Pro/Contra half bei Entscheidung
2. **Risiko-Minimierung:** Keine DB-Migration = schnelle Umsetzung
3. **Iteratives Vorgehen:** Backend → Frontend → Tests (Schritt für Schritt)
4. **Dokumentation:** ADR + Lessons Learned parallel zur Implementierung

### Was verbessert werden kann 🔧

1. **Früher Feedback einholen:** Problem hätte früher erkannt werden können
2. **Prototyp erstellen:** Mockup hätte User-Feedback ermöglicht
3. **Tests erweitern:** Neue APIs sollten eigene Unit Tests haben

### Checkliste für zukünftige Umstellungen

- [ ] Problem klar definieren (User-Perspektive)
- [ ] Alternativen evaluieren (mindestens 2)
- [ ] Risiken & Mitigation dokumentieren
- [ ] Zeitaufwand schätzen (realistisch!)
- [ ] Präsentation erstellen (Stakeholder-Freigabe)
- [ ] ADR schreiben (BEVOR implementiert wird)
- [ ] Iterativ umsetzen (Backend → Frontend → Tests)
- [ ] Lessons Learned dokumentieren (NACH Implementierung)

---

## Nächste Schritte

1. **Dashboard-Fortschritt korrigieren:** getCourseProgress API verwenden
2. **Wiederholungs-Logik:** Nur fehlerhafte Fragen anzeigen (Filter)
3. **Pause-Funktion:** Fortschritt speichern, "Fortsetzen" Button
4. **Schritt 5-6 abschließen:** Sprint 8 Korrekturen fertigstellen

---

## Referenzen

- ADR-015: `docs/decisions/ADR-015-Course-Based-Quiz.md`
- Sprint 8: `docs/sprint-8-implementation-prompts.md`
- Dialog-Timing: `docs/lessons-learned/Sprint-8-Dialog-Timing-Misunderstanding.md`
