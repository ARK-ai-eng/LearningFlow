# Wiederholungsmodus Fundamental-Fix (14.02.2026)

## Problem-Beschreibung

User meldete 3 kritische Probleme im Wiederholungsmodus:

1. **Pause-Button funktioniert nicht** - Button verschwindet oder ist nicht klickbar
2. **Fragen werden übersprungen** - Während Wiederholung verschwinden Fragen plötzlich
3. **100% Fortschritt obwohl Wiederholung läuft** - Score zeigt 100% trotz fehlerhafter Fragen

## Root Cause Analyse

### Was war falsch?

**Fundamentaler Architektur-Fehler in `questionProgress` Schema:**

```typescript
// VORHER (FALSCH):
export const questionProgress = mysqlTable("question_progress", {
  status: mysqlEnum("status", ["unanswered", "correct", "incorrect"]),
  attemptCount: int("attemptCount").default(0),
});
```

**Problem:** `status` wurde bei jeder Antwort überschrieben!

**Ablauf des Fehlers:**
1. User beantwortet Frage falsch → `status = 'incorrect'` ✅
2. User startet Wiederholung (Filter: `status === 'incorrect'`)
3. User beantwortet gleiche Frage richtig → `status = 'correct'` ❌
4. **UPSERT überschreibt Status!**
5. Frage verschwindet aus Wiederholungs-Liste (Filter findet sie nicht mehr)
6. Fortschritt zeigt 100% (alle `status = 'correct'`)
7. `isLastQuestion` Logik ist kaputt → Pause-Button verschwindet

### Warum war es falsch?

**ADR-013 Violation:** "Erste Antwort zählt bei Wiederholung"

Die Implementierung hat ADR-013 verletzt:
- ADR-013 sagt: Erste Antwort muss für Score zählen
- Aber Code überschrieb Status bei jeder Antwort
- Keine Unterscheidung zwischen "erste Antwort" und "Wiederholungs-Antwort"

**Backend-Logik in `submitAnswer` (server/routers.ts:746-751):**
```typescript
// VORHER (FALSCH):
await db.upsertQuestionProgress({
  userId: ctx.user.id,
  questionId: input.questionId,
  topicId: input.topicId,
  status: input.isCorrect ? 'correct' : 'incorrect',  // ← Überschreibt!
});
```

**Frontend-Filter in QuizView.tsx:**
```typescript
// VORHER (FALSCH):
const incorrectQuestions = questionsWithStatus.filter(q => q.status === 'incorrect');
const correct = questionsWithStatus.filter(q => q.status === 'correct').length;
```

**Resultat:**
- Nach Wiederholung: `status` ändert sich von 'incorrect' zu 'correct'
- Filter findet keine Fragen mehr → "Keine Fragen verfügbar"
- Score-Berechnung basiert auf aktuellem Status → 100%
- `isLastQuestion` wird falsch berechnet → Pause-Button verschwindet

## Lösung

### Schema-Änderung (Breaking Change)

**Erweitere `questionProgress` Tabelle:**

```typescript
// NACHHER (RICHTIG):
export const questionProgress = mysqlTable("question_progress", {
  // DEPRECATED: Kept for backward compatibility
  status: mysqlEnum("status", ["unanswered", "correct", "incorrect"]),
  
  // NEW: First attempt status (NEVER changes after first answer)
  firstAttemptStatus: mysqlEnum("firstAttemptStatus", ["unanswered", "correct", "incorrect"]),
  
  // NEW: Last attempt result (updates on every answer)
  lastAttemptCorrect: boolean("lastAttemptCorrect"),
  
  attemptCount: int("attemptCount").default(0),
});
```

**Semantik:**
- `firstAttemptStatus`: Wird EINMAL gesetzt (bei erster Antwort), NIEMALS überschrieben
- `lastAttemptCorrect`: Wird bei jeder Antwort aktualisiert (für UI-Feedback)
- `status`: Deprecated, nur für Backward Compatibility

### Backend-Änderungen

**1. `upsertQuestionProgress` (server/db.ts:547-604):**

```typescript
// NACHHER (RICHTIG):
export async function upsertQuestionProgress(data: {
  userId: number;
  questionId: number;
  topicId: number;
  isCorrect: boolean; // Changed from 'status' to 'isCorrect'
}): Promise<void> {
  const existing = await db.select()...;
  
  if (existing.length > 0) {
    // Update: Erhöhe attemptCount, update lastAttemptCorrect
    // ABER: firstAttemptStatus bleibt unverändert! (ADR-013)
    await db.update(questionProgress).set({
      status: data.isCorrect ? 'correct' : 'incorrect', // Deprecated
      lastAttemptCorrect: data.isCorrect,
      attemptCount: sql`${questionProgress.attemptCount} + 1`,
    });
  } else {
    // Insert: Erste Antwort - setze firstAttemptStatus
    const status = data.isCorrect ? 'correct' : 'incorrect';
    await db.insert(questionProgress).values({
      status: status,
      firstAttemptStatus: status, // Set once, never change!
      lastAttemptCorrect: data.isCorrect,
      attemptCount: 1,
    });
  }
}
```

**2. `submitAnswer` Score-Berechnung (server/routers.ts:761-764):**

```typescript
// NACHHER (RICHTIG):
// Berechne Score basierend auf FIRST ATTEMPT
const correctCount = topicProgress.filter(p => p.firstAttemptStatus === 'correct').length;
const score = Math.round((correctCount / topicQuestions.length) * 100);
```

**3. `getIncorrectQuestionsByTopic` (server/db.ts:606-623):**

```typescript
// NACHHER (RICHTIG):
const results = await db.select()
  .from(questionProgress)
  .where(and(
    eq(questionProgress.userId, userId),
    eq(questionProgress.topicId, topicId),
    eq(questionProgress.firstAttemptStatus, 'incorrect') // Changed!
  ));
```

### Frontend-Änderungen

**QuizView.tsx (Course 2 + 3):**

```typescript
// NACHHER (RICHTIG):
// Filter auf firstAttemptStatus
const incorrectQuestions = questionsWithStatus.filter(q => q.firstAttemptStatus === 'incorrect');

// Stats basieren auf firstAttemptStatus
const stats = useMemo(() => {
  const answered = questionsWithStatus.filter(q => q.firstAttemptStatus !== 'unanswered').length;
  const correct = questionsWithStatus.filter(q => q.firstAttemptStatus === 'correct').length;
  const incorrect = questionsWithStatus.filter(q => q.firstAttemptStatus === 'incorrect').length;
  // ...
});
```

**TopicView.tsx (Course 1):**

```typescript
// NACHHER (RICHTIG):
const stats = useMemo(() => {
  const answered = questionsWithStatus.filter(q => q.firstAttemptStatus !== 'unanswered').length;
  const correct = questionsWithStatus.filter(q => q.firstAttemptStatus === 'correct').length;
  const incorrect = questionsWithStatus.filter(q => q.firstAttemptStatus === 'incorrect').length;
  // ...
});
```

### Migration

**1. Schema Migration (drizzle/0007_jittery_ares.sql):**

```sql
ALTER TABLE `question_progress` ADD `firstAttemptStatus` enum('unanswered','correct','incorrect') DEFAULT 'unanswered' NOT NULL;
ALTER TABLE `question_progress` ADD `lastAttemptCorrect` boolean;
CREATE INDEX `idx_user_topic_first_attempt` ON `question_progress` (`userId`,`topicId`,`firstAttemptStatus`);
DROP INDEX `idx_user_topic_status` ON `question_progress`;
```

**2. Daten-Migration:**

```sql
UPDATE question_progress 
SET firstAttemptStatus = status,
    lastAttemptCorrect = CASE 
      WHEN status = 'correct' THEN TRUE
      WHEN status = 'incorrect' THEN FALSE
      ELSE NULL
    END
WHERE firstAttemptStatus = 'unanswered';
```

## Was wurde gelernt?

### 1. Schema-Design für Wiederholungs-Logik

**Regel:** Bei Quiz/Test-Systemen mit Wiederholung:
- **NIEMALS** Status überschreiben
- **IMMER** erste Antwort separat speichern
- **IMMER** zwischen "Score-relevant" und "UI-Feedback" trennen

**Pattern:**
```typescript
{
  firstAttemptStatus: 'correct' | 'incorrect',  // Score-relevant
  lastAttemptCorrect: boolean,                  // UI-Feedback
  attemptCount: number,                         // Statistik
}
```

### 2. ADR-Compliance prüfen

**Regel:** Vor Implementierung ALLE relevanten ADRs lesen!
- ADR-013 war klar: "Erste Antwort zählt"
- Aber Implementierung hat es verletzt
- Hätte durch Code-Review verhindert werden können

### 3. Symptom vs. Root Cause

**User meldet:**
- "Pause-Button funktioniert nicht"
- "Fragen werden übersprungen"
- "100% Fortschritt"

**Echtes Problem:**
- Schema-Design fundamental falsch
- Status wird überschrieben
- Alle Symptome sind Folge davon

**Lektion:** Bei mehreren Symptomen → Root Cause suchen!

### 4. Breaking Changes richtig handhaben

**Vorgehen:**
1. Schema erweitern (neue Felder hinzufügen)
2. Alte Felder als "deprecated" markieren (nicht löschen!)
3. Migration schreiben (Daten kopieren)
4. Backend anpassen (neue Felder verwenden)
5. Frontend anpassen (neue Felder verwenden)
6. Testen (alle Szenarien)
7. Später: Deprecated Felder entfernen (separate Migration)

## Abhängigkeiten

**Betroffene Komponenten:**
- ✅ `drizzle/schema.ts` - Schema erweitert
- ✅ `server/db.ts` - `upsertQuestionProgress`, `getIncorrectQuestionsByTopic`
- ✅ `server/routers.ts` - `submitAnswer` Score-Berechnung
- ✅ `client/src/pages/user/QuizView.tsx` - Filter + Stats
- ✅ `client/src/pages/user/TopicView.tsx` - Stats

**Nicht betroffen:**
- ❌ Course 3 Certification-Logik (verwendet gleiche Basis)
- ❌ Dashboard (zeigt aggregierte Stats)
- ❌ Zertifikate (basieren auf finalem Score)

## Testing-Szenarien

**1. Normal-Modus (alle korrekt):**
- User beantwortet alle Fragen richtig
- Score: 100%
- Kein Wiederholungs-Dialog
- ✅ Funktioniert

**2. Normal-Modus (einige falsch):**
- User beantwortet 3 von 13 falsch
- Score: 77%
- Dialog: "Fehlerhafte Fragen wiederholen?"
- ✅ Funktioniert

**3. Wiederholungsmodus (alle korrekt):**
- User wiederholt 3 Fragen, alle richtig
- Dialog: "Glückwunsch! Alle Fragen korrekt"
- Score bleibt 77% (erste Antwort zählt!)
- ✅ Funktioniert

**4. Wiederholungsmodus (noch Fehler):**
- User wiederholt 3 Fragen, 1 noch falsch
- Dialog: "Nochmal wiederholen? Du hast noch 1 fehlerhafte Frage"
- ✅ Funktioniert

**5. Counter-Stabilität:**
- "Frage X von Y" bleibt stabil
- Kein "4 von 3" Bug mehr
- ✅ Funktioniert

**6. Pause-Button:**
- Erscheint bei allen Fragen außer letzter
- Navigation zurück funktioniert
- ✅ Funktioniert

## Dateien

**Geänderte Dateien:**
- `drizzle/schema.ts` - Schema erweitert
- `drizzle/0007_jittery_ares.sql` - Migration
- `server/db.ts` - `upsertQuestionProgress`, `getIncorrectQuestionsByTopic`
- `server/routers.ts` - `submitAnswer`
- `client/src/pages/user/QuizView.tsx` - Filter + Stats
- `client/src/pages/user/TopicView.tsx` - Stats

**Dokumentation:**
- `docs/lessons-learned/wiederholungsmodus-fundamental-fix-feb14.md` - Diese Datei
- `docs/debugging/repeat-mode-fixes-feb14.md` - Technische Details
- `todo.md` - Tasks aktualisiert

## Zusammenfassung

**Problem:** Schema-Design erlaubte Status-Überschreibung → Wiederholung kaputt

**Lösung:** Schema erweitert mit `firstAttemptStatus` (NIEMALS ändern) + `lastAttemptCorrect` (UI-Feedback)

**Resultat:**
- ✅ Pause-Button funktioniert
- ✅ Fragen werden nicht übersprungen
- ✅ Fortschritt korrekt (basierend auf erster Antwort)
- ✅ ADR-013 Compliance
- ✅ Alle Tests bestehen

**Aufwand:** ~2 Stunden (Schema-Änderung, Backend, Frontend, Migration, Testing)

**Risiko:** Niedrig (Breaking Change, aber gut getestet + Backward Compatibility)
