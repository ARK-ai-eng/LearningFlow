# LearningFlow - Update-Guide für VPS-Deployment

**Version:** 1.0.0  
**Letzte Aktualisierung:** 17.02.2026  
**Zielgruppe:** System-Administratoren, DevOps  
**Voraussetzung:** Bestehende LearningFlow-Installation auf VPS

---

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Einmalige Migration: Manuell → Git-basiert](#einmalige-migration-manuell--git-basiert)
3. [Standard-Update-Prozess (Git-basiert)](#standard-update-prozess-git-basiert)
4. [Datenbank-Migrationen](#datenbank-migrationen)
5. [Rollback-Prozedur](#rollback-prozedur)
6. [Troubleshooting](#troubleshooting)
7. [Automatisierung](#automatisierung)

---

## 🎯 Überblick

### Update-Strategien

**Szenario 1: Erste Installation (manuell)**
- Code wurde manuell auf VPS hochgeladen
- Keine Git-Versionskontrolle
- ➡️ **Einmalige Migration zu Git erforderlich**

**Szenario 2: Git-basierte Installation**
- Code wird via Git verwaltet
- Updates via `git pull`
- ➡️ **Standard-Update-Prozess**

### Wichtigste Regel

> **🔴 NIEMALS Daten in der Produktions-Datenbank löschen!**
> 
> Alle Updates müssen **abwärtskompatibel** sein:
> - ✅ Neue Spalten mit DEFAULT-Werten
> - ✅ Neue Tabellen
> - ✅ Code-Änderungen die alte Daten verstehen
> - ❌ DROP TABLE / TRUNCATE / DELETE ohne WHERE
> - ❌ Spalten löschen die noch Daten enthalten
> - ❌ NOT NULL ohne DEFAULT bei bestehenden Tabellen

---

## 🔄 Einmalige Migration: Manuell → Git-basiert

### Schritt 1: Backup erstellen

```bash
# 1. Code-Backup
cd /var/www/learningflow
tar -czf ~/learningflow-backup-$(date +%Y%m%d_%H%M%S).tar.gz .

# 2. Datenbank-Backup
mysqldump -h <DB_HOST> -u <DB_USER> -p<DB_PASSWORD> learningflow > ~/db-backup-$(date +%Y%m%d_%H%M%S).sql

# 3. Backup-Größe prüfen
ls -lh ~/*backup*.{tar.gz,sql}
```

**Erwartetes Ergebnis:**
```
-rw-r--r-- 1 user user  15M Feb 17 12:00 learningflow-backup-20260217_120000.tar.gz
-rw-r--r-- 1 user user  8.5M Feb 17 12:00 db-backup-20260217_120000.sql
```

---

### Schritt 2: Git-Repository initialisieren

```bash
cd /var/www/learningflow

# 1. Git initialisieren
git init
git branch -M main

# 2. GitHub-Remote hinzufügen
git remote add origin https://github.com/ToniK0891/LearningFlow.git

# 3. Aktuelle Dateien committen (optional - für Vergleich)
git add .
git commit -m "Snapshot vor GitHub-Migration"

# 4. GitHub-Code pullen
git fetch origin main

# 5. Merge-Strategie wählen

# Option A: GitHub-Code überschreibt lokale Änderungen (EMPFOHLEN)
git reset --hard origin/main

# Option B: Lokale Änderungen behalten (nur wenn du custom code hast)
git merge origin/main --allow-unrelated-histories
# Bei Konflikten: manuell auflösen mit `git mergetool`
```

**⚠️ Wichtig:** Option A (`reset --hard`) verwenden wenn:
- Du keine eigenen Code-Änderungen gemacht hast
- Du die neueste GitHub-Version verwenden willst
- Du Merge-Konflikte vermeiden willst

**Option B nur verwenden wenn:**
- Du custom Code-Änderungen hast die du behalten willst
- Du weißt wie man Git-Merge-Konflikte auflöst

---

### Schritt 3: Dependencies aktualisieren

```bash
# 1. Node-Version prüfen
node --version  # Sollte >= 18.0.0 sein

# 2. pnpm installieren (falls nicht vorhanden)
npm install -g pnpm

# 3. Dependencies installieren
pnpm install

# 4. Build erstellen
pnpm build
```

**Erwartetes Ergebnis:**
```
✓ 1234 packages installed
✓ TypeScript compilation successful
✓ Vite build complete
```

---

### Schritt 4: Umgebungsvariablen prüfen

```bash
# 1. .env-Datei prüfen
cat .env

# 2. Erforderliche Variablen:
# DATABASE_URL=mysql://user:pass@host:port/database
# JWT_SECRET=<random-string-min-32-chars>
# VITE_APP_ID=<manus-app-id>
# OAUTH_SERVER_URL=https://api.manus.im
# VITE_OAUTH_PORTAL_URL=https://portal.manus.im
# ... (siehe .env.example)

# 3. Fehlende Variablen ergänzen
nano .env
```

---

### Schritt 5: Datenbank-Schema aktualisieren

```bash
# 1. Schema-Änderungen prüfen
pnpm drizzle-kit generate

# 2. Generierte Migration prüfen
ls -la drizzle/migrations/
cat drizzle/migrations/<neueste-datei>.sql

# 3. WICHTIG: SQL-File manuell prüfen!
# Suche nach gefährlichen Statements:
grep -i "DROP TABLE" drizzle/migrations/*.sql
grep -i "TRUNCATE" drizzle/migrations/*.sql
grep -i "DELETE FROM" drizzle/migrations/*.sql

# 4. Wenn alles OK: Migration ausführen
pnpm db:push
```

**⚠️ STOP! Wenn du siehst:**
- `DROP TABLE` → Tabelle wird gelöscht! **NICHT AUSFÜHREN**
- `TRUNCATE` → Alle Daten werden gelöscht! **NICHT AUSFÜHREN**
- `DELETE FROM ... WHERE 1=1` → Alle Rows werden gelöscht! **NICHT AUSFÜHREN**

**✅ Sicher sind:**
- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE ADD COLUMN ... DEFAULT ...`
- `CREATE INDEX`

---

### Schritt 6: Anwendung neu starten

```bash
# Option A: PM2 (empfohlen)
pm2 restart learningflow

# Option B: Systemd
sudo systemctl restart learningflow

# Option C: Manuell (nur für Tests)
pnpm dev  # Development
pnpm start  # Production
```

---

### Schritt 7: Verifikation

```bash
# 1. Server-Status prüfen
pm2 status learningflow
# Sollte: online, uptime > 0s

# 2. Logs prüfen
pm2 logs learningflow --lines 50
# Sollte: "Server running on http://localhost:3000"

# 3. Health-Check
curl http://localhost:3000/api/health
# Sollte: {"status":"ok"}

# 4. Login-Test im Browser
# https://your-domain.com/login
# → Einloggen mit Test-User
# → Dashboard sollte Kurse anzeigen
```

---

## 🔄 Standard-Update-Prozess (Git-basiert)

**Voraussetzung:** Git-Repository ist bereits eingerichtet (siehe Migration oben)

### Update-Checkliste

```markdown
## Pre-Update Checklist

- [ ] Backup erstellt (Code + Datenbank)
- [ ] Aktuelle Version notiert (git log -1)
- [ ] Changelog gelesen (docs/CHANGELOG.md)
- [ ] Wartungsfenster geplant (falls Downtime nötig)
- [ ] Rollback-Plan bereit

## Update-Schritte

- [ ] Code von GitHub pullen
- [ ] Dependencies aktualisieren
- [ ] Datenbank-Migration prüfen
- [ ] Datenbank-Migration ausführen
- [ ] Build erstellen
- [ ] Server neu starten
- [ ] Verifikation durchführen

## Post-Update Verification

- [ ] Server läuft (pm2 status)
- [ ] Logs OK (keine Errors)
- [ ] Login funktioniert
- [ ] Dashboard zeigt Kurse
- [ ] Kurs starten funktioniert
- [ ] Exam/Quiz funktioniert
- [ ] Zertifikat-Generierung funktioniert
```

---

### Schritt-für-Schritt Update

```bash
#!/bin/bash
# update.sh - LearningFlow Update Script

set -e  # Exit on error

echo "=== LearningFlow Update Script ==="
echo "Datum: $(date)"
echo ""

# 1. Backup
echo "[1/8] Erstelle Backup..."
BACKUP_DIR=~/learningflow-backups
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Code-Backup
cd /var/www/learningflow
tar -czf $BACKUP_DIR/code-$TIMESTAMP.tar.gz .

# DB-Backup
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD learningflow > $BACKUP_DIR/db-$TIMESTAMP.sql

echo "✓ Backup erstellt: $BACKUP_DIR/*-$TIMESTAMP.*"

# 2. Aktuelle Version notieren
echo "[2/8] Aktuelle Version:"
git log --oneline -1
CURRENT_VERSION=$(git rev-parse --short HEAD)
echo "✓ Version: $CURRENT_VERSION"

# 3. Code pullen
echo "[3/8] Pulling code from GitHub..."
git pull origin main
NEW_VERSION=$(git rev-parse --short HEAD)
echo "✓ Update: $CURRENT_VERSION → $NEW_VERSION"

# 4. Dependencies
echo "[4/8] Updating dependencies..."
pnpm install
echo "✓ Dependencies updated"

# 5. Schema-Änderungen prüfen
echo "[5/8] Checking database schema changes..."
pnpm drizzle-kit generate

# Prüfe ob neue Migrations vorhanden
if [ -n "$(find drizzle/migrations -name '*.sql' -newer $BACKUP_DIR/code-$TIMESTAMP.tar.gz 2>/dev/null)" ]; then
  echo "⚠️  NEUE DATENBANK-MIGRATIONEN GEFUNDEN!"
  echo "Bitte prüfe die SQL-Dateien in drizzle/migrations/ manuell!"
  echo ""
  read -p "Migration ausführen? (yes/no): " CONFIRM
  
  if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Update abgebrochen. Rollback mit: git reset --hard $CURRENT_VERSION"
    exit 1
  fi
  
  echo "Führe Migration aus..."
  pnpm db:push
  echo "✓ Migration completed"
else
  echo "✓ Keine Schema-Änderungen"
fi

# 6. Build
echo "[6/8] Building application..."
pnpm build
echo "✓ Build successful"

# 7. Restart
echo "[7/8] Restarting server..."
pm2 restart learningflow
sleep 3
echo "✓ Server restarted"

# 8. Verification
echo "[8/8] Verifying deployment..."
sleep 2

# Health-Check
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✓ Health check passed"
else
  echo "❌ Health check failed!"
  echo "Rollback empfohlen: git reset --hard $CURRENT_VERSION && pm2 restart learningflow"
  exit 1
fi

# PM2 Status
pm2 status learningflow

echo ""
echo "=== Update erfolgreich abgeschlossen! ==="
echo "Alte Version: $CURRENT_VERSION"
echo "Neue Version: $NEW_VERSION"
echo "Backup: $BACKUP_DIR/*-$TIMESTAMP.*"
echo ""
echo "Bitte teste folgende Funktionen manuell:"
echo "- Login"
echo "- Dashboard (Kurse werden angezeigt)"
echo "- Kurs starten"
echo "- Quiz/Exam durchführen"
echo "- Zertifikat generieren"
```

**Installation:**
```bash
# Script erstellen
nano /var/www/learningflow/update.sh

# Ausführbar machen
chmod +x /var/www/learningflow/update.sh

# Ausführen
./update.sh
```

---

## 🗄️ Datenbank-Migrationen

### Sichere Migration-Patterns

#### Pattern 1: Neue Spalte hinzufügen

**Schema-Änderung:**
```typescript
// drizzle/schema.ts
export const users = sqliteTable('users', {
  // ... bestehende Spalten ...
  
  // ✅ NEU: Mit DEFAULT-Wert
  phoneNumber: text('phone_number').default(''),
  
  // ✅ NEU: Nullable
  department: text('department'),
  
  // ❌ FALSCH: NOT NULL ohne DEFAULT
  // requiredField: text('required_field').notNull(),
});
```

**Generierte Migration:**
```sql
-- ✅ SICHER
ALTER TABLE users ADD COLUMN phone_number TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN department TEXT;

-- ❌ GEFÄHRLICH (wird Fehler werfen bei bestehenden Rows)
-- ALTER TABLE users ADD COLUMN required_field TEXT NOT NULL;
```

---

#### Pattern 2: Neue Tabelle erstellen

**Schema-Änderung:**
```typescript
// drizzle/schema.ts
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read').default(0).notNull(),
  createdAt: integer('created_at').notNull(),
});
```

**Generierte Migration:**
```sql
-- ✅ SICHER (Tabelle existiert noch nicht)
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER NOT NULL
);
```

---

#### Pattern 3: Index hinzufügen

**Schema-Änderung:**
```typescript
// drizzle/schema.ts
export const examResults = sqliteTable('exam_results', {
  // ... Spalten ...
}, (table) => ({
  // ✅ NEU: Index für Performance
  userIdIdx: index('exam_results_user_id_idx').on(table.userId),
  companyIdIdx: index('exam_results_company_id_idx').on(table.companyId),
}));
```

**Generierte Migration:**
```sql
-- ✅ SICHER (Index kann jederzeit hinzugefügt werden)
CREATE INDEX IF NOT EXISTS exam_results_user_id_idx ON exam_results(user_id);
CREATE INDEX IF NOT EXISTS exam_results_company_id_idx ON exam_results(company_id);
```

---

### Gefährliche Migrations-Patterns

#### ❌ Pattern 1: Spalte löschen

```sql
-- ❌ NIEMALS in Produktion ohne Vorbereitung!
ALTER TABLE users DROP COLUMN old_field;
```

**Sichere Alternative:**
1. Code-Update: Entferne alle Referenzen auf `old_field`
2. Deploy Code-Update
3. Warte 1-2 Wochen (Monitoring)
4. Dann erst: `ALTER TABLE users DROP COLUMN old_field`

---

#### ❌ Pattern 2: Tabelle löschen

```sql
-- ❌ NIEMALS ohne Backup und Bestätigung!
DROP TABLE old_table;
```

**Sichere Alternative:**
1. Tabelle umbenennen: `RENAME TABLE old_table TO old_table_deprecated;`
2. Warte 1-2 Wochen (Monitoring)
3. Backup erstellen: `mysqldump ... old_table_deprecated > backup.sql`
4. Dann erst: `DROP TABLE old_table_deprecated;`

---

#### ❌ Pattern 3: Daten-Migration ohne DEFAULT

```sql
-- ❌ FALSCH: Spalte hinzufügen ohne DEFAULT, dann UPDATE
ALTER TABLE users ADD COLUMN status TEXT NOT NULL;
UPDATE users SET status = 'active';  -- ← Fehler! NOT NULL constraint verletzt
```

**✅ Richtig:**
```sql
-- Schritt 1: Spalte mit DEFAULT hinzufügen
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' NOT NULL;

-- Schritt 2 (optional): Bestehende Daten aktualisieren
UPDATE users SET status = 'inactive' WHERE last_login < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

### Migration-Checkliste

```markdown
## Datenbank-Migration Checklist

### Vor der Migration
- [ ] Backup erstellt
- [ ] SQL-File manuell geprüft
- [ ] Keine DROP/TRUNCATE/DELETE Statements
- [ ] Neue Spalten haben DEFAULT-Werte oder sind NULLABLE
- [ ] Migration auf Test-Datenbank getestet

### Migration ausführen
- [ ] `pnpm drizzle-kit generate`
- [ ] SQL-File in drizzle/migrations/ prüfen
- [ ] `pnpm db:push`
- [ ] Logs prüfen (keine Errors)

### Nach der Migration
- [ ] Schema-Verifikation: `pnpm drizzle-kit check`
- [ ] Daten-Verifikation: SELECT-Queries auf neue Spalten
- [ ] Anwendung testen (Login, CRUD-Operationen)
```

---

## ⏮️ Rollback-Prozedur

### Szenario 1: Code-Rollback (ohne DB-Änderungen)

```bash
# 1. Letzte funktionierende Version finden
git log --oneline -10

# 2. Zu Version zurückkehren
git reset --hard <commit-hash>

# 3. Dependencies neu installieren
pnpm install

# 4. Build
pnpm build

# 5. Server neu starten
pm2 restart learningflow

# 6. Verifikation
curl http://localhost:3000/api/health
```

---

### Szenario 2: Datenbank-Rollback

**⚠️ KRITISCH: Nur wenn Migration fehlgeschlagen ist!**

```bash
# 1. Server stoppen
pm2 stop learningflow

# 2. Datenbank-Backup wiederherstellen
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD learningflow < ~/learningflow-backups/db-20260217_120000.sql

# 3. Code-Rollback (siehe Szenario 1)
git reset --hard <commit-hash>
pnpm install
pnpm build

# 4. Server starten
pm2 start learningflow

# 5. Verifikation
pm2 logs learningflow
```

---

### Szenario 3: Komplett-Rollback (Code + DB)

```bash
#!/bin/bash
# rollback.sh - Komplett-Rollback Script

set -e

echo "=== LearningFlow Rollback Script ==="
echo ""

# 1. Backup-Zeitpunkt auswählen
echo "Verfügbare Backups:"
ls -lht ~/learningflow-backups/ | head -20

read -p "Backup-Zeitstempel (Format: YYYYMMDD_HHMMSS): " TIMESTAMP

BACKUP_DIR=~/learningflow-backups
CODE_BACKUP=$BACKUP_DIR/code-$TIMESTAMP.tar.gz
DB_BACKUP=$BACKUP_DIR/db-$TIMESTAMP.sql

# 2. Backups prüfen
if [ ! -f "$CODE_BACKUP" ] || [ ! -f "$DB_BACKUP" ]; then
  echo "❌ Backup-Dateien nicht gefunden!"
  exit 1
fi

echo "✓ Backups gefunden"

# 3. Server stoppen
echo "Stoppe Server..."
pm2 stop learningflow

# 4. Code wiederherstellen
echo "Stelle Code wieder her..."
cd /var/www/learningflow
rm -rf *  # ⚠️ Löscht alle Dateien!
tar -xzf $CODE_BACKUP

# 5. Datenbank wiederherstellen
echo "Stelle Datenbank wieder her..."
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD learningflow < $DB_BACKUP

# 6. Dependencies
echo "Installiere Dependencies..."
pnpm install

# 7. Server starten
echo "Starte Server..."
pm2 start learningflow

# 8. Verifikation
sleep 3
pm2 status learningflow
pm2 logs learningflow --lines 20

echo ""
echo "=== Rollback abgeschlossen ==="
echo "Wiederhergestellte Version: $TIMESTAMP"
```

---

## 🔧 Troubleshooting

### Problem 1: Migration schlägt fehl

**Symptom:**
```
Error: Column 'new_field' cannot be null
```

**Ursache:** Neue Spalte ohne DEFAULT-Wert bei bestehenden Rows

**Lösung:**
```bash
# 1. Rollback
git reset --hard HEAD~1

# 2. Schema korrigieren
# drizzle/schema.ts: Füge DEFAULT-Wert hinzu
newField: text('new_field').default('').notNull(),

# 3. Migration neu generieren
pnpm drizzle-kit generate

# 4. Erneut versuchen
pnpm db:push
```

---

### Problem 2: Server startet nicht nach Update

**Symptom:**
```
pm2 status: errored, restart: 10
```

**Diagnose:**
```bash
# Logs prüfen
pm2 logs learningflow --lines 100

# Häufige Fehler:
# - "Cannot find module ..." → pnpm install vergessen
# - "Port 3000 already in use" → Alter Prozess läuft noch
# - "Database connection failed" → .env falsch
```

**Lösung:**
```bash
# 1. Dependencies neu installieren
pnpm install

# 2. Build neu erstellen
pnpm build

# 3. Alte Prozesse killen
pm2 delete learningflow
pm2 start ecosystem.config.js

# 4. Wenn immer noch Fehler: Rollback
./rollback.sh
```

---

### Problem 3: Datenbank-Verbindung schlägt fehl

**Symptom:**
```
Error: Access denied for user 'learningflow'@'localhost'
```

**Lösung:**
```bash
# 1. .env prüfen
cat .env | grep DATABASE_URL

# 2. Datenbank-Verbindung testen
mysql -h <DB_HOST> -u <DB_USER> -p<DB_PASSWORD> learningflow -e "SELECT 1;"

# 3. Wenn Verbindung OK: Server neu starten
pm2 restart learningflow
```

---

### Problem 4: Frontend zeigt alte Version

**Ursache:** Browser-Cache

**Lösung:**
```bash
# 1. Cache-Busting prüfen
# client/index.html sollte haben:
# <script type="module" src="/src/main.tsx?v=<timestamp>"></script>

# 2. Vite Build mit neuem Hash
pnpm build

# 3. NGINX Cache leeren (falls vorhanden)
sudo nginx -s reload

# 4. Browser: Hard-Refresh (Ctrl+Shift+R)
```

---

## 🤖 Automatisierung

### Cron-Job für automatische Updates

**⚠️ NICHT EMPFOHLEN für Produktion!**  
Automatische Updates ohne Tests können zu Downtime führen.

**Nur für Staging/Test-Umgebungen:**

```bash
# /etc/cron.d/learningflow-update
# Jeden Sonntag um 3 Uhr morgens
0 3 * * 0 /var/www/learningflow/update.sh >> /var/log/learningflow-update.log 2>&1
```

---

### Monitoring & Alerting

**PM2 Monitoring:**
```bash
# PM2 Plus (kostenlos für 1 Server)
pm2 link <secret> <public>

# Alerts bei Crashes
pm2 install pm2-auto-pull
```

**Health-Check Monitoring:**
```bash
#!/bin/bash
# /usr/local/bin/learningflow-health-check.sh

HEALTH_URL="http://localhost:3000/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$RESPONSE" != "200" ]; then
  echo "❌ Health check failed! HTTP $RESPONSE"
  # Alert senden (E-Mail, Slack, etc.)
  echo "LearningFlow health check failed" | mail -s "Alert: LearningFlow Down" admin@example.com
  
  # Auto-Restart (optional)
  pm2 restart learningflow
fi
```

**Cron-Job:**
```bash
# Alle 5 Minuten Health-Check
*/5 * * * * /usr/local/bin/learningflow-health-check.sh
```

---

## 📊 Update-Historie

### Version Tracking

**Changelog führen:**
```bash
# docs/CHANGELOG.md
## [1.1.0] - 2026-02-17

### Added
- Security-Audit-Log Feature
- Admin-UI für Security-Logs

### Fixed
- Dashboard zeigt jetzt alle 3 aktiven Kurse korrekt an
- Admin-Kurs-Route Bug behoben

### Changed
- Performance-Optimierung: N+1 Query Elimination
- db.execute() Result-Format korrigiert

### Database Migrations
- Neue Tabelle: security_logs
- Neue Indizes: exam_results_user_id_idx, exam_results_company_id_idx
```

---

## ✅ Best Practices

### 1. Immer Backups vor Updates

```bash
# Automatisches Backup-Script in update.sh einbauen
BACKUP_DIR=~/learningflow-backups
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/code-$(date +%Y%m%d_%H%M%S).tar.gz .
mysqldump ... > $BACKUP_DIR/db-$(date +%Y%m%d_%H%M%S).sql
```

### 2. Staging-Environment verwenden

```
Development (lokal) → Staging (Test-VPS) → Production (Live-VPS)
```

### 3. Wartungsfenster planen

```bash
# Wartungsmodus aktivieren
# client/public/maintenance.html erstellen
# NGINX: redirect all traffic to /maintenance.html

# Update durchführen
./update.sh

# Wartungsmodus deaktivieren
# NGINX: remove redirect
```

### 4. Monitoring aktivieren

- PM2 Plus für Server-Monitoring
- Uptime-Monitoring (UptimeRobot, Pingdom)
- Error-Tracking (Sentry)
- Log-Aggregation (Papertrail, Loggly)

---

## 📞 Support

**Bei Problemen:**
1. Logs prüfen: `pm2 logs learningflow`
2. Troubleshooting-Sektion durchgehen
3. Rollback durchführen wenn nötig
4. GitHub Issues: https://github.com/ToniK0891/LearningFlow/issues

**Dokumentation:**
- `docs/DEPLOYMENT-GUIDE.md` - Initiales Setup
- `docs/UPDATE-GUIDE.md` - Dieses Dokument
- `docs/TROUBLESHOOTING.md` - Detailliertes Troubleshooting
- `docs/CHANGELOG.md` - Versions-Historie

---

**Letzte Aktualisierung:** 17.02.2026  
**Version:** 1.0.0  
**Autor:** Development Team
