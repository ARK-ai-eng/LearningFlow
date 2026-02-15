#!/bin/bash

# Komplettes Backup-Script für AISmarterFlow Academy
# Erstellt SQL-Dump + komplettes Projekt-Verzeichnis als ZIP
# Verwendung: ./scripts/create-backup.sh

set -e  # Exit bei Fehler

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== AISmarterFlow Academy Backup ===${NC}"
echo ""

# Timestamp für Dateinamen
TIMESTAMP=$(date +"%Y-%m-%d-%H%M")
BACKUP_DIR="/home/ubuntu/backups"
BACKUP_NAME="aisf-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Erstelle Backup-Verzeichnis
mkdir -p "${BACKUP_DIR}"
mkdir -p "${BACKUP_PATH}"

echo -e "${BLUE}[1/4] Erstelle SQL-Dump...${NC}"

# Extrahiere DB-Credentials aus DATABASE_URL
# Format: mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}
# In Manus Webdev: Env-Variablen sind System-Env, nicht in .env Datei
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Fehler: DATABASE_URL nicht gefunden!${NC}"
  echo "Stelle sicher dass das Script im Manus Webdev-Kontext läuft."
  exit 1
fi

DB_URL="$DATABASE_URL"

# Parse DATABASE_URL
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Erstelle SQL-Dump (TiDB-kompatibel)
mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --password="${DB_PASS}" \
  --ssl-mode=REQUIRED \
  --no-tablespaces \
  --skip-lock-tables \
  --databases "${DB_NAME}" \
  2>&1 | grep -v "Using a password" \
  > "${BACKUP_PATH}/database-dump.sql"

echo -e "${GREEN}✓ SQL-Dump erstellt ($(du -h ${BACKUP_PATH}/database-dump.sql | cut -f1))${NC}"

echo -e "${BLUE}[2/4] Kopiere Projekt-Dateien...${NC}"

# Kopiere komplettes Projekt (inkl. node_modules, .git, etc.)
cp -r /home/ubuntu/aismarterflow-academy "${BACKUP_PATH}/"
# Lösche Backup-Verzeichnis aus Kopie (vermeidet Rekursion)
rm -rf "${BACKUP_PATH}/aismarterflow-academy/$(basename ${BACKUP_DIR})" 2>/dev/null || true

echo -e "${GREEN}✓ Projekt-Dateien kopiert${NC}"

echo -e "${BLUE}[3/4] Erstelle README für Backup...${NC}"

# Erstelle README mit Wiederherstellungs-Anleitung
cat > "${BACKUP_PATH}/README.md" << 'EOF'
# AISmarterFlow Academy Backup

**Erstellt am:** $(date +"%Y-%m-%d %H:%M:%S")

## Inhalt

- `database-dump.sql` - Kompletter SQL-Dump aller Tabellen
- `aismarterflow-academy/` - Komplettes Projekt-Verzeichnis
  - Alle Quellcode-Dateien
  - node_modules/ (Dependencies)
  - .git/ (Git-History)
  - Alle Config-Dateien
  - Alle Dokumentation

## Wiederherstellung

### 1. Datenbank wiederherstellen

```bash
mysql \
  --host=<DB_HOST> \
  --port=<DB_PORT> \
  --user=<DB_USER> \
  --password=<DB_PASS> \
  --ssl-mode=REQUIRED \
  < database-dump.sql
```

### 2. Projekt wiederherstellen

```bash
# Entpacke ZIP
unzip aisf-backup-YYYY-MM-DD-HHmm.zip

# Kopiere Projekt
cp -r aisf-backup-YYYY-MM-DD-HHmm/aismarterflow-academy /home/ubuntu/

# Starte Server
cd /home/ubuntu/aismarterflow-academy
pnpm install  # Falls node_modules fehlt
pnpm dev
```

### 3. Prüfe .env Datei

Stelle sicher dass `.env` korrekte Credentials enthält:
- DATABASE_URL
- JWT_SECRET
- Alle anderen Secrets

## Wichtig

- **Backup-Größe:** Inkl. node_modules (~500MB+)
- **Git-History:** Komplett enthalten in .git/
- **Alle Secrets:** In .env Datei (NICHT committen!)

## Support

Bei Problemen siehe:
- `docs/LESSONS-LEARNED-KURS-WIEDERHOLUNG.md`
- `docs/CRITICAL-DATABASE-MIGRATION-RULES.md`
EOF

# Ersetze Timestamp im README
sed -i "s/\$(date +\"%Y-%m-%d %H:%M:%S\")/${TIMESTAMP}/g" "${BACKUP_PATH}/README.md"

echo -e "${GREEN}✓ README erstellt${NC}"

echo -e "${BLUE}[4/4] Erstelle ZIP-Archiv...${NC}"

# Erstelle ZIP (mit Kompression)
cd "${BACKUP_DIR}"
zip -r -q "${BACKUP_NAME}.zip" "${BACKUP_NAME}/"

# Lösche temporäres Verzeichnis
rm -rf "${BACKUP_PATH}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.zip" | cut -f1)

echo ""
echo -e "${GREEN}=== Backup erfolgreich erstellt ===${NC}"
echo -e "Datei: ${BACKUP_DIR}/${BACKUP_NAME}.zip"
echo -e "Größe: ${BACKUP_SIZE}"
echo ""
echo -e "${BLUE}Download:${NC}"
echo -e "1. Öffne Manus File Manager"
echo -e "2. Navigiere zu /home/ubuntu/backups/"
echo -e "3. Lade ${BACKUP_NAME}.zip herunter"
echo ""

# Lösche alte Backups (behalte nur die letzten 7)
echo -e "${BLUE}Lösche alte Backups (behalte nur 7 neueste)...${NC}"
cd "${BACKUP_DIR}"
ls -t aisf-backup-*.zip | tail -n +8 | xargs -r rm --
REMAINING=$(ls -1 aisf-backup-*.zip 2>/dev/null | wc -l)
echo -e "${GREEN}✓ ${REMAINING} Backups vorhanden${NC}"
