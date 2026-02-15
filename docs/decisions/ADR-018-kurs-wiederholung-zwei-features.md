# ADR-018: Kurs-Wiederholung - Zwei Features mit unterschiedlicher Logik

**Status:** ✅ Akzeptiert  
**Datum:** 15. Februar 2026  
**Autor:** Manus AI  
**Kontext:** Bug-Fix Session (Dashboard-Fortschritt & Kurs-Wiederholung)

---

## Kontext

Nach der Implementierung von "Falsche Fragen wiederholen" (ADR-016) stellte sich heraus dass es **zwei verschiedene Wiederholungs-Features** gibt die unterschiedliche Logik benötigen:

1. **"Kurs wiederholen" bei 100% Abschluss** - User will den kompletten Kurs neu starten
2. **"Falsche Fragen wiederholen" bei <100%** - User will nur die falschen Fragen nochmal beantworten

Beide Features wurden initial vermischt was zu einem kritischen Bug führte: "Kurs wiederholen" setzte nur `incorrect` Fragen zurück statt ALLE Fragen.

---

## Entscheidung

Wir trennen die beiden Features klar und definieren unterschiedliche Logik:

### Feature 1: "Kurs wiederholen" (Komplett-Reset)

**Wann:** Erscheint nur bei 100% Kurs-Abschluss

**Was passiert:**
1. User klickt "Kurs wiederholen" Button
2. Dialog: "Dein Fortschritt wird zurückgesetzt und du kannst den Kurs erneut durchführen. Dein Abschlussdatum bleibt für Compliance-Zwecke gespeichert."
3. Bei Bestätigung: `resetQuestionProgressByCourse()` wird aufgerufen
4. ALLE `question_progress` Einträge werden gelöscht
5. ALLE `user_progress` Einträge werden auf `status='in_progress'` gesetzt
6. `lastCompletedAt` bleibt erhalten (Compliance!)
7. Fortschritt: 0%
8. User sieht wieder alle 12 Fragen

**Funktion:**
```typescript
export async function resetQuestionProgressByCourse(userId: number, courseId: number) {
  // 1. Lösche ALLE question_progress Einträge
  await db.delete(questionProgress)
    .where(and(
      eq(questionProgress.userId, userId),
      eq(questionProgress.courseId, courseId)
    ));

  // 2. Setze ALLE user_progress auf 'in_progress'
  await db.update(userProgress)
    .set({ status: 'in_progress' })
    .where(and(
      eq(userProgress.userId, userId),
      eq(userProgress.courseId, courseId)
    ));

  // lastCompletedAt bleibt erhalten!
}
```

**API-Endpoint:**
```typescript
course: {
  resetProgress: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.resetQuestionProgressByCourse(ctx.user.id, input.courseId);
      return { success: true };
    }),
}
```

---

### Feature 2: "Falsche Fragen wiederholen" (Selektive Anzeige)

**Wann:** Automatisch bei <100% Kurs-Fortschritt

**Was passiert:**
1. User öffnet Kurs mit 58% Fortschritt (7/12 correct)
2. CourseView zeigt: "5 Fragen warten auf dich"
3. User klickt "Starten"
4. Quiz zeigt NUR die 5 Fragen mit `firstAttemptStatus='incorrect'` ODER `'unanswered'`
5. User beantwortet die 5 Fragen nochmal
6. Bei korrekter Antwort: `firstAttemptStatus` wird auf `'correct'` gesetzt
7. Fortschritt steigt: 58% → 67% → 75% → ...
8. Bei 100%: "Kurs abgeschlossen!" Meldung

**Wichtig:** KEIN Reset nötig! Die Logik funktioniert automatisch durch:

```typescript
// getUnansweredQuestionsByCourse() gibt nur Fragen zurück mit:
// - firstAttemptStatus = 'unanswered' ODER
// - firstAttemptStatus = 'incorrect'

export async function getUnansweredQuestionsByCourse(userId: number, courseId: number) {
  return await db.select({
    id: questions.id,
    text: questions.text,
    optionA: questions.optionA,
    optionB: questions.optionB,
    optionC: questions.optionC,
    optionD: questions.optionD,
    correctAnswer: questions.correctAnswer,
    topicId: questions.topicId,
  })
  .from(questions)
  .leftJoin(questionProgress, and(
    eq(questionProgress.questionId, questions.id),
    eq(questionProgress.userId, userId)
  ))
  .where(and(
    eq(questions.courseId, courseId),
    or(
      isNull(questionProgress.id),  // Noch nie beantwortet
      eq(questionProgress.firstAttemptStatus, 'incorrect')  // Falsch beantwortet
    )
  ));
}
```

**Fortschritts-Berechnung:**
```typescript
const progress = (correct / total) * 100;  // Nur KORREKTE Antworten zählen!
```

---

## Vergleich der Features

| Aspekt | Kurs wiederholen (100%) | Falsche Fragen wiederholen (<100%) |
|--------|-------------------------|-------------------------------------|
| **Trigger** | Button "Kurs wiederholen" | Automatisch im Quiz |
| **Bedingung** | Fortschritt = 100% | Fortschritt < 100% |
| **Reset** | Ja - ALLE Fragen | Nein - nur Anzeige-Filter |
| **Funktion** | `resetQuestionProgressByCourse()` | `getUnansweredQuestionsByCourse()` |
| **Fortschritt** | 0% → User fängt neu an | 58% → 67% → 75% → ... |
| **Fragen** | Alle 12 Fragen | Nur 5 falsche Fragen |
| **lastCompletedAt** | Bleibt erhalten | Wird bei 100% gesetzt |
| **Use-Case** | Auffrischung nach 1 Jahr | Fehler korrigieren |

---

## Konsequenzen

### Positiv

1. **Klare Trennung** - Zwei Features mit unterschiedlicher Logik, keine Vermischung
2. **Einfache Implementierung** - Feature #2 braucht KEINEN Reset, funktioniert automatisch
3. **Compliance-konform** - `lastCompletedAt` bleibt bei Feature #1 erhalten
4. **User-freundlich** - Bei <100% muss User nicht den ganzen Kurs neu machen

### Negativ

1. **Verwirrung möglich** - User könnte denken "Kurs wiederholen" = "Falsche Fragen wiederholen"
2. **Zwei verschiedene Begriffe** - "Wiederholen" hat zwei Bedeutungen

### Risiken

1. **Zukünftige Entwickler** könnten die Features wieder vermischen
2. **Feature #1 kaputt machen** durch Änderungen an `resetQuestionProgressByCourse()`

---

## Mitigationen

### 1. Klarere Button-Texte

**Vorher:**
- "Kurs wiederholen" (bei 100%)
- "Starten" (bei <100%)

**Nachher:**
- "Kurs neu starten" (bei 100%) + Dialog-Warnung
- "Falsche Fragen üben" (bei <100%)

### 2. Dokumentation

- [x] ADR-018 erstellt (dieses Dokument)
- [x] Lessons Learned dokumentiert (`LESSONS-LEARNED-SESSION-2026-02-15.md`)
- [ ] Code-Kommentare in `resetQuestionProgressByCourse()`:
  ```typescript
  /**
   * WICHTIG: Diese Funktion löscht ALLE question_progress Einträge!
   * Verwende sie NUR für "Kurs neu starten" bei 100% Abschluss.
   * 
   * Für "Falsche Fragen wiederholen" bei <100% verwende stattdessen
   * getUnansweredQuestionsByCourse() - kein Reset nötig!
   */
  ```

### 3. Tests

- [x] Unit-Test für `resetQuestionProgressByCourse()` (löscht ALLE Einträge)
- [ ] Unit-Test für `getUnansweredQuestionsByCourse()` (gibt nur incorrect/unanswered zurück)
- [ ] Integration-Test: Komplett-Reset bei 100%
- [ ] Integration-Test: Falsche Fragen bei <100%

---

## Alternativen

### Alternative 1: Zwei separate Reset-Funktionen

```typescript
resetQuestionProgressByCourse()     // ALLE Fragen zurücksetzen
resetIncorrectQuestionsOnly()        // Nur incorrect zurücksetzen
```

**Abgelehnt weil:** Feature #2 braucht KEINEN Reset! Die Logik funktioniert bereits durch `getUnansweredQuestionsByCourse()`.

### Alternative 2: Parameter für Reset-Typ

```typescript
resetQuestionProgressByCourse(userId, courseId, resetType: 'all' | 'incorrect')
```

**Abgelehnt weil:** Macht die Funktion komplexer ohne Mehrwert. Feature #2 braucht keinen Reset.

### Alternative 3: "Kurs wiederholen" komplett entfernen

**Abgelehnt weil:** User wollen nach 1 Jahr den Kurs komplett neu machen können (Auffrischung, Re-Zertifizierung).

---

## Implementation Checklist

- [x] `resetQuestionProgressByCourse()` auf Original zurückgesetzt (löscht ALLE)
- [x] `getUnansweredQuestionsByCourse()` prüfen (gibt nur incorrect/unanswered zurück)
- [x] CourseView: "Fragen warten" = `total - correct` (nicht `total - answered`)
- [x] Dashboard: Fortschritt = `correct / total * 100`
- [x] Tests: `dashboard.progress.test.ts` erstellt
- [ ] Button-Texte ändern: "Kurs neu starten" + "Falsche Fragen üben"
- [ ] Dialog-Warnung bei "Kurs neu starten"
- [ ] Code-Kommentare hinzufügen
- [ ] Integration-Tests schreiben

---

## Referenzen

- [ADR-016: Kurs-Wiederholung mit Compliance-Tracking](./ADR-016-kurs-wiederholung-compliance.md)
- [Lessons Learned: Session 15.02.2026](../LESSONS-LEARNED-SESSION-2026-02-15.md)
- [Critical Database Migration Rules](../CRITICAL-DATABASE-MIGRATION-RULES.md)

---

## Änderungshistorie

| Datum | Autor | Änderung |
|-------|-------|----------|
| 15.02.2026 | Manus AI | Initial erstellt |
