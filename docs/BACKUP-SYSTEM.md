# Backup-System Dokumentation

## Übersicht

Manuelles Backup-System für AISmarterFlow Academy das **KOMPLETT ALLES** sichert:
- SQL-Dump aller Datenbank-Tabellen
- Komplettes Projekt-Verzeichnis (Code, Design, Config)
- node_modules/ (Dependencies)
- .git/ (Git-History)
- Alle Dokumentation

**Backup-Größe:** ~520MB  
**Speicherort:** `/home/ubuntu/backups/`  
**Rotation:** Automatisch (behält nur 7 neueste Backups)

---

## Verwendung

### Backup erstellen

```bash
cd /home/ubuntu/aismarterflow-academy
./scripts/create-backup.sh
```

**Output:**
```
=== AISmarterFlow Academy Backup ===

[1/4] Erstelle SQL-Dump...
✓ SQL-Dump erstellt (36K)

[2/4] Kopiere Projekt-Dateien...
✓ Projekt-Dateien kopiert

[3/4] Erstelle README für Backup...
✓ README erstellt

[4/4] Erstelle ZIP-Archiv...

=== Backup erfolgreich erstellt ===
Datei: /home/ubuntu/backups/aisf-backup-2026-02-14-1951.zip
Größe: 520M

Download:
1. Öffne File Manager
2. Navigiere zu /home/ubuntu/backups/
3. Lade aisf-backup-2026-02-14-1951.zip herunter

Lösche alte Backups (behalte nur 7 neueste)...
✓ 1 Backups vorhanden
```

### Backup herunterladen

1. **Öffne File Manager** (im Browser)
2. **Navigiere zu** `/home/ubuntu/backups/`
3. **Klicke auf** `aisf-backup-YYYY-MM-DD-HHmm.zip`
4. **Download** → Speichere lokal auf deinem Computer

### Backup wiederherstellen

**Siehe README.md im Backup-ZIP** für detaillierte Anleitung.

Kurzversion:
```bash
# 1. Entpacke ZIP
unzip aisf-backup-YYYY-MM-DD-HHmm.zip

# 2. Datenbank wiederherstellen
mysql --host=<HOST> --port=<PORT> --user=<USER> --password=<PASS> --ssl-mode=REQUIRED < database-dump.sql

# 3. Projekt wiederherstellen
cp -r aisf-backup-YYYY-MM-DD-HHmm/aismarterflow-academy /home/ubuntu/
cd /home/ubuntu/aismarterflow-academy
pnpm dev
```

---

## Backup-Inhalt

### 1. SQL-Dump (`database-dump.sql`)

**Größe:** ~36KB  
**Format:** MySQL-kompatibel  
**Inhalt:**
- Alle Tabellen mit Schema
- Alle Daten (User, Kurse, Fragen, Progress)
- Alle Relationen

**Tabellen:**
- `users` - Alle User (SysAdmin, FirmenAdmin, normale User)
- `companies` - Firmen
- `courses` - Kurse (Learning, Sensitization, Certification)
- `topics` - Themen pro Kurs
- `questions` - Fragen pro Thema
- `question_progress` - User-Fortschritt pro Frage (inkl. `lastCompletedAt`)
- `user_progress` - User-Fortschritt pro Topic
- `certificates` - Zertifikate

### 2. Projekt-Verzeichnis (`aismarterflow-academy/`)

**Größe:** ~520MB (mit node_modules)  
**Struktur:**

```
aismarterflow-academy/
├── client/                    # Frontend (React + Tailwind)
│   ├── src/
│   │   ├── pages/            # Seiten (Dashboard, CourseView, QuizView, etc.)
│   │   ├── components/       # UI-Komponenten (shadcn/ui + Custom)
│   │   ├── lib/              # tRPC Client, Utils
│   │   └── index.css         # Globale Styles, Theme-Variablen
│   ├── public/               # Statische Assets (Bilder, Icons, Fonts)
│   └── index.html
├── server/                    # Backend (Express + tRPC)
│   ├── routers.ts            # API-Endpoints
│   ├── db.ts                 # Datenbank-Queries
│   └── _core/                # Framework (OAuth, LLM, Storage)
├── drizzle/                   # Datenbank-Schema
│   └── schema.ts
├── scripts/                   # Utility-Scripts
│   ├── create-backup.sh      # Backup-Script
│   └── seed-courses.mjs      # Seed-Daten
├── docs/                      # Dokumentation
│   ├── LESSONS-LEARNED-KURS-WIEDERHOLUNG.md
│   ├── CRITICAL-DATABASE-MIGRATION-RULES.md
│   ├── BACKUP-SYSTEM.md (dieses Dokument)
│   └── decisions/            # ADRs
├── node_modules/              # Dependencies (~500MB)
├── .git/                      # Git-History
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 3. README.md

Wiederherstellungs-Anleitung mit:
- Schritt-für-Schritt Anleitung
- Datenbank-Restore-Befehle
- Projekt-Setup-Befehle
- Wichtige Hinweise zu .env Datei

---

## Technische Details

### Script-Funktionsweise

**1. SQL-Dump erstellen:**
```bash
mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --password="${DB_PASS}" \
  --ssl-mode=REQUIRED \
  --no-tablespaces \
  --skip-lock-tables \
  --databases "${DB_NAME}" \
  > database-dump.sql
```

**TiDB-spezifische Optionen:**
- `--no-tablespaces` - TiDB unterstützt keine Tablespaces
- `--skip-lock-tables` - Vermeidet SAVEPOINT-Fehler

**2. Projekt kopieren:**
```bash
cp -r /home/ubuntu/aismarterflow-academy "${BACKUP_PATH}/"
rm -rf "${BACKUP_PATH}/aismarterflow-academy/backups"  # Vermeidet Rekursion
```

**3. ZIP erstellen:**
```bash
zip -r -q "${BACKUP_NAME}.zip" "${BACKUP_NAME}/"
```

**4. Alte Backups löschen:**
```bash
ls -t aisf-backup-*.zip | tail -n +8 | xargs -r rm --
```
Behält nur die 7 neuesten Backups.

### Dateiname-Format

```
aisf-backup-YYYY-MM-DD-HHmm.zip
```

**Beispiel:** `aisf-backup-2026-02-14-1951.zip`
- Datum: 14. Februar 2026
- Uhrzeit: 19:51

---

## Wann Backup erstellen?

### ✅ IMMER vor:
- Schema-Änderungen (ALTER TABLE)
- Datenbank-Migrationen
- Großen Code-Refactorings
- Deployment in Produktion
- Löschen von Daten

### ✅ REGELMÄSSIG:
- Nach wichtigen Features
- Nach Bug-Fixes
- Vor längeren Pausen
- Einmal pro Woche (manuell)

### ❌ NICHT nötig:
- Nach kleinen CSS-Änderungen
- Nach Dokumentations-Updates
- Wenn Checkpoint bereits erstellt wurde

---

## Troubleshooting

### Problem: "DATABASE_URL nicht gefunden"

**Ursache:** Script läuft nicht im Webdev Context

**Lösung:**
```bash
# Prüfe ob DATABASE_URL gesetzt ist
echo $DATABASE_URL

# Falls leer: Führe Script im Webdev-Kontext aus
cd /home/ubuntu/aismarterflow-academy
./scripts/create-backup.sh
```

### Problem: "mysqldump: SAVEPOINT sp does not exist"

**Ursache:** Alte mysqldump-Optionen nicht TiDB-kompatibel

**Lösung:** Script verwendet bereits TiDB-kompatible Optionen:
- `--no-tablespaces`
- `--skip-lock-tables`

Falls Fehler weiterhin auftritt: Prüfe mysqldump-Version
```bash
mysqldump --version
```

### Problem: ZIP-Erstellung dauert sehr lange (>5 Minuten)

**Ursache:** node_modules/ ist sehr groß (~500MB)

**Lösung:** Normal! ZIP-Kompression von 500MB dauert 3-5 Minuten.

**Alternative:** Backup ohne node_modules:
```bash
# Manuell: Lösche node_modules vor Backup
rm -rf node_modules/
./scripts/create-backup.sh

# Nach Backup: Installiere Dependencies neu
pnpm install
```

### Problem: "No space left on device"

**Ursache:** Zu viele Backups in `/home/ubuntu/backups/`

**Lösung:** Alte Backups manuell löschen
```bash
cd /home/ubuntu/backups/
ls -lh  # Zeige alle Backups
rm aisf-backup-2026-01-*.zip  # Lösche alte Backups
```

---

## Best Practices

### 1. Backup-Strategie

**3-2-1 Regel:**
- **3** Kopien: Original + 2 Backups
- **2** verschiedene Medien: Development Sandbox + Lokaler Computer
- **1** Offsite: Cloud-Storage (Google Drive, Dropbox, etc.)

**Empfehlung:**
1. Backup erstellen (`/home/ubuntu/backups/`)
2. Herunterladen auf lokalen Computer
3. Kopieren in Cloud-Storage

### 2. Backup-Frequenz

**Minimal:**
- Einmal pro Woche (manuell)
- Vor jeder Schema-Änderung

**Optimal:**
- Nach jedem wichtigen Feature
- Vor jedem Deployment
- Nach jedem Bug-Fix

**Maximal:**
- Täglich (automatisch via Cron - siehe unten)

### 3. Backup-Verifizierung

**Nach jedem Backup:**
1. ZIP-Datei herunterladen
2. Entpacken und prüfen:
   - `database-dump.sql` vorhanden?
   - `aismarterflow-academy/` Verzeichnis vollständig?
   - README.md vorhanden?
3. SQL-Dump testen (optional):
   ```bash
   mysql --host=<TEST_DB> < database-dump.sql
   ```

### 4. Backup-Rotation

**Automatisch:** Script behält nur 7 neueste Backups

**Manuell:** Alte Backups regelmäßig löschen
```bash
cd /home/ubuntu/backups/
ls -lht  # Sortiert nach Datum (neueste zuerst)
rm aisf-backup-2026-01-*.zip  # Lösche Januar-Backups
```

---

## Automatisierung (Optional)

### Tägliches Backup via Cron

**⚠️ WICHTIG:** Funktioniert nur solange Sandbox läuft!

```bash
# Crontab bearbeiten
crontab -e

# Füge Zeile hinzu (täglich um 2:00 Uhr)
0 2 * * * cd /home/ubuntu/aismarterflow-academy && ./scripts/create-backup.sh >> /home/ubuntu/backup.log 2>&1
```

**Problem:** Nach Sandbox-Neustart ist Cron-Job weg!

**Bessere Lösung:** Schedule Feature verwenden (wenn verfügbar)

---

## Wiederherstellung im Detail

### Szenario 1: Kompletter Datenverlust

**Situation:** Datenbank + Code komplett weg

**Schritte:**
1. Backup-ZIP entpacken
2. Datenbank wiederherstellen:
   ```bash
   mysql --host=<HOST> --port=<PORT> --user=<USER> --password=<PASS> --ssl-mode=REQUIRED < database-dump.sql
   ```
3. Projekt wiederherstellen:
   ```bash
   cp -r aisf-backup-*/aismarterflow-academy /home/ubuntu/
   cd /home/ubuntu/aismarterflow-academy
   pnpm dev
   ```

### Szenario 2: Nur Datenbank wiederherstellen

**Situation:** Code OK, aber Datenbank korrupt

**Schritte:**
1. Backup-ZIP entpacken
2. Nur SQL-Dump wiederherstellen:
   ```bash
   mysql --host=<HOST> --port=<PORT> --user=<USER> --password=<PASS> --ssl-mode=REQUIRED < database-dump.sql
   ```

### Szenario 3: Nur Code wiederherstellen

**Situation:** Datenbank OK, aber Code kaputt

**Schritte:**
1. Backup-ZIP entpacken
2. Nur Projekt-Verzeichnis wiederherstellen:
   ```bash
   rm -rf /home/ubuntu/aismarterflow-academy
   cp -r aisf-backup-*/aismarterflow-academy /home/ubuntu/
   cd /home/ubuntu/aismarterflow-academy
   pnpm install  # Falls node_modules fehlt
   pnpm dev
   ```

### Szenario 4: Einzelne Datei wiederherstellen

**Situation:** Nur eine Datei ist kaputt (z.B. `schema.ts`)

**Schritte:**
1. Backup-ZIP entpacken
2. Einzelne Datei kopieren:
   ```bash
   cp aisf-backup-*/aismarterflow-academy/drizzle/schema.ts /home/ubuntu/aismarterflow-academy/drizzle/
   ```

---

## Vergleich: Backup vs. Checkpoint

| Feature | Backup (ZIP) | Checkpoint (Platform) |
|---------|--------------|-------------------|
| **Datenbank** | ✅ Ja (SQL-Dump) | ❌ Nein |
| **Code** | ✅ Ja (komplett) | ✅ Ja (Git-Snapshot) |
| **node_modules** | ✅ Ja (~500MB) | ❌ Nein |
| **Design/Assets** | ✅ Ja | ✅ Ja |
| **Dokumentation** | ✅ Ja | ✅ Ja |
| **Download** | ✅ Ja (ZIP) | ❌ Nein |
| **Offline-Speicherung** | ✅ Ja | ❌ Nein |
| **Wiederherstellung** | Manuell | Automatisch |
| **Größe** | ~520MB | ~5MB |

**Empfehlung:** Beide verwenden!
- **Checkpoint:** Für schnelle Rollbacks während Entwicklung
- **Backup:** Für langfristige Sicherung + Offline-Speicherung

---

## Checkliste: Backup erstellen

- [ ] Alle Änderungen committen (optional)
- [ ] Checkpoint erstellen (optional)
- [ ] Backup-Script ausführen: `./scripts/create-backup.sh`
- [ ] Warten bis ZIP erstellt ist (~3-5 Minuten)
- [ ] ZIP-Datei herunterladen
- [ ] Auf lokalem Computer speichern
- [ ] In Cloud-Storage kopieren (optional)
- [ ] Backup-Inhalt verifizieren (entpacken + prüfen)

---

## Support

Bei Problemen mit Backup-System:
1. Diese Dokumentation lesen
2. `docs/CRITICAL-DATABASE-MIGRATION-RULES.md` lesen
3. `docs/LESSONS-LEARNED-KURS-WIEDERHOLUNG.md` lesen

**Dokumentations-Speicherort:** `/home/ubuntu/aismarterflow-academy/docs/`
