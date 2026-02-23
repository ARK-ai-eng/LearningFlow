# Feature-Development Checklist

**Zweck:** Sicherstellen dass neue Features vollständig und korrekt implementiert werden.

**Verwendung:** Bei jedem neuen Feature durchgehen.

**Letzte Aktualisierung:** 17.02.2026

---

## ✅ Phase 1: Planning

- [ ] **Feature-Beschreibung**
  - User-Story geschrieben
  - Akzeptanzkriterien definiert
  - Mockups/Wireframes erstellt (optional)

- [ ] **Technische Planung**
  - Datenmodell skizziert
  - API-Endpoints definiert
  - UI-Komponenten identifiziert

- [ ] **Dependencies geprüft**
  - Welche Features hängen davon ab?
  - Welche Features müssen vorher fertig sein?

- [ ] **Risiken identifiziert**
  - Breaking Changes?
  - Performance-Impact?
  - Security-Risiken?

---

## ✅ Phase 2: Backend

### Datenbank

- [ ] **Schema aktualisiert**
  - Neue Tabellen in `drizzle/schema.ts`
  - Spalten haben DEFAULT-Werte (falls NOT NULL)
  - Indizes für häufige Queries

- [ ] **Migration erstellt**
  - `pnpm db:push` ausgeführt
  - Migration-File geprüft
  - Keine gefährlichen Statements (DROP, TRUNCATE)

- [ ] **DB-Funktionen erstellt**
  - Query-Helpers in `server/db.ts`
  - Type-Safe mit Drizzle
  - Keine N+1 Queries

### API

- [ ] **tRPC Procedures erstellt**
  - Input-Validation mit Zod
  - Protected vs Public entschieden
  - Error-Handling implementiert

- [ ] **Business-Logik**
  - In `server/db.ts` oder separaten Files
  - Wiederverwendbar
  - Gut getestet

---

## ✅ Phase 3: Frontend

### UI-Komponenten

- [ ] **Komponenten erstellt**
  - shadcn/ui Komponenten verwendet
  - Tailwind für Styling
  - Responsive Design

- [ ] **tRPC Hooks verwendet**
  - `useQuery` für Daten-Fetching
  - `useMutation` für Änderungen
  - Optimistic Updates (falls sinnvoll)

- [ ] **States implementiert**
  - Loading State (Skeleton)
  - Error State (Fehlermeldung + Retry)
  - Empty State (Icon + Text + CTA)

### Navigation

- [ ] **Route registriert**
  - In `client/src/App.tsx`
  - Protected vs Public
  - Breadcrumbs/Back-Button

- [ ] **Navigation-Links**
  - Sidebar/Header aktualisiert
  - Client-side Navigation (`setLocation`)

---

## ✅ Phase 4: Testing

### Unit-Tests

- [ ] **Backend-Tests**
  - DB-Funktionen getestet
  - tRPC Procedures getestet
  - Edge-Cases abgedeckt

- [ ] **Test-Coverage**
  - Mindestens 80%
  - Kritische Pfade 100%

### Browser-Tests

- [ ] **Happy-Path getestet**
  - Feature funktioniert wie erwartet
  - Alle UI-Elemente sichtbar

- [ ] **Error-Cases getestet**
  - Fehler werden korrekt angezeigt
  - Retry funktioniert

- [ ] **Responsive getestet**
  - Mobile (375px)
  - Tablet (768px)
  - Desktop (1920px)

---

## ✅ Phase 5: Code-Review

- [ ] **Code-Qualität**
  - Keine TypeScript-Fehler
  - Keine Linting-Fehler
  - Code ist lesbar

- [ ] **Best Practices**
  - DO-DONT.md befolgt
  - Patterns verwendet
  - Keine Anti-Patterns

- [ ] **Performance**
  - Keine N+1 Queries
  - Indizes vorhanden
  - Optimistic Updates (falls sinnvoll)

- [ ] **Security**
  - Input-Validation
  - Auth-Checks
  - Keine SQL-Injection

---

## ✅ Phase 6: Dokumentation

- [ ] **Code-Kommentare**
  - Komplexe Logik erklärt
  - TODOs markiert

- [ ] **Dokumentation aktualisiert**
  - README aktualisiert (falls nötig)
  - ADR erstellt (falls architektonische Entscheidung)
  - Pattern dokumentiert (falls wiederverwendbar)

- [ ] **todo.md aktualisiert**
  - Feature als [x] markiert
  - Neue TODOs hinzugefügt

---

## ✅ Phase 7: Deployment

- [ ] **Staging-Test**
  - Feature auf Staging deployed
  - Smoke-Test durchgeführt

- [ ] **Checkpoint erstellt**
  - `webdev_save_checkpoint`
  - Aussagekräftige Message

- [ ] **Production-Deployment**
  - `update.sh` ausgeführt
  - Health-Check bestanden
  - Smoke-Test durchgeführt

---

## 📋 Feature-Template

```markdown
## Feature: [Name]

### User-Story
Als [Rolle] möchte ich [Aktion], damit [Nutzen].

### Akzeptanzkriterien
- [ ] Kriterium 1
- [ ] Kriterium 2
- [ ] Kriterium 3

### Technische Details
**Datenmodell:**
- Tabelle: `feature_table`
- Spalten: `id`, `userId`, `data`, `createdAt`

**API-Endpoints:**
- `feature.create` - Erstellt neues Feature
- `feature.list` - Listet alle Features
- `feature.update` - Aktualisiert Feature
- `feature.delete` - Löscht Feature

**UI-Komponenten:**
- `FeatureList.tsx` - Liste aller Features
- `FeatureEditor.tsx` - Feature erstellen/bearbeiten
- `FeatureCard.tsx` - Feature-Vorschau

### Risiken
- [ ] Breaking Change: Nein
- [ ] Performance-Impact: Niedrig
- [ ] Security-Risiko: Niedrig

### Tests
- [ ] Unit-Tests: 5 Tests
- [ ] Browser-Tests: Happy-Path + Error-Cases
- [ ] Responsive: Mobile/Tablet/Desktop

### Deployment
- [ ] Staging: ✅ Getestet
- [ ] Production: ⏳ Pending
```

---

## 📚 Weiterführende Dokumentation

- `../DO-DONT.md` - Do's & Don'ts
- `../patterns/CODE-PATTERNS.md` - Wiederverwendbare Patterns
- `PRE-DEPLOYMENT-CHECKLIST.md` - Deployment-Checklist

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 17.02.2026  
**Maintainer:** Development Team
