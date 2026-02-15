# Data-Integrity-Check Script - Design Document

**Datum:** 15. Februar 2026  
**Zweck:** Automatische Erkennung und Korrektur inkonsistenter Progress-Daten  
**Auslöser:** Bug-Fix Dashboard-Progress (siehe BUG-FIX-DASHBOARD-PROGRESS-2026-02-15.md)

---

## Problem-Beschreibung

### Inkonsistenz zwischen `question_progress` und `user_progress`

**Symptom:**
- `user_progress` zeigt Topics als `'completed'` obwohl nicht alle Fragen beantwortet
- Dashboard zeigt falschen Fortschritt (z.B. 100% statt 25%)

**Ursache:**
- Nach Kurs-Reset: `question_progress` wird zurückgesetzt, aber `user_progress` bleibt auf `'completed'`
- Bei Wiederholung: Topics werden als `'completed'` markiert sobald EINE Frage beantwortet wird

**Auswirkung:**
- User sehen falschen Fortschritt
- Compliance-Berichte sind inkorrekt
- Zertifikate werden fälschlicherweise ausgestellt

---

## Anforderungen

### Funktionale Anforderungen

1. **Erkennung von Inkonsistenzen**
   - Prüfe ALLE User und ALLE Kurse
   - Erkenne Topics wo `user_progress.status = 'completed'` aber nicht alle Fragen beantwortet
   - Erkenne Topics wo Fragen beantwortet sind aber kein `user_progress` Eintrag existiert

2. **Automatische Korrektur**
   - Setze `user_progress.status = 'in_progress'` für Topics mit unbeantworteten Fragen
   - Setze `user_progress.status = 'completed'` für Topics mit allen Fragen beantwortet
   - Erstelle fehlende `user_progress` Einträge

3. **Reporting**
   - Zeige Anzahl geprüfter User/Kurse/Topics
   - Zeige Anzahl gefundener Inkonsistenzen
   - Zeige Anzahl korrigierter Einträge
   - Logge Details für jeden User mit Inkonsistenzen

4. **Sicherheit**
   - Dry-Run Mode (nur prüfen, nicht korrigieren)
   - Backup vor Korrektur
   - Rollback-Möglichkeit

### Nicht-Funktionale Anforderungen

1. **Performance**
   - Soll mit 1000+ Usern umgehen können
   - Batch-Processing (100 User pro Batch)
   - Progress-Anzeige während Ausführung

2. **Wartbarkeit**
   - Klarer, dokumentierter Code
   - Wiederverwendbare Funktionen
   - Einfach erweiterbar

3. **Zuverlässigkeit**
   - Fehlerbehandlung (wenn DB nicht verfügbar)
   - Transaction-Safety (Rollback bei Fehler)
   - Idempotent (mehrfach ausführbar ohne Schaden)

---

## Architektur

### Script-Struktur

```
scripts/
  check-data-integrity.mjs    # Haupt-Script (CLI)
server/
  integrity/
    checker.ts                # Check-Logik
    fixer.ts                  # Fix-Logik
    reporter.ts               # Reporting-Logik
  integrity.test.ts           # Unit-Tests
docs/
  DATA-INTEGRITY-CHECK.md     # User-Dokumentation
```

### Datenfluss

```
1. CLI-Aufruf
   ↓
2. Lade alle User aus DB
   ↓
3. Für jeden User:
   a. Lade alle Kurse
   b. Für jeden Kurs:
      - Prüfe question_progress vs user_progress
      - Sammle Inkonsistenzen
   ↓
4. Reporting (Dry-Run) ODER Fixing
   ↓
5. Ausgabe: Summary + Details
```

---

## Check-Logik

### Regel 1: Topic ist "completed" nur wenn ALLE Fragen beantwortet

```typescript
// Für jedes Topic:
const topicQuestions = await getQuestionsByTopic(topicId);
const answeredQuestions = await getQuestionProgressByTopic(userId, topicId);

// Inkonsistenz wenn:
if (userProgress.status === 'completed' && answeredQuestions.length < topicQuestions.length) {
  // FEHLER: Topic als completed markiert aber nicht alle Fragen beantwortet
  inconsistencies.push({
    type: 'incomplete_topic_marked_complete',
    userId,
    courseId,
    topicId,
    expected: 'in_progress',
    actual: 'completed',
    questionsTotal: topicQuestions.length,
    questionsAnswered: answeredQuestions.length,
  });
}
```

### Regel 2: Topic ist "in_progress" wenn mindestens EINE Frage beantwortet

```typescript
// Inkonsistenz wenn:
if (answeredQuestions.length > 0 && !userProgress) {
  // FEHLER: Fragen beantwortet aber kein user_progress Eintrag
  inconsistencies.push({
    type: 'missing_user_progress',
    userId,
    courseId,
    topicId,
    questionsAnswered: answeredQuestions.length,
  });
}
```

### Regel 3: Topic ist "completed" nur wenn ALLE Fragen beantwortet

```typescript
// Inkonsistenz wenn:
if (answeredQuestions.length === topicQuestions.length && userProgress.status !== 'completed') {
  // FEHLER: Alle Fragen beantwortet aber Topic nicht als completed markiert
  inconsistencies.push({
    type: 'complete_topic_not_marked',
    userId,
    courseId,
    topicId,
    expected: 'completed',
    actual: userProgress.status,
  });
}
```

---

## Fix-Logik

### Fix 1: Setze incomplete Topics auf "in_progress"

```typescript
for (const issue of inconsistencies.filter(i => i.type === 'incomplete_topic_marked_complete')) {
  await db.update(userProgress)
    .set({ 
      status: 'in_progress',
      completedAt: null 
    })
    .where(and(
      eq(userProgress.userId, issue.userId),
      eq(userProgress.topicId, issue.topicId)
    ));
}
```

### Fix 2: Erstelle fehlende user_progress Einträge

```typescript
for (const issue of inconsistencies.filter(i => i.type === 'missing_user_progress')) {
  // Berechne Score basierend auf question_progress
  const progress = await getQuestionProgressByTopic(issue.userId, issue.topicId);
  const correctCount = progress.filter(p => p.firstAttemptStatus === 'correct').length;
  const score = Math.round((correctCount / issue.questionsAnswered) * 100);
  
  await db.upsertProgress({
    userId: issue.userId,
    courseId: issue.courseId,
    topicId: issue.topicId,
    status: 'in_progress',
    score,
    completedAt: null,
  });
}
```

### Fix 3: Setze complete Topics auf "completed"

```typescript
for (const issue of inconsistencies.filter(i => i.type === 'complete_topic_not_marked')) {
  // Berechne Score
  const progress = await getQuestionProgressByTopic(issue.userId, issue.topicId);
  const correctCount = progress.filter(p => p.firstAttemptStatus === 'correct').length;
  const score = Math.round((correctCount / progress.length) * 100);
  
  await db.update(userProgress)
    .set({ 
      status: 'completed',
      score,
      completedAt: new Date()
    })
    .where(and(
      eq(userProgress.userId, issue.userId),
      eq(userProgress.topicId, issue.topicId)
    ));
}
```

---

## CLI-Interface

### Kommandos

```bash
# Dry-Run (nur prüfen, nicht korrigieren)
node scripts/check-data-integrity.mjs --dry-run

# Prüfen und korrigieren
node scripts/check-data-integrity.mjs --fix

# Nur bestimmten User prüfen
node scripts/check-data-integrity.mjs --user-id 123 --dry-run

# Nur bestimmten Kurs prüfen
node scripts/check-data-integrity.mjs --course-id 456 --dry-run

# Verbose Output
node scripts/check-data-integrity.mjs --dry-run --verbose
```

### Output-Format

```
╔════════════════════════════════════════════════════════════════╗
║         Data Integrity Check - AISmarterFlow Academy           ║
╚════════════════════════════════════════════════════════════════╝

Mode: DRY RUN (no changes will be made)
Started: 2026-02-15 08:30:00

[1/3] Loading users...
  ✓ Found 150 users

[2/3] Checking progress data...
  ✓ Checked 150 users
  ✓ Checked 450 course enrollments
  ✓ Checked 5400 topic progress entries

[3/3] Analyzing inconsistencies...
  ⚠ Found 12 inconsistencies:
    - 8 incomplete topics marked as complete
    - 3 missing user_progress entries
    - 1 complete topic not marked

╔════════════════════════════════════════════════════════════════╗
║                          SUMMARY                               ║
╚════════════════════════════════════════════════════════════════╝

Total Users:              150
Total Courses:            3
Total Topics:             36
Total Checks:             5400

Inconsistencies Found:    12 (0.22%)
  - Type 1 (incomplete):  8
  - Type 2 (missing):     3
  - Type 3 (not marked):  1

Affected Users:           5

╔════════════════════════════════════════════════════════════════╗
║                      AFFECTED USERS                            ║
╚════════════════════════════════════════════════════════════════╝

User ID  Email                    Issues  Details
-------  -----------------------  ------  -----------------------
123      user1@example.com        3       2 incomplete, 1 missing
456      user2@example.com        5       4 incomplete, 1 not marked
789      user3@example.com        2       1 incomplete, 1 missing
...

Run with --fix to apply corrections.
Run with --verbose for detailed issue list.

Completed: 2026-02-15 08:30:15 (15 seconds)
```

---

## Rollback-Strategie

### Backup vor Fix

```typescript
// Vor jeder Korrektur: Backup erstellen
const backupFile = `/tmp/user_progress_backup_${Date.now()}.sql`;
await exec(`mysqldump -u ${user} -p${pass} ${db} user_progress > ${backupFile}`);
console.log(`Backup created: ${backupFile}`);
```

### Rollback-Kommando

```bash
# Rollback aus Backup
mysql -u user -p database < /tmp/user_progress_backup_1234567890.sql
```

---

## Testing-Strategie

### Unit-Tests

```typescript
describe('Data Integrity Checker', () => {
  it('sollte incomplete Topics erkennen', async () => {
    // Setup: Topic mit 3 Fragen, nur 1 beantwortet, aber status='completed'
    // Assert: Inkonsistenz erkannt
  });

  it('sollte fehlende user_progress Einträge erkennen', async () => {
    // Setup: Fragen beantwortet, aber kein user_progress
    // Assert: Inkonsistenz erkannt
  });

  it('sollte complete Topics erkennen die nicht markiert sind', async () => {
    // Setup: Alle Fragen beantwortet, aber status='in_progress'
    // Assert: Inkonsistenz erkannt
  });

  it('sollte keine false positives erzeugen', async () => {
    // Setup: Konsistente Daten
    // Assert: Keine Inkonsistenzen
  });
});
```

### Integration-Tests

```bash
# Test mit echten Daten (Staging-DB)
node scripts/check-data-integrity.mjs --dry-run --verbose

# Erwartung: Keine Inkonsistenzen (nach initialem Fix)
```

---

## Deployment

### Cron-Job (optional)

```bash
# Täglich um 3 Uhr morgens prüfen
0 3 * * * cd /path/to/project && node scripts/check-data-integrity.mjs --dry-run --verbose >> /var/log/integrity-check.log 2>&1
```

### Monitoring

```typescript
// Bei Inkonsistenzen: E-Mail an Admin
if (inconsistencies.length > 0) {
  await notifyOwner({
    title: 'Data Integrity Issues Found',
    content: `Found ${inconsistencies.length} inconsistencies. Run with --fix to correct.`
  });
}
```

---

## Nächste Schritte

1. ✅ Design-Dokument erstellt
2. [ ] Implementierung: `server/integrity/checker.ts`
3. [ ] Implementierung: `server/integrity/fixer.ts`
4. [ ] Implementierung: `server/integrity/reporter.ts`
5. [ ] Implementierung: `scripts/check-data-integrity.mjs`
6. [ ] Unit-Tests schreiben
7. [ ] Integration-Test mit echten Daten
8. [ ] User-Dokumentation schreiben
9. [ ] Checkpoint erstellen

---

**Geschätzte Implementierungszeit:** 2-3 Stunden  
**Priorität:** Hoch (verhindert zukünftige Bugs)
