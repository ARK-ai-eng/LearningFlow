# Manus Onboarding – Kernregeln aus LearningFlow

**Erstellt:** 02.03.2026  
**Quelle:** 25 Sprints Entwicklung, LearningFlow (AISmarterFlow Academy)  
**Repository:** https://github.com/ARK-ai-eng/LearningFlow  
**Verwendung:** Dieses Dokument am Anfang eines neuen Manus-Tasks teilen, damit bekannte Fehler nicht wiederholt werden.

---

## 🔴 Kritische technische Regeln

### 1. MySQL / TiDB: `db.execute()` gibt `[rows, fields]` zurück

```ts
// ❌ Falsch – result ist [rows, fields], nicht rows
const rows = result as any[];

// ✅ Richtig – immer so extrahieren
const rows = Array.isArray(result[0]) ? result[0] : result;
const firstRow = (rows as any[])[0];
```

**Warum:** Drizzle ORM's `db.execute()` mit Raw-SQL gibt ein Tupel zurück. Wird das nicht berücksichtigt, sind alle Werte `undefined` oder `NaN` — führt zu "Invalid Date", "0 Fragen", falschen Prozentwerten.

---

### 2. Datenbank-Migrationen: NIEMALS `pnpm db:push` in Produktion ohne Backup

**Vorfall 14.02.2026:** `pnpm db:push` hat alle User-Daten gelöscht (38 User, 131 Fortschritts-Einträge) — trotz "Nein" bei der Truncate-Frage.

```bash
# Immer zuerst Backup:
mysqldump -h $HOST -u $USER -p$PASS $DB > backup_$(date +%Y%m%d_%H%M%S).sql

# Dann erst:
pnpm db:push
```

---

### 3. Tests: Immer `afterAll`-Cleanup — Tests laufen gegen Produktions-DB

```ts
// ✅ Pflicht in jedem Test der DB-Einträge erstellt
afterAll(async () => {
  if (testCourseId) await db.deleteCourse(testCourseId);
  if (testUserId) await db.deleteUser(testUserId);
});
```

**Warum:** Es gibt keine separate Test-DB. Ohne Cleanup entstehen bei jedem `pnpm test` neue Einträge in der Produktions-DB. TiDB AUTO_INCREMENT springt in 30.000er-Blöcken — nach 5 Testläufen haben IDs den Wert 150.000+.

---

### 4. Bash-Skripte: Niemals `source .env` oder String-Interpolation bei Passwörtern

```bash
# ❌ Falsch – bricht bei Sonderzeichen im Passwort
source .env
node -e "const u = new URL('$DATABASE_URL');"

# ✅ Richtig – als Env-Variable übergeben
DATABASE_URL="$DATABASE_URL" node -e "
  const u = new URL(process.env.DATABASE_URL);
  const sep = '\x1F';
  process.stdout.write(u.hostname + sep + u.password + '\n');
"
IFS=$'\x1F' read -r DB_HOST DB_PASS <<< "$DB_INFO"
```

---

### 5. Schema-Änderungen: Immer Migration generieren, nicht nur Schema editieren

Wenn `drizzle/schema.ts` geändert wird, muss `pnpm db:push` (oder `drizzle-kit generate && migrate`) ausgeführt werden. Ohne das fehlen Spalten in der DB → Login schlägt fehl mit "Failed query: column not found".

**Bekannter Fall:** `forcePasswordChange` wurde zum Schema hinzugefügt aber keine Migration generiert → alle Logins schlugen fehl.

---

## 🟡 VPS-Deployment (Ubuntu + MySQL 8 + PM2 + Nginx)

### Stack
- **OS:** Ubuntu 24.04 LTS
- **DB:** MySQL 8.0 (lokal) oder TiDB Cloud (MySQL-kompatibel)
- **Runtime:** Node.js 22, pnpm 9, PM2
- **Proxy:** Nginx

### Update-Prozess
```bash
cd /var/www/learningflow
./scripts/update.sh   # git pull + pnpm install + db:push + build + pm2 restart
```

### DATABASE_URL mit Sonderzeichen im Passwort
Sonderzeichen müssen URL-kodiert werden:
- `"` → `%22`
- `§` → `%C2%A7`  
- `@` → `%40`
- `#` → `%23`

```
DATABASE_URL=mysql://user:Passwort%22%C2%A7123@localhost:3306/dbname
```

### PM2 Befehle
```bash
pm2 status              # Status prüfen
pm2 logs learningflow   # Logs anzeigen
pm2 restart learningflow
pm2 save && pm2 startup # Autostart nach Reboot
```

---

## 🟡 tRPC + Drizzle Patterns (React 19 + Express 4)

### Rollen-System
```ts
// Verfügbare Procedures:
publicProcedure          // Jeder
protectedProcedure       // Eingeloggte User
companyAdminProcedure    // companyadmin + sysadmin
adminProcedure           // Nur sysadmin
```

**Häufiger Fehler:** Endpoint mit `adminProcedure` statt `companyAdminProcedure` → FirmenAdmin bekommt Fehler 10002 "You do not have required permission".

### Optimistic Updates
```ts
// Für Listen, Toggles, Profil-Edits: onMutate/onError/onSettled Pattern
// Für kritische Operationen (Auth, Zahlung): invalidate() in onSuccess
```

---

## 🟢 Was gut funktioniert hat

- **Drizzle ORM** mit MySQL: Sehr gut, aber Raw-SQL via `db.execute()` immer mit `[rows, fields]`-Extraktion
- **tRPC 11** End-to-End-Typsicherheit: Keine manuellen API-Typen nötig
- **Vitest** für Unit-Tests: Schnell, zuverlässig — aber immer `afterAll`-Cleanup
- **shadcn/ui + Tailwind 4**: Konsistentes Design-System, kaum Custom-CSS nötig
- **PM2 + Nginx**: Stabile Produktion, Autostart nach Reboot funktioniert

---

## 📁 Weiterführende Dokumentation

| Datei | Inhalt |
|---|---|
| `docs/DEPLOYMENT-VPS.md` | Vollständiger VPS-Setup-Guide |
| `docs/CRITICAL-DATABASE-MIGRATION-RULES.md` | Migrations-Regeln nach Datenverlust-Vorfall |
| `docs/patterns/CODE-PATTERNS.md` | Code-Patterns und Anti-Patterns |
| `docs/checklists/PRE-DEPLOYMENT-CHECKLIST.md` | Vor jedem Deployment prüfen |
| `docs/decisions/` | Architekturentscheidungen (ADRs) |
| `docs/lessons-learned/` | Alle Fehler und wie sie gelöst wurden |
