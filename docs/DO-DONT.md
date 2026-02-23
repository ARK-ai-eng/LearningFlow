# LearningFlow - Do's & Don'ts

**Zweck:** Zentrale Sammlung aller wichtigen Do's & Don'ts aus 22 Sprints Entwicklung. Diese Regeln verhindern häufige Fehler und beschleunigen die Entwicklung.

**Quellen:** Konsolidiert aus allen Lesson-Learned-Dokumenten, ADRs und Sprint-Dokumentationen.

**Letzte Aktualisierung:** 17.02.2026

---

## 🔴 Code & Development

### ❌ DON'T

**1. Niemals Dateien editieren ohne sie vorher zu lesen**
- **Warum:** Du weißt nicht was du überschreibst
- **Beispiel:** Admin-Kurs-Route wurde versehentlich von `/admin/courses/:id` zu `/admin/kurse/:id/edit` geändert
- **Quelle:** `LESSON-LEARNED-ROUTE-BUG-2026-02-17.md`

**2. Niemals `db.execute()` ohne `[0]` verwenden**
- **Warum:** `db.execute()` gibt `[rows, fields]` Tuple zurück, nicht `rows` direkt
- **Beispiel:** `const result = await db.execute(sql)` → `result` ist Array, nicht Rows!
- **Fix:** `const [rows] = await db.execute(sql)` oder `const result = await db.execute(sql); const rows = result[0];`
- **Quelle:** `LESSON-LEARNED-DB-EXECUTE-BUG-2026-02-17.md`

**3. Niemals setState/Navigation in Render-Phase**
- **Warum:** React-Fehler "Cannot update a component while rendering"
- **Fix:** Wrap in `useEffect(() => { setLocation('/path') }, [])`
- **Quelle:** Sprint 3 Bugfixes

**4. Niemals neue Objekte/Arrays in Render als Query-Input**
- **Warum:** Neue Referenz bei jedem Render → Infinite Loop
- **Beispiel:** `useQuery({ date: new Date() })` ❌
- **Fix:** `const [date] = useState(() => new Date()); useQuery({ date })` ✅
- **Quelle:** Template README - Common Pitfalls

**5. Niemals Checkpoints ohne Browser-Test**
- **Warum:** Bugs werden erst beim User sichtbar
- **Fix:** Mindestens 3 kritische Flows testen (Login, Navigation, CRUD)
- **Quelle:** `LESSON-LEARNED-ROUTE-BUG-2026-02-17.md`

**6. Niemals blind imports fixen**
- **Warum:** Funktion existiert vielleicht gar nicht
- **Fix:** Erst prüfen ob Funktion existiert, dann Import
- **Quelle:** Security-Audit-Log Session

**7. Niemals doppeltes Mapping**
- **Warum:** Performance-Killer + unnötige Komplexität
- **Beispiel:** `rows.map(...).map(...)` ❌
- **Fix:** Alles in einem `map()` machen ✅
- **Quelle:** Dashboard-Bug-Fix Session

**8. Niemals File-Bytes in Datenbank speichern**
- **Warum:** DB-Bloat + langsame Queries
- **Fix:** S3 für Files, DB nur für Metadaten (URL, Mime-Type, Size)
- **Quelle:** Template README - Common Pitfalls

**9. Niemals nested `<a>` Tags**
- **Warum:** HTML-Fehler + Runtime-Errors
- **Beispiel:** `<Link><a>...</a></Link>` ❌
- **Fix:** `<Link>...</Link>` ✅ (Link rendert bereits `<a>`)
- **Quelle:** Template README - Common Pitfalls

**10. Niemals leere `Select.Item` values**
- **Warum:** React-Fehler
- **Fix:** Jedes `<Select.Item>` muss non-empty `value` haben
- **Quelle:** Template README - Common Pitfalls

---

### ✅ DO

**1. Immer Datei lesen vor Edit**
- **Warum:** Du musst wissen was du änderst
- **Workflow:** Read → Understand → Edit
- **Quelle:** `LESSON-LEARNED-ROUTE-BUG-2026-02-17.md`

**2. Immer Browser-Test nach Checkpoint**
- **Warum:** Regression-Bugs früh erkennen
- **Minimum:** Login, Navigation, eine CRUD-Operation
- **Quelle:** `LESSON-LEARNED-ROUTE-BUG-2026-02-17.md`

**3. Immer TypeScript-Fehler ernst nehmen**
- **Warum:** Sie zeigen echte Probleme
- **Fix:** Erst verstehen, dann fixen (nicht blind `@ts-ignore`)
- **Quelle:** Security-Audit-Log Session

**4. Immer Drizzle-Queries mit Drizzle-ORM**
- **Warum:** Type-Safety + weniger Fehler
- **Nur Raw-SQL wenn:** Performance-kritisch oder komplexe Joins
- **Quelle:** `LESSON-LEARNED-DB-EXECUTE-BUG-2026-02-17.md`

**5. Immer Debug-Logging bei DB-Problemen**
- **Warum:** Schnellere Fehlersuche
- **Beispiel:** `console.log('Raw result:', result); console.log('Transformed:', transformed);`
- **Quelle:** `LESSON-LEARNED-DB-EXECUTE-BUG-2026-02-17.md`

**6. Immer Unit-Tests für DB-Funktionen**
- **Warum:** DB-Bugs sind teuer
- **Minimum:** Happy Path + Edge Cases
- **Quelle:** `LESSON-LEARNED-DB-EXECUTE-BUG-2026-02-17.md`

**7. Immer Referenzen stabilisieren in React**
- **Warum:** Verhindert Infinite Loops
- **Tools:** `useState`, `useMemo`, `useCallback`
- **Quelle:** Template README - Common Pitfalls

**8. Immer S3 für File-Storage**
- **Warum:** Skalierbar + performant
- **Pattern:** DB = Metadaten, S3 = Bytes
- **Quelle:** Template README - File Storage

**9. Immer Semantic Colors mit Foreground pairen**
- **Warum:** Verhindert unsichtbaren Text
- **Beispiel:** `bg-card text-card-foreground` ✅
- **Quelle:** Template README - Common Pitfalls

**10. Immer Optimistic Updates für UX**
- **Wann:** Lists, Toggles, Profile-Edits
- **Pattern:** `onMutate` → update cache, `onError` → rollback
- **Quelle:** Template README - Frontend Guidelines

---

## 🔴 Datenbank

### ❌ DON'T

**1. Niemals DROP TABLE in Produktion**
- **Warum:** Datenverlust!
- **Ausnahme:** Nur mit Backup + Rollback-Plan
- **Quelle:** `CRITICAL-DATABASE-MIGRATION-RULES.md`

**2. Niemals NOT NULL ohne DEFAULT**
- **Warum:** Bestehende Rows brechen
- **Fix:** Immer DEFAULT-Wert setzen bei neuen Spalten
- **Quelle:** `CRITICAL-DATABASE-MIGRATION-RULES.md`, UPDATE-GUIDE.md

**3. Niemals TRUNCATE ohne Backup**
- **Warum:** Unwiderruflicher Datenverlust
- **Fix:** Backup → Truncate → Verify
- **Quelle:** `CRITICAL-DATABASE-MIGRATION-RULES.md`

**4. Niemals DELETE FROM ... WHERE 1=1**
- **Warum:** Löscht ALLE Rows!
- **Fix:** Immer spezifische WHERE-Clause
- **Quelle:** UPDATE-GUIDE.md

**5. Niemals Schema-Änderungen ohne Migration**
- **Warum:** Produktion bricht
- **Fix:** `pnpm db:push` nach Schema-Änderung
- **Quelle:** UPDATE-GUIDE.md

**6. Niemals Foreign Keys ohne Index**
- **Warum:** Performance-Killer bei Joins
- **Fix:** Index auf Foreign-Key-Spalten
- **Quelle:** `PHASE-2-INDEX-ANALYSIS-2026-02-16.md`

**7. Niemals N+1 Queries**
- **Warum:** 340 Queries statt 4 = 100× langsamer
- **Fix:** JOIN-basierte Aggregationen
- **Quelle:** `PHASE-1-N+1-ELIMINATION-RESULTS.md`

**8. Niemals map(async) für DB-Queries**
- **Warum:** N+1 Problem
- **Fix:** Bulk-Query mit IN-Clause oder JOIN
- **Quelle:** `PHASE-1-N+1-ELIMINATION-RESULTS.md`

---

### ✅ DO

**1. Immer Backup vor Migration**
- **Warum:** Rollback-Option
- **Tools:** `mysqldump`, `update.sh` (automatisch)
- **Quelle:** UPDATE-GUIDE.md

**2. Immer DEFAULT-Werte bei neuen Spalten**
- **Warum:** Bestehende Rows funktionieren weiter
- **Beispiel:** `phoneNumber: text('phone_number').default('')`
- **Quelle:** `CRITICAL-DATABASE-MIGRATION-RULES.md`

**3. Immer Soft-Delete statt Hard-Delete**
- **Warum:** Daten-Wiederherstellung möglich
- **Pattern:** `deletedAt` Timestamp-Spalte
- **Quelle:** `ADR-011-Soft-Delete.md`

**4. Immer Indizes für häufige Queries**
- **Wann:** WHERE, JOIN, ORDER BY Spalten
- **Beispiel:** `idx_user_company (userId, companyId)`
- **Quelle:** `PHASE-2-INDIZES-RESULTS-2026-02-16.md`

**5. Immer Transactions für atomare Operationen**
- **Wann:** Mehrere abhängige DB-Operationen
- **Beispiel:** Exam + Certificate Erstellung
- **Quelle:** `PHASE-3-TRANSACTIONS-RESULTS-2026-02-16.md`

**6. Immer Staging-Test vor Produktion**
- **Warum:** Bugs früh erkennen
- **Workflow:** Dev → Staging → Production
- **Quelle:** UPDATE-GUIDE.md

**7. Immer Migration-Script für Breaking Changes**
- **Warum:** Alte Daten migrieren
- **Beispiel:** `3/5 richtig` → `60%` Fortschritt
- **Quelle:** `ADR-015-Migration-Strategie.md`

**8. Immer Composite-Indizes für Multi-Tenancy**
- **Warum:** Performance bei firmen-spezifischen Queries
- **Beispiel:** `idx_company_user (companyId, userId)`
- **Quelle:** `PHASE-2-INDEX-ANALYSIS-2026-02-16.md`

---

## 🔴 Security

### ❌ DON'T

**1. Niemals Passwörter im Klartext speichern**
- **Warum:** Security-Desaster
- **Fix:** bcrypt mit SALT_ROUNDS >= 10
- **Quelle:** `SECURITY-HARDENING-2026-02-16.md`

**2. Niemals JWT-Secrets hardcoden**
- **Warum:** Kompromittierung
- **Fix:** Environment Variables
- **Quelle:** `SECURITY-HARDENING-2026-02-16.md`

**3. Niemals unbegrenzte Login-Versuche**
- **Warum:** Brute-Force-Attacken
- **Fix:** Rate-Limiting (5 Versuche / 15 Min)
- **Quelle:** `SECURITY-HARDENING-2026-02-16.md`

**4. Niemals Admin-Endpoints ohne Auth**
- **Warum:** Unauthorized Access
- **Fix:** `adminProcedure` mit Role-Check
- **Quelle:** Template README - RBAC

**5. Niemals User-Input direkt in SQL**
- **Warum:** SQL-Injection
- **Fix:** Prepared Statements / Drizzle-ORM
- **Quelle:** Security Best Practices

---

### ✅ DO

**1. Immer JWT mit kurzer Expiry**
- **Warum:** Minimiert Schaden bei Kompromittierung
- **Empfehlung:** 24h für Web-Apps
- **Quelle:** `SECURITY-HARDENING-2026-02-16.md`

**2. Immer forcePasswordChange für neue User**
- **Warum:** Admin-generierte Passwörter sind unsicher
- **Pattern:** Flag in DB, Redirect bei Login
- **Quelle:** `SECURITY-HARDENING-2026-02-16.md`

**3. Immer Security-Audit-Log für kritische Events**
- **Was loggen:** Login, Passwort-Änderung, Admin-Actions
- **Retention:** 90 Tage (DSGVO)
- **Quelle:** `SECURITY-AUDIT-LOG-2026-02-16.md`

**4. Immer Rate-Limiting für Auth-Endpoints**
- **Warum:** Verhindert Brute-Force
- **Empfehlung:** 5 Versuche / 15 Min
- **Quelle:** `SECURITY-HARDENING-2026-02-16.md`

**5. Immer Role-Based Access Control (RBAC)**
- **Pattern:** `ctx.user.role` in Procedures
- **Rollen:** admin, user
- **Quelle:** Template README - RBAC

---

## 🔴 Performance

### ❌ DON'T

**1. Niemals map(async) für DB-Queries**
- **Warum:** N+1 Problem (340 Queries!)
- **Fix:** JOIN oder Bulk-Query
- **Quelle:** `PHASE-1-N+1-ELIMINATION-RESULTS.md`

**2. Niemals bcrypt SALT_ROUNDS > 12**
- **Warum:** Login dauert > 1s
- **Empfehlung:** 10-12 (Balance Security/Performance)
- **Quelle:** `PERFORMANCE-RESULTS-2026-02-15.md`

**3. Niemals window.location.href für Navigation**
- **Warum:** Full Page Reload
- **Fix:** `setLocation()` (Client-side Navigation)
- **Quelle:** `PERFORMANCE-RESULTS-2026-02-15.md`

**4. Niemals Queries ohne Indizes**
- **Warum:** Full Table Scan
- **Fix:** Index auf WHERE/JOIN-Spalten
- **Quelle:** `PHASE-2-INDIZES-RESULTS-2026-02-16.md`

**5. Niemals SELECT * in Produktion**
- **Warum:** Unnötige Daten übertragen
- **Fix:** Nur benötigte Spalten selektieren
- **Quelle:** Performance Best Practices

---

### ✅ DO

**1. Immer JOIN statt map(async)**
- **Warum:** 94% weniger Queries
- **Beispiel:** `SELECT ... FROM courses c LEFT JOIN progress p ON ...`
- **Quelle:** `PHASE-1-N+1-ELIMINATION-RESULTS.md`

**2. Immer Indizes für häufige Queries**
- **Wann:** WHERE, JOIN, ORDER BY
- **Impact:** P95 von 7000ms → 150ms
- **Quelle:** `PHASE-2-INDIZES-RESULTS-2026-02-16.md`

**3. Immer Transactions für atomare Operationen**
- **Warum:** Konsistenz + Performance
- **Beispiel:** Exam + Certificate in einer Transaction
- **Quelle:** `PHASE-3-TRANSACTIONS-RESULTS-2026-02-16.md`

**4. Immer Client-side Navigation**
- **Warum:** Schneller + bessere UX
- **Tool:** `setLocation()` statt `window.location.href`
- **Quelle:** `PERFORMANCE-RESULTS-2026-02-15.md`

**5. Immer Optimistic Updates für UX**
- **Warum:** Instant Feedback
- **Pattern:** Update Cache → API Call → Rollback on Error
- **Quelle:** Template README - Frontend Guidelines

**6. Immer Composite-Indizes für Multi-Column-Queries**
- **Warum:** Schneller als mehrere Single-Column-Indizes
- **Beispiel:** `idx_company_user (companyId, userId)`
- **Quelle:** `PHASE-2-INDEX-ANALYSIS-2026-02-16.md`

---

## 🔴 Deployment

### ❌ DON'T

**1. Niemals direkt auf Produktion pushen**
- **Warum:** Keine Rollback-Option
- **Fix:** Staging → Production Workflow
- **Quelle:** UPDATE-GUIDE.md

**2. Niemals Deployment ohne Backup**
- **Warum:** Datenverlust bei Fehler
- **Fix:** `update.sh` macht automatisch Backup
- **Quelle:** UPDATE-GUIDE.md

**3. Niemals Migration ohne Review**
- **Warum:** Gefährliche SQL-Statements
- **Fix:** `update.sh` zeigt Migration-Content + Bestätigung
- **Quelle:** UPDATE-GUIDE.md

**4. Niemals git reset --hard in Produktion**
- **Warum:** Verlust von lokalen Änderungen
- **Fix:** `rollback.sh` statt git reset
- **Quelle:** UPDATE-GUIDE.md

**5. Niemals Deployment ohne Health-Check**
- **Warum:** Broken Deployment unbemerkt
- **Fix:** `health-check.sh` nach Deployment
- **Quelle:** UPDATE-GUIDE.md

---

### ✅ DO

**1. Immer Backup vor Deployment**
- **Warum:** Rollback-Option
- **Tools:** `update.sh` (automatisch)
- **Quelle:** UPDATE-GUIDE.md

**2. Immer Staging-Test**
- **Warum:** Bugs früh erkennen
- **Workflow:** Dev → Staging → Production
- **Quelle:** UPDATE-GUIDE.md

**3. Immer Rollback-Plan**
- **Warum:** Schnelle Recovery bei Fehler
- **Tool:** `rollback.sh`
- **Quelle:** UPDATE-GUIDE.md

**4. Immer Health-Check nach Deployment**
- **Warum:** Verifikation
- **Tool:** `health-check.sh`
- **Quelle:** UPDATE-GUIDE.md

**5. Immer Checkpoint vor riskanten Änderungen**
- **Warum:** Einfacher Rollback
- **Wann:** Refactoring, Schema-Änderungen, Breaking Changes
- **Quelle:** Template README - Workflow

**6. Immer Deployment-Scripts verwenden**
- **Warum:** Konsistenz + weniger Fehler
- **Tools:** `update.sh`, `rollback.sh`, `health-check.sh`
- **Quelle:** UPDATE-GUIDE.md

---

## 🔴 UI/UX

### ❌ DON'T

**1. Niemals Navigation-Dead-Ends**
- **Warum:** User kann nicht zurück
- **Fix:** Immer Back-Button oder Sidebar-Navigation
- **Quelle:** Template README - Common Pitfalls

**2. Niemals unsichtbarer Text**
- **Warum:** Theme/Color-Mismatch
- **Fix:** `bg-card text-card-foreground` (immer pairen!)
- **Quelle:** Template README - Common Pitfalls

**3. Niemals Blocking-Loader für ganze Seite**
- **Warum:** Schlechte UX
- **Fix:** Component-Level Skeletons
- **Quelle:** Template README - Frontend Guidelines

**4. Niemals generische Fehlermeldungen**
- **Warum:** User weiß nicht was zu tun ist
- **Fix:** Spezifische Fehler + Lösungsvorschlag
- **Quelle:** UX Best Practices

**5. Niemals Placeholder-Features ohne Toast**
- **Warum:** User denkt es ist kaputt
- **Fix:** "Feature coming soon" Toast bei Klick
- **Quelle:** Template README - Frontend Guidelines

---

### ✅ DO

**1. Immer Loading-States**
- **Warum:** User weiß dass etwas passiert
- **Tools:** Skeletons, Spinners
- **Quelle:** Template README - Frontend Guidelines

**2. Immer Error-States**
- **Warum:** User weiß was schiefging
- **Pattern:** Error-Boundary + Retry-Button
- **Quelle:** Template README - Frontend Guidelines

**3. Immer Empty-States**
- **Warum:** Bessere UX als leere Seite
- **Pattern:** Icon + Text + CTA
- **Quelle:** Template README - Frontend Guidelines

**4. Immer Optimistic Updates**
- **Warum:** Instant Feedback
- **Wann:** Lists, Toggles, Profile-Edits
- **Quelle:** Template README - Frontend Guidelines

**5. Immer Responsive Design**
- **Warum:** Mobile-First
- **Tools:** Tailwind Breakpoints
- **Quelle:** `FINAL-RESPONSIVE-ANALYSIS-2026-02-15.md`

**6. Immer Accessible**
- **Warum:** WCAG-Compliance
- **Minimum:** Keyboard-Navigation, Focus-Rings, ARIA-Labels
- **Quelle:** Template README - Frontend Guidelines

---

## 🔴 Testing

### ❌ DON'T

**1. Niemals Checkpoint ohne Test**
- **Warum:** Regression-Bugs
- **Minimum:** 3 kritische Flows
- **Quelle:** `LESSON-LEARNED-ROUTE-BUG-2026-02-17.md`

**2. Niemals nur Happy-Path testen**
- **Warum:** Edge-Cases brechen
- **Fix:** Auch Error-Cases testen
- **Quelle:** Testing Best Practices

**3. Niemals Tests skippen wegen Zeitdruck**
- **Warum:** Bugs kosten mehr Zeit später
- **Fix:** Mindestens Smoke-Tests
- **Quelle:** `LESSON-LEARNED-ROUTE-BUG-2026-02-17.md`

---

### ✅ DO

**1. Immer Unit-Tests für DB-Funktionen**
- **Warum:** DB-Bugs sind teuer
- **Tools:** Vitest
- **Quelle:** `LESSON-LEARNED-DB-EXECUTE-BUG-2026-02-17.md`

**2. Immer Browser-Tests nach Checkpoint**
- **Warum:** Regression-Bugs früh erkennen
- **Minimum:** Login, Navigation, CRUD
- **Quelle:** `LESSON-LEARNED-ROUTE-BUG-2026-02-17.md`

**3. Immer Integration-Tests für kritische Flows**
- **Warum:** End-to-End-Verifikation
- **Beispiel:** User-Registration → Login → Course-Start
- **Quelle:** Testing Best Practices

**4. Immer Test-Coverage > 80%**
- **Warum:** Confidence in Code
- **Tools:** Vitest Coverage
- **Quelle:** Testing Best Practices

---

## 🔴 Dokumentation

### ❌ DON'T

**1. Niemals Code ohne Dokumentation**
- **Warum:** Niemand versteht es später
- **Minimum:** README + Inline-Comments
- **Quelle:** Knowledge Management System

**2. Niemals Fehler ohne Lesson-Learned**
- **Warum:** Gleicher Fehler passiert wieder
- **Fix:** `docs/lessons-learned/*.md`
- **Quelle:** `LESSON-LEARNED-*.md` Dokumente

**3. Niemals Breaking Changes ohne ADR**
- **Warum:** Kontext geht verloren
- **Fix:** `docs/decisions/ADR-*.md`
- **Quelle:** ADR-Verzeichnis

---

### ✅ DO

**1. Immer ADR für architektonische Entscheidungen**
- **Warum:** Kontext + Konsequenzen dokumentieren
- **Template:** Context → Decision → Consequences
- **Quelle:** `docs/decisions/README.md`

**2. Immer Lesson-Learned nach Fehler**
- **Warum:** Verhindert Wiederholung
- **Template:** Was war falsch → Warum → Wie gelöst
- **Quelle:** `docs/lessons-learned/README.md`

**3. Immer Sprint-Dokumentation**
- **Warum:** Nachvollziehbarkeit
- **Inhalt:** Features, Bugs, Learnings
- **Quelle:** `docs/sprints/README.md`

**4. Immer README in jedem Verzeichnis**
- **Warum:** Schneller Überblick
- **Inhalt:** Zweck, Struktur, Verwendung
- **Quelle:** Knowledge Management System

**5. Immer Changelog führen**
- **Warum:** Versions-Historie
- **Format:** Version → Changes → Breaking Changes
- **Quelle:** UPDATE-GUIDE.md

---

## 📚 Weiterführende Dokumentation

### Lesson-Learned Dokumente
- `docs/LESSON-LEARNED-ROUTE-BUG-2026-02-17.md` - Admin-Kurs-Route Bug
- `docs/LESSON-LEARNED-DB-EXECUTE-BUG-2026-02-17.md` - Dashboard db.execute() Bug
- `docs/lessons-learned/*.md` - Alle weiteren Learnings

### ADRs (Architecture Decision Records)
- `docs/decisions/ADR-015-Course-Based-Quiz.md`
- `docs/decisions/ADR-016-database-migration-incident.md`
- `docs/decisions/ADR-017-mandantenfaehigkeit-multi-portal.md`
- `docs/decisions/ADR-018-kurs-wiederholung-zwei-features.md`

### Performance-Dokumentation
- `docs/PERFORMANCE-RELIABILITY-ANALYSIS-2026-02-15.md`
- `docs/PHASE-1-N+1-ELIMINATION-RESULTS.md`
- `docs/PHASE-2-INDIZES-RESULTS-2026-02-16.md`
- `docs/PHASE-3-TRANSACTIONS-RESULTS-2026-02-16.md`

### Security-Dokumentation
- `docs/SECURITY-HARDENING-2026-02-16.md`
- `docs/SECURITY-AUDIT-LOG-2026-02-16.md`

### Deployment-Dokumentation
- `docs/UPDATE-GUIDE.md`
- `docs/CRITICAL-DATABASE-MIGRATION-RULES.md`
- `scripts/README.md`

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 17.02.2026  
**Autor:** Konsolidiert aus 22 Sprints Entwicklung  
**Maintainer:** Development Team
