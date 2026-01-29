# Sprint 8 - Implementierungs-Prompts

**Datum**: 29.01.2026  
**Zweck**: Präzise Prompts für technische Umsetzung der Sprint 8 Features

---

## Übersicht

Dieses Dokument enthält **Copy-Paste-Ready Prompts** für die Implementierung der Sprint 8 Features.

**Wichtig**: Diese Prompts sollten **in dieser Reihenfolge** ausgeführt werden.

---

## Prompt 1: Feature 1 - Kurs-Status-Management

### Kontext

Implementiere Kurs-Status-Management für SysAdmin Dashboard: Kurse können aktiviert/deaktiviert werden, inaktive Kurse werden visuell unterschieden und hinten angereiht.

### Anforderungen

1. **Backend**:
   - Prüfe ob `courses.isActive` Boolean-Feld existiert, falls nicht: Migration erstellen
   - API-Endpoint: `course.deactivate(id)` - setzt `isActive = false`
   - API-Endpoint: `course.activate(id)` - setzt `isActive = true`
   - API-Endpoint: `course.list(status)` - mit Filter (all/active/inactive) und Sortierung (aktiv zuerst)
   - Für Mitarbeiter-Rolle: Inaktive Kurse bleiben sichtbar, wenn bereits zugewiesen

2. **Frontend**:
   - SysAdmin Dashboard: Kurs-Liste mit Filter-Buttons (Alle/Aktiv/Inaktiv)
   - Visuelle Unterscheidung: Inaktive Kurse mit `opacity-50` und Badge "Inaktiv"
   - Toggle-Button: "Aktivieren" / "Deaktivieren" für jeden Kurs
   - Sortierung: Aktive Kurse oben, inaktive Kurse unten

3. **Tests**:
   - Unit Tests für `course.deactivate()`, `course.activate()`, `course.list()`
   - Manual Testing: Kurs deaktivieren, Filter testen, Sortierung prüfen

### Technische Details

- **ADR-011**: Soft-Delete (siehe `docs/decisions/README.md`)
- **ADR-012**: Mitarbeiter sehen zugewiesene inaktive Kurse (siehe `docs/decisions/README.md`)
- **PATTERN-Soft-Delete**: Siehe `docs/patterns/README.md`

### Implementierungs-Prompt

```
Implementiere Kurs-Status-Management für SysAdmin Dashboard:

Backend:
1. Prüfe ob `courses.isActive` Boolean-Feld existiert (drizzle/schema.ts)
   - Falls nicht: Erstelle Migration mit `isActive: boolean('is_active').default(true)`
2. Erstelle API-Endpoints in server/routers.ts:
   - course.deactivate: adminProcedure, input: { id: number }, setzt isActive = false
   - course.activate: adminProcedure, input: { id: number }, setzt isActive = true
   - course.list: adminProcedure, input: { status: 'all' | 'active' | 'inactive' }, 
     filtert nach isActive, sortiert aktive zuerst
   - Für Mitarbeiter-Rolle: WHERE isActive = true OR assigned = true
3. Unit Tests in server/*.test.ts schreiben

Frontend:
1. Erstelle/erweitere client/src/pages/admin/CourseManagement.tsx:
   - Filter-Buttons: Alle/Aktiv/Inaktiv (useState für status)
   - Kurs-Liste mit trpc.course.list.useQuery({ status })
   - Inaktive Kurse: className="opacity-50" + Badge "Inaktiv"
   - Toggle-Button: trpc.course.deactivate/activate.useMutation()
   - Sortierung: Aktive oben, inaktive unten (Backend macht das)
2. Nutze shadcn/ui: Button, Card, Badge, CardHeader, CardTitle
3. Mobile-First Responsive: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

Referenzen:
- docs/decisions/README.md (ADR-011, ADR-012)
- docs/patterns/README.md (PATTERN-Soft-Delete)
- docs/design-system/DO-DONT-DESIGN.md

Teste:
- Kurs deaktivieren → opacity-50, Badge "Inaktiv", hinten angereiht
- Kurs aktivieren → normal, Badge weg, oben angereiht
- Filter: Alle/Aktiv/Inaktiv funktioniert
- Mitarbeiter sieht zugewiesene inaktive Kurse
```

---

## Prompt 2: ADR-Dokumentation

### Kontext

Dokumentiere Architektur-Entscheidungen für Sprint 8 Features BEVOR Feature 2 implementiert wird.

### Anforderungen

ADRs sind bereits geschrieben (siehe `docs/decisions/README.md`), aber müssen nochmal geprüft werden:
- ADR-013: Erste Antwort zählt bei Wiederholung
- ADR-014: Fisher-Yates Shuffle für Antworten
- ADR-015: Migration-Strategie für Breaking Changes

### Implementierungs-Prompt

```
Prüfe ADRs für Sprint 8 Feature 2:

1. Lese docs/decisions/README.md:
   - ADR-013: Erste Antwort zählt bei Wiederholung
   - ADR-014: Fisher-Yates Shuffle für Antworten
   - ADR-015: Migration-Strategie für Breaking Changes

2. Verstehe Entscheidungen:
   - Warum erste Antwort? (Verhindert "Cheating")
   - Warum Fisher-Yates? (Uniform distribution, keine Bugs)
   - Warum Migration? (Kein Datenverlust, Fairness)

3. Falls Fragen: Frage BEVOR du Feature 2 implementierst

Keine Implementierung nötig - nur Verständnis sicherstellen.
```

---

## Prompt 3: Feature 2 - Lern-Flow Logik (Teil 1: Backend)

### Kontext

Implementiere neue Lern-Flow Logik für Sensitization-Kurse: Jede Frage nur 1x, sofort Feedback, Wiederholung nur falsche Fragen, Antworten-Shuffle.

### Anforderungen

1. **Migration-Script**:
   - Alte Fortschritte (3/5 Fragen richtig) → Neue Fortschritte (% basiert)
   - Backup erstellen vor Migration
   - Validierung nach Migration

2. **Shuffle-Algorithmus**:
   - Fisher-Yates Shuffle implementieren
   - Unit Tests schreiben

3. **Backend-Endpoints**:
   - `progress.getIncorrectQuestions()` - gibt falsch beantwortete Fragen zurück
   - `progress.calculateScore()` - berechnet % Score
   - `progress.repeatIncorrectQuestions()` - nur falsche Fragen anzeigen
   - Antworten-Shuffle in API integrieren

### Technische Details

- **ADR-013**: Erste Antwort zählt
- **ADR-014**: Fisher-Yates Shuffle
- **ADR-015**: Migration-Strategie
- **PATTERN-Fisher-Yates-Shuffle**: Siehe `docs/patterns/README.md`
- **PATTERN-Migration-Script**: Siehe `docs/patterns/README.md`

### Implementierungs-Prompt

```
Implementiere Lern-Flow Logik Backend (Teil 1):

1. Migration-Script (migrate-progress.mjs):
   - Erstelle scripts/migrate-progress.mjs
   - Kopiere Code aus docs/patterns/README.md (PATTERN-Migration-Script)
   - Passe an: Alte scoreType 'fraction' → Neue scoreType 'percentage'
   - Backup-Tabelle: user_progress_backup
   - Validierung: Zähle Anzahl migrierter Records
   - Teste auf Staging ZUERST

2. Fisher-Yates Shuffle (server/utils/shuffle.ts):
   - Erstelle server/utils/shuffle.ts
   - Kopiere Code aus docs/patterns/README.md (PATTERN-Fisher-Yates-Shuffle)
   - Export: shuffleArray<T>(array: T[]): T[]
   - Unit Tests in server/utils/shuffle.test.ts:
     * should not lose any elements
     * should shuffle (not always same order)
     * should not mutate original array

3. Backend-Endpoints (server/routers.ts):
   - progress.getIncorrectQuestions:
     * protectedProcedure
     * input: { topicId: number }
     * output: Array<{ questionId, questionText, correctAnswer }>
     * Query: SELECT * FROM user_progress WHERE userId = X AND topicId = Y AND isCorrect = false
   
   - progress.calculateScore:
     * protectedProcedure
     * input: { topicId: number }
     * output: { score: number (%), correctCount: number, totalCount: number }
     * Berechnung: (correctCount / totalCount) * 100
   
   - progress.repeatIncorrectQuestions:
     * protectedProcedure
     * input: { topicId: number }
     * output: Array<{ question, shuffledAnswers }>
     * Nutze shuffleArray() für Antworten
   
   - questions.getByTopic (erweitern):
     * Nutze shuffleArray() für Antworten
     * Return: { question, shuffledAnswers: [{ id, text, isCorrect }] }

4. Datenbank-Schema erweitern (drizzle/schema.ts):
   - user_progress Tabelle:
     * firstAttemptScore: int('first_attempt_score') // Zählt für Zertifikat
     * currentScore: int('current_score') // Aktueller Score (kann besser sein)
     * attempts: int('attempts').default(1)
     * scoreType: text('score_type').default('percentage') // 'fraction' oder 'percentage'

5. Unit Tests:
   - server/progress.test.ts:
     * getIncorrectQuestions
     * calculateScore
     * repeatIncorrectQuestions
   - server/shuffle.test.ts:
     * Fisher-Yates Shuffle

Referenzen:
- docs/decisions/README.md (ADR-013, 014, 015)
- docs/patterns/README.md (PATTERN-Fisher-Yates-Shuffle, PATTERN-Migration-Script)

Teste:
- Migration-Script auf Staging
- Shuffle-Algorithmus (Unit Tests)
- Endpoints (Unit Tests + Manual)
```

---

## Prompt 4: Feature 2 - Lern-Flow Logik (Teil 2: Frontend)

### Kontext

Implementiere Frontend für neue Lern-Flow Logik: "Nächste Frage" Button, Dialog für Wiederholung, % Fortschritt, Antworten-Shuffle.

### Anforderungen

1. **"Nächste Frage" Button**:
   - Statt "Thema abschließen" → "Nächste Frage"
   - Nach letzter Frage: Dialog "Fehlerhafte Fragen wiederholen?"

2. **Dialog "Fehlerhafte Fragen wiederholen?"**:
   - Text: "Du hast X von Y Fragen falsch beantwortet. Möchtest du nur die X fehlerhaften Fragen wiederholen, um dein Wissen zu vertiefen? (Score wird nicht geändert)"
   - Buttons: "Ja, wiederholen" / "Nein, fortfahren"

3. **Anzeige nur falsche Fragen**:
   - Wenn "Ja": Nur falsche Fragen anzeigen
   - Wenn "Nein": Fortschritt % anzeigen, zum nächsten Thema

4. **Fortschritt-Anzeige**:
   - Statt "3/5 richtig" → "60% richtig"
   - Progress Bar mit %

5. **Antworten-Reihenfolge shuffeln**:
   - Bei jeder Wiederholung: Antworten-Reihenfolge shuffeln
   - Backend macht das (shuffleArray)

### Implementierungs-Prompt

```
Implementiere Lern-Flow Logik Frontend (Teil 2):

1. TopicView.tsx anpassen (client/src/pages/user/TopicView.tsx):
   - Lese bestehende TopicView.tsx
   - "Nächste Frage" Button:
     * Nach Antwort-Feedback: Button "Nächste Frage" (nicht "Thema abschließen")
     * onClick: Nächste Frage laden
     * Nach letzter Frage: Dialog öffnen
   
   - Dialog "Fehlerhafte Fragen wiederholen?":
     * shadcn/ui Dialog Component
     * Text: "Du hast X von Y Fragen falsch beantwortet. Möchtest du nur die X fehlerhaften Fragen wiederholen, um dein Wissen zu vertiefen? (Score wird nicht geändert)"
     * Buttons:
       - "Ja, wiederholen" → trpc.progress.repeatIncorrectQuestions.useQuery()
       - "Nein, fortfahren" → Fortschritt % anzeigen, zum nächsten Thema
   
   - Anzeige nur falsche Fragen:
     * Wenn "Ja": questions = incorrectQuestions
     * Wenn "Nein": Fortschritt % anzeigen
   
   - Fortschritt-Anzeige:
     * Statt "3/5 richtig" → "60% richtig"
     * shadcn/ui Progress Component
     * trpc.progress.calculateScore.useQuery({ topicId })
   
   - Antworten-Reihenfolge:
     * Backend shuffelt bereits (shuffleArray)
     * Frontend zeigt nur an

2. Styling:
   - Nutze Design-Tokens (Farben, Spacing)
   - Nutze shadcn/ui: Dialog, Progress, Button, Card
   - Mobile-First Responsive

3. Error Handling:
   - Loading States (Skeleton)
   - Error States (Fehlermeldung)
   - Empty States (Keine falschen Fragen)

Referenzen:
- docs/design-system/DO-DONT-DESIGN.md
- docs/patterns/README.md (PATTERN-Lern-Flow)

Teste:
- Frage beantworten → "Nächste Frage" Button
- Letzte Frage → Dialog öffnet
- "Ja, wiederholen" → Nur falsche Fragen
- "Nein, fortfahren" → Fortschritt % anzeigen
- Wiederholung → Antworten-Reihenfolge shuffelt
```

---

## Prompt 5: Testing & Code Review

### Kontext

Teste alle Features, schreibe Unit Tests, führe Code Review durch.

### Anforderungen

1. **Unit Tests**:
   - Feature 1: course.deactivate, course.activate, course.list
   - Feature 2: shuffleArray, progress.getIncorrectQuestions, progress.calculateScore

2. **Integration Tests**:
   - Feature 1: Kurs deaktivieren → Mitarbeiter sieht noch (wenn zugewiesen)
   - Feature 2: Lern-Flow → Wiederholung → Score bleibt gleich

3. **Manual Testing**:
   - Feature 1: Kurs deaktivieren, Filter, Sortierung
   - Feature 2: Lern-Flow, Wiederholung, Dialog, Fortschritt

4. **User Testing**:
   - 5 Testpersonen: Lern-Flow durchgehen, Feedback sammeln

5. **Code Review**:
   - Checkliste: docs/checklists/README.md (Code Review)

### Implementierungs-Prompt

```
Teste Sprint 8 Features:

1. Unit Tests ausführen:
   - pnpm test
   - Alle Tests sollten bestehen
   - Falls nicht: Fehler fixen

2. Manual Testing:
   - Feature 1:
     * SysAdmin: Kurs deaktivieren → opacity-50, Badge "Inaktiv"
     * SysAdmin: Filter Alle/Aktiv/Inaktiv → funktioniert
     * Mitarbeiter: Zugewiesener inaktiver Kurs → noch sichtbar
   
   - Feature 2:
     * Mitarbeiter: Lern-Flow durchgehen
     * Letzte Frage → Dialog "Fehlerhafte Fragen wiederholen?"
     * "Ja" → Nur falsche Fragen
     * "Nein" → Fortschritt % anzeigen
     * Wiederholung → Antworten-Reihenfolge shuffelt

3. User Testing:
   - 5 Testpersonen einladen
   - Lern-Flow durchgehen lassen
   - Feedback sammeln (Was ist verwirrend? Was fehlt?)

4. Code Review:
   - Lese docs/checklists/README.md (Code Review)
   - Prüfe:
     * Code-Qualität (lesbar, keine Duplikate)
     * Standards (Design-Tokens, Tailwind, shadcn/ui)
     * Tests (vorhanden, bestehen)
     * Sicherheit (SQL Injection, XSS)
     * Performance (unnötige Re-Renders?)

5. Fixes nach Code Review:
   - Feedback einarbeiten
   - Tests nochmal laufen lassen

Referenzen:
- docs/checklists/README.md (Code Review, Testing)
```

---

## Prompt 6: Staging & Production Deployment

### Kontext

Deploye Sprint 8 Features auf Staging, teste, dann auf Production.

### Anforderungen

1. **Staging-Deployment**:
   - Migration-Script auf Staging ausführen
   - Features auf Staging testen
   - Monitoring prüfen

2. **Production-Deployment**:
   - Backup erstellen
   - Migration-Script auf Production ausführen
   - Features auf Production testen
   - Monitoring prüfen

3. **Rollback-Plan**:
   - Falls Fehler: Rollback mit webdev_rollback_checkpoint

### Implementierungs-Prompt

```
Deploye Sprint 8 Features:

1. Staging-Deployment:
   - webdev_save_checkpoint (Beschreibung: "Sprint 8 - Vor Staging-Deployment")
   - Migration-Script auf Staging:
     * node scripts/migrate-progress.mjs
     * Logs prüfen (Fehler?)
     * Validierung (Anzahl migrierter Records)
   - Features auf Staging testen:
     * Feature 1: Kurs deaktivieren, Filter
     * Feature 2: Lern-Flow, Wiederholung
   - Monitoring prüfen (Fehler? Performance?)

2. Production-Deployment:
   - Backup erstellen (webdev_save_checkpoint)
   - Migration-Script auf Production:
     * node scripts/migrate-progress.mjs
     * Logs prüfen (Fehler?)
     * Validierung (Anzahl migrierter Records)
   - Features auf Production testen:
     * Feature 1: Kurs deaktivieren, Filter
     * Feature 2: Lern-Flow, Wiederholung
   - Monitoring prüfen (Fehler? Performance?)

3. Rollback-Plan:
   - Falls Fehler: webdev_rollback_checkpoint
   - Datenbank-Backup wiederherstellen
   - Fehler analysieren, fixen, nochmal versuchen

Referenzen:
- docs/checklists/README.md (Deployment)
```

---

## Zusammenfassung

**Reihenfolge**:
1. Prompt 1: Feature 1 - Kurs-Status-Management (3-4h)
2. Prompt 2: ADR-Dokumentation (Verständnis sicherstellen)
3. Prompt 3: Feature 2 - Backend (3-4h)
4. Prompt 4: Feature 2 - Frontend (2-3h)
5. Prompt 5: Testing & Code Review (2-3h)
6. Prompt 6: Staging & Production Deployment (1-2h)

**Gesamt-Aufwand**: 11-17 Stunden (inkl. Puffer)

**Kritische Punkte**:
- ADRs MÜSSEN verstanden werden BEVOR Feature 2 implementiert wird
- Migration-Script MUSS auf Staging getestet werden BEVOR Production
- User Testing MUSS durchgeführt werden (5 Personen)

---

**Status**: ✅ Implementierungs-Prompts erstellt  
**Nächster Schritt**: Wissensmanagement-System Checkpoint erstellen  
**Dann**: Implementierung starten
