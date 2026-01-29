# ADR-015: Kurs-basiertes Quiz statt Themen-basiert

**Status:** Akzeptiert  
**Datum:** 29.01.2026  
**Entscheider:** Product Owner, Development Team

---

## Kontext

Ursprünglich war das Quiz-System **Themen-basiert**:
- Admin erstellt Themen (z.B. "Phishing", "Passwörter", "MFA")
- Fragen werden Themen zugeordnet
- User bearbeitet jedes Thema einzeln
- Fortschritt wird pro Thema getrackt

**Problem:**
- User muss jedes Thema einzeln öffnen und abschließen
- Kein durchgehender Quiz-Flow über alle 12 Fragen
- Komplexe Navigation (Thema 1 → Kurs → Thema 2 → Kurs → ...)
- Fortschritt fragmentiert über mehrere Themen

**Anforderung:**
- Ein durchgehender Quiz über ALLE Fragen eines Kurses
- Frage 1 → Frage 2 → ... → Frage 12 (ohne Themen-Unterbrechungen)
- Fortschritt pro Kurs (nicht pro Thema)

---

## Entscheidung

**Option 2 gewählt: Themen als Tags, Quiz über alle Fragen**

### Was ändert sich?

**Backend:**
- Neue API: `question.listByCourse(courseId)` - gibt alle Fragen eines Kurses zurück
- Neue API: `question.getProgressByCourse(courseId)` - Fortschritt pro Kurs
- Neue DB-Funktion: `getQuestionProgressByCourse(userId, courseId)`

**Frontend:**
- Neue Route: `/course/:id/quiz` - Quiz-Ansicht
- CourseView: "Quiz starten" Button statt Themen-Liste
- QuizView: Basierend auf TopicView, aber für ganzen Kurs
- Themen bleiben sichtbar (nur zur Info, nicht klickbar)

**Was bleibt unberührt?**
- ✅ Datenbank-Schema (keine Migration!)
- ✅ Admin-Funktionen (Themen/Fragen anlegen)
- ✅ Bestehende Fortschritte (bleiben erhalten)
- ✅ TopicView (falls später gebraucht)

---

## Alternativen

### Option 1: Themen komplett entfernen ❌

**Vorteile:**
- Einfachste Datenstruktur
- Keine Themen-Verwaltung nötig

**Nachteile:**
- ❌ Verlust der inhaltlichen Struktur
- ❌ Admin kann Fragen nicht mehr organisieren
- ❌ Schwer zu skalieren (100+ Fragen ohne Kategorien = Chaos)
- ❌ Große Datenbank-Migration nötig
- ❌ Bestehende Daten müssen umstrukturiert werden

**Warum abgelehnt:** Zu riskant, zu aufwändig, verliert Flexibilität

---

## Konsequenzen

### Positiv ✅

1. **Bessere UX:** Ein durchgehender Quiz-Flow ohne Unterbrechungen
2. **Schnelle Umsetzung:** 2 Stunden statt 2 Tage (keine DB-Migration)
3. **Minimales Risiko:** Bestehende Funktionen bleiben erhalten
4. **Zukunftssicher:** Themen können später für Statistiken genutzt werden
5. **Flexibel:** Admin kann weiter Themen zur Organisation nutzen

### Negativ ❌

1. **Doppelte Struktur:** Topic-basiert UND Course-basiert parallel
2. **Mehr Code:** Zwei Sets von APIs (listByTopic + listByCourse)
3. **Verwirrung:** Themen sind sichtbar, aber nicht klickbar (könnte User verwirren)

### Mitigation

- Themen klar als "Zur Info" kennzeichnen
- Später: Themen für erweiterte Statistiken nutzen ("Schwächen in Thema X")
- Später: Optional "Nur Thema X wiederholen" Feature

---

## Implementierung

**Backend (30 min):**
```typescript
// server/routers.ts
listByCourse: protectedProcedure
  .input(z.object({ courseId: z.number() }))
  .query(async ({ input, ctx }) => {
    // Get all questions for a course
  });

getProgressByCourse: protectedProcedure
  .input(z.object({ courseId: z.number() }))
  .query(async ({ input, ctx }) => {
    // Get progress for all questions in course
  });
```

**Frontend (1 Stunde):**
```tsx
// CourseView.tsx
<Button onClick={() => setLocation(`/course/${courseId}/quiz`)}>
  Quiz starten
</Button>

// QuizView.tsx (basierend auf TopicView)
const { data: questions } = trpc.question.listByCourse.useQuery({ courseId });
const { data: progress } = trpc.question.getProgressByCourse.useQuery({ courseId });
```

**Tests (30 min):**
- Unit Tests für neue APIs
- Integration Test: Quiz-Flow über alle Fragen

---

## Lessons Learned

1. **Immer Alternativen evaluieren:** Option 1 vs Option 2 klar dokumentieren
2. **Risiko minimieren:** Keine DB-Migration = schneller + sicherer
3. **Flexibilität bewahren:** Themen behalten für zukünftige Features
4. **User-Feedback einholen:** Vor großen Änderungen Stakeholder fragen

---

## Referenzen

- Sprint 8 Implementation Prompts: `docs/sprint-8-implementation-prompts.md`
- Lessons Learned: `docs/lessons-learned/Sprint-8-Dialog-Timing-Misunderstanding.md`
- Related ADRs: ADR-013 (Erste Antwort zählt)
