# Code-Review Checklist

**Zweck:** Sicherstellen dass Code-Reviews vollständig und konsistent sind.

**Verwendung:** Bei jedem Code-Review durchgehen.

**Letzte Aktualisierung:** 17.02.2026

---

## ✅ Code-Qualität

### Lesbarkeit

- [ ] **Code ist selbsterklärend**
  - Variablen-Namen sind aussagekräftig
  - Funktions-Namen beschreiben was sie tun
  - Keine Magic Numbers

- [ ] **Kommentare vorhanden** (wo nötig)
  - Komplexe Logik erklärt
  - WHY nicht WHAT kommentiert
  - TODOs markiert

- [ ] **Code-Struktur**
  - Funktionen sind kurz (< 50 Zeilen)
  - Keine tief verschachtelten Loops
  - DRY-Prinzip befolgt

### TypeScript

- [ ] **Keine TypeScript-Fehler**
  - `pnpm build` läuft ohne Fehler
  - Keine `@ts-ignore` ohne Kommentar
  - Keine `any` ohne Begründung

- [ ] **Types korrekt**
  - Input/Output-Types definiert
  - Zod-Schemas für Validation
  - Keine impliziten `any`

---

## ✅ Funktionalität

### Logik

- [ ] **Feature funktioniert**
  - Happy-Path getestet
  - Edge-Cases bedacht
  - Error-Handling vorhanden

- [ ] **Keine Bugs eingeführt**
  - Bestehende Features funktionieren noch
  - Keine Regression

### Tests

- [ ] **Tests vorhanden**
  - Unit-Tests für neue Funktionen
  - Mindestens 80% Coverage
  - Tests sind aussagekräftig

- [ ] **Tests bestehen**
  - `pnpm test` läuft durch
  - Keine skipped Tests
  - Keine flaky Tests

---

## ✅ Performance

### Datenbank

- [ ] **Keine N+1 Queries**
  - Kein map(async) für DB-Queries
  - JOINs statt mehrere Queries
  - Bulk-Operations statt Loops

- [ ] **Indizes vorhanden**
  - WHERE-Spalten haben Indizes
  - JOIN-Spalten haben Indizes
  - Composite-Indizes für Multi-Column-Queries

- [ ] **Transactions verwendet** (falls nötig)
  - Atomare Operationen in Transactions
  - Rollback bei Fehler

### Frontend

- [ ] **Optimistic Updates** (falls sinnvoll)
  - Listen-Operationen haben Optimistic Updates
  - Rollback bei Fehler

- [ ] **Client-side Navigation**
  - `setLocation()` statt `window.location.href`
  - Keine Full-Page-Reloads

- [ ] **Keine unnötigen Re-Renders**
  - Stabile Referenzen (useState, useMemo)
  - Keine neue Objekte/Arrays in Render

---

## ✅ Security

### Input-Validation

- [ ] **Backend-Validation**
  - Zod-Schemas für alle Inputs
  - Keine direkte User-Input-Verwendung
  - SQL-Injection-Schutz (Drizzle ORM)

- [ ] **Frontend-Validation**
  - react-hook-form + Zod
  - Fehlermeldungen verständlich

### Auth & Authorization

- [ ] **Auth-Checks vorhanden**
  - Protected Procedures für geschützte Endpoints
  - Admin-Procedures für Admin-Endpoints
  - Role-Checks korrekt

- [ ] **Keine Secrets im Code**
  - Environment Variables verwendet
  - Keine API-Keys hardcoded

---

## ✅ UI/UX

### States

- [ ] **Loading States**
  - Skeletons statt Spinner
  - Keine Blocking-Loader

- [ ] **Error States**
  - Fehlermeldungen verständlich
  - Retry-Button vorhanden

- [ ] **Empty States**
  - Icon + Text + CTA
  - Keine leeren Seiten

### Responsive

- [ ] **Mobile getestet** (375px)
  - Alle Elemente sichtbar
  - Touch-Targets groß genug

- [ ] **Tablet getestet** (768px)
  - Layout passt sich an

- [ ] **Desktop getestet** (1920px)
  - Keine zu breiten Elemente

### Accessibility

- [ ] **Keyboard-Navigation**
  - Alle interaktiven Elemente erreichbar
  - Focus-Rings sichtbar

- [ ] **ARIA-Labels** (falls nötig)
  - Icons haben Labels
  - Buttons haben aussagekräftige Labels

---

## ✅ Best Practices

### DO-DONT.md befolgt

- [ ] **Code-Patterns**
  - Datei lesen vor Edit
  - Browser-Test nach Checkpoint
  - TypeScript-Fehler ernst nehmen

- [ ] **Datenbank-Patterns**
  - Backup vor Migration
  - DEFAULT-Werte bei neuen Spalten
  - Soft-Delete statt Hard-Delete

- [ ] **Security-Patterns**
  - Password Hashing (bcrypt)
  - JWT mit kurzer Expiry
  - Rate-Limiting für Auth

- [ ] **Performance-Patterns**
  - JOIN statt map(async)
  - Indizes für häufige Queries
  - Optimistic Updates

### Patterns verwendet

- [ ] **Code-Patterns**
  - tRPC Procedures (Public/Protected/Admin)
  - Drizzle Queries (Select/JOIN/Transaction)
  - React Patterns (Optimistic Updates, Forms)

- [ ] **Keine Anti-Patterns**
  - Kein N+1
  - Keine nested `<a>` Tags
  - Keine leeren `Select.Item` values

---

## ✅ Dokumentation

### Code-Kommentare

- [ ] **Komplexe Logik erklärt**
  - WHY nicht WHAT
  - Algorithmen dokumentiert

- [ ] **TODOs markiert**
  - Mit Kontext
  - Mit Assignee (falls bekannt)

### Externe Dokumentation

- [ ] **README aktualisiert** (falls nötig)
  - Neue Dependencies
  - Neue Environment Variables

- [ ] **ADR erstellt** (falls nötig)
  - Architektonische Entscheidungen
  - Context + Decision + Consequences

- [ ] **Lesson-Learned** (falls Bugs gefixt)
  - Was war falsch
  - Warum war es falsch
  - Wie wurde es gelöst

---

## ✅ Git

### Commits

- [ ] **Commit-Messages aussagekräftig**
  - Präfix: feat/fix/docs/refactor/test
  - Kurze Beschreibung (< 50 Zeichen)
  - Längere Beschreibung (falls nötig)

- [ ] **Commits atomar**
  - Ein Commit = Eine logische Änderung
  - Keine "WIP" Commits

### Branches

- [ ] **Branch-Name aussagekräftig**
  - feature/feature-name
  - fix/bug-description
  - refactor/refactor-description

---

## 🚨 Blocker (MUST FIX)

**Code-Review ablehnen wenn:**

- [ ] TypeScript-Fehler vorhanden
- [ ] Tests schlagen fehl
- [ ] Keine Tests für neue Funktionen
- [ ] N+1 Queries vorhanden
- [ ] SQL-Injection-Risiko
- [ ] Secrets im Code
- [ ] Breaking Changes ohne Migration
- [ ] Keine Input-Validation

---

## ✅ Nice-to-Have (SHOULD FIX)

**Nicht blockierend, aber erwähnen:**

- [ ] Code könnte lesbarer sein
- [ ] Kommentare fehlen
- [ ] Performance könnte besser sein
- [ ] UI könnte schöner sein
- [ ] Tests könnten umfangreicher sein

---

## 📋 Review-Template

```markdown
## Code-Review: [Feature-Name]

### ✅ Positives
- Gut: [Was ist gut?]
- Gut: [Was ist gut?]

### 🔴 Blocker
- [ ] Blocker 1: [Beschreibung + Lösung]
- [ ] Blocker 2: [Beschreibung + Lösung]

### ⚠️ Nice-to-Have
- [ ] Verbesserung 1: [Beschreibung]
- [ ] Verbesserung 2: [Beschreibung]

### 💬 Fragen
- Frage 1: [Warum wurde X so gemacht?]
- Frage 2: [Könnte man Y nicht besser machen?]

### 📚 Learnings
- Learning 1: [Was habe ich gelernt?]
- Learning 2: [Was könnte dokumentiert werden?]

### ✅ Approval
- [ ] Approved (nach Blocker-Fixes)
- [ ] Approved with Comments (Nice-to-Haves)
- [ ] Changes Requested (Blocker vorhanden)
```

---

## 📚 Weiterführende Dokumentation

- `../DO-DONT.md` - Do's & Don'ts
- `../patterns/CODE-PATTERNS.md` - Wiederverwendbare Patterns
- `FEATURE-DEVELOPMENT-CHECKLIST.md` - Feature-Development

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 17.02.2026  
**Maintainer:** Development Team
