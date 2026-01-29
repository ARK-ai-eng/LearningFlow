# Sprint 8 Schritt 4: Dialog-Varianten

**Datum**: 29.01.2026  
**Status**: ✅ Angepasst  
**Kategorie**: Feature-Anpassung

---

## Aufgabe

**Schritt 4**: Dialog-Varianten implementieren
- Variante A: Fehler vorhanden → "Wiederholen?" mit "Ja" / "Nein, nicht jetzt"
- Variante B: Alles richtig → "🎉 Perfekt!" mit "Zurück zur Kursübersicht"

---

## Analyse

### Code-Review

Der Code in `TopicView.tsx` Zeile 296-337 hatte bereits beide Varianten implementiert:

**Variante A: Fehler vorhanden**
```typescript
{stats.incorrect === 0 ? (
  // Variante B
) : (
  // Variante A
  <>
    <DialogTitle>Fehlerhafte Fragen wiederholen?</DialogTitle>
    <DialogDescription>
      Du hast {stats.incorrect} von {stats.total} Fragen falsch beantwortet.
      Möchtest du nur die {stats.incorrect} fehlerhaften Fragen wiederholen?
      (Dein Score wird nicht geändert)
    </DialogDescription>
    <DialogFooter>
      <Button variant="outline" onClick={handleFinish}>
        Nein, fortfahren  ← FALSCH!
      </Button>
      <Button onClick={handleRepeatIncorrect}>
        Ja, wiederholen
      </Button>
    </DialogFooter>
  </>
)}
```

**Variante B: Alles richtig**
```typescript
{stats.incorrect === 0 ? (
  <>
    <DialogTitle>🎉 Perfekt!</DialogTitle>
    <DialogDescription>
      Du hast alle {stats.total} Fragen richtig beantwortet!
    </DialogDescription>
    <DialogFooter>
      <Button onClick={handleFinish}>
        Zurück zur Kursübersicht
      </Button>
    </DialogFooter>
  </>
) : (
  // Variante A
)}
```

---

## Änderung

### Problem

Button-Text war "Nein, fortfahren" statt "Nein, nicht jetzt"

### Lösung

**Datei**: `client/src/pages/user/TopicView.tsx` (Zeile 327-328)

**Vorher:**
```typescript
<Button variant="outline" onClick={handleFinish}>
  Nein, fortfahren
</Button>
```

**Nachher:**
```typescript
<Button variant="outline" onClick={handleFinish}>
  Nein, nicht jetzt
</Button>
```

---

## UX-Begründung

### Warum "Nein, nicht jetzt" statt "Nein, fortfahren"?

1. **Klarere Intention**
   - "Nicht jetzt" → User kann später wiederholen
   - "Fortfahren" → Klingt nach "weiter zum nächsten Thema"

2. **Konsistente Sprache**
   - "Nicht jetzt" ist freundlicher
   - Impliziert "später möglich"
   - Weniger endgültig als "fortfahren"

3. **User-Erwartung**
   - User denkt: "Ich will jetzt nicht wiederholen, aber vielleicht später"
   - "Nicht jetzt" passt besser zu dieser Erwartung

---

## Dialog-Varianten Übersicht

| Situation | Titel | Beschreibung | Buttons |
|-----------|-------|--------------|---------|
| `stats.incorrect > 0` | "Fehlerhafte Fragen wiederholen?" | "Du hast X von Y falsch..." | "Ja, wiederholen" \| "Nein, nicht jetzt" |
| `stats.incorrect === 0` | "🎉 Perfekt!" | "Du hast alle X richtig!" | "Zurück zur Kursübersicht" |

---

## Beispiele

### Beispiel 1: 3 Fehler bei 12 Fragen

```
Dialog erscheint nach "Abschließen" Button:

┌─────────────────────────────────────────┐
│ Fehlerhafte Fragen wiederholen?         │
├─────────────────────────────────────────┤
│ Du hast 3 von 12 Fragen falsch         │
│ beantwortet. Möchtest du nur die 3     │
│ fehlerhaften Fragen wiederholen, um    │
│ dein Wissen zu vertiefen?              │
│                                         │
│ (Dein Score wird nicht geändert)       │
├─────────────────────────────────────────┤
│  [Nein, nicht jetzt]  [Ja, wiederholen]│
└─────────────────────────────────────────┘
```

### Beispiel 2: Alle richtig

```
Dialog erscheint nach "Abschließen" Button:

┌─────────────────────────────────────────┐
│ 🎉 Perfekt!                             │
├─────────────────────────────────────────┤
│ Du hast alle 12 Fragen richtig         │
│ beantwortet!                            │
├─────────────────────────────────────────┤
│            [Zurück zur Kursübersicht]   │
└─────────────────────────────────────────┘
```

---

## Tests

### Manuelle Tests

1. **Variante A: 3 Fehler**
   - ✅ Titel: "Fehlerhafte Fragen wiederholen?"
   - ✅ Text: "Du hast 3 von 12 Fragen falsch..."
   - ✅ Buttons: "Nein, nicht jetzt" | "Ja, wiederholen"
   - ✅ Klick "Nein" → Zurück zur Kursübersicht
   - ✅ Klick "Ja" → Erste fehlerhafte Frage

2. **Variante B: Alle richtig**
   - ✅ Titel: "🎉 Perfekt!"
   - ✅ Text: "Du hast alle 12 Fragen richtig..."
   - ✅ Button: "Zurück zur Kursübersicht"
   - ✅ Klick → Zurück zur Kursübersicht

---

## Lessons Learned

### Was haben wir gelernt?

1. **Wording ist wichtig**
   - "Nicht jetzt" vs "Fortfahren" macht einen Unterschied
   - User-Erwartung beachten
   - Freundliche Sprache bevorzugen

2. **Code war fast perfekt**
   - Nur ein Wort ändern
   - Rest war bereits korrekt implementiert
   - Zeigt gute Vorarbeit

3. **Conditional Rendering für Varianten**
   - `condition ? <VarianteA /> : <VarianteB />`
   - Sauber und lesbar
   - Einfach zu erweitern

---

## Nächste Schritte

- ✅ Schritt 1: Dialog-Timing (bereits korrekt)
- ✅ Schritt 2: Button-Text dynamisch (bereits korrekt)
- ✅ Schritt 3: Pause Button ausblenden (implementiert)
- ✅ Schritt 4: Dialog-Varianten (Button-Text angepasst)
- ⏳ Schritt 5: Wiederholungs-Logik
- ⏳ Schritt 6: Fortschritt-Anzeige

---

## Betroffene Dateien

- `client/src/pages/user/TopicView.tsx` (Zeile 328, geändert)
- `docs/lessons-learned/Sprint-8-Step-4-Dialog-Variants.md` (neu)
- `todo.md` (aktualisiert)

---

**Status**: ✅ Abgeschlossen, Button-Text angepasst
