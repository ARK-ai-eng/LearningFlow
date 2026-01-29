# Sprint 8 Schritt 2: Button-Text dynamisch

**Datum**: 29.01.2026  
**Status**: ✅ Bereits korrekt implementiert  
**Kategorie**: Code-Analyse

---

## Aufgabe

**Schritt 2**: Button-Text dynamisch anpassen
- Wenn noch Fragen im Pool: "Nächste Frage"
- Wenn letzte Frage im Pool: "Abschließen"

---

## Analyse

### Code-Review

Der Code in `TopicView.tsx` Zeile 285-287 war bereits korrekt implementiert:

```typescript
{/* Next Question Button */}
{hasAnswered && (
  <div className="mt-8 flex justify-end">
    <Button onClick={handleNextQuestion} size="lg">
      {isLastQuestion ? 'Abschließen' : 'Nächste Frage'}
    </Button>
  </div>
)}
```

### Logik

```typescript
const isLastQuestion = currentQuestionIndex === questionsWithShuffledAnswers.length - 1;
```

**Funktionsweise:**
- `isLastQuestion` prüft ob aktuelle Frage die letzte im Array ist
- Ternärer Operator: `condition ? 'Abschließen' : 'Nächste Frage'`
- Button-Text ändert sich automatisch basierend auf Position

### Beispiele

| Situation | `currentQuestionIndex` | `length` | `isLastQuestion` | Button-Text |
|-----------|----------------------|----------|------------------|-------------|
| Frage 1 von 12 | 0 | 12 | false | "Nächste Frage" |
| Frage 11 von 12 | 10 | 12 | false | "Nächste Frage" |
| Frage 12 von 12 | 11 | 12 | true | "Abschließen" |
| Wiederholung 1 von 3 | 0 | 3 | false | "Nächste Frage" |
| Wiederholung 3 von 3 | 2 | 3 | true | "Abschließen" |

---

## Ergebnis

**Keine Änderung nötig!** ✅

Der Code war bereits korrekt implementiert und erfüllt alle Anforderungen:
- ✅ Dynamischer Button-Text
- ✅ "Nächste Frage" bei nicht-letzter Frage
- ✅ "Abschließen" bei letzter Frage
- ✅ Funktioniert für alle Pool-Größen (12, 3, 1 Frage)

---

## Lessons Learned

### Was haben wir gelernt?

1. **Code-Analyse BEVOR Implementierung**
   - Erst prüfen ob Feature bereits existiert
   - Dann entscheiden ob Änderung nötig
   - Vermeidet unnötige Arbeit

2. **Schrittweise Freigabe ist sinnvoll**
   - User gibt jeden Schritt einzeln frei
   - Ermöglicht Code-Review pro Schritt
   - Verhindert "Implementierung auf Verdacht"

3. **Dokumentation auch bei "keine Änderung"**
   - Auch "bereits korrekt" ist dokumentationswürdig
   - Zeigt, dass Schritt geprüft wurde
   - Verhindert doppelte Arbeit

---

## Nächste Schritte

- ✅ Schritt 1: Dialog-Timing (bereits korrekt)
- ✅ Schritt 2: Button-Text dynamisch (bereits korrekt)
- ⏳ Schritt 3: Pause Button ausblenden bei letzter Frage
- ⏳ Schritt 4: Dialog-Varianten
- ⏳ Schritt 5: Wiederholungs-Logik
- ⏳ Schritt 6: Fortschritt-Anzeige

---

## Betroffene Dateien

- `client/src/pages/user/TopicView.tsx` (Zeile 285-287, keine Änderung)
- `docs/lessons-learned/Sprint-8-Step-2-Button-Text-Dynamic.md` (neu)
- `todo.md` (aktualisiert)

---

**Status**: ✅ Abgeschlossen, keine Änderung nötig
