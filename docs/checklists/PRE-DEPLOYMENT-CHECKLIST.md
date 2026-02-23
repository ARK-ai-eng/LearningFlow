# Pre-Deployment Checklist

**Zweck:** Sicherstellen dass alle kritischen Schritte vor einem Deployment durchgeführt wurden.

**Verwendung:** Vor jedem Production-Deployment durchgehen.

**Letzte Aktualisierung:** 17.02.2026

---

## ✅ Code-Qualität

- [ ] **Alle Tests bestehen**
  - `pnpm test` ausführen
  - Mindestens 80% Coverage
  - Keine skipped Tests

- [ ] **TypeScript-Fehler behoben**
  - `pnpm build` läuft ohne Fehler
  - Keine `@ts-ignore` ohne Kommentar

- [ ] **Linting bestanden**
  - `pnpm lint` ohne Fehler
  - Code-Style konsistent

- [ ] **Code Review durchgeführt**
  - Mindestens 1 Person hat Code reviewed
  - Alle Kommentare addressiert

---

## ✅ Datenbank

- [ ] **Schema-Änderungen dokumentiert**
  - Neue Spalten haben DEFAULT-Werte
  - Keine DROP TABLE ohne Backup
  - Migration-Script getestet

- [ ] **Backup erstellt**
  - Code-Backup (`update.sh` macht automatisch)
  - Datenbank-Backup (`update.sh` macht automatisch)
  - Backup-Location verifiziert

- [ ] **Migration getestet**
  - Migration auf Staging ausgeführt
  - Keine Fehler in Logs
  - Daten-Integrität geprüft

- [ ] **Indizes geprüft**
  - Neue Queries haben Indizes
  - Keine fehlenden Foreign-Key-Indizes

---

## ✅ Security

- [ ] **Secrets gesetzt**
  - Alle Environment Variables konfiguriert
  - Keine Secrets in Code/Git
  - JWT_SECRET rotiert (falls nötig)

- [ ] **Auth getestet**
  - Login funktioniert
  - Logout funktioniert
  - Protected Routes sind geschützt
  - Admin-Routes nur für Admins

- [ ] **Rate-Limiting aktiv**
  - Login-Endpoint hat Rate-Limit
  - API-Endpoints haben Rate-Limit

- [ ] **Security-Audit-Log aktiv**
  - Kritische Events werden geloggt
  - Logs sind lesbar

---

## ✅ Performance

- [ ] **N+1 Queries eliminiert**
  - Keine map(async) für DB-Queries
  - JOINs statt mehrere Queries

- [ ] **Indizes vorhanden**
  - WHERE-Spalten haben Indizes
  - JOIN-Spalten haben Indizes

- [ ] **Client-side Navigation**
  - Keine `window.location.href` für interne Links
  - `setLocation()` verwendet

- [ ] **Optimistic Updates**
  - Listen-Operationen haben Optimistic Updates
  - Rollback bei Fehler funktioniert

---

## ✅ UI/UX

- [ ] **Loading States**
  - Alle Daten-Fetching-Komponenten haben Skeletons
  - Keine Blocking-Loader

- [ ] **Error States**
  - Alle Queries haben Error-Handling
  - Fehlermeldungen sind verständlich

- [ ] **Empty States**
  - Leere Listen haben Empty-State
  - CTAs vorhanden

- [ ] **Responsive Design**
  - Mobile getestet (375px)
  - Tablet getestet (768px)
  - Desktop getestet (1920px)

---

## ✅ Browser-Tests

- [ ] **Kritische Flows getestet**
  - **Login:** SysAdmin, FirmenAdmin, User
  - **Navigation:** Alle Haupt-Routen erreichbar
  - **CRUD:** Mindestens eine Create/Read/Update/Delete-Operation

- [ ] **Regression-Tests**
  - Alte Features funktionieren noch
  - Keine neuen Bugs in bestehenden Features

- [ ] **Cross-Browser**
  - Chrome getestet
  - Firefox getestet (optional)
  - Safari getestet (optional)

---

## ✅ Deployment-Vorbereitung

- [ ] **Checkpoint erstellt**
  - `webdev_save_checkpoint` ausgeführt
  - Checkpoint-Message aussagekräftig

- [ ] **Rollback-Plan**
  - Vorherige Version-ID notiert
  - `rollback.sh` bereit

- [ ] **Staging-Test**
  - Deployment auf Staging erfolgreich
  - Alle Features auf Staging getestet

- [ ] **Downtime-Plan**
  - User informiert (falls Downtime)
  - Wartungsfenster geplant

---

## ✅ Dokumentation

- [ ] **Changelog aktualisiert**
  - Neue Features dokumentiert
  - Breaking Changes dokumentiert
  - Bug-Fixes dokumentiert

- [ ] **README aktualisiert**
  - Neue Dependencies dokumentiert
  - Neue Environment Variables dokumentiert

- [ ] **ADR erstellt** (falls nötig)
  - Architektonische Entscheidungen dokumentiert

- [ ] **Lesson-Learned** (falls Bugs gefixt)
  - Was war falsch
  - Warum war es falsch
  - Wie wurde es gelöst

---

## ✅ Post-Deployment

- [ ] **Health-Check**
  - `health-check.sh` ausführen
  - HTTP 200 Response
  - Datenbank-Verbindung OK

- [ ] **Smoke-Tests**
  - Login testen
  - Dashboard öffnen
  - Eine CRUD-Operation durchführen

- [ ] **Monitoring**
  - PM2-Status prüfen
  - Server-Logs prüfen
  - Error-Rate prüfen

- [ ] **User-Feedback**
  - User informieren über neue Features
  - Feedback-Kanal öffnen

---

## 🚨 Rollback-Trigger

**Sofort rollback wenn:**
- [ ] Health-Check schlägt fehl
- [ ] Login funktioniert nicht
- [ ] Kritische Features sind kaputt
- [ ] Datenbank-Migration fehlgeschlagen
- [ ] Error-Rate > 5%

**Rollback-Command:**
```bash
cd /var/www/learningflow
./scripts/rollback.sh
```

---

## 📚 Weiterführende Dokumentation

- `UPDATE-GUIDE.md` - Deployment-Prozess
- `../DO-DONT.md` - Do's & Don'ts
- `../CRITICAL-DATABASE-MIGRATION-RULES.md` - DB-Migration-Regeln

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 17.02.2026  
**Maintainer:** Development Team
