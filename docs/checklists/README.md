# Task-Checklisten - Häufige Aufgaben

## Übersicht

Dieses Verzeichnis dokumentiert **Checklisten** für häufige Aufgaben in der Entwicklung.

**Zweck**: Struktur, Konsistenz, Fehlerprävention.

---

## Checklisten-Index

| Checkliste | Kategorie | Dauer | Komplexität |
|-----------|-----------|-------|-------------|
| [Neue Feature implementieren](#neue-feature-implementieren) | Development | 2-4h | ⭐⭐⭐ |
| [Neuen Kurs hinzufügen](#neuen-kurs-hinzufügen) | Content | 1-2h | ⭐⭐ |
| [Bug beheben](#bug-beheben) | Debugging | 1-3h | ⭐⭐⭐ |
| [Code Review durchführen](#code-review-durchführen) | QA | 30-60min | ⭐⭐ |
| [Deployment vorbereiten](#deployment-vorbereiten) | DevOps | 30min | ⭐⭐ |
| [Neue Dokumentation schreiben](#neue-dokumentation-schreiben) | Documentation | 1-2h | ⭐⭐ |
| [Performance optimieren](#performance-optimieren) | Optimization | 2-4h | ⭐⭐⭐ |
| [Sicherheit überprüfen](#sicherheit-überprüfen) | Security | 1-2h | ⭐⭐⭐ |

---

## Neue Feature implementieren

**Dauer**: 2-4 Stunden  
**Komplexität**: ⭐⭐⭐  
**Voraussetzungen**: Requirements klar, Design genehmigt

### Schritt 1: Planung & Design

- [ ] Requirements verstehen (Was soll die Feature tun?)
- [ ] Design-Entscheidungen treffen (Welche Komponenten? Welches Layout?)
- [ ] Datenmodell skizzieren (Welche Datenbank-Tabellen?)
- [ ] API-Endpoints planen (Welche tRPC Procedures?)
- [ ] Abhängigkeiten prüfen (Andere Features beeinflussen?)

### Schritt 2: Datenbank

- [ ] Schema in `drizzle/schema.ts` aktualisieren
- [ ] `pnpm db:push` ausführen (Migrationen)
- [ ] Datenbank-Funktionen in `server/db.ts` schreiben
- [ ] Unit Tests für DB-Funktionen schreiben

### Schritt 3: Backend

- [ ] tRPC Procedures in `server/routers.ts` schreiben
- [ ] Input Validation mit Zod
- [ ] Error Handling
- [ ] Authorization Checks (Role-Based)
- [ ] Unit Tests für Procedures

### Schritt 4: Frontend

- [ ] Komponenten in `client/src/components/` erstellen
- [ ] Pages in `client/src/pages/` erstellen
- [ ] tRPC Hooks nutzen (useQuery, useMutation)
- [ ] Loading States
- [ ] Error States
- [ ] Responsive Design (Mobile-First)

### Schritt 5: Design & Styling

- [ ] Design-Tokens nutzen (Farben, Spacing)
- [ ] Tailwind CSS Klassen
- [ ] shadcn/ui Komponenten
- [ ] Dark Mode testen
- [ ] Responsive auf Mobile/Tablet/Desktop testen

### Schritt 6: Testing

- [ ] Unit Tests schreiben (Vitest)
- [ ] Integration Tests (optional)
- [ ] Manual Testing im Browser
- [ ] Responsive Testing (DevTools)
- [ ] Accessibility Testing (a11y)

### Schritt 7: Dokumentation

- [ ] Code-Kommentare schreiben
- [ ] README aktualisieren (falls nötig)
- [ ] ADR schreiben (falls architektur-relevant)
- [ ] Pattern dokumentieren (falls wiederverwendbar)

### Schritt 8: Code Review & Merge

- [ ] Code Review durchführen
- [ ] Feedback einarbeiten
- [ ] Tests nochmal laufen lassen
- [ ] Merge in main

### Schritt 9: Deployment

- [ ] Checkpoint erstellen
- [ ] Auf Staging testen
- [ ] Auf Production deployen
- [ ] Monitoring prüfen

### Referenzen

- [PATTERN-Katalog](../patterns/README.md)
- [DO-DONT-DESIGN.md](../design-system/DO-DONT-DESIGN.md)
- [TECHNICAL_REFERENCE.md](../TECHNICAL_REFERENCE.md)

---

## Neuen Kurs hinzufügen

**Dauer**: 1-2 Stunden  
**Komplexität**: ⭐⭐  
**Voraussetzungen**: Kurs-Inhalt vorbereitet

### Schritt 1: Kurs erstellen

- [ ] SysAdmin-Panel öffnen
- [ ] "Neuer Kurs" Button klicken
- [ ] Kurs-Daten eingeben:
  - [ ] Titel
  - [ ] Beschreibung
  - [ ] Kurstyp (Learning, Sensitization, Certification)
  - [ ] Zielgruppe (optional)

### Schritt 2: Themen hinzufügen

- [ ] 12 Themen erstellen (Standard)
- [ ] Für jedes Thema:
  - [ ] Titel
  - [ ] Beschreibung
  - [ ] Reihenfolge

### Schritt 3: Fragen hinzufügen

- [ ] Für jedes Thema 4 Fragen erstellen
- [ ] Für jede Frage:
  - [ ] Frage-Text
  - [ ] 4 Antwortmöglichkeiten (A, B, C, D)
  - [ ] Korrekte Antwort
  - [ ] Erklärung (optional)

### Schritt 4: Validierung

- [ ] Alle 12 Themen haben Fragen
- [ ] Alle Fragen haben 4 Antworten
- [ ] Korrekte Antwort ist definiert
- [ ] Keine Duplikate

### Schritt 5: Veröffentlichung

- [ ] Kurs als "Aktiv" markieren
- [ ] Zielgruppe zuweisen
- [ ] Notification an Mitarbeiter (optional)

### Referenzen

- [USER_GUIDE.md](../USER_GUIDE.md) - SysAdmin Handbuch
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Kurs-Struktur

---

## Bug beheben

**Dauer**: 1-3 Stunden  
**Komplexität**: ⭐⭐⭐  
**Voraussetzungen**: Bug ist reproduzierbar

### Schritt 1: Reproduzieren

- [ ] Bug-Beschreibung lesen
- [ ] Bug reproduzieren (lokal)
- [ ] Schritte dokumentieren
- [ ] Browser Console prüfen (Fehler?)
- [ ] Server Logs prüfen (Fehler?)

### Schritt 2: Debugging

- [ ] Browser DevTools öffnen
- [ ] Network Tab prüfen (API Requests)
- [ ] Console Tab prüfen (JavaScript Fehler)
- [ ] Breakpoints setzen
- [ ] Code Step-by-Step durchgehen

### Schritt 3: Root Cause Analysis

- [ ] Wo ist der Fehler? (Frontend/Backend/Database?)
- [ ] Warum passiert das?
- [ ] Ist es ein bekannter Fehler? (Fehler-Katalog prüfen)
- [ ] Dokumentieren für Fehler-Katalog

### Schritt 4: Lösung implementieren

- [ ] Fix schreiben
- [ ] Minimal & fokussiert (nicht zu viel ändern)
- [ ] Tests schreiben (um Regression zu vermeiden)
- [ ] Lokal testen

### Schritt 5: Validierung

- [ ] Bug ist behoben
- [ ] Keine neuen Fehler
- [ ] Tests bestehen
- [ ] Code Review

### Schritt 6: Dokumentation

- [ ] Fehler in Fehler-Katalog dokumentieren
- [ ] Lösung dokumentieren
- [ ] Lessons Learned dokumentieren

### Referenzen

- [DATABASE_FIX.md](../DATABASE_FIX.md) - Fehler-Beispiele
- [Fehler-Katalog](../lessons-learned/README.md)

---

## Code Review durchführen

**Dauer**: 30-60 Minuten  
**Komplexität**: ⭐⭐  
**Voraussetzungen**: PR ist bereit

### Schritt 1: Überblick

- [ ] PR-Beschreibung lesen
- [ ] Welche Features/Bugs?
- [ ] Welche Dateien geändert?
- [ ] Wie viele Zeilen Code?

### Schritt 2: Code-Qualität

- [ ] Code ist lesbar (Variablen-Namen, Kommentare)
- [ ] Keine Code-Duplikate
- [ ] Keine hardcodierten Werte
- [ ] Keine Console.logs
- [ ] Keine commented-out Code

### Schritt 3: Standards prüfen

- [ ] Nutzt Design-Tokens? (Farben, Spacing)
- [ ] Nutzt Tailwind CSS? (nicht inline Styles)
- [ ] Nutzt shadcn/ui? (nicht custom Components)
- [ ] Mobile-First Responsive? (grid-cols-1 zuerst)
- [ ] Error Handling vorhanden?

### Schritt 4: Tests prüfen

- [ ] Unit Tests vorhanden?
- [ ] Tests bestehen?
- [ ] Code Coverage ausreichend?
- [ ] Edge Cases getestet?

### Schritt 5: Sicherheit prüfen

- [ ] SQL Injection möglich?
- [ ] XSS möglich?
- [ ] Authorization Checks vorhanden?
- [ ] Sensitive Daten in Logs?

### Schritt 6: Performance prüfen

- [ ] Unnötige Re-Renders?
- [ ] N+1 Queries?
- [ ] Große Dependencies hinzugefügt?
- [ ] Bundle Size OK?

### Schritt 7: Feedback geben

- [ ] Positive Feedback geben
- [ ] Konstruktive Kritik
- [ ] Konkrete Verbesserungsvorschläge
- [ ] Approve oder Request Changes

### Referenzen

- [DO-DONT-DESIGN.md](../design-system/DO-DONT-DESIGN.md)
- [TECHNICAL_REFERENCE.md](../TECHNICAL_REFERENCE.md)

---

## Deployment vorbereiten

**Dauer**: 30 Minuten  
**Komplexität**: ⭐⭐  
**Voraussetzungen**: Features sind fertig

### Schritt 1: Tests

- [ ] `pnpm test` - Alle Tests bestehen
- [ ] `pnpm build` - Build erfolgreich
- [ ] `pnpm lint` - Keine Linting Fehler
- [ ] TypeScript Fehler prüfen

### Schritt 2: Datenbank

- [ ] Migrationen aktuell? (`pnpm db:push`)
- [ ] Seed-Daten aktuell?
- [ ] Backup vor Deployment?

### Schritt 3: Dokumentation

- [ ] README aktualisiert?
- [ ] Changelog aktualisiert?
- [ ] API-Dokumentation aktualisiert?
- [ ] Deployment-Anleitung aktualisiert?

### Schritt 4: Umgebung

- [ ] Environment Variables prüfen
- [ ] Secrets korrekt gesetzt?
- [ ] API Keys vorhanden?
- [ ] URLs korrekt?

### Schritt 5: Monitoring

- [ ] Logging konfiguriert?
- [ ] Error Tracking aktiv?
- [ ] Performance Monitoring aktiv?
- [ ] Alerts konfiguriert?

### Schritt 6: Checkpoint

- [ ] `webdev_save_checkpoint` ausführen
- [ ] Version ID dokumentieren
- [ ] Deployment-Notes schreiben

### Schritt 7: Deployment

- [ ] Auf Staging deployen
- [ ] Staging testen
- [ ] Auf Production deployen
- [ ] Production testen

### Referenzen

- [SETUP.md](../SETUP.md)
- [TECHNICAL_REFERENCE.md](../TECHNICAL_REFERENCE.md)

---

## Neue Dokumentation schreiben

**Dauer**: 1-2 Stunden  
**Komplexität**: ⭐⭐  
**Voraussetzungen**: Thema ist klar

### Schritt 1: Planung

- [ ] Zielgruppe definieren (Entwickler? Benutzer? Beide?)
- [ ] Struktur planen (Übersicht, Details, Beispiele)
- [ ] Länge schätzen (Wie viel Content?)
- [ ] Format wählen (Markdown, Video, etc.)

### Schritt 2: Schreiben

- [ ] Übersicht schreiben (Was ist das?)
- [ ] Problem beschreiben (Warum braucht man das?)
- [ ] Lösung erklären (Wie funktioniert es?)
- [ ] Beispiele geben (Code-Snippets)
- [ ] Best Practices dokumentieren

### Schritt 3: Struktur

- [ ] Markdown-Formatierung korrekt
- [ ] Überschriften hierarchisch
- [ ] Tabellen für Vergleiche
- [ ] Code-Blöcke mit Syntax-Highlighting
- [ ] Links zu anderen Dokumenten

### Schritt 4: Validierung

- [ ] Markdown-Syntax korrekt
- [ ] Links funktionieren
- [ ] Code-Beispiele sind korrekt
- [ ] Keine Typos

### Schritt 5: Review

- [ ] Jemand anderen lesen lassen
- [ ] Feedback einarbeiten
- [ ] Nochmal prüfen

### Schritt 6: Integration

- [ ] In richtiges Verzeichnis speichern
- [ ] In Index/README hinzufügen
- [ ] Links aktualisieren
- [ ] Commit & Push

### Referenzen

- [docs/README.md](../README.md)
- [Alle Dokumentation](../)

---

## Performance optimieren

**Dauer**: 2-4 Stunden  
**Komplexität**: ⭐⭐⭐  
**Voraussetzungen**: Performance-Problem identifiziert

### Schritt 1: Messen

- [ ] Performance-Metriken sammeln (Speed, Bundle Size, etc.)
- [ ] Bottleneck identifizieren (Wo ist es langsam?)
- [ ] Browser DevTools prüfen (Performance Tab)
- [ ] Network Tab prüfen (Große Requests?)

### Schritt 2: Frontend Optimization

- [ ] Unnötige Re-Renders finden
- [ ] useMemo/useCallback nutzen
- [ ] Lazy Loading implementieren
- [ ] Code Splitting
- [ ] Image Optimization
- [ ] CSS Minification

### Schritt 3: Backend Optimization

- [ ] N+1 Queries finden
- [ ] Indexes in Datenbank
- [ ] Caching implementieren
- [ ] API Response Compression
- [ ] Datenbank Query Optimization

### Schritt 4: Bundle Optimization

- [ ] Große Dependencies identifizieren
- [ ] Tree Shaking prüfen
- [ ] Unused Code entfernen
- [ ] Polyfills prüfen
- [ ] Bundle Size Analyzer nutzen

### Schritt 5: Validierung

- [ ] Performance-Metriken nochmal messen
- [ ] Verbesserung dokumentieren
- [ ] Tests bestehen
- [ ] Keine neuen Fehler

### Referenzen

- [TECHNICAL_REFERENCE.md](../TECHNICAL_REFERENCE.md)
- [DO-DONT-DESIGN.md](../design-system/DO-DONT-DESIGN.md)

---

## Sicherheit überprüfen

**Dauer**: 1-2 Stunden  
**Komplexität**: ⭐⭐⭐  
**Voraussetzungen**: Feature ist fertig

### Schritt 1: Input Validation

- [ ] Alle Inputs validiert? (Frontend + Backend)
- [ ] Zod Schemas vorhanden?
- [ ] Type-Checking aktiv?
- [ ] Keine unsicheren Datentypen

### Schritt 2: SQL Injection

- [ ] Prepared Statements? (Drizzle ORM nutzt das)
- [ ] Keine String Concatenation?
- [ ] Keine Raw Queries?

### Schritt 3: XSS (Cross-Site Scripting)

- [ ] Keine dangerouslySetInnerHTML?
- [ ] HTML-Escaping aktiv?
- [ ] Keine eval() oder Function()?
- [ ] Content Security Policy?

### Schritt 4: CSRF (Cross-Site Request Forgery)

- [ ] CSRF Tokens vorhanden?
- [ ] Same-Site Cookies?
- [ ] Origin Checks?

### Schritt 5: Authentication & Authorization

- [ ] JWT Token Validation?
- [ ] Token Expiration?
- [ ] Refresh Token Rotation?
- [ ] Role-Based Access Control?
- [ ] Authorization Checks in Procedures?

### Schritt 6: Sensitive Data

- [ ] Keine Passwords in Logs?
- [ ] Keine API Keys in Code?
- [ ] Keine Secrets in Git?
- [ ] HTTPS überall?
- [ ] Secure Cookies?

### Schritt 7: Dependencies

- [ ] `npm audit` - Keine Vulnerabilities?
- [ ] Dependencies aktuell?
- [ ] Keine deprecated Packages?

### Referenzen

- [TECHNICAL_REFERENCE.md](../TECHNICAL_REFERENCE.md)
- [Fehler-Katalog](../lessons-learned/README.md)

---

## Checklisten-Tipps

### Für neue Entwickler

1. Drucke relevante Checkliste aus
2. Arbeite Punkt für Punkt ab
3. Frage, wenn unsicher
4. Dokumentiere Lessons Learned

### Für Automatisierung

1. Nutze Pre-Commit Hooks (Linting, Tests)
2. Nutze CI/CD Pipeline (Tests, Build)
3. Nutze Checklisten in PR Templates

### Für Verbesserung

1. Wenn Fehler passiert: Checkliste aktualisieren
2. Wenn neue Pattern: Checkliste aktualisieren
3. Regelmäßig Review (Quarterly)

---

**Status**: ✅ 8 Checklisten dokumentiert  
**Letzte Aktualisierung**: 28.01.2026  
**Skalierbar für**: Neue Checklisten, neue Entwickler, andere Projekte
