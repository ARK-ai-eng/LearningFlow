# Lessons Learned: Dashboard-Fortschritt & Kurs-Wiederholung (15.02.2026)

**Autor:** Manus AI  
**Datum:** 15. Februar 2026  
**Dauer:** ~6 Stunden (08:15 - 15:04 Uhr)  
**Status:** ✅ Abgeschlossen

---

## Zusammenfassung

Diese Session begann mit einem kritischen Bug-Report: Das Dashboard zeigte 100% Fortschritt obwohl nur 25% der Fragen korrekt beantwortet wurden. Was als einfacher Bug erschien, entpuppte sich als fundamentales Missverständnis der Fortschritts-Logik. Die Session dokumentiert **5 kritische Fehler**, **3 Stunden verschwendete Zeit** durch falsches Verständnis, und **wichtige Learnings** über Datenbank-Konsistenz und Feature-Isolation.

**Hauptprobleme:**
1. Dashboard-Fortschritt basierte auf `completed` Topics statt korrekten Antworten
2. Kurs-Wiederholung setzte nur `incorrect` Fragen zurück (sollte ALLE zurücksetzen)
3. Datenbank-Inkonsistenzen durch fehlende Validierung
4. Zwei verschiedene Features wurden vermischt (Komplett-Reset vs. Falsche Fragen)

**Ergebnis:**
- ✅ Dashboard zeigt jetzt korrekten Fortschritt (basierend auf `correct` Fragen)
- ✅ "Kurs wiederholen" bei 100% setzt ALLES auf 0% zurück
- ✅ Quiz zeigt nur unbeantwortete/falsche Fragen bei <100%
- ✅ Data-Integrity-Check Script erstellt (automatische Validierung)
- ✅ Wöchentlicher Cron-Job eingerichtet (Montag 3 Uhr)

---

## Chronologie der Fehler

### Fehler #1: Dashboard-Fortschritt basiert auf Topics statt Fragen (08:15 - 11:30)

**Was war falsch:**

Das Dashboard berechnete Fortschritt als `completedTopics / totalTopics`. Ein Topic wurde auf `completed` gesetzt sobald EINE Frage beantwortet wurde (egal ob richtig oder falsch). Bei 12 Topics mit je 1 Frage führte dies zu 100% Fortschritt obwohl nur 3 von 12 Fragen korrekt waren.

**Warum war es falsch:**

Die ursprüngliche Implementierung (heute morgen 02:20) hatte diesen Bug bereits gefixed, aber ich habe die Lösung nicht verstanden und den Code wieder kaputt gemacht. Der User hatte klar gesagt: **"Fortschritt = nur KORREKT beantwortete Fragen"**, aber ich habe `answered` statt `correct` verwendet.

**Root Cause:**

- Ich habe die Dokumentation (`LESSONS-LEARNED-KURS-WIEDERHOLUNG.md`) nicht gelesen bevor ich Änderungen machte
- Ich habe angenommen dass "beantwortet" = "korrekt" ist (falsche Annahme!)
- Ich habe die `user_progress` Tabelle als "Source of Truth" behandelt obwohl `question_progress` die eigentliche Quelle ist

**Wie wurde es gelöst:**

1. Dashboard-Code geändert: Fortschritt basiert jetzt auf `correct / total` (nicht `completed / total`)
2. `course.listActive` API erweitert: Berechnet Stats für jeden Kurs (correct, answered, total)
3. SQL-Fix: `user_progress` Einträge für unbeantwortete Topics gelöscht

**Code-Änderung:**

```typescript
// ❌ FALSCH (vorher)
const completedTopics = courseProgress.filter((p: any) => p.status === 'completed').length;
const progress = (completedTopics / courseProgress.length) * 100;

// ✅ RICHTIG (nachher)
const progress = course.stats 
  ? Math.round((course.stats.correct / course.stats.total) * 100) 
  : 0;
```

**Zeit verschwendet:** ~2 Stunden (Datenbank-Korrekturen, falsches Verständnis)

---

### Fehler #2: "In Bearbeitung" zählt Topics statt Kurse (09:45 - 10:15)

**Was war falsch:**

Das Dashboard zeigte "9 In Bearbeitung" obwohl nur 1 Kurs in Bearbeitung war. Der Code zählte ALLE `user_progress` Einträge mit `status='in_progress'` (12 Topics = 12 Einträge).

**Warum war es falsch:**

Ich habe nicht verstanden dass `user_progress` eine **Topic-Level** Tabelle ist, nicht **Course-Level**. Ein Kurs mit 12 Topics hat 12 `user_progress` Einträge.

**Root Cause:**

- Fehlende Dokumentation über Datenbank-Schema (welche Tabelle ist welche Granularität?)
- Ich habe nicht geprüft was `courseProgress` enthält (hätte mit `console.log` sehen können)

**Wie wurde es gelöst:**

```typescript
// ❌ FALSCH (vorher)
const inProgress = progress.filter((p: any) => p.status === 'in_progress').length;

// ✅ RICHTIG (nachher)
const inProgress = courses.filter(c => {
  const prog = c.stats ? Math.round((c.stats.correct / c.stats.total) * 100) : 0;
  return prog > 0 && prog < 100;
}).length;
```

**Zeit verschwendet:** ~30 Minuten

---

### Fehler #3: Kurs-Wiederholung setzt nur `incorrect` Fragen zurück (14:46 - 15:04)

**Was war falsch:**

Nach dem Implementieren von "Falsche Fragen wiederholen" habe ich `resetQuestionProgressByCourse()` so geändert dass nur `incorrect` Fragen zurückgesetzt werden. Das war FALSCH für den "Kurs wiederholen" Button bei 100% - dieser soll ALLE Fragen zurücksetzen!

**Warum war es falsch:**

Ich habe zwei verschiedene Features vermischt:

1. **"Kurs wiederholen" (bei 100%)** - Komplett-Reset, User fängt von vorne an
2. **"Falsche Fragen wiederholen" (bei <100%)** - Nur falsche Fragen nochmal zeigen

Beide Features nutzen dieselbe Funktion (`resetQuestionProgressByCourse()`), aber mit unterschiedlicher Logik!

**Root Cause:**

- Ich habe die existierende Funktion geändert statt eine neue zu erstellen
- Ich habe nicht geprüft wo `resetQuestionProgressByCourse()` überall aufgerufen wird
- Ich habe Feature #2 implementiert OHNE zu verstehen dass Feature #1 bereits existiert

**Wie wurde es gelöst:**

`resetQuestionProgressByCourse()` auf Original zurückgesetzt (löscht ALLE `question_progress` Einträge). Feature #2 ("Falsche Fragen wiederholen") funktioniert bereits automatisch durch `getUnansweredQuestionsByCourse()` - es braucht KEINE separate Reset-Funktion!

**Code-Änderung:**

```typescript
// ❌ FALSCH (14:46 - 15:04)
export async function resetQuestionProgressByCourse(userId: number, courseId: number) {
  await db.delete(questionProgress)
    .where(and(
      eq(questionProgress.userId, userId),
      eq(questionProgress.courseId, courseId),
      eq(questionProgress.firstAttemptStatus, 'incorrect') // NUR incorrect!
    ));
}

// ✅ RICHTIG (Original, wieder hergestellt)
export async function resetQuestionProgressByCourse(userId: number, courseId: number) {
  await db.delete(questionProgress)
    .where(and(
      eq(questionProgress.userId, userId),
      eq(questionProgress.courseId, courseId)
      // ALLE Fragen löschen!
    ));
}
```

**Wichtige Erkenntnis:**

"Falsche Fragen wiederholen" braucht KEINEN Reset! Die Logik ist:

- User beantwortet Fragen → `firstAttemptStatus` wird gesetzt (`correct` oder `incorrect`)
- Quiz zeigt nur Fragen mit `firstAttemptStatus='unanswered'` ODER `firstAttemptStatus='incorrect'`
- Fortschritt = `correct / total` (nicht `answered / total`)

**Zeit verschwendet:** ~1 Stunde (falsches Verständnis, mehrfache Änderungen)

---

### Fehler #4: Datenbank-Inkonsistenzen durch fehlende Validierung (11:00 - 12:30)

**Was war falsch:**

Die `user_progress` Tabelle enthielt inkonsistente Daten:
- 12 Topics alle auf `status='completed'` obwohl nur 3 Fragen beantwortet
- Topics ohne beantwortete Fragen hatten `user_progress` Einträge
- `question_progress` und `user_progress` waren nicht synchron

**Warum war es falsch:**

Es gab keine automatische Validierung die prüft ob `user_progress` mit `question_progress` übereinstimmt. Nach dem Kurs-Reset wurden `question_progress` Einträge gelöscht, aber `user_progress` blieb unverändert.

**Root Cause:**

- `resetQuestionProgressByCourse()` löschte nur `question_progress`, nicht `user_progress`
- `upsertQuestionProgress()` setzte Topics auf `completed` sobald EINE Frage beantwortet wurde
- Keine Constraints in der Datenbank (z.B. Trigger, Checks)

**Wie wurde es gelöst:**

1. **Data-Integrity-Check Script erstellt** (`scripts/check-data-integrity.ts`)
   - Prüft 3 Regeln:
     1. Incomplete Topics: `user_progress.status='completed'` aber nicht alle Fragen korrekt
     2. Fehlende Einträge: Fragen beantwortet aber kein `user_progress` Eintrag
     3. Complete nicht markiert: Alle Fragen korrekt aber `user_progress.status!='completed'`
   - Dry-Run und Fix-Mode
   - Verbose Logging

2. **Wöchentlicher Cron-Job eingerichtet** (`scripts/cron-integrity-check.sh`)
   - Läuft jeden Montag um 3 Uhr
   - Automatische Korrektur (`--fix`)
   - Logs nach `/var/log/aismarterflow/integrity-check.log`
   - Owner-Benachrichtigung bei >5 Inkonsistenzen

3. **`resetQuestionProgressByCourse()` erweitert**
   - Löscht jetzt auch `user_progress` Einträge (Zeile 571-581)

**Test-Ergebnis:**

- Dry-Run: 19 Inkonsistenzen gefunden bei 10 Usern (4.09% aller Checks)
- Fix: Alle 19 Inkonsistenzen korrigiert
- Verification: 0 Inkonsistenzen nach Fix

**Zeit investiert:** ~2 Stunden (gut investiert - verhindert zukünftige Bugs!)

---

### Fehler #5: "0 Fragen warten" obwohl 5 falsch (15:03 - 15:04)

**Was war falsch:**

Nach dem Implementieren von "Falsche Fragen wiederholen" zeigte CourseView "0 Fragen warten auf dich" obwohl 5 Fragen falsch beantwortet wurden.

**Warum war es falsch:**

Die Berechnung war `total - answered` (12 - 12 = 0). Aber `answered` bedeutet "beantwortet" (egal ob richtig oder falsch), nicht "korrekt beantwortet"!

**Root Cause:**

Ich habe wieder `answered` und `correct` verwechselt. Der User wollte dass "Fragen warten" nur die unbeantworteten UND falschen Fragen zählt.

**Wie wurde es gelöst:**

```typescript
// ❌ FALSCH (vorher)
{(courseProgress?.total || 0) - (courseProgress?.answered || 0)} Fragen warten auf dich

// ✅ RICHTIG (nachher)
{(courseProgress?.total || 0) - (courseProgress?.correct || 0)} Fragen warten auf dich
```

**Zeit verschwendet:** ~5 Minuten (schnell gefixed)

---

## Learnings & Best Practices

### 1. **IMMER Dokumentation lesen BEVOR Änderungen gemacht werden**

**Problem:** Ich habe Code geändert ohne `LESSONS-LEARNED-KURS-WIEDERHOLUNG.md` zu lesen.

**Lösung:** Vor jeder Code-Änderung:
1. Suche nach relevanten Dokumenten (`docs/LESSONS-LEARNED-*.md`, `docs/decisions/ADR-*.md`)
2. Lese die komplette Dokumentation (nicht nur überfliegen!)
3. Verstehe die ursprüngliche Implementierung
4. Prüfe ob meine Änderung mit der Dokumentation übereinstimmt

**Neue Regel:** Wenn User sagt "das hatten wir doch schon gefixed", SOFORT Dokumentation suchen und lesen!

---

### 2. **Unterscheide `answered` vs. `correct` vs. `completed`**

**Problem:** Ich habe diese 3 Begriffe ständig verwechselt.

**Klare Definitionen:**

| Begriff | Bedeutung | Verwendung |
|---------|-----------|------------|
| `answered` | Frage wurde beantwortet (egal ob richtig oder falsch) | Zählt wie viele Fragen der User gesehen hat |
| `correct` | Frage wurde KORREKT beantwortet | **Fortschritt-Berechnung!** |
| `completed` | Topic/Kurs ist abgeschlossen | Status-Feld in `user_progress` |

**Fortschritt-Formel:**

```typescript
// ✅ RICHTIG
const progress = (correct / total) * 100;

// ❌ FALSCH
const progress = (answered / total) * 100;
const progress = (completed / total) * 100;
```

---

### 3. **Feature-Isolation: Neue Funktionen erstellen statt existierende ändern**

**Problem:** Ich habe `resetQuestionProgressByCourse()` geändert und dabei Feature #1 kaputt gemacht.

**Lösung:** Wenn zwei Features ähnlich sind aber unterschiedliche Logik brauchen:

1. **Erstelle NEUE Funktionen** (nicht existierende ändern!)
   ```typescript
   resetQuestionProgressByCourse()  // Komplett-Reset (für "Kurs wiederholen")
   resetIncorrectQuestionsOnly()     // Nur falsche (für "Falsche Fragen wiederholen")
   ```

2. **Erstelle NEUE API-Endpoints**
   ```typescript
   course.resetProgress      // Ruft resetQuestionProgressByCourse() auf
   course.resetIncorrect     // Ruft resetIncorrectQuestionsOnly() auf
   ```

3. **Frontend unterscheidet**
   ```typescript
   // Bei 100%: "Kurs wiederholen" → course.resetProgress
   // Bei <100%: Quiz zeigt automatisch nur falsche → KEIN Reset!
   ```

**Wichtig:** Prüfe IMMER wo eine Funktion aufgerufen wird bevor du sie änderst!

```bash
# Suche alle Aufrufe
grep -r "resetQuestionProgressByCourse" server/
```

---

### 4. **Datenbank-Konsistenz mit automatischer Validierung sicherstellen**

**Problem:** `user_progress` und `question_progress` waren nicht synchron.

**Lösung:** Data-Integrity-Check Script mit 3 Prüfungen:

1. **Incomplete Topics:** Prüft ob `user_progress.status='completed'` aber nicht alle Fragen korrekt
2. **Fehlende Einträge:** Prüft ob Fragen beantwortet aber kein `user_progress` Eintrag
3. **Complete nicht markiert:** Prüft ob alle Fragen korrekt aber `user_progress.status!='completed'`

**Wöchentlicher Cron-Job:**
```bash
0 3 * * 1 /home/ubuntu/aismarterflow-academy/scripts/cron-integrity-check.sh
```

**Best Practice:** Nach jedem Schema-Change oder Breaking Change das Script ausführen!

---

### 5. **Zwei-Phasen-Ansatz: Verstehen → Implementieren**

**Problem:** Ich habe sofort implementiert ohne das Problem zu verstehen.

**Lösung:**

**Phase 1: Verstehen (30 Minuten)**
1. User-Problem genau verstehen (was ist falsch? was soll richtig sein?)
2. Dokumentation lesen (`docs/LESSONS-LEARNED-*.md`, `docs/decisions/ADR-*.md`)
3. Aktuellen Code analysieren (wo ist der Bug? warum ist er da?)
4. Root Cause identifizieren (nicht nur Symptom!)

**Phase 2: Implementieren (30 Minuten)**
1. Lösung planen (welche Dateien ändern? welche Tests schreiben?)
2. User fragen: "Ich habe verstanden dass X. Ich werde Y ändern. Ist das korrekt?"
3. Implementieren (Code ändern, Tests schreiben)
4. Verifizieren (Browser-Test, Unit-Tests, Datenbank-Check)

**Wichtig:** Wenn Phase 1 länger als 30 Minuten dauert → User fragen!

---

### 6. **SQL-Queries IMMER mit Dry-Run testen**

**Problem:** Ich habe mehrfach SQL-Updates ausgeführt die nichts geändert haben (0 rows affected).

**Lösung:**

```sql
-- 1. Dry-Run: SELECT statt UPDATE/DELETE
SELECT * FROM user_progress 
WHERE userId = 7 AND courseId = 30002;

-- 2. Prüfen: Sind die richtigen Rows dabei?

-- 3. UPDATE/DELETE ausführen
UPDATE user_progress 
SET status = 'in_progress' 
WHERE userId = 7 AND courseId = 30002;

-- 4. Verifizieren: Wie viele Rows wurden geändert?
-- Affected rows: 12
```

**Best Practice:** Nutze `LIMIT 1` beim ersten Test!

---

## Checkliste für zukünftige Fortschritts-Bugs

Wenn User meldet "Fortschritt ist falsch":

- [ ] Dokumentation lesen (`docs/LESSONS-LEARNED-*.md`)
- [ ] Definitionen klären: `answered` vs. `correct` vs. `completed`
- [ ] Datenbank prüfen:
  ```sql
  SELECT * FROM question_progress WHERE userId = X AND courseId = Y;
  SELECT * FROM user_progress WHERE userId = X AND courseId = Y;
  ```
- [ ] Berechnung prüfen:
  ```typescript
  const progress = (correct / total) * 100; // ✅ RICHTIG
  ```
- [ ] Data-Integrity-Check ausführen:
  ```bash
  npx tsx scripts/check-data-integrity.ts --dry-run
  ```
- [ ] Browser-Test: Dashboard + CourseView beide prüfen
- [ ] Unit-Tests schreiben für die Berechnung

---

## Statistik

| Metrik | Wert |
|--------|------|
| **Gesamt-Dauer** | ~6 Stunden |
| **Zeit verschwendet** | ~3 Stunden |
| **Zeit gut investiert** | ~3 Stunden |
| **Anzahl Fehler** | 5 kritische Bugs |
| **Anzahl Checkpoints** | 7 |
| **Code-Zeilen geändert** | ~200 |
| **Tests geschrieben** | 4 (dashboard.progress.test.ts) |
| **Dokumentation erstellt** | 3 Dateien |

**Effizienz-Verbesserung:**

Wenn ich die Dokumentation SOFORT gelesen hätte (statt nach 2 Stunden):
- **Zeit gespart:** ~2 Stunden
- **Fehler vermieden:** 3 von 5 Bugs

**ROI des Data-Integrity-Check Scripts:**

- **Zeit investiert:** 2 Stunden
- **Zeit gespart (zukünftig):** ~1 Stunde pro Bug (geschätzt 5 Bugs/Jahr = 5 Stunden)
- **ROI:** 250% (5h / 2h)

---

## Nächste Schritte

### Sofort (heute)
- [x] Dokumentation schreiben (dieses Dokument)
- [x] ADR-018 erstellen (Kurs-Wiederholung: Zwei Features)
- [x] Checkpoint erstellen

### Diese Woche
- [ ] Unit-Tests für Dashboard-Fortschritt erweitern (mehr Edge Cases)
- [ ] Data-Integrity-Check auf Produktions-Server installieren
- [ ] Healthchecks.io Integration (Monitoring für Cron-Job)

### Nächster Sprint
- [ ] "Kurs wiederholen" Button umbenennen → "Kurs neu starten" (mit Warnung)
- [ ] Zertifikat-Download nach 100% automatisch anzeigen
- [ ] FirmenAdmin Benachrichtigung bei 100% Abschluss

---

## Anhang

### Betroffene Dateien

**Geändert:**
- `client/src/pages/user/Dashboard.tsx` (Fortschritts-Berechnung)
- `client/src/pages/user/CourseView.tsx` ("Fragen warten" Berechnung)
- `server/routers.ts` (course.listActive mit Stats erweitert)
- `server/db.ts` (resetQuestionProgressByCourse auf Original zurück)

**Neu erstellt:**
- `server/integrity/checker.ts` (Inkonsistenzen erkennen)
- `server/integrity/fixer.ts` (Inkonsistenzen korrigieren)
- `server/integrity/reporter.ts` (CLI-Output)
- `scripts/check-data-integrity.ts` (CLI-Script)
- `scripts/cron-integrity-check.sh` (Cron-Wrapper)
- `docs/DATA-INTEGRITY-CHECK.md` (User-Dokumentation)
- `docs/CRON-JOB-INSTALLATION.md` (Installation-Anleitung)
- `docs/BUG-FIX-DASHBOARD-PROGRESS-2026-02-15.md` (Bug-Fix Dokumentation)

### SQL-Queries für Debugging

```sql
-- Prüfe question_progress für User
SELECT 
  qp.questionId,
  qp.firstAttemptStatus,
  qp.lastAttemptCorrect,
  qp.attemptCount
FROM question_progress qp
WHERE qp.userId = 7 AND qp.courseId = 30002
ORDER BY qp.questionId;

-- Prüfe user_progress für User
SELECT 
  up.topicId,
  up.status,
  up.lastCompletedAt
FROM user_progress up
WHERE up.userId = 7 AND up.courseId = 30002
ORDER BY up.topicId;

-- Zähle correct/incorrect/unanswered
SELECT 
  firstAttemptStatus,
  COUNT(*) as count
FROM question_progress
WHERE userId = 7 AND courseId = 30002
GROUP BY firstAttemptStatus;
```

---

**Fazit:** Diese Session war ein perfektes Beispiel für "measure twice, cut once". Hätte ich die Dokumentation SOFORT gelesen statt nach 2 Stunden, hätte ich 60% der Zeit gespart. Das Data-Integrity-Check Script ist eine wertvolle Investition die zukünftige Bugs verhindert. Die wichtigste Lektion: **Verstehen → Planen → Implementieren**, nicht **Implementieren → Debuggen → Nochmal implementieren**.
