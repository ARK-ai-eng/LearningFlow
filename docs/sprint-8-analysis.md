# Sprint 8 - Senior Dev Analyse

**Datum**: 29.01.2026  
**Analyst**: Senior Fullstack Dev (30 Jahre Erfahrung)  
**Methodik**: Kategorisierung, Abhängigkeiten, Risiken, Priorisierung

---

## Fehler/Wunsch 1: Kurs-Status-Management im SysAdmin Dashboard

### Beschreibung
Dashboard des Sysadmins zeigt 6 Kurse an. Wenn der Sysadmin sie inaktiv setzt, sollen sie hinten angereiht sein und entsprechend visuell sichtbar, dass sie inaktiv sind, sonst verwirrt das den SysAdmin.

### Kategorisierung

| Aspekt | Bewertung |
|--------|-----------|
| **Primäre Kategorie** | 70% UX/UI Feature, 30% Backend Feature |
| **Typ** | Feature Request (nicht Bug) |
| **Bereich** | Kurs-Management, Admin-Panel |
| **Komplexität** | ⭐⭐ Mittel |

### Technische Analyse

**Was wird gebraucht:**

1. **Backend**: 
   - `isActive` Boolean-Feld in `courses` Tabelle (bereits vorhanden?)
   - API-Endpoint: `course.deactivate()` und `course.activate()`
   - API-Endpoint: `course.list()` mit Sortierung (aktiv zuerst)

2. **Frontend**:
   - Visuelle Unterscheidung (Opacity, Badge, Farbe)
   - Sortierung (aktiv oben, inaktiv unten)
   - Toggle-Button (Aktivieren/Deaktivieren)
   - Filter (Alle/Aktiv/Inaktiv)

### Abhängigkeiten

- ✅ **Keine harten Abhängigkeiten**
- ⚠️ **Soft-Dependency**: Sollte vor "Kurs-Bearbeitung" kommen (gleicher Bereich)

### Risiken & Warnungen

⚠️ **Risiko 1: Soft-Delete vs Hard-Delete**
- **Problem**: Wenn Kurse "gelöscht" werden, sind sie für immer weg
- **Lösung**: Soft-Delete (isActive = false) statt Hard-Delete
- **Konsequenz**: Datenbank-Integrität bleibt erhalten, Rollback möglich

⚠️ **Risiko 2: Mitarbeiter mit inaktiven Kursen**
- **Problem**: Was passiert, wenn ein Mitarbeiter gerade einen Kurs bearbeitet und der Kurs wird inaktiv gesetzt?
- **Lösung**: Inaktive Kurse sollten für bereits zugewiesene Mitarbeiter weiter sichtbar sein
- **Konsequenz**: Braucht zusätzliche Logik in `course.list()` für Mitarbeiter-Rolle

⚠️ **Risiko 3: Zertifikate von inaktiven Kursen**
- **Problem**: Wenn ein Kurs inaktiv ist, sind die Zertifikate noch gültig?
- **Lösung**: Zertifikate bleiben gültig, auch wenn Kurs inaktiv
- **Konsequenz**: Keine Änderung nötig, aber dokumentieren

### Priorisierung

| Kriterium | Bewertung | Begründung |
|-----------|-----------|------------|
| **Business Impact** | 🟢 Hoch | SysAdmin-Verwirrung = schlechte UX |
| **Technische Komplexität** | 🟡 Mittel | Einfache Feature, aber Soft-Delete Pattern |
| **Risiko** | 🟡 Mittel | Mitarbeiter-Logik muss durchdacht sein |
| **Dringlichkeit** | 🟢 Hoch | Blockiert keine anderen Features, aber nervt |

**Empfohlene Priorität**: **Sprint 8 (Hoch)**

### Sprint-Zuordnung

- **Sprint 8**: Implementierung (Backend + Frontend)
- **Aufwand**: 3-4 Stunden
- **Abhängigkeiten**: Keine

### Wissensmanagement-Updates

**ADR-013**: Soft-Delete für Kurse (nicht Hard-Delete)  
**PATTERN-Soft-Delete**: Deaktivieren statt Löschen  
**CHECKLIST**: Kurs-Status-Management

---

## Fehler/Wunsch 2: Lern-Flow Logik für Sensitization-Kurse

### Beschreibung

Der Kurstyp bei Sensitization muss entsprechend der neuen Logik gerichtet werden:

1. **Alte Logik entfernen**: 3/5 Fragen richtig → Kurs abgeschafft
2. **Neue Logik**: Lernmodus
   - User beantwortet Fragen
   - Richtig → Grün
   - Falsch → Rot
   - "Nächste Frage" Button (nicht "Thema abschließen")
3. **Nach allen Fragen**: "Möchtest du die fehlerhaften Fragen wiederholen?"
   - Ja → Nur falsche Fragen anzeigen
   - Nein → Fortschritt % gewichten (jede Frage gleich viel)
4. **Wiederholung**: Antworten-Reihenfolge automatisch tauschen (nicht auswendig lernen)

### Kategorisierung

| Aspekt | Bewertung |
|--------|-----------|
| **Primäre Kategorie** | 50% Feature, 30% Bug-Fix, 20% UX |
| **Typ** | Feature Enhancement + Bug-Fix |
| **Bereich** | Lern-Flow, Kurs-Logik |
| **Komplexität** | ⭐⭐⭐⭐ Hoch |

### Technische Analyse

**Was wird gebraucht:**

1. **Backend**:
   - Fortschritt-Tracking: Welche Fragen falsch beantwortet?
   - API-Endpoint: `progress.getIncorrectQuestions()`
   - API-Endpoint: `progress.calculateScore()` (% basiert)
   - Antworten-Shuffle-Algorithmus (Fisher-Yates)

2. **Frontend**:
   - "Nächste Frage" Button (statt "Thema abschließen")
   - Dialog: "Fehlerhafte Fragen wiederholen?"
   - Anzeige: Nur falsche Fragen
   - Fortschritt-Anzeige: % statt "3/5 richtig"
   - Antworten-Reihenfolge shuffeln bei jeder Wiederholung

3. **Datenbank**:
   - `user_progress` Tabelle erweitern:
     - `incorrectQuestions` (JSON Array)
     - `score` (Percentage)

### Abhängigkeiten

⚠️ **Harte Abhängigkeit**: Fehler/Wunsch 1 muss NICHT zuerst kommen (unabhängig)

✅ **Soft-Dependency**: Sollte nach "Kurs-Status-Management" kommen (gleicher Sprint, aber getrennt testbar)

### Risiken & Warnungen

🔴 **Risiko 1: Breaking Change für bestehende Kurse**
- **Problem**: Alte Kurse haben "3/5 Fragen richtig" Logik, neue Kurse haben "% Logik"
- **Lösung**: Migration-Script für bestehende Fortschritte
- **Konsequenz**: Alle bestehenden Fortschritte müssen neu berechnet werden
- **Empfehlung**: ADR-014 schreiben BEVOR implementiert wird

🔴 **Risiko 2: Shuffle-Algorithmus kann Fragen "verlieren"**
- **Problem**: Wenn Shuffle falsch implementiert, können Antworten verschwinden
- **Lösung**: Fisher-Yates Shuffle (bewährt, korrekt)
- **Konsequenz**: Unit Tests für Shuffle-Algorithmus MÜSSEN geschrieben werden
- **Empfehlung**: PATTERN-Shuffle dokumentieren

⚠️ **Risiko 3: UX-Verwirrung bei "Fehlerhafte Fragen wiederholen"**
- **Problem**: User könnte denken, er muss ALLE Fragen nochmal beantworten
- **Lösung**: Klarer Dialog-Text: "Du hast X von Y Fragen falsch beantwortet. Möchtest du nur die X fehlerhaften Fragen wiederholen?"
- **Konsequenz**: UX-Text muss präzise sein

⚠️ **Risiko 4: Fortschritt-Berechnung bei Wiederholung**
- **Problem**: Wenn User falsche Fragen wiederholt, wie wird Fortschritt berechnet?
- **Frage**: Zählt die erste Antwort? Oder die zweite? Oder beide?
- **Empfehlung**: ADR-015 schreiben: "Fortschritt-Berechnung bei Wiederholung"
- **Vorschlag**: Erste Antwort zählt (sonst kann User einfach wiederholen bis 100%)

🟡 **Risiko 5: Performance bei vielen Wiederholungen**
- **Problem**: Wenn User 10x wiederholt, werden 10x Fortschritte gespeichert?
- **Lösung**: Nur letzte Wiederholung speichern (überschreiben)
- **Konsequenz**: Historie geht verloren (aber ist das wichtig?)

### Priorisierung

| Kriterium | Bewertung | Begründung |
|-----------|-----------|------------|
| **Business Impact** | 🔴 Kritisch | Alte Logik ist falsch, neue Logik ist besser |
| **Technische Komplexität** | 🔴 Hoch | Shuffle, Migration, Fortschritt-Berechnung |
| **Risiko** | 🔴 Hoch | Breaking Change, Migration nötig |
| **Dringlichkeit** | 🟢 Hoch | Sollte bald gemacht werden, aber nicht sofort |

**Empfohlene Priorität**: **Sprint 8 (Hoch, aber nach Fehler/Wunsch 1)**

### Sprint-Zuordnung

- **Sprint 8**: ADR-014, ADR-015 schreiben + Implementierung (Backend + Frontend)
- **Aufwand**: 6-8 Stunden (inkl. Migration-Script, Unit Tests)
- **Abhängigkeiten**: ADR-014, ADR-015 müssen ZUERST geschrieben werden

### Wissensmanagement-Updates

**ADR-014**: Breaking Change - Alte Logik → Neue Logik (Migration)  
**ADR-015**: Fortschritt-Berechnung bei Wiederholung  
**PATTERN-Shuffle**: Fisher-Yates Shuffle für Antworten  
**PATTERN-Migration**: Wie man Breaking Changes handhabt  
**CHECKLIST**: Lern-Flow Testing (Shuffle, Wiederholung, Fortschritt)

---

## Verständlichkeit & Technische Umsetzbarkeit

### Ist das alles verständlich?

✅ **Ja, vollständig verständlich.**

Beide Anforderungen sind klar:
1. Kurs-Status-Management (inaktiv setzen, visuell unterscheiden)
2. Lern-Flow Logik (neue Logik, Shuffle, Wiederholung)

### Ist das technisch umsetzbar?

✅ **Ja, 100% umsetzbar.**

Beide Features sind Standard-Features in modernen Web-Apps:
1. Soft-Delete ist ein bewährtes Pattern
2. Shuffle-Algorithmus (Fisher-Yates) ist Standard
3. Fortschritt-Tracking ist bereits implementiert (nur erweitern)
4. Wiederholung-Logik ist einfach (Filter auf falsche Fragen)

### Kritische Punkte

🔴 **Achtung**: Fehler/Wunsch 2 ist ein **Breaking Change**
- Alte Kurse müssen migriert werden
- Fortschritte müssen neu berechnet werden
- Unit Tests MÜSSEN geschrieben werden

⚠️ **Empfehlung**: ADRs ZUERST schreiben, dann implementieren

---

## Roadmap & Sprint-Zuordnung

### Sprint 8 (Jetzt)

| Feature | Aufwand | Priorität | Reihenfolge |
|---------|---------|-----------|-------------|
| **Kurs-Status-Management** | 3-4h | Hoch | 1. |
| **ADR-014, ADR-015 schreiben** | 1h | Kritisch | 2. |
| **Lern-Flow Logik** | 6-8h | Hoch | 3. |

**Gesamt Sprint 8**: 10-13 Stunden

### Sprint 9 (Später)

- Mini-Quiz nach Lernphase (5 zufällige Fragen)
- E-Mail-Versand (Benachrichtigungen)
- Passwort-Reset System

### Sprint 10+ (Later)

- Video-Tutorials
- Gamification (Badges, Punkte)
- Analytics (Welche Fragen sind am schwierigsten?)

---

## Zusammenfassung

### Fehler/Wunsch 1: Kurs-Status-Management

- **Kategorie**: 70% UX/UI Feature, 30% Backend Feature
- **Priorität**: Hoch (Sprint 8, Position 1)
- **Aufwand**: 3-4 Stunden
- **Risiken**: Mittel (Soft-Delete, Mitarbeiter-Logik)
- **Abhängigkeiten**: Keine

### Fehler/Wunsch 2: Lern-Flow Logik

- **Kategorie**: 50% Feature, 30% Bug-Fix, 20% UX
- **Priorität**: Hoch (Sprint 8, Position 3)
- **Aufwand**: 6-8 Stunden
- **Risiken**: Hoch (Breaking Change, Migration, Shuffle)
- **Abhängigkeiten**: ADR-014, ADR-015 zuerst

### Empfohlene Reihenfolge

1. **Kurs-Status-Management** (einfacher, unabhängig)
2. **ADR-014, ADR-015 schreiben** (Entscheidungen dokumentieren)
3. **Lern-Flow Logik** (komplexer, Breaking Change)

---

**Status**: ✅ Analyse abgeschlossen  
**Nächster Schritt**: Wissensmanagement & Todo.md aktualisieren  
**Dann**: Implementierungs-Prompts erstellen
