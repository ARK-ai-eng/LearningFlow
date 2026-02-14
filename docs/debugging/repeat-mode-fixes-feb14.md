# Wiederholungsmodus Fixes - Feb 14, 2026

## Übersicht

Drei kritische Bugs und Features im Wiederholungsmodus wurden behoben:
1. "4 von 3" Counter-Overflow Bug
2. Fehlender Erfolgs-Dialog nach allen Fragen korrekt
3. Fehlender automatischer Wiederholungs-Dialog

---

## Bug 1: "4 von 3" Counter-Overflow

### Problem

**Symptom:**
- User startet Wiederholung mit 3 falschen Fragen
- Nach Beantwortung erscheint "Frage 4 von 3"
- Counter zeigt mehr Fragen als existieren

**Root Cause:**
```typescript
// VORHER (Zeile 152):
const isLastQuestion = currentQuestionIndex === activeQuestions.length - 1;
```

**Was passierte:**
1. User startet Wiederholung: `initialRepeatCount = 3` ✅
2. `activeQuestions` filtert auf `status === 'incorrect'` (3 Fragen)
3. User beantwortet Frage korrekt
4. **BUG:** `activeQuestions` Filter (Zeile 122-149) behält gerade beantwortete Frage in Liste (um Auto-Advance zu verhindern)
5. `activeQuestions.length` = 4 (3 falsche + 1 gerade beantwortete)
6. `currentQuestionIndex` wird zu 3 (4. Frage)
7. Anzeige: "Frage 4 von 3" ❌

**Warum behält Filter die Frage?**
- Zeile 128-143: Wenn `currentQuestion` nicht in `incorrectQuestions` → füge hinzu
- Zweck: Verhindert dass Frage sofort aus Liste verschwindet nach korrekter Antwort
- Nebenwirkung: `activeQuestions.length` ist temporär größer als `initialRepeatCount`

### Lösung

```typescript
// NACHHER (Zeile 153-157):
// isLastQuestion: In repeat mode, use initialRepeatCount to determine if we're at the last question
// This prevents "4 von 3" bug where activeQuestions.length temporarily includes just-answered question
const isLastQuestion = isRepeatMode && initialRepeatCount !== null
  ? currentQuestionIndex === initialRepeatCount - 1
  : currentQuestionIndex === activeQuestions.length - 1;
```

**Logik:**
- Im Wiederholungsmodus: `isLastQuestion` basiert auf `initialRepeatCount` (stabil)
- Im Normal-Modus: `isLastQuestion` basiert auf `activeQuestions.length` (wie vorher)

**Resultat:**
- ✅ "Frage 3 von 3" bleibt stabil
- ✅ Kein Counter-Overflow mehr
- ✅ `isLastQuestion` triggert korrekt nach letzter Frage

---

## Feature 2: Erfolgs-Dialog nach Wiederholungsmodus

### Problem

**Fehlend:**
- Nach Wiederholungsmodus alle Fragen korrekt → kein Dialog
- User wurde direkt zu CourseView zurückgeschickt
- Keine Bestätigung, keine Optionen

**Anforderung:**
- Dialog: "Glückwunsch! Alle Fragen korrekt beantwortet"
- Optionen:
  1. "Abschließen" → Progress reset, zurück zu CourseView
  2. "Nochmal machen" → Quiz neu starten
  3. "Später" → zurück zu CourseView (Progress bleibt)

### Lösung

**handleNextQuestion() erweitert (Zeile 199-231):**
```typescript
if (isLastQuestion) {
  // In repeat mode: Check if all repeat questions are now correct
  if (isRepeatMode) {
    // Refresh stats to check current state
    const currentIncorrect = questionsWithStatus.filter(q => q.status === 'incorrect').length;
    
    if (currentIncorrect === 0) {
      // All repeat questions answered correctly! Show success dialog
      setShowRepeatDialog(true);
    } else {
      // Still some incorrect - ask if user wants to repeat again
      setShowRepeatDialog(true);
    }
  } else {
    // Normal mode: Show repeat dialog if there are incorrect answers
    if (stats.incorrect > 0) {
      setShowRepeatDialog(true);
    } else {
      // All correct - go back to course
      setLocation(`/course/${courseId}`);
    }
  }
}
```

**Dialog-Logik (Zeile 451-463):**
```typescript
{isRepeatMode && stats.incorrect === 0 ? (
  // Repeat mode completed successfully - all correct!
  <>
    <Button onClick={handleFinish} className="w-full sm:w-auto">
      ✅ Abschließen
    </Button>
    <Button variant="outline" onClick={handleRestartAll} className="w-full sm:w-auto">
      🔄 Nochmal machen
    </Button>
    <Button variant="ghost" onClick={handleContinueLater} className="w-full sm:w-auto">
      ⏸️ Später
    </Button>
  </>
) : ...}
```

**Resultat:**
- ✅ Dialog erscheint nach allen Fragen korrekt
- ✅ 3 klare Optionen für User
- ✅ "Abschließen" resettet Progress (ruft `handleFinish()` → `resetCourseProgress`)

---

## Feature 3: Automatischer Wiederholungs-Dialog

### Problem

**Fehlend:**
- Nach Wiederholungsmodus noch fehlerhafte Fragen → kein Dialog
- User konnte nicht nochmal wiederholen
- Keine Frage "Willst du nochmal wiederholen?"

**Anforderung:**
- Dialog: "Nochmal wiederholen?"
- Text: "Du hast noch X fehlerhafte Frage(n). Möchtest du diese nochmal wiederholen?"
- Optionen:
  1. "Ja, nochmal wiederholen" → Wiederholung erneut starten
  2. "Später fortsetzen" → zurück zu CourseView

### Lösung

**handleNextQuestion() prüft automatisch (Zeile 205-215):**
```typescript
if (isRepeatMode) {
  // Refresh stats to check current state
  const currentIncorrect = questionsWithStatus.filter(q => q.status === 'incorrect').length;
  
  if (currentIncorrect === 0) {
    // All repeat questions answered correctly! Show success dialog
    setShowRepeatDialog(true);
  } else {
    // Still some incorrect - ask if user wants to repeat again
    setShowRepeatDialog(true);
  }
}
```

**Dialog-Logik (Zeile 464-473):**
```typescript
{isRepeatMode && stats.incorrect > 0 ? (
  // Repeat mode but still some incorrect - ask to repeat again
  <>
    <Button onClick={handleRepeatIncorrect} className="w-full sm:w-auto">
      🔄 Ja, nochmal wiederholen
    </Button>
    <Button variant="outline" onClick={handleContinueLater} className="w-full sm:w-auto">
      ⏸️ Später fortsetzen
    </Button>
  </>
) : ...}
```

**Resultat:**
- ✅ Dialog erscheint automatisch nach letzter Wiederholungs-Frage
- ✅ Zeigt Anzahl noch fehlerhafter Fragen
- ✅ "Ja" startet Wiederholung erneut (ruft `handleRepeatIncorrect()`)
- ✅ "Später" geht zurück zu CourseView (Progress bleibt)

---

## Zusammenfassung

### Geänderte Dateien
- `client/src/pages/user/QuizView.tsx` (3 Änderungen)

### Zeilen-Änderungen
1. **Zeile 153-157:** `isLastQuestion` Logik mit `initialRepeatCount` Check
2. **Zeile 199-231:** `handleNextQuestion()` mit Wiederholungsmodus-Checks
3. **Zeile 414-473:** Dialog-Logik mit 4 Szenarien

### Test-Szenarien

**Szenario 1: Normal-Modus, alle korrekt**
- ✅ Keine fehlerhafte Fragen
- ✅ Direkt zurück zu CourseView (kein Dialog)

**Szenario 2: Normal-Modus, einige falsch**
- ✅ Dialog: "Fehlerhafte Fragen wiederholen?"
- ✅ Optionen: "Ja, wiederholen" / "Nein, nicht jetzt"

**Szenario 3: Wiederholungsmodus, alle korrekt**
- ✅ Dialog: "🎉 Glückwunsch! Alle Fragen korrekt beantwortet!"
- ✅ Optionen: "Abschließen" / "Nochmal machen" / "Später"

**Szenario 4: Wiederholungsmodus, noch Fehler**
- ✅ Dialog: "🔄 Nochmal wiederholen?"
- ✅ Text: "Du hast noch X fehlerhafte Frage(n)"
- ✅ Optionen: "Ja, nochmal wiederholen" / "Später fortsetzen"

**Szenario 5: "4 von 3" Bug**
- ✅ Counter bleibt stabil ("3 von 3")
- ✅ Kein Overflow mehr

### Lessons Learned

**1. State-Management in Repeat-Mode:**
- `initialRepeatCount` speichert initiale Anzahl → stabile Anzeige
- `activeQuestions` ist dynamisch → nicht für Counter verwenden
- `isLastQuestion` muss auf stabile Werte basieren

**2. Dialog-Logik mit Multiple Conditions:**
- 4 verschiedene Szenarien im gleichen Dialog
- Conditional Rendering basierend auf `isRepeatMode` + `stats.incorrect`
- Klare Trennung zwischen Normal-Modus und Wiederholungsmodus

**3. Filter + Current Item Pattern:**
- Filter entfernt Items aus Liste
- Aber: Current Item muss sichtbar bleiben (für Feedback)
- Lösung: Temporär in Liste behalten, aber Counter basiert auf initiale Anzahl

---

## Nächste Schritte

- [ ] Browser-Testing: Alle 5 Szenarien durchspielen
- [ ] Unit Tests für neue Logik schreiben
- [ ] TopicView.tsx mit gleichen Fixes aktualisieren (Course 1)
- [ ] Checkpoint erstellen
