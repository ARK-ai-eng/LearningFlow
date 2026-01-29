# Fehler-Katalog & Lessons Learned

## Übersicht

Dieses Verzeichnis dokumentiert **Fehler, die passiert sind**, ihre **Root Causes**, **Lösungen** und **wie sie hätten verhindert werden können**.

**Zweck**: Zukünftige Entwickler vermeiden die gleichen Fehler.

---

## Index

| Fehler | Kategorie | Datum | Severity | Status |
|--------|-----------|-------|----------|--------|
| [FEHLER-001](#fehler-001-datenbank-query-fehler) | Datenbank | 28.01.2026 | 🔴 Kritisch | ✅ Behoben |
| [FEHLER-002](#fehler-002-button-label-verwirrung) | UX/UI | 27.01.2026 | 🟡 Mittel | ✅ Behoben |
| [FEHLER-003](#fehler-003-flex-overflow-bug) | CSS/Layout | 25.01.2026 | 🟡 Mittel | ✅ Behoben |
| [FEHLER-004](#fehler-004-responsive-design-fehler) | Responsive | 24.01.2026 | 🟡 Mittel | ✅ Behoben |
| [FEHLER-005](#fehler-005-datenbank-initialisierung) | Setup | 22.01.2026 | 🔴 Kritisch | ✅ Behoben |

---

## FEHLER-001: Datenbank Query Fehler

**Titel**: "Failed query" Fehler trotz existierender Daten

**Datum**: 28.01.2026  
**Severity**: 🔴 Kritisch  
**Status**: ✅ Behoben  
**Betroffene Komponente**: Login, User-Abfragen

### Symptom

```
Error: Failed query: select `id`, `email`, `passwordHash` from `users` where `users`.`email` = ?
params: arton.ritter@aismarterflow.de
```

- Benutzer existiert in Datenbank
- Query schlägt trotzdem fehl
- Login funktioniert nicht

### Root Cause Analysis

**Ursache**: Drizzle ORM wurde mit Direct URL initialisiert, nicht mit mysql2 Pool.

```typescript
// ❌ FALSCH
export const db = drizzle(process.env.DATABASE_URL);
```

**Warum das falsch ist**:
- mysql2 braucht einen Connection Pool
- Direct URL funktioniert nicht mit mysql2
- Queries schlagen zur Laufzeit fehl

### Lösung

```typescript
// ✅ RICHTIG
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(pool);
```

### Hätte verhindert werden können durch

- [ ] **Code-Review**: Hätte die Pool-Initialisierung geprüft
- [ ] **Testing**: Unit Tests hätten den Fehler gefunden
- [ ] **Dokumentation**: ADR-009 erklärt warum Pool nötig ist
- [ ] **Debugging-Guide**: DATABASE_FIX.md erklärt die Lösung

### Wiederkehrend?

**JA** - Dieser Fehler tritt bei jedem neuen Drizzle + mysql2 Projekt auf.

### Checkliste für zukünftige Projekte

- [ ] Drizzle ORM mit mysql2 Pool initialisieren (nicht Direct URL)
- [ ] Connection Pool Parameter prüfen (connectionLimit, queueLimit)
- [ ] Unit Tests für Datenbank-Funktionen schreiben
- [ ] Fehler in Logs prüfen (nicht nur Browser Console)

### Referenzen

- [ADR-001: Drizzle ORM](../decisions/README.md#adr-001-drizzle-orm)
- [ADR-009: mysql2 Pool](../decisions/README.md#adr-009-mysql2-pool)
- [DATABASE_FIX.md](../DATABASE_FIX.md)

---

## FEHLER-002: Button Label Verwirrung

**Titel**: "Quiz abschließen" Button verwirrt Lernende

**Datum**: 27.01.2026  
**Severity**: 🟡 Mittel  
**Status**: ✅ Behoben  
**Betroffene Komponente**: TopicView.tsx, Lern-Flow

### Symptom

- Mitarbeiter antwortet Frage falsch
- Klickt "Antwort prüfen"
- Sieht "Quiz abschließen" Button
- Ist verwirrt: "Ich will doch nur lernen, nicht das Quiz beenden!"

### Root Cause Analysis

**Ursache**: Button-Label war nicht klar, was passiert.

**Warum das falsch ist**:
- "Quiz abschließen" impliziert: Quiz ist zu Ende
- Aber der Benutzer will: Nächste Frage
- Unklare Labels führen zu Verwirrung

### Lösung

```typescript
// ❌ FALSCH
<Button onClick={handleCompleteQuiz}>Quiz abschließen</Button>

// ✅ RICHTIG
<Button onClick={handleNextQuestion}>Nächste Frage</Button>
```

**Zusätzlich**:
- Zeige Feedback sofort nach Klick (grün/rot)
- "Nächste Frage" Button automatisch aktivieren
- Am Ende aller Fragen: "Thema abgeschlossen" Meldung

### Hätte verhindert werden können durch

- [ ] **User Testing**: Frühe User Tests hätten Verwirrung gezeigt
- [ ] **Button Label Best Practices**: Klare, aktive Verben nutzen
- [ ] **UX Review**: Jemand hätte die Verwirrung erkannt

### Wiederkehrend?

**JA** - Unklare Button Labels sind ein häufiges UX-Problem.

### Checkliste für zukünftige Projekte

- [ ] Button Labels sind aktive Verben ("Nächste Frage", nicht "Weiter")
- [ ] Button Labels beschreiben Resultat ("Speichern", nicht "OK")
- [ ] User Testing mit echten Benutzern durchführen
- [ ] UX Review vor Release

### Referenzen

- [LEARNING_FLOW.md](../LEARNING_FLOW.md)
- [DO-DONT-DESIGN.md](../design-system/DO-DONT-DESIGN.md)

---

## FEHLER-003: Flex Overflow Bug

**Titel**: Flex-Kinder quetschen sich zusammen

**Datum**: 25.01.2026  
**Severity**: 🟡 Mittel  
**Status**: ✅ Behoben  
**Betroffene Komponente**: Layout-Komponenten, Card-Grid

### Symptom

```typescript
<div className="flex">
  <div className="w-full">Content 1</div>
  <div className="w-full">Content 2</div>
</div>
```

**Problem**: Beide Divs sind `w-full`, aber quetschen sich zusammen statt nebeneinander zu sein.

### Root Cause Analysis

**Ursache**: Flex-Kinder haben keinen `min-width: 0`.

**Warum das falsch ist**:
- Flex-Items haben standardmäßig `min-width: auto`
- Das verhindert, dass sie schrumpfen
- `w-full` funktioniert nicht wie erwartet

### Lösung

```typescript
// ✅ RICHTIG
<div className="flex">
  <div className="min-w-0 w-full">Content 1</div>
  <div className="min-w-0 w-full">Content 2</div>
</div>

// Oder mit flex-1
<div className="flex">
  <div className="min-w-0 flex-1">Content 1</div>
  <div className="min-w-0 flex-1">Content 2</div>
</div>
```

**In Tailwind**:
```css
/* client/src/index.css */
.flex {
  @apply flex min-w-0 min-h-0;
}
```

### Hätte verhindert werden können durch

- [ ] **CSS-Wissen**: `min-width: 0` ist ein Flex-Standard
- [ ] **Tailwind Customization**: `.flex` mit `min-w-0` definieren
- [ ] **Testing**: Layout-Tests hätten das gefunden

### Wiederkehrend?

**JA** - Flex Overflow ist ein häufiges CSS-Problem.

### Checkliste für zukünftige Projekte

- [ ] `.flex` Klasse mit `min-w-0` definieren
- [ ] Flex-Kinder immer `min-w-0` nutzen
- [ ] Layout-Tests schreiben
- [ ] Browser DevTools prüfen (Flex Inspector)

### Referenzen

- [RESPONSIVE-DESIGN.md](../design-system/RESPONSIVE-DESIGN.md)
- [TAILWIND-ARCHITECTURE.md](../design-system/TAILWIND-ARCHITECTURE.md)

---

## FEHLER-004: Responsive Design Fehler

**Titel**: Desktop-First statt Mobile-First Responsive

**Datum**: 24.01.2026  
**Severity**: 🟡 Mittel  
**Status**: ✅ Behoben  
**Betroffene Komponente**: Alle Layout-Komponenten

### Symptom

```typescript
// ❌ FALSCH - Desktop-First
<div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
```

**Problem**: 
- Breakpoint-Reihenfolge ist falsch
- Mobile sieht 3 Spalten (falsch!)
- Tablet sieht 2 Spalten (richtig)
- Desktop sieht 1 Spalte (falsch!)

### Root Cause Analysis

**Ursache**: Desktop-First Denken statt Mobile-First.

**Warum das falsch ist**:
- Tailwind ist Mobile-First
- Breakpoints ohne Prefix = Mobile
- `md:` = Tablet, `lg:` = Desktop
- Desktop-First ist verwirrend

### Lösung

```typescript
// ✅ RICHTIG - Mobile-First
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**Reihenfolge**:
- Keine Prefix: Mobile (1 Spalte)
- `md:`: Tablet (2 Spalten)
- `lg:`: Desktop (3 Spalten)

### Hätte verhindert werden können durch

- [ ] **Mobile-First Mindset**: Immer Mobile zuerst denken
- [ ] **Tailwind Dokumentation**: Breakpoints verstehen
- [ ] **Code Review**: Breakpoint-Reihenfolge prüfen
- [ ] **Testing**: Auf echten Geräten testen

### Wiederkehrend?

**JA** - Desktop-First Fehler sind häufig bei neuen Entwicklern.

### Checkliste für zukünftige Projekte

- [ ] Mobile-First Mindset: Klein → Groß denken
- [ ] Breakpoints: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- [ ] Auf echten Geräten testen (iPhone, iPad, Desktop)
- [ ] DevTools Responsive Mode nutzen

### Referenzen

- [RESPONSIVE-DESIGN.md](../design-system/RESPONSIVE-DESIGN.md)
- [DO-DONT-DESIGN.md](../design-system/DO-DONT-DESIGN.md)

---

## FEHLER-005: Datenbank Initialisierung

**Titel**: Seed-Daten nicht geladen

**Datum**: 22.01.2026  
**Severity**: 🔴 Kritisch  
**Status**: ✅ Behoben  
**Betroffene Komponente**: Datenbank, Seed-Script

### Symptom

- Datenbank ist leer
- Keine Kurse, keine Fragen
- Login schlägt fehl (kein SysAdmin)

### Root Cause Analysis

**Ursache**: Seed-Script wurde nicht ausgeführt.

**Warum das falsch ist**:
- Datenbank-Schema ist leer nach Migration
- Seed-Daten müssen manuell geladen werden
- Ohne Seed-Daten funktioniert nichts

### Lösung

```bash
# Seed-Script ausführen
node scripts/seed-courses.mjs
node scripts/seed-users.mjs
```

**Oder in package.json**:
```json
{
  "scripts": {
    "db:seed": "node scripts/seed-courses.mjs && node scripts/seed-users.mjs"
  }
}
```

### Hätte verhindert werden können durch

- [ ] **Dokumentation**: Setup-Anleitung mit Seed-Schritten
- [ ] **Automation**: Seed-Script in `pnpm db:push` integrieren
- [ ] **Checklist**: Deployment-Checklist mit Seed-Schritt

### Wiederkehrend?

**JA** - Seed-Daten vergessen ist ein häufiges Problem.

### Checkliste für zukünftige Projekte

- [ ] Seed-Scripts erstellen für alle Datentypen
- [ ] `pnpm db:seed` Command in package.json
- [ ] Setup-Dokumentation mit Seed-Schritt
- [ ] Deployment-Checklist mit Seed-Schritt

### Referenzen

- [SETUP.md](../SETUP.md)
- [DATABASE_FIX.md](../DATABASE_FIX.md)

---

## Wie Fehler-Katalog nutzen

### Für neue Entwickler

1. Lese relevante Fehler für Kontext
2. Verstehe Root Cause
3. Nutze Checkliste um Fehler zu vermeiden

### Für Debugging

1. Fehler tritt auf
2. Suche ähnlichen Fehler im Katalog
3. Nutze Lösung

### Für Code-Review

1. Prüfe: Könnte dieser Fehler hier passieren?
2. Nutze Checkliste um Fehler zu vermeiden

### Template für neuen Fehler

```markdown
## FEHLER-XXX: [Titel]

**Titel**: [Beschreibung]

**Datum**: [Datum]  
**Severity**: 🔴 Kritisch / 🟡 Mittel / 🟢 Gering  
**Status**: ⏳ Offen / ✅ Behoben / ❌ Wontfix  
**Betroffene Komponente**: [Komponente]

### Symptom
[Was ist sichtbar?]

### Root Cause Analysis
[Warum passiert das?]

### Lösung
[Wie wird es behoben?]

### Hätte verhindert werden können durch
- [ ] [Maßnahme 1]
- [ ] [Maßnahme 2]

### Wiederkehrend?
[JA / NEIN] - [Erklärung]

### Checkliste für zukünftige Projekte
- [ ] [Item 1]
- [ ] [Item 2]

### Referenzen
- [Dokument 1](link)
- [Dokument 2](link)
```

---

## Statistiken

| Metrik | Wert |
|--------|------|
| **Dokumentierte Fehler** | 5 |
| **Kritische Fehler** | 2 |
| **Mittlere Fehler** | 3 |
| **Behobene Fehler** | 5 |
| **Wiederkehrende Fehler** | 5 |

---

**Status**: ✅ 5 Fehler dokumentiert  
**Letzte Aktualisierung**: 28.01.2026  
**Skalierbar für**: Neue Fehler, neue Entwickler, andere Projekte
