# LearningFlow – VPS Deployment-Guide

**Version:** 2.0.0  
**Stand:** 01.03.2026  
**Repository:** https://github.com/ARK-ai-eng/LearningFlow  
**Zielgruppe:** System-Administratoren, DevOps  
**Stack:** Node.js 22 · pnpm · React 19 · Express 4 · tRPC 11 · Drizzle ORM · TiDB (MySQL-kompatibel)

---

## Inhaltsverzeichnis

1. [Voraussetzungen](#1-voraussetzungen)
2. [Erstinstallation auf dem VPS](#2-erstinstallation-auf-dem-vps)
3. [Umgebungsvariablen](#3-umgebungsvariablen)
4. [Datenbank einrichten](#4-datenbank-einrichten)
5. [Build & Start](#5-build--start)
6. [Prozess-Management mit PM2](#6-prozess-management-mit-pm2)
7. [Nginx Reverse-Proxy](#7-nginx-reverse-proxy)
8. [Update-Prozess (laufendes System)](#8-update-prozess-laufendes-system)
9. [Migration: Manuelle Installation → Git-basiert](#9-migration-manuelle-installation--git-basiert)
10. [Rollback-Prozedur](#10-rollback-prozedur)
11. [Backup-Strategie](#11-backup-strategie)
12. [Troubleshooting](#12-troubleshooting)
13. [Sicherheits-Checkliste](#13-sicherheits-checkliste)

---

## 1. Voraussetzungen

### Server-Anforderungen

| Komponente | Minimum | Empfohlen |
|-----------|---------|-----------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Node.js | 22.x | 22.x |
| pnpm | 9.x | 9.x |

### Externe Dienste

| Dienst | Zweck | Pflicht |
|--------|-------|---------|
| TiDB Cloud (oder MySQL 8) | Datenbank | ✅ Ja |
| Domain + SSL (Let's Encrypt) | HTTPS | ✅ Ja |
| PM2 | Prozess-Management | ✅ Ja |
| Nginx | Reverse-Proxy | ✅ Ja |

### Software installieren

```bash
# Node.js 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# PM2
npm install -g pm2

# Nginx
sudo apt install -y nginx

# Git
sudo apt install -y git

# Versionen prüfen
node --version    # v22.x.x
pnpm --version    # 9.x.x
pm2 --version     # 5.x.x
nginx -v          # nginx/1.x.x
```

---

## 2. Erstinstallation auf dem VPS

### 2.1 Repository klonen

```bash
# Zielverzeichnis erstellen
sudo mkdir -p /var/www/learningflow
sudo chown $USER:$USER /var/www/learningflow

# Repository klonen
cd /var/www
git clone https://github.com/ARK-ai-eng/LearningFlow learningflow
cd learningflow

# Aktuellen Stand prüfen
git log --oneline -3
```

### 2.2 Dependencies installieren

```bash
cd /var/www/learningflow
pnpm install --frozen-lockfile
```

### 2.3 Umgebungsvariablen konfigurieren

```bash
# .env Datei erstellen (NIEMALS in Git committen!)
cp .env.example .env   # falls vorhanden
nano .env              # oder: vim .env
```

Alle erforderlichen Variablen: siehe [Abschnitt 3](#3-umgebungsvariablen).

### 2.4 Datenbank einrichten

```bash
# Schema in Datenbank pushen (erstellt alle Tabellen)
pnpm db:push

# Prüfen ob Tabellen erstellt wurden
# (via TiDB Cloud Console oder MySQL-Client)
```

### 2.5 Build erstellen

```bash
pnpm build
```

### 2.6 Ersten Start testen

```bash
# Test-Start (Ctrl+C zum Beenden)
pnpm start

# Prüfen ob Server läuft
curl http://localhost:3000/api/health
```

---

## 3. Umgebungsvariablen

Erstelle `/var/www/learningflow/.env` mit folgenden Werten:

```env
# ============================================================
# DATENBANK
# ============================================================
# TiDB Cloud Connection String (MySQL-kompatibel)
# Format: mysql://user:password@host:port/database?ssl=true
DATABASE_URL=mysql://root:DEIN_PASSWORT@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/learningflow?ssl={"rejectUnauthorized":true}

# ============================================================
# AUTHENTIFIZIERUNG
# ============================================================
# JWT Secret für Session-Tokens (mindestens 32 Zeichen, zufällig generieren)
# Generieren: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=DEIN_ZUFAELLIGES_SECRET_MINDESTENS_32_ZEICHEN

# ============================================================
# ANWENDUNG
# ============================================================
# Port auf dem der Server läuft
PORT=3000

# Node.js Umgebung
NODE_ENV=production

# ============================================================
# VITE FRONTEND VARIABLEN (werden ins Frontend eingebaut)
# ============================================================
# App-ID für interne Identifikation
VITE_APP_ID=learningflow-prod

# App-Titel (erscheint im Browser-Tab)
VITE_APP_TITLE=LearningFlow

# ============================================================
# OPTIONALE VARIABLEN
# ============================================================
# Analytics (Umami) - optional
# VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
# VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

> **🔴 WICHTIG:** Die `.env` Datei darf **NIEMALS** in Git committet werden!
> Prüfen: `cat .gitignore | grep .env` → muss `.env` enthalten.

### JWT_SECRET generieren

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Ausgabe: z.B. a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

---

## 4. Datenbank einrichten

### 4.1 TiDB Cloud (empfohlen)

1. Konto erstellen auf [tidbcloud.com](https://tidbcloud.com)
2. Neues Cluster erstellen (Serverless Tier ist kostenlos)
3. Datenbank `learningflow` erstellen
4. Connection String kopieren und in `.env` eintragen
5. IP-Whitelist: VPS-IP-Adresse hinzufügen

### 4.2 Schema deployen

```bash
cd /var/www/learningflow
pnpm db:push
```

Dieser Befehl:
- Liest `drizzle/schema.ts`
- Erstellt alle Tabellen die noch nicht existieren
- Fügt neue Spalten hinzu (bei Updates)
- **Löscht KEINE bestehenden Daten**

### 4.3 SysAdmin erstellen (Erstinstallation)

Nach dem ersten `pnpm db:push` muss der SysAdmin-Account manuell erstellt werden:

```bash
cd /var/www/learningflow

# Passwort-Hash generieren
node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('DEIN_SICHERES_PASSWORT', 10);
console.log(hash);
"

# SQL-Statement ausführen (via MySQL-Client oder TiDB Cloud Console)
# INSERT INTO users (email, passwordHash, name, firstName, lastName, role, isActive, createdAt, updatedAt)
# VALUES ('admin@deinedomaene.de', 'HASH_AUS_OBEN', 'Admin', 'System', 'Admin', 'sysadmin', 1, NOW(), NOW());
```

---

## 5. Build & Start

### Produktions-Build erstellen

```bash
cd /var/www/learningflow
pnpm build
```

Der Build:
- Kompiliert TypeScript (Server)
- Baut React-Frontend (Vite)
- Output: `dist/` (Server) und `client/dist/` (Frontend)

### Manueller Start (zum Testen)

```bash
pnpm start
# Server läuft auf http://localhost:3000
```

### Umgebungsvariablen prüfen

```bash
node -e "require('dotenv').config(); console.log('DB:', process.env.DATABASE_URL ? 'OK' : 'FEHLT'); console.log('JWT:', process.env.JWT_SECRET ? 'OK' : 'FEHLT');"
```

---

## 6. Prozess-Management mit PM2

### 6.1 PM2 Konfiguration erstellen

```bash
cat > /var/www/learningflow/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'learningflow',
    script: './dist/index.js',
    cwd: '/var/www/learningflow',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '/var/www/learningflow/.env',
    error_file: '/var/log/learningflow/error.log',
    out_file: '/var/log/learningflow/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
EOF

# Log-Verzeichnis erstellen
sudo mkdir -p /var/log/learningflow
sudo chown $USER:$USER /var/log/learningflow
```

### 6.2 App starten

```bash
cd /var/www/learningflow
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Autostart bei Server-Neustart einrichten
# Den angezeigten Befehl ausführen (sudo ...)
```

### 6.3 Wichtige PM2-Befehle

```bash
pm2 status                    # Status aller Apps
pm2 logs learningflow         # Live-Logs anzeigen
pm2 logs learningflow --lines 100  # Letzte 100 Zeilen
pm2 restart learningflow      # App neu starten
pm2 reload learningflow       # Zero-downtime Reload
pm2 stop learningflow         # App stoppen
pm2 delete learningflow       # App aus PM2 entfernen
pm2 monit                     # Ressourcen-Monitor
```

---

## 7. Nginx Reverse-Proxy

### 7.1 Nginx-Konfiguration

```bash
sudo nano /etc/nginx/sites-available/learningflow
```

Inhalt:

```nginx
server {
    listen 80;
    server_name deine-domain.de www.deine-domain.de;

    # Weiterleitung zu HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name deine-domain.de www.deine-domain.de;

    # SSL-Zertifikate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/deine-domain.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/deine-domain.de/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Sicherheits-Header
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip-Komprimierung
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Proxy zu Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Statische Assets mit langem Cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.2 Konfiguration aktivieren

```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/learningflow /etc/nginx/sites-enabled/

# Konfiguration testen
sudo nginx -t

# Nginx neu laden
sudo systemctl reload nginx
```

### 7.3 SSL-Zertifikat (Let's Encrypt)

```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# Zertifikat ausstellen
sudo certbot --nginx -d deine-domain.de -d www.deine-domain.de

# Auto-Renewal testen
sudo certbot renew --dry-run
```

---

## 8. Update-Prozess (laufendes System)

> **🔴 GOLDENE REGEL:** Niemals Daten löschen! Alle Updates müssen abwärtskompatibel sein.

### 8.1 Automatisches Update (empfohlen)

Das Update-Script `scripts/update.sh` führt alle Schritte automatisch durch:

```bash
cd /var/www/learningflow
./scripts/update.sh
```

Das Script:
1. Erstellt Backup (Code + DB-Schema)
2. Führt `git pull` durch
3. Installiert neue Dependencies
4. Führt DB-Migrationen durch (`pnpm db:push`)
5. Erstellt neuen Build
6. Startet App neu (PM2 reload)
7. Führt Health-Check durch
8. Rollt automatisch zurück bei Fehler

### 8.2 Manuelles Update (Schritt für Schritt)

```bash
cd /var/www/learningflow

# 1. Backup erstellen
BACKUP_DIR="/var/backups/learningflow/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/code" --exclude=node_modules --exclude=.git
echo "Backup erstellt: $BACKUP_DIR"

# 2. Neuesten Code holen
git fetch origin main
git log --oneline HEAD..origin/main  # Zeigt was sich geändert hat
git pull origin main

# 3. Dependencies aktualisieren
pnpm install --frozen-lockfile

# 4. Datenbank migrieren (NIEMALS überspringen!)
pnpm db:push

# 5. Build erstellen
pnpm build

# 6. App neu starten (zero-downtime)
pm2 reload learningflow

# 7. Health-Check
sleep 3
curl -f http://localhost:3000/api/health && echo "✅ App läuft" || echo "❌ Fehler!"

# 8. Logs prüfen
pm2 logs learningflow --lines 20
```

### 8.3 Was sich bei einem Update ändern kann

| Änderungstyp | Aktion erforderlich | Risiko |
|-------------|--------------------|----|
| Frontend-Code | `pnpm build` + `pm2 reload` | Gering |
| Backend-Code | `pnpm build` + `pm2 reload` | Gering |
| Neue DB-Spalte (mit DEFAULT) | `pnpm db:push` | Gering |
| Neue DB-Tabelle | `pnpm db:push` | Gering |
| Neue Dependencies | `pnpm install` | Mittel |
| Schema-Breaking-Change | Manuelle Migration nötig | Hoch |

### 8.4 Datenbank-Migrationen sicher durchführen

**✅ Sicher (immer erlaubt):**
```sql
-- Neue Spalte mit DEFAULT
ALTER TABLE users ADD COLUMN phoneNumber VARCHAR(20) DEFAULT '';

-- Neue Tabelle
CREATE TABLE notifications (...);

-- Index hinzufügen
CREATE INDEX idx_users_email ON users(email);
```

**❌ Gefährlich (nie ohne Backup und Test):**
```sql
-- Spalte löschen (Datenverlust!)
ALTER TABLE users DROP COLUMN oldField;

-- Tabelle löschen (Datenverlust!)
DROP TABLE oldTable;

-- Alle Daten löschen (Datenverlust!)
TRUNCATE TABLE users;
```

---

## 9. Migration: Manuelle Installation → Git-basiert

Falls die erste Installation manuell (ohne Git) durchgeführt wurde:

### 9.1 Aktuellen Stand sichern

```bash
# Vollständiges Backup des aktuellen Zustands
BACKUP="/var/backups/learningflow/pre-git-migration-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
cp -r /var/www/learningflow "$BACKUP/code"
echo "Backup erstellt: $BACKUP"
```

### 9.2 Git initialisieren und mit GitHub verbinden

```bash
cd /var/www/learningflow

# Git initialisieren (falls noch nicht vorhanden)
git init
git branch -M main

# Remote hinzufügen
git remote add origin https://github.com/ARK-ai-eng/LearningFlow.git

# Neuesten Stand holen
git fetch origin main
```

### 9.3 Lokale Änderungen prüfen

```bash
# Zeigt Unterschiede zwischen lokalem Code und GitHub
git diff HEAD origin/main -- drizzle/schema.ts  # Schema-Unterschiede
git diff HEAD origin/main -- package.json        # Dependency-Unterschiede
```

### 9.4 Auf neuesten Stand wechseln

```bash
# .env Datei sichern (wird beim Reset nicht gelöscht, da in .gitignore)
cp .env /tmp/.env.backup

# Auf neuesten GitHub-Stand wechseln
git reset --hard origin/main

# .env wiederherstellen (falls nötig)
cp /tmp/.env.backup .env

# Dependencies und Build
pnpm install --frozen-lockfile
pnpm db:push   # Neue Tabellen/Spalten hinzufügen
pnpm build

# App neu starten
pm2 restart learningflow
```

---

## 10. Rollback-Prozedur

### 10.1 Automatisches Rollback

```bash
cd /var/www/learningflow
./scripts/rollback.sh
```

Das Script listet verfügbare Backups und führt den Rollback durch.

### 10.2 Manuelles Rollback (Git)

```bash
cd /var/www/learningflow

# Letzte Commits anzeigen
git log --oneline -10

# Auf bestimmten Commit zurückgehen
git reset --hard COMMIT_HASH

# Build und Neustart
pnpm install --frozen-lockfile
pnpm build
pm2 reload learningflow
```

### 10.3 Rollback mit Backup

```bash
# Backup-Verzeichnisse anzeigen
ls -la /var/backups/learningflow/

# Backup wiederherstellen
BACKUP="/var/backups/learningflow/20260301_120000"
pm2 stop learningflow
cp -r "$BACKUP/code/." /var/www/learningflow/
pnpm install --frozen-lockfile
pnpm build
pm2 start learningflow
```

---

## 11. Backup-Strategie

### 11.1 Code-Backup (automatisch via Git)

Jeder `git push` zu GitHub ist ein automatisches Code-Backup. Zusätzlich:

```bash
# Tägliches Backup via Cron
crontab -e

# Füge hinzu:
0 2 * * * /var/www/learningflow/scripts/create-backup.sh
```

### 11.2 Datenbank-Backup

```bash
# Für TiDB Cloud: Export via Console oder CLI
# Für MySQL: mysqldump

# Beispiel MySQL-Dump
mysqldump -h HOST -u USER -p DATABASE > /var/backups/learningflow/db-$(date +%Y%m%d).sql

# Cron für tägliches DB-Backup
0 3 * * * mysqldump -h HOST -u USER -pPASSWORD DATABASE > /var/backups/learningflow/db-$(date +\%Y\%m\%d).sql
```

### 11.3 Backup-Rotation (ältere Backups löschen)

```bash
# Backups älter als 30 Tage löschen
find /var/backups/learningflow -mtime +30 -delete
```

---

## 12. Troubleshooting

### App startet nicht

```bash
# Logs prüfen
pm2 logs learningflow --lines 50

# Häufige Ursachen:
# 1. .env fehlt oder ist unvollständig
cat .env | grep DATABASE_URL
cat .env | grep JWT_SECRET

# 2. Port bereits belegt
lsof -i :3000

# 3. Node.js Version falsch
node --version  # Muss 22.x sein

# 4. Build fehlt
ls dist/  # Muss index.js enthalten
```

### Datenbank-Verbindungsfehler

```bash
# Verbindung testen
node -e "
const mysql = require('mysql2/promise');
mysql.createConnection(process.env.DATABASE_URL)
  .then(c => { console.log('✅ DB OK'); c.end(); })
  .catch(e => console.error('❌ DB Fehler:', e.message));
"

# Häufige Ursachen:
# 1. Falsche DATABASE_URL in .env
# 2. VPS-IP nicht in TiDB Cloud Whitelist
# 3. SSL-Zertifikat-Problem
```

### "Failed query" Fehler beim Login

Dieser Fehler tritt auf wenn die Datenbankverbindung kurzzeitig unterbrochen wird (TiDB Cloud Timeout). Das ist **kein Code-Bug**.

**Lösung:** Einfach nochmal versuchen. Der nächste Login-Versuch funktioniert.

**Langfristige Lösung:** Connection-Pool mit Retry-Logik konfigurieren (in `server/db.ts`).

### App läuft, aber Seite nicht erreichbar

```bash
# Nginx-Status prüfen
sudo systemctl status nginx
sudo nginx -t

# Firewall prüfen
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Port-Weiterleitung prüfen
curl http://localhost:3000  # Direkt
curl http://deine-domain.de  # Via Nginx
```

### Hohe CPU/Memory-Auslastung

```bash
# PM2 Monitor
pm2 monit

# Health-Check Script
./scripts/health-check.sh

# App neu starten
pm2 restart learningflow
```

---

## 13. Sicherheits-Checkliste

Vor dem ersten Produktions-Deployment:

- [ ] `JWT_SECRET` ist mindestens 32 Zeichen und zufällig generiert
- [ ] `.env` ist in `.gitignore` eingetragen
- [ ] `.env` ist **nicht** in Git committet (`git log -- .env` zeigt nichts)
- [ ] HTTPS ist eingerichtet (Let's Encrypt)
- [ ] Nginx-Sicherheits-Header sind konfiguriert
- [ ] Firewall ist aktiv (nur Port 80, 443, 22 offen)
- [ ] SSH-Passwort-Login ist deaktiviert (nur SSH-Keys)
- [ ] Automatische Sicherheits-Updates sind aktiviert
- [ ] Backup-Strategie ist implementiert und getestet
- [ ] SysAdmin-Passwort ist sicher (min. 12 Zeichen, Sonderzeichen)
- [ ] TiDB Cloud IP-Whitelist enthält nur VPS-IP

### Firewall einrichten

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Automatische Sicherheits-Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Schnell-Referenz

```bash
# App starten
pm2 start ecosystem.config.cjs

# App neu starten (zero-downtime)
pm2 reload learningflow

# Logs anzeigen
pm2 logs learningflow

# Update durchführen
./scripts/update.sh

# Health-Check
./scripts/health-check.sh

# Rollback
./scripts/rollback.sh

# Build erstellen
pnpm build

# Tests ausführen
pnpm test

# DB-Schema deployen
pnpm db:push
```

---

*Dokumentation: LearningFlow Development Team | Stand: 01.03.2026*
