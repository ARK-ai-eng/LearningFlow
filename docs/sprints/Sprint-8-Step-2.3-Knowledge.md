# Sprint 8 - Schritt 2.3: Dialog für Wiederholung fehlerhafter Fragen

**Datum**: 29.01.2026  
**Implementiert von**: Manus AI Agent  
**Status**: ✅ Abgeschlossen

---

## Überblick

Schritt 2.3 implementiert den **Dialog für Wiederholung** nach der letzten Frage mit:
- **Trigger**: Dialog erscheint nur nach letzter Frage (alle beantwortet)
- **Zwei Optionen**: "Ja, wiederholen" oder "Nein, später"
- **Repeat-Mode**: Öffnet erste fehlerhafte Frage bei "Ja"
- **Spezialfall**: "Perfekt!" Meldung wenn alle Fragen richtig

---

## Was wurde implementiert?

### 1. RepeatIncorrectDialog Komponente

**Datei**: `client/src/components/RepeatIncorrectDialog.tsx`

**Funktionalität**:
- AlertDialog (shadcn/ui) für Wiederholungs-Frage
- Zwei Varianten:
  * **Fehlerhafte Fragen vorhanden**: "Möchtest du die fehlerhaften Fragen wiederholen?"
  * **Alle richtig**: "🎉 Perfekt! Du hast alle Fragen richtig beantwortet."

**Props**:
```tsx
interface RepeatIncorrectDialogProps {
  isOpen: boolean;           // Dialog sichtbar?
  incorrectCount: number;    // Anzahl falscher Fragen
  onRepeat: () => void;      // "Ja, wiederholen" Callback
  onSkip: () => void;        // "Nein, später" Callback
}
```

**Logik**:
```tsx
if (incorrectCount === 0) {
  // Alle Fragen richtig → "Perfekt!" Meldung
  return <AlertDialog>...</AlertDialog>;
}

// Fehlerhafte Fragen vorhanden → Wiederholungs-Dialog
return (
  <AlertDialog>
    <AlertDialogTitle>Fehlerhafte Fragen wiederholen?</AlertDialogTitle>
    <AlertDialogDescription>
      Du hast {incorrectCount} Frage(n) falsch beantwortet.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={onSkip}>Nein, später</AlertDialogCancel>
      <AlertDialogAction onClick={onRepeat}>Ja, wiederholen</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialog>
);
```

---

### 2. TopicView.tsx Integration

**State Management**:
```tsx
const [showRepeatDialog, setShowRepeatDialog] = useState(false);
const [repeatMode, setRepeatMode] = useState(false);
```

**Trigger-Logik** (in `closeQuestion()`):
```tsx
const closeQuestion = () => {
  setSelectedQuestionId(null);
  
  // Check if all questions are answered (and not in repeat mode)
  if (!repeatMode && stats.answered === stats.total && stats.total > 0) {
    setShowRepeatDialog(true);
  }
};
```

**Wichtig**: Dialog erscheint nur:
- Nach letzter Frage (`stats.answered === stats.total`)
- Nicht im Repeat-Mode (`!repeatMode`)
- Wenn Fragen vorhanden sind (`stats.total > 0`)

**Repeat-Handler**:
```tsx
const handleRepeat = () => {
  setShowRepeatDialog(false);
  setRepeatMode(true);
  // Open first incorrect question
  const firstIncorrect = sortedQuestions.find(q => q.status === 'incorrect');
  if (firstIncorrect) {
    setSelectedQuestionId(firstIncorrect.id);
  }
};
```

**Skip-Handler**:
```tsx
const handleSkipRepeat = () => {
  setShowRepeatDialog(false);
  setLocation(`/course/${cId}`); // Zurück zur Kurs-Übersicht
};
```

---

## User Flow

### Szenario 1: Fehlerhafte Fragen vorhanden

1. **User beantwortet letzte Frage** → QuestionDetailDialog schließt sich
2. **Dialog erscheint**: "Möchtest du die fehlerhaften Fragen wiederholen?"
3. **User klickt "Ja, wiederholen"**:
   - `repeatMode = true`
   - Erste fehlerhafte Frage öffnet sich
   - User kann fehlerhafte Fragen erneut beantworten
4. **User klickt "Nein, später"**:
   - Dialog schließt sich
   - User wird zur Kurs-Übersicht weitergeleitet

### Szenario 2: Alle Fragen richtig

1. **User beantwortet letzte Frage** → QuestionDetailDialog schließt sich
2. **Dialog erscheint**: "🎉 Perfekt! Du hast alle Fragen richtig beantwortet."
3. **User klickt "Zurück zum Kurs"**:
   - Dialog schließt sich
   - User wird zur Kurs-Übersicht weitergeleitet

---

## Technische Entscheidungen

### 1. AlertDialog statt Dialog

**Entscheidung**: AlertDialog (shadcn/ui)  
**Begründung**:
- AlertDialog ist für "Entscheidungen" gedacht (Ja/Nein)
- Bessere Semantik als normaler Dialog
- Eingebaute Buttons (Cancel/Action)
- Konsistent mit anderen Bestätigungs-Dialogen

### 2. Repeat-Mode Flag

**Entscheidung**: `repeatMode` State-Variable  
**Begründung**:
- Verhindert, dass Dialog erneut erscheint nach Wiederholung
- Einfache Boolean-Flag statt komplexer Logik
- Kann später erweitert werden (z.B. "Wiederholungs-Runde 2")

### 3. Erste fehlerhafte Frage öffnen

**Entscheidung**: Bei "Ja" → erste fehlerhafte Frage öffnen  
**Begründung**:
- User muss nicht manuell auf Frage klicken
- Direkter Einstieg in Wiederholung
- Bessere UX (weniger Klicks)
- Konsistent mit "Nächste Frage" Flow

### 4. Sortierung bleibt erhalten

**Entscheidung**: Fragen-Liste wird nicht neu sortiert im Repeat-Mode  
**Begründung**:
- User sieht weiterhin alle Fragen (inkl. richtige)
- Transparenz: User kann sehen, welche Fragen bereits richtig waren
- Einfachere Implementierung (keine Filter-Logik nötig)
- User kann selbst entscheiden, welche Frage als nächstes

**Alternative** (nicht implementiert):
- Nur fehlerhafte Fragen anzeigen (Filter)
- Würde zusätzliche Logik erfordern
- Könnte verwirrend sein (Fragen "verschwinden")

---

## CSS & Styling

**AlertDialog** verwendet shadcn/ui Standard-Styling:
- Overlay mit Backdrop-Blur
- Zentriert auf Bildschirm
- Responsive (Mobile-optimiert)
- Tastatur-Navigation (Escape schließt)

**Buttons**:
- `AlertDialogCancel`: Outline-Button (sekundär)
- `AlertDialogAction`: Solid-Button (primär)

---

## Tests

**Status**: ✅ 61 Tests bestanden (keine neuen Tests nötig)

**Begründung**:
- Dialog ist rein präsentational (kein Business-Logic)
- Backend-Logik bereits getestet (getIncorrectQuestions)
- User-Flow wird manuell getestet

**Manuelle Tests durchgeführt**:
- ✅ Dialog erscheint nach letzter Frage
- ✅ Dialog erscheint NICHT im Repeat-Mode
- ✅ "Ja" öffnet erste fehlerhafte Frage
- ✅ "Nein" leitet zur Kurs-Übersicht weiter
- ✅ "Perfekt!" Meldung bei allen richtigen Antworten
- ✅ Dialog kann mit Escape geschlossen werden

---

## Lessons Learned

### 1. Trigger-Logik in closeQuestion()

**Problem**: Wo soll Dialog-Trigger platziert werden?  
**Lösung**: In `closeQuestion()` → wird nach jeder Frage aufgerufen

**Alternativen** (nicht gewählt):
- `useEffect` mit `stats.answered` → würde zu früh triggern
- Separate "Letzte Frage" Logik → zu komplex

### 2. Repeat-Mode Flag verhindert Endlos-Loop

**Problem**: Dialog würde nach Wiederholung erneut erscheinen  
**Lösung**: `repeatMode` Flag → Dialog nur im ersten Durchgang

### 3. Spezialfall "Alle richtig"

**Problem**: Was passiert wenn User alle Fragen richtig beantwortet?  
**Lösung**: Separate "Perfekt!" Meldung → positive Verstärkung

### 4. AlertDialog vs. Dialog

**Problem**: Welche Dialog-Komponente verwenden?  
**Lösung**: AlertDialog → bessere Semantik für Ja/Nein-Entscheidungen

---

## Offene Punkte

### 1. Wiederholung im Repeat-Mode

**Aktuell**: User kann fehlerhafte Fragen wiederholen, aber Dialog erscheint nicht erneut  
**Frage**: Soll Dialog nach Wiederholung erneut erscheinen?  
**Entscheidung**: Nein → User kann selbst entscheiden, wann er aufhört

### 2. Filter für fehlerhafte Fragen

**Aktuell**: Alle Fragen werden angezeigt (inkl. richtige)  
**Frage**: Sollen nur fehlerhafte Fragen angezeigt werden im Repeat-Mode?  
**Entscheidung**: Nein → Transparenz wichtiger als Filter

### 3. Fortschritt bei Wiederholung

**Aktuell**: Fortschritt wird aktualisiert bei jeder Antwort  
**Frage**: Soll Fortschritt nur bei erster Antwort zählen?  
**Entscheidung**: Siehe ADR-013 (Erste Antwort zählt) - noch nicht implementiert

---

## Nächste Schritte

### Schritt 2.4: Fortschritt-Dashboard (1h)
- Fortschritt pro Thema anzeigen (% korrekt)
- Fortschritt pro Kurs anzeigen (% abgeschlossen)
- Fortschritt im Dashboard anzeigen

### Schritt 3: ADR-013 implementieren
- Nur erste Antwort zählt für Fortschritt
- Wiederholung ändert Status, aber nicht Score
- Backend-Logik anpassen

---

## Zusammenfassung

**Was funktioniert**:
- ✅ Dialog erscheint nach letzter Frage
- ✅ Zwei Optionen: "Ja, wiederholen" oder "Nein, später"
- ✅ Repeat-Mode öffnet erste fehlerhafte Frage
- ✅ "Perfekt!" Meldung bei allen richtigen Antworten
- ✅ 61 Tests bestanden

**Was fehlt noch**:
- Fortschritt-Dashboard (Schritt 2.4)
- ADR-013: Erste Antwort zählt (Schritt 3)

**Zeitaufwand**: ~1h (geplant: 1h)
