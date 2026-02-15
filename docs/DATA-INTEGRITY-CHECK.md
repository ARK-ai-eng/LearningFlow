# Data Integrity Check - User Documentation

**Version:** 1.0  
**Datum:** 15. Februar 2026  
**Autor:** Manus AI

---

## Übersicht

Das Data-Integrity-Check Script prüft und korrigiert automatisch inkonsistente Fortschrittsdaten in der Datenbank. Es erkennt drei Arten von Inkonsistenzen:

1. **Incomplete Topics als "completed" markiert** - Topics sind als abgeschlossen markiert obwohl nicht alle Fragen beantwortet wurden
2. **Fehlende user_progress Einträge** - Fragen wurden beantwortet aber kein user_progress Eintrag existiert
3. **Complete Topics nicht markiert** - Alle Fragen wurden beantwortet aber Topic ist nicht als abgeschlossen markiert

---

## Installation

Das Script ist bereits im Projekt enthalten. Keine Installation notwendig.

**Voraussetzungen:**
- Node.js 18+ installiert
- Datenbank-Verbindung konfiguriert (`DATABASE_URL` in `.env`)
- `pnpm install` ausgeführt

---

## Verwendung

### Dry-Run (nur prüfen, nicht korrigieren)

```bash
npx tsx scripts/check-data-integrity.ts --dry-run
```

**Empfohlen:** Führe immer zuerst einen Dry-Run aus um zu sehen welche Inkonsistenzen gefunden werden.

### Fix (prüfen und korrigieren)

```bash
npx tsx scripts/check-data-integrity.ts --fix
```

**Achtung:** Dies ändert Daten in der Datenbank! Führe vorher einen Dry-Run aus.

### Nur bestimmten User prüfen

```bash
npx tsx scripts/check-data-integrity.ts --user-id 123 --dry-run
```

### Nur bestimmten Kurs prüfen

```bash
npx tsx scripts/check-data-integrity.ts --course-id 456 --dry-run
```

### Detailliertes Logging

```bash
npx tsx scripts/check-data-integrity.ts --dry-run --verbose
```

Zeigt für jeden User und jede Inkonsistenz Details an.

### Hilfe anzeigen

```bash
npx tsx scripts/check-data-integrity.ts --help
```

---

## Output-Beispiel

### Dry-Run Output

```
══════════════════════════════════════════════════════════════════════
         Data Integrity Check - AISmarterFlow Academy
══════════════════════════════════════════════════════════════════════

Mode: DRY RUN (no changes will be made)

[1/2] Checking data integrity...

══════════════════════════════════════════════════════════════════════
         Data Integrity Check - AISmarterFlow Academy
══════════════════════════════════════════════════════════════════════

Started: 15.2.2026, 08:22:00
Duration: 10.95s

══════════════════════════════════════════════════════════════════════
                          SUMMARY
══════════════════════════════════════════════════════════════════════

Total Users:              15
Total Courses:            17
Total Topics:             51
Total Checks:             465

⚠️  Inconsistencies Found:    19 (4.09%)
    - Missing user_progress entry: 6
    - Complete topic not marked: 9
    - Incomplete topic marked as complete: 4

Affected Users:           10

══════════════════════════════════════════════════════════════════════
                      AFFECTED USERS
══════════════════════════════════════════════════════════════════════

User ID  Email                              Issues  Details
-------  ---------------------------------  ------  ----------------
      7  testyou@me.com                         10  1 missing, 9 not marked
  30001  test-progress-1771160497764@test.com       1  1 incomplete
  30002  test-all-correct-1771160498994@test.com       1  1 missing

══════════════════════════════════════════════════════════════════════
Run with --fix to apply corrections.
Run with --verbose for detailed issue list.
══════════════════════════════════════════════════════════════════════
```

### Fix Output

```
[2/2] Fixing inconsistencies...

══════════════════════════════════════════════════════════════════════
                      FIX RESULT
══════════════════════════════════════════════════════════════════════

Total Inconsistencies:    19
Successfully Fixed:       19
Errors:                   0

Fixed by type:
  - Missing user_progress entry: 6
  - Complete topic not marked: 9
  - Incomplete topic marked as complete: 4

✅ All inconsistencies fixed successfully!

══════════════════════════════════════════════════════════════════════
```

---

## Wann sollte das Script ausgeführt werden?

### Regelmäßig (empfohlen)

Führe das Script **wöchentlich** aus um Inkonsistenzen frühzeitig zu erkennen.

**✅ Automatisierung verfügbar:** Ein vorkonfiguriertes Cron-Job Script ist bereits erstellt:
- **Script:** `scripts/cron-integrity-check.sh`
- **Zeitplan:** Jeden Montag um 3 Uhr
- **Features:** Automatisches Logging, Error-Handling, Owner-Benachrichtigung
- **Installation:** Siehe `docs/CRON-JOB-INSTALLATION.md`

**Manueller Test:**
```bash
./scripts/cron-integrity-check.sh
```

### Nach größeren Änderungen

Führe das Script nach folgenden Ereignissen aus:

- ✅ Nach Schema-Änderungen an `user_progress` oder `question_progress`
- ✅ Nach Kurs-Resets für viele User
- ✅ Nach Datenbank-Migrationen
- ✅ Nach Import von externen Daten

### Bei Verdacht auf Inkonsistenzen

Wenn User melden dass:
- Dashboard falschen Fortschritt zeigt
- Kurse als abgeschlossen markiert sind obwohl nicht alle Fragen beantwortet
- Fortschritt nicht gespeichert wird

---

## Fehlerbehandlung

### Script schlägt fehl

**Fehler:** `DATABASE_URL not set`

**Lösung:** Stelle sicher dass `.env` Datei existiert und `DATABASE_URL` gesetzt ist.

---

**Fehler:** `Cannot connect to database`

**Lösung:** Prüfe Datenbank-Verbindung:
```bash
mysql -u user -p -h host database
```

---

**Fehler:** `ERR_UNKNOWN_FILE_EXTENSION`

**Lösung:** Verwende `npx tsx` statt `node`:
```bash
npx tsx scripts/check-data-integrity.ts --dry-run
```

---

### Inkonsistenzen können nicht gefixed werden

Wenn `--fix` Fehler meldet:

1. **Prüfe Logs:** Schaue in Output nach "Errors during fix"
2. **Manueller Fix:** Korrigiere betroffene Einträge manuell in der Datenbank
3. **Support kontaktieren:** Wenn Problem weiterhin besteht

---

## Rollback

Falls nach dem Fix Probleme auftreten:

### Option 1: Datenbank-Rollback

```bash
# Erstelle Backup VOR dem Fix
mysqldump -u user -p database user_progress > backup.sql

# Rollback
mysql -u user -p database < backup.sql
```

### Option 2: Checkpoint-Rollback

Wenn du einen Checkpoint vor dem Fix erstellt hast:

```bash
# In Manus Management UI: Rollback zu vorherigem Checkpoint
```

---

## FAQ

### Wie lange dauert das Script?

- **Kleine Datenbank** (< 100 User): ~5-10 Sekunden
- **Mittlere Datenbank** (100-1000 User): ~30-60 Sekunden
- **Große Datenbank** (> 1000 User): ~2-5 Minuten

### Kann ich das Script während Produktiv-Betrieb ausführen?

**Ja**, aber mit Vorsicht:

- ✅ **Dry-Run:** Jederzeit sicher
- ⚠️ **Fix:** Nur außerhalb der Stoßzeiten (nachts/Wochenende)
- ❌ **Nie:** Während Prüfungen oder wichtigen Schulungen

### Was passiert wenn das Script während der Ausführung abbricht?

Das Script ist **transaktions-sicher**. Jede Korrektur ist eine separate Transaktion. Wenn das Script abbricht:

- ✅ Bereits korrigierte Inkonsistenzen bleiben korrigiert
- ✅ Nicht korrigierte Inkonsistenzen bleiben unverändert
- ✅ Keine Daten gehen verloren

Führe das Script einfach erneut aus.

### Kann ich das Script automatisieren?

**Ja**, empfohlen als wöchentlicher Cron-Job:

```bash
# /etc/cron.d/integrity-check
0 3 * * 1 ubuntu cd /home/ubuntu/aismarterflow-academy && npx tsx scripts/check-data-integrity.ts --fix >> /var/log/integrity-check.log 2>&1
```

**Tipp:** Verwende `--fix` nur wenn du sicher bist dass keine manuellen Eingriffe notwendig sind.

---

## Technische Details

### Geprüfte Regeln

**Regel 1:** Topic ist "completed" nur wenn ALLE Fragen beantwortet
```sql
SELECT * FROM user_progress up
WHERE up.status = 'completed'
  AND (SELECT COUNT(*) FROM question_progress qp 
       WHERE qp.userId = up.userId AND qp.topicId = up.topicId)
    < (SELECT COUNT(*) FROM questions q WHERE q.topicId = up.topicId)
```

**Regel 2:** Wenn Fragen beantwortet, muss user_progress existieren
```sql
SELECT * FROM question_progress qp
WHERE NOT EXISTS (
  SELECT 1 FROM user_progress up 
  WHERE up.userId = qp.userId AND up.topicId = qp.topicId
)
```

**Regel 3:** Wenn ALLE Fragen beantwortet, muss status='completed' sein
```sql
SELECT * FROM user_progress up
WHERE up.status != 'completed'
  AND (SELECT COUNT(*) FROM question_progress qp 
       WHERE qp.userId = up.userId AND qp.topicId = up.topicId)
    = (SELECT COUNT(*) FROM questions q WHERE q.topicId = up.topicId)
```

### Architektur

```
scripts/check-data-integrity.ts   # CLI-Interface
server/integrity/
  ├── checker.ts                  # Check-Logik
  ├── fixer.ts                    # Fix-Logik
  └── reporter.ts                 # Output-Formatierung
```

---

## Support

Bei Fragen oder Problemen:

1. **Dokumentation lesen:** Dieses Dokument + `DATA-INTEGRITY-CHECK-DESIGN.md`
2. **Logs prüfen:** Schaue in Output nach Fehlermeldungen
3. **Issue melden:** Erstelle GitHub Issue mit Details

---

**Letzte Aktualisierung:** 15. Februar 2026  
**Version:** 1.0
