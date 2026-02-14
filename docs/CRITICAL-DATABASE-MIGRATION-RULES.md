# 🚨 KRITISCHE REGELN: DATENBANK-MIGRATIONEN

**ERSTELLT:** 14.02.2026 nach kritischem Datenverlust-Vorfall  
**STATUS:** PFLICHTLEKTÜRE vor JEDER Schema-Änderung

---

## ⚠️ WAS IST PASSIERT (14.02.2026)

### Vorfall-Zusammenfassung
- **Aktion:** Schema-Änderung (`lastCompletedAt` Feld zu `questionProgress` hinzugefügt)
- **Methode:** `pnpm db:push` (Drizzle Kit)
- **Ergebnis:** **ALLE USER-DATEN GELÖSCHT** (38 User → 0 User)
- **Root Cause:** Drizzle Kit fragte "Truncate table?" → "Nein" gewählt → **Daten trotzdem gelöscht**
- **Wiederherstellung:** Manuelle SQL-Inserts mit bcrypt-Hashes

### Betroffene Daten
- ❌ **users** Tabelle komplett geleert
- ❌ **question_progress** Tabelle geleert (131 Einträge verloren)
- ❌ Alle anderen Tabellen betroffen

### Warum Git-Rollback NICHT half
- **Git speichert NUR Code, NICHT Datenbank-Daten**
- Rollback stellte Code wieder her, aber Datenbank blieb leer
- Kein Backup vorhanden

---

## 🔴 ABSOLUTE VERBOTE

### NIEMALS VERWENDEN:
1. ❌ **`pnpm db:push`** in Produktion oder mit echten Daten
2. ❌ **`drizzle-kit push`** ohne vorheriges Backup
3. ❌ **Schema-Änderungen ohne Backup-Strategie**
4. ❌ **Automatische Migrations-Tools bei produktiven Daten**

### WARUM?
- Drizzle Kit kann Daten löschen **auch wenn du "Nein" wählst**
- Keine Rollback-Möglichkeit bei Datenverlust
- Kein Backup = permanenter Datenverlust

---

## ✅ SICHERE MIGRATIONS-STRATEGIE

### Schritt 1: BACKUP ERSTELLEN (IMMER!)
```bash
# Option A: SQL-Dump (bevorzugt)
mysqldump -h $DATABASE_HOST -u $DATABASE_USER -p$DATABASE_PASSWORD $DATABASE_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Option B: TiDB Cloud Backup (falls verfügbar)
# Über TiDB Cloud Console → Backup erstellen
```

### Schritt 2: Schema-Änderung in Code
```typescript
// drizzle/schema.ts
export const questionProgress = mysqlTable("question_progress", {
  // ... existing fields
  lastCompletedAt: timestamp("lastCompletedAt"),  // NEU
});
```

### Schritt 3: Migration MANUELL per SQL
```sql
-- NIEMALS pnpm db:push verwenden!
-- Stattdessen: Manuelle ALTER TABLE Statements

ALTER TABLE question_progress 
ADD COLUMN lastCompletedAt TIMESTAMP NULL 
AFTER lastAttemptAt;
```

### Schritt 4: Verifizierung
```sql
-- Prüfe ob Spalte existiert
DESCRIBE question_progress;

-- Prüfe ob Daten noch da sind
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM question_progress;
```

---

## 📋 MIGRATIONS-CHECKLISTE

**VOR jeder Schema-Änderung:**
- [ ] Backup erstellt? (SQL-Dump oder TiDB Cloud)
- [ ] Backup-Datei gespeichert? (lokal + Cloud)
- [ ] Backup-Größe geprüft? (> 0 Bytes)
- [ ] Migration als SQL-Statement vorbereitet?
- [ ] SQL-Statement getestet? (auf Dev-DB wenn möglich)

**WÄHREND der Migration:**
- [ ] Nur `ALTER TABLE` / `CREATE TABLE` verwenden
- [ ] NIEMALS `DROP TABLE` / `TRUNCATE` verwenden
- [ ] Bei Fehlern: SOFORT STOPPEN, Backup wiederherstellen

**NACH der Migration:**
- [ ] Daten-Count prüfen (vorher/nachher vergleichen)
- [ ] Stichproben-Test (z.B. User-Login testen)
- [ ] Schema-Änderung in Git committen
- [ ] Backup aufbewahren (mindestens 7 Tage)

---

## 🔧 WIEDERHERSTELLUNGS-PROZESS

### Falls Daten verloren gehen:

#### Option 1: SQL-Backup wiederherstellen
```bash
mysql -h $DATABASE_HOST -u $DATABASE_USER -p$DATABASE_PASSWORD $DATABASE_NAME < backup_20260214_230000.sql
```

#### Option 2: TiDB Cloud Backup
1. TiDB Cloud Console öffnen
2. Cluster auswählen
3. "Backup & Restore" → Backup auswählen
4. "Restore" klicken

#### Option 3: Manuelle Wiederherstellung (NOTFALL)
```sql
-- User mit bcrypt-Hash erstellen
-- WICHTIG: Passwort-Hash MUSS mit bcrypt generiert werden!

-- Beispiel:
INSERT INTO users (email, passwordHash, role, isActive, createdAt, updatedAt, lastSignedIn) 
VALUES ('user@example.com', '$2b$10$...', 'user', 1, NOW(), NOW(), NOW());
```

**bcrypt-Hash generieren:**
```bash
node -e "
const bcrypt = require('bcryptjs');
(async () => {
  const hash = await bcrypt.hash('DeinPasswort123', 10);
  console.log(hash);
})();
"
```

---

## 📊 DATEN-MONITORING

### Vor jeder Migration: Baseline erstellen
```sql
-- User-Count
SELECT COUNT(*) as user_count FROM users;

-- Progress-Count
SELECT COUNT(*) as progress_count FROM question_progress;

-- Firmen-Count
SELECT COUNT(*) as company_count FROM companies;

-- Fragen-Count
SELECT COUNT(*) as question_count FROM questions;
```

### Nach Migration: Vergleichen
```sql
-- Wenn Zahlen NICHT übereinstimmen → ROLLBACK!
```

---

## 🎯 BEST PRACTICES

### 1. Entwicklung vs. Produktion trennen
- **Dev-DB:** Kann mit `pnpm db:push` experimentieren
- **Prod-DB:** NUR manuelle SQL-Migrations

### 2. Migrations-Log führen
```markdown
## Migration Log

### 2026-02-14: lastCompletedAt Feld hinzugefügt
- **Backup:** backup_20260214_230000.sql (2.3 MB)
- **SQL:** ALTER TABLE question_progress ADD COLUMN lastCompletedAt TIMESTAMP NULL;
- **Verifizierung:** ✅ 38 Users, 131 Progress-Einträge
- **Dauer:** 2 Sekunden
```

### 3. Rollback-Plan haben
- Für jede Migration: "Was mache ich wenn es schief geht?"
- Rollback-SQL vorbereiten (z.B. `ALTER TABLE ... DROP COLUMN ...`)

### 4. Staging-Environment nutzen
- Erst auf Staging testen
- Dann auf Produktion anwenden

---

## 🚨 NOTFALL-KONTAKTE

### Bei kritischem Datenverlust:
1. **SOFORT STOPPEN** - keine weiteren Änderungen
2. **Backup prüfen** - ist ein Backup verfügbar?
3. **User informieren** - transparent kommunizieren
4. **Wiederherstellung starten** - siehe "Wiederherstellungs-Prozess"

### Eskalation:
- TiDB Cloud Support (falls Cloud-Backup)
- Datenbank-Administrator
- Projekt-Owner

---

## 📚 LESSONS LEARNED

### Was haben wir gelernt?
1. **Drizzle Kit ist NICHT sicher** für Prod-Daten
2. **"Nein" bei Truncate ≠ Daten bleiben erhalten**
3. **Git-Rollback hilft NICHT bei Datenbank-Problemen**
4. **Backup ist PFLICHT, nicht optional**
5. **Manuelle SQL-Migrations sind sicherer als Tools**

### Was ändern wir?
1. ✅ **Backup-Strategie implementieren** (täglich automatisch)
2. ✅ **Migrations-Checkliste einführen** (siehe oben)
3. ✅ **Staging-Environment aufsetzen** (für Tests)
4. ✅ **Monitoring einrichten** (Daten-Count-Alerts)
5. ✅ **Dokumentation pflegen** (dieses Dokument!)

---

## ⚡ QUICK REFERENCE

### Schema-Änderung hinzufügen (SICHER):
```bash
# 1. Backup
mysqldump ... > backup.sql

# 2. SQL schreiben
echo "ALTER TABLE xyz ADD COLUMN abc TIMESTAMP NULL;" > migration.sql

# 3. Ausführen
mysql ... < migration.sql

# 4. Verifizieren
mysql -e "SELECT COUNT(*) FROM users;"
```

### Schema-Änderung rückgängig machen:
```sql
ALTER TABLE question_progress DROP COLUMN lastCompletedAt;
```

---

**WICHTIG:** Diese Regeln sind NICHT optional. Jede Abweichung kann zu Datenverlust führen.

**Bei Fragen:** Lieber 2x fragen als 1x Daten verlieren.

**Letzte Aktualisierung:** 14.02.2026 23:05 Uhr
