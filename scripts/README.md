# LearningFlow - Deployment Scripts

Dieses Verzeichnis enthält Scripts für Deployment, Updates und Wartung von LearningFlow auf einem VPS.

---

## 📁 Verfügbare Scripts

### 1. `update.sh` - Automatisches Update-Script

**Zweck:** Führt ein vollständiges Update von GitHub durch (Code + Datenbank)

**Features:**
- ✅ Automatisches Backup (Code + Datenbank)
- ✅ Git Pull von GitHub
- ✅ Dependency-Update
- ✅ Datenbank-Migration (mit Sicherheitsprüfung)
- ✅ Build
- ✅ Server-Neustart
- ✅ Health-Check

**Verwendung:**
```bash
cd /var/www/learningflow
./scripts/update.sh
```

**Voraussetzungen:**
- Git-Repository initialisiert
- PM2 läuft
- .env konfiguriert

---

### 2. `rollback.sh` - Rollback-Script

**Zweck:** Stellt eine frühere Version aus Backup wieder her

**Features:**
- ✅ Listet verfügbare Backups
- ✅ Stellt Code wieder her
- ✅ Stellt Datenbank wieder her
- ✅ Erstellt Emergency-Backup vor Rollback
- ✅ Neustart und Verifikation

**Verwendung:**
```bash
cd /var/www/learningflow
./scripts/rollback.sh
# Folge den Anweisungen und gib Backup-Zeitstempel ein
```

**Wann verwenden:**
- Update ist fehlgeschlagen
- Neue Version hat Bugs
- Datenbank-Migration ist schiefgegangen

---

### 3. `health-check.sh` - Health-Check-Script

**Zweck:** Überwacht Server-Status und startet bei Problemen automatisch neu

**Features:**
- ✅ PM2-Status-Check
- ✅ HTTP Health-Endpoint-Check
- ✅ Datenbank-Connectivity-Check
- ✅ Memory/CPU-Monitoring
- ✅ Auto-Restart bei Problemen
- ✅ E-Mail-Alerts (optional)

**Verwendung:**
```bash
# Manuell ausführen
./scripts/health-check.sh

# Als Cron-Job (alle 5 Minuten)
crontab -e
# Füge hinzu:
*/5 * * * * /var/www/learningflow/scripts/health-check.sh
```

**Konfiguration:**
- E-Mail-Adresse in Script anpassen: `ALERT_EMAIL="admin@example.com"`
- Mail-System konfigurieren (sendmail, postfix, etc.)

---

## 🚀 Erste Schritte

### 1. Scripts auf VPS kopieren

**Option A: Via Git (empfohlen)**
```bash
cd /var/www/learningflow
git pull origin main
chmod +x scripts/*.sh
```

**Option B: Manuell**
```bash
# Auf lokalem Rechner
scp scripts/*.sh user@vps:/var/www/learningflow/scripts/

# Auf VPS
chmod +x /var/www/learningflow/scripts/*.sh
```

---

### 2. Erstes Update durchführen

```bash
cd /var/www/learningflow
./scripts/update.sh
```

**Erwartete Ausgabe:**
```
=== LearningFlow Update Script ===
[1/9] Pre-flight checks...
✓ All dependencies installed
[2/9] Preparing backup directory...
✓ Backup directory ready
[3/9] Creating code backup...
✓ Code backup created: code-20260217_120000.tar.gz (15M)
[4/9] Creating database backup...
✓ Database backup created: db-20260217_120000.sql (8.5M)
[5/9] Recording current version...
Current version: a90ca602 (branch: main)
[6/9] Pulling latest code from GitHub...
Already up to date!
```

---

### 3. Health-Check einrichten

```bash
# Test-Lauf
./scripts/health-check.sh

# Als Cron-Job einrichten
crontab -e

# Füge hinzu (alle 5 Minuten):
*/5 * * * * /var/www/learningflow/scripts/health-check.sh

# Logs prüfen
tail -f /var/log/learningflow-health.log
```

---

## 📊 Backup-Verwaltung

### Backup-Speicherort

```bash
~/learningflow-backups/
├── code-20260217_120000.tar.gz
├── db-20260217_120000.sql
├── code-20260217_150000.tar.gz
├── db-20260217_150000.sql
└── update-20260217_120000.log
```

### Alte Backups löschen

```bash
# Backups älter als 30 Tage löschen
find ~/learningflow-backups -name "*.tar.gz" -mtime +30 -delete
find ~/learningflow-backups -name "*.sql" -mtime +30 -delete
find ~/learningflow-backups -name "*.log" -mtime +30 -delete
```

### Automatische Backup-Bereinigung (Cron)

```bash
crontab -e

# Füge hinzu (täglich um 2 Uhr):
0 2 * * * find ~/learningflow-backups -name "*.tar.gz" -mtime +30 -delete
0 2 * * * find ~/learningflow-backups -name "*.sql" -mtime +30 -delete
```

---

## 🔧 Troubleshooting

### Problem: update.sh schlägt fehl

**Lösung:**
```bash
# Logs prüfen
cat ~/learningflow-backups/update-*.log | tail -50

# Manuell zurücksetzen
cd /var/www/learningflow
git status
git reset --hard origin/main
pnpm install
pm2 restart learningflow
```

---

### Problem: Datenbank-Migration schlägt fehl

**Symptom:**
```
Error: Column 'new_field' cannot be null
```

**Lösung:**
```bash
# Rollback durchführen
./scripts/rollback.sh

# Oder manuell:
cd /var/www/learningflow
git reset --hard <previous-version>
mysql -u user -p database < ~/learningflow-backups/db-<timestamp>.sql
pm2 restart learningflow
```

---

### Problem: Health-Check schlägt fehl

**Symptom:**
```
❌ Health check failed! HTTP 500
```

**Diagnose:**
```bash
# Server-Logs prüfen
pm2 logs learningflow --lines 100

# Manueller Health-Check
curl http://localhost:3000/api/health

# Server-Status
pm2 status learningflow
```

**Lösung:**
```bash
# Server neu starten
pm2 restart learningflow

# Wenn das nicht hilft: Rollback
./scripts/rollback.sh
```

---

## 📝 Best Practices

### 1. Vor jedem Update

```bash
# 1. Backup manuell erstellen
./scripts/update.sh  # Macht automatisch Backup

# 2. Oder manuell:
tar -czf ~/manual-backup-$(date +%Y%m%d).tar.gz /var/www/learningflow
mysqldump -u user -p database > ~/manual-db-backup-$(date +%Y%m%d).sql
```

### 2. Nach jedem Update

```bash
# 1. Health-Check
./scripts/health-check.sh

# 2. Manueller Test
# - Login testen
# - Dashboard öffnen
# - Kurs starten
# - Quiz durchführen
```

### 3. Regelmäßige Wartung

```bash
# Wöchentlich: Logs prüfen
pm2 logs learningflow --lines 100

# Monatlich: Backups prüfen
ls -lh ~/learningflow-backups/

# Quartal: Alte Backups löschen
find ~/learningflow-backups -mtime +90 -delete
```

---

## 🔗 Weitere Dokumentation

- **UPDATE-GUIDE.md** - Vollständige Update-Anleitung
- **DEPLOYMENT-GUIDE.md** - Initiales VPS-Setup
- **TROUBLESHOOTING.md** - Detailliertes Troubleshooting
- **CHANGELOG.md** - Versions-Historie

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 17.02.2026  
**Autor:** Manus AI Agent
