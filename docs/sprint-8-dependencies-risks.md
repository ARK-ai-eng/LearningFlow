# Sprint 8 - Abhängigkeiten & Risiken

**Datum**: 29.01.2026  
**Zweck**: Detaillierte Dokumentation aller Abhängigkeiten und Risiken für Sprint 8

---

## Abhängigkeits-Graph

```
Sprint 8 Features:
│
├── Feature 1: Kurs-Status-Management
│   ├── Keine harten Abhängigkeiten
│   └── Kann parallel zu Feature 2 entwickelt werden
│
├── Feature 2: Lern-Flow Logik
│   ├── HARTE Abhängigkeit: ADR-014 (Breaking Change Strategie)
│   ├── HARTE Abhängigkeit: ADR-015 (Fortschritt-Berechnung)
│   └── SOFT Abhängigkeit: Feature 1 sollte zuerst (gleicher Bereich, aber unabhängig)
│
└── Empfohlene Reihenfolge:
    1. Feature 1: Kurs-Status-Management (3-4h)
    2. ADR-014 & ADR-015 schreiben (1h)
    3. Feature 2: Lern-Flow Logik (6-8h)
```

---

## Feature 1: Kurs-Status-Management - Abhängigkeiten

### Technische Abhängigkeiten

| Abhängigkeit | Typ | Status | Beschreibung |
|--------------|-----|--------|--------------|
| **Datenbank-Schema** | Hard | ✅ Vorhanden | `courses.isActive` Feld (prüfen ob vorhanden) |
| **tRPC Router** | Hard | ✅ Vorhanden | `server/routers.ts` muss erweitert werden |
| **Admin-Panel** | Hard | ✅ Vorhanden | `client/src/pages/admin/` existiert |

### Funktionale Abhängigkeiten

| Abhängigkeit | Typ | Kritikalität | Beschreibung |
|--------------|-----|--------------|--------------|
| **Mitarbeiter mit zugewiesenen Kursen** | Soft | Mittel | Was passiert, wenn Kurs inaktiv wird? |
| **Zertifikate von inaktiven Kursen** | Soft | Niedrig | Zertifikate bleiben gültig |
| **Fortschritte von inaktiven Kursen** | Soft | Mittel | Fortschritte bleiben erhalten |

### Empfohlene Lösungen

1. **Mitarbeiter-Sicht**: Inaktive Kurse bleiben sichtbar, wenn bereits zugewiesen
2. **Zertifikate**: Bleiben gültig, unabhängig von Kurs-Status
3. **Fortschritte**: Bleiben erhalten, können später reaktiviert werden

---

## Feature 1: Kurs-Status-Management - Risiken

### Risiko 1: Soft-Delete vs Hard-Delete

**Beschreibung**: Wenn Kurse "gelöscht" werden, sind sie für immer weg

| Aspekt | Details |
|--------|---------|
| **Wahrscheinlichkeit** | 🟢 Niedrig (Soft-Delete ist geplant) |
| **Impact** | 🔴 Kritisch (Datenverlust) |
| **Mitigation** | Soft-Delete implementieren (`isActive = false`) |
| **Fallback** | Datenbank-Backup vor Deployment |

**Empfehlung**: ADR-013 schreiben - "Soft-Delete für Kurse"

### Risiko 2: Mitarbeiter mit inaktiven Kursen

**Beschreibung**: Mitarbeiter bearbeitet Kurs, SysAdmin setzt ihn inaktiv → Kurs verschwindet

| Aspekt | Details |
|--------|---------|
| **Wahrscheinlichkeit** | 🟡 Mittel (kann passieren) |
| **Impact** | 🟡 Mittel (Verwirrung, aber kein Datenverlust) |
| **Mitigation** | Inaktive Kurse bleiben für zugewiesene Mitarbeiter sichtbar |
| **Fallback** | SysAdmin kann Kurs wieder aktivieren |

**Empfehlung**: Logik in `course.list()` für Mitarbeiter-Rolle

### Risiko 3: UI-Verwirrung bei vielen inaktiven Kursen

**Beschreibung**: Wenn 50% der Kurse inaktiv sind, wird die Liste lang und unübersichtlich

| Aspekt | Details |
|--------|---------|
| **Wahrscheinlichkeit** | 🟡 Mittel (langfristig) |
| **Impact** | 🟢 Niedrig (nur UX-Problem) |
| **Mitigation** | Filter: "Nur aktive anzeigen" (Standard) |
| **Fallback** | Pagination (später) |

**Empfehlung**: Filter implementieren (Sprint 8), Pagination später (Sprint 9+)

---

## Feature 2: Lern-Flow Logik - Abhängigkeiten

### Technische Abhängigkeiten

| Abhängigkeit | Typ | Status | Beschreibung |
|--------------|-----|--------|--------------|
| **ADR-014** | Hard | ❌ Fehlt | Breaking Change Strategie |
| **ADR-015** | Hard | ❌ Fehlt | Fortschritt-Berechnung bei Wiederholung |
| **user_progress Tabelle** | Hard | ✅ Vorhanden | Muss erweitert werden |
| **Shuffle-Algorithmus** | Hard | ❌ Fehlt | Fisher-Yates implementieren |
| **Migration-Script** | Hard | ❌ Fehlt | Alte Fortschritte migrieren |

### Funktionale Abhängigkeiten

| Abhängigkeit | Typ | Kritikalität | Beschreibung |
|--------------|-----|--------------|--------------|
| **Bestehende Fortschritte** | Hard | 🔴 Kritisch | Müssen migriert werden |
| **Alte Kurs-Logik** | Hard | 🔴 Kritisch | Muss entfernt/ersetzt werden |
| **Zertifikate** | Soft | 🟡 Mittel | Alte Zertifikate bleiben gültig? |

### Empfohlene Reihenfolge

1. **ADR-014 schreiben** (30 min) - Entscheidung: Wie migrieren?
2. **ADR-015 schreiben** (30 min) - Entscheidung: Wie Fortschritt berechnen?
3. **Migration-Script schreiben** (1h) - Alte Fortschritte migrieren
4. **Shuffle-Algorithmus implementieren** (1h) - Fisher-Yates
5. **Frontend anpassen** (2-3h) - Neue Logik
6. **Backend anpassen** (2-3h) - Neue Endpoints
7. **Unit Tests schreiben** (1-2h) - Shuffle, Fortschritt, Wiederholung

---

## Feature 2: Lern-Flow Logik - Risiken

### Risiko 1: Breaking Change für bestehende Kurse

**Beschreibung**: Alte Kurse haben "3/5 Fragen richtig" Logik, neue Kurse haben "% Logik"

| Aspekt | Details |
|--------|---------|
| **Wahrscheinlichkeit** | 🔴 100% (sicher) |
| **Impact** | 🔴 Kritisch (Datenverlust möglich) |
| **Mitigation** | Migration-Script für bestehende Fortschritte |
| **Fallback** | Datenbank-Backup + Rollback-Plan |

**Empfehlung**: 
1. ADR-014 schreiben BEVOR implementiert wird
2. Migration-Script testen auf Staging
3. Backup vor Production-Deployment

### Risiko 2: Shuffle-Algorithmus kann Fragen "verlieren"

**Beschreibung**: Wenn Shuffle falsch implementiert, können Antworten verschwinden

| Aspekt | Details |
|--------|---------|
| **Wahrscheinlichkeit** | 🟡 Mittel (wenn falsch implementiert) |
| **Impact** | 🔴 Kritisch (Antworten verschwinden) |
| **Mitigation** | Fisher-Yates Shuffle (bewährt, korrekt) |
| **Fallback** | Unit Tests für Shuffle-Algorithmus |

**Empfehlung**: 
1. PATTERN-Shuffle dokumentieren
2. Unit Tests schreiben (MUSS)
3. Code Review vor Merge

**Fisher-Yates Shuffle (Referenz)**:
```typescript
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

### Risiko 3: UX-Verwirrung bei "Fehlerhafte Fragen wiederholen"

**Beschreibung**: User könnte denken, er muss ALLE Fragen nochmal beantworten

| Aspekt | Details |
|--------|---------|
| **Wahrscheinlichkeit** | 🟡 Mittel (UX-Problem) |
| **Impact** | 🟡 Mittel (Verwirrung, aber kein Datenverlust) |
| **Mitigation** | Klarer Dialog-Text |
| **Fallback** | User Testing vor Production |

**Empfohlener Dialog-Text**:
```
Du hast X von Y Fragen falsch beantwortet.

Möchtest du nur die X fehlerhaften Fragen wiederholen,
um dein Wissen zu vertiefen?

[Ja, wiederholen] [Nein, fortfahren]
```

### Risiko 4: Fortschritt-Berechnung bei Wiederholung

**Beschreibung**: Wenn User falsche Fragen wiederholt, wie wird Fortschritt berechnet?

| Aspekt | Details |
|--------|---------|
| **Wahrscheinlichkeit** | 🔴 100% (muss entschieden werden) |
| **Impact** | 🟡 Mittel (Business-Logik) |
| **Mitigation** | ADR-015 schreiben |
| **Fallback** | Erste Antwort zählt (Standard) |

**Optionen**:

| Option | Beschreibung | Pro | Contra |
|--------|--------------|-----|--------|
| **A: Erste Antwort zählt** | Nur erste Antwort wird gewertet | ✅ Ehrlich | ❌ Keine zweite Chance |
| **B: Beste Antwort zählt** | Beste von allen Versuchen | ✅ Motivierend | ❌ User kann "cheaten" |
| **C: Letzte Antwort zählt** | Nur letzte Antwort wird gewertet | ✅ Aktuelles Wissen | ❌ Kann schlechter werden |
| **D: Durchschnitt** | Durchschnitt aller Versuche | ✅ Fair | ❌ Komplex |

**Empfehlung**: Option A (Erste Antwort zählt)
- Ehrlich und transparent
- Verhindert "Cheating"
- Einfach zu implementieren
- Standard in E-Learning-Systemen

### Risiko 5: Performance bei vielen Wiederholungen

**Beschreibung**: Wenn User 10x wiederholt, werden 10x Fortschritte gespeichert?

| Aspekt | Details |
|--------|---------|
| **Wahrscheinlichkeit** | 🟢 Niedrig (selten) |
| **Impact** | 🟢 Niedrig (Datenbank-Speicher) |
| **Mitigation** | Nur letzte Wiederholung speichern |
| **Fallback** | Datenbank-Cleanup (später) |

**Empfehlung**: 
- Wiederholungen überschreiben (nicht anhängen)
- Historie ist nicht wichtig für Lernmodus
- Wenn Historie gewünscht: Separate Tabelle (später)

---

## Risiko-Matrix

### Gesamt-Risiko-Bewertung

| Feature | Technisches Risiko | Business Risiko | Gesamt-Risiko |
|---------|-------------------|-----------------|---------------|
| **Kurs-Status-Management** | 🟡 Mittel | 🟢 Niedrig | 🟡 Mittel |
| **Lern-Flow Logik** | 🔴 Hoch | 🔴 Hoch | 🔴 Hoch |

### Risiko-Mitigation-Plan

#### Feature 1: Kurs-Status-Management

1. ✅ ADR-013 schreiben (Soft-Delete)
2. ✅ Unit Tests schreiben
3. ✅ Code Review
4. ✅ Staging-Test
5. ✅ Backup vor Production

**Risiko nach Mitigation**: 🟢 Niedrig

#### Feature 2: Lern-Flow Logik

1. ✅ ADR-014 schreiben (Breaking Change)
2. ✅ ADR-015 schreiben (Fortschritt-Berechnung)
3. ✅ Migration-Script schreiben + testen
4. ✅ Unit Tests schreiben (Shuffle, Fortschritt)
5. ✅ Code Review
6. ✅ Staging-Test (mit echten Daten)
7. ✅ User Testing (5 Testpersonen)
8. ✅ Backup vor Production
9. ✅ Rollback-Plan bereit

**Risiko nach Mitigation**: 🟡 Mittel

---

## Abhängigkeits-Checkliste

### Vor Implementierung

- [ ] ADR-013 geschrieben (Soft-Delete)
- [ ] ADR-014 geschrieben (Breaking Change)
- [ ] ADR-015 geschrieben (Fortschritt-Berechnung)
- [ ] Migration-Script geplant
- [ ] Unit Tests geplant
- [ ] Staging-Umgebung bereit
- [ ] Backup-Strategie definiert

### Während Implementierung

- [ ] Feature 1 implementiert
- [ ] Feature 1 getestet (Unit + Manual)
- [ ] ADR-014, ADR-015 geschrieben
- [ ] Migration-Script implementiert
- [ ] Migration-Script getestet (Staging)
- [ ] Feature 2 implementiert
- [ ] Feature 2 getestet (Unit + Manual)

### Nach Implementierung

- [ ] Code Review durchgeführt
- [ ] Staging-Test erfolgreich
- [ ] User Testing erfolgreich
- [ ] Backup erstellt
- [ ] Production-Deployment
- [ ] Monitoring aktiv
- [ ] Rollback-Plan bereit

---

**Status**: ✅ Abhängigkeiten & Risiken dokumentiert  
**Nächster Schritt**: Sprint-Zuordnung & Roadmap  
**Kritische Punkte**: ADR-014, ADR-015 MÜSSEN zuerst geschrieben werden
