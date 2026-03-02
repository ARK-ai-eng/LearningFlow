# Hotfix: Fehlende Spalte `forcePasswordChange` in der Datenbank

**Datum:** 02.03.2026  
**Symptom:** `Failed query: select ... from users where users.email = ?` beim Login  
**Ursache:** Die Spalte `forcePasswordChange` wurde zum Drizzle-Schema hinzugefügt, aber keine SQL-Migration wurde dafür generiert.

---

## Root Cause

Die Spalte `forcePasswordChange` ist in `drizzle/schema.ts` definiert und im Snapshot `drizzle/meta/0011_snapshot.json` enthalten, aber **fehlt in allen SQL-Migrationsdateien** (`drizzle/000*.sql`). Drizzle ORM versucht beim Login, alle Spalten aus dem Schema zu selektieren — inklusive `forcePasswordChange`. Da diese Spalte in der Datenbank nicht existiert, wirft MySQL/TiDB einen Fehler.

---

## Fix: SQL direkt ausführen

### Option 1: TiDB Cloud Console (empfohlen)

1. Öffnen Sie [tidbcloud.com](https://tidbcloud.com) → Ihr Cluster → **SQL Editor**
2. Wählen Sie die Datenbank `learningflow`
3. Führen Sie folgenden SQL-Befehl aus:

```sql
ALTER TABLE `users` 
ADD COLUMN `forcePasswordChange` boolean NOT NULL DEFAULT false;
```

4. Bestätigen Sie mit `Run`
5. Testen Sie den Login erneut

### Option 2: Auf dem VPS via MySQL-Client

```bash
# Verbindung zur TiDB Cloud
mysql -h gateway01.eu-central-1.prod.aws.tidbcloud.com \
      -P 4000 \
      -u <DEIN_USER> \
      -p \
      --ssl-mode=REQUIRED \
      learningflow

# Im MySQL-Client:
ALTER TABLE `users` 
ADD COLUMN `forcePasswordChange` boolean NOT NULL DEFAULT false;

# Prüfen ob die Spalte jetzt vorhanden ist:
DESCRIBE users;
```

### Option 3: Auf dem VPS via pnpm db:push

Falls Sie Zugriff auf den VPS haben und die `.env`-Datei korrekt gesetzt ist:

```bash
cd /var/www/learningflow
pnpm db:push
```

> **Hinweis:** `pnpm db:push` führt `drizzle-kit generate && drizzle-kit migrate` aus und synchronisiert das Schema mit der Datenbank. Da der Snapshot bereits korrekt ist, sollte nur die fehlende Spalte hinzugefügt werden.

---

## Verifikation nach dem Fix

Nach dem Ausführen des SQL-Befehls:

1. **Login testen:** `arton.ritter@aismarterflow.de` / `Manus§123*`
2. **Erwartetes Ergebnis:** Erfolgreicher Login, Weiterleitung zum Dashboard
3. **Falls weiterhin Fehler:** PM2-Logs prüfen: `pm2 logs learningflow`

---

## Präventionsmaßnahme

Zukünftig nach jeder Schema-Änderung:

```bash
# 1. Schema ändern in drizzle/schema.ts
# 2. Migration generieren UND ausführen:
pnpm db:push

# 3. Prüfen ob SQL-Datei generiert wurde:
ls -la drizzle/*.sql | tail -5

# 4. Sicherstellen dass die neue SQL-Datei committed wird:
git add drizzle/
git status
```

**Wichtig:** `drizzle-kit generate` erstellt die SQL-Datei, `drizzle-kit migrate` führt sie aus. Beide Schritte sind in `pnpm db:push` zusammengefasst.

---

## Warum ist dieser Fehler aufgetreten?

Die Spalte `forcePasswordChange` wurde direkt zum Schema hinzugefügt, ohne `pnpm db:push` auszuführen. Auf der Manus-Plattform (TiDB Cloud, Entwicklungsumgebung) wurde die Spalte möglicherweise manuell oder über einen anderen Mechanismus hinzugefügt. Auf dem frisch aufgesetzten VPS mit einer neuen Datenbank fehlt diese Spalte, da die SQL-Migration nie generiert wurde.
