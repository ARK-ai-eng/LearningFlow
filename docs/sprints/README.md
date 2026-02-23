# Sprint-Dokumentation - Projekt-Historie

## Übersicht

Dieses Verzeichnis dokumentiert alle **Sprints** chronologisch mit Features, Bugs, Lessons Learned.

**Zweck**: Nachvollziehbarkeit, Wissensmanagement, Skalierbarkeit.

---

## Sprint-Index

| Sprint | Titel | Datum | Status | Features | Bugs |
|--------|-------|-------|--------|----------|------|
| [Sprint 1](#sprint-1-projektinitialisierung--auth-system) | Projektinitialisierung & Auth-System | 15.01.2026 | ✅ Abgeschlossen | 3 | 0 |
| [Sprint 2](#sprint-2-firmen--benutzer-verwaltung) | Firmen- & Benutzer-Verwaltung | 18.01.2026 | ✅ Abgeschlossen | 4 | 1 |
| [Sprint 3](#sprint-3-kurs-struktur--datenmodell) | Kurs-Struktur & Datenmodell | 21.01.2026 | ✅ Abgeschlossen | 5 | 2 |
| [Sprint 4](#sprint-4-lern-flow-vereinfachung) | Lern-Flow Vereinfachung | 27.01.2026 | ✅ Abgeschlossen | 2 | 1 |
| [Sprint 5](#sprint-5-datenbank-stabilisierung) | Datenbank-Stabilisierung | 28.01.2026 | ✅ Abgeschlossen | 0 | 1 |
| [Sprint 6](#sprint-6-design-system-dokumentation) | Design System Dokumentation | 28.01.2026 | ✅ Abgeschlossen | 6 | 0 |
| [Sprint 7](#sprint-7-wissensmanagement-system) | Wissensmanagement-System | 28.01.2026 | 🔄 In Progress | 5 | 0 |

---

## Sprint 1: Projektinitialisierung & Auth-System

**Datum**: 15.01.2026  
**Status**: ✅ Abgeschlossen  
**Checkpoint**: fc42c32f

### Features

- [x] Projekt-Setup (React 19, Tailwind 4, Express 4, tRPC 11)
- [x] OAuth Provider Integration
- [x] JWT Token Management
- [x] Datenbank-Schema (users, companies, courses, topics, questions)

### Bugs

Keine

### Lessons Learned

- Drizzle ORM ist Type-Safe und einfach zu nutzen
- OAuth Provider funktioniert out-of-the-box
- JWT mit 7 Tagen Expiration ist sinnvoll

### Nächste Schritte

- Firmen- & Benutzer-Verwaltung
- Kurs-Struktur

---

## Sprint 2: Firmen- & Benutzer-Verwaltung

**Datum**: 18.01.2026  
**Status**: ✅ Abgeschlossen  
**Checkpoint**: 8f3a2c1e

### Features

- [x] 3-Rollen-System (SysAdmin, FirmenAdmin, User)
- [x] Firmen-Verwaltung (CRUD)
- [x] Benutzer-Verwaltung (CRUD)
- [x] Role-Based Access Control (RBAC)

### Bugs

- [x] **BUG-001**: Firmen-Admin konnte alle Firmen sehen (Fixed: Scope auf eigene Firma)

### Lessons Learned

- RBAC sollte früh implementiert werden
- Benutzer-Rollen sollten in Enum sein
- FirmenAdmin sollte nur seine Mitarbeiter sehen

### Nächste Schritte

- Kurs-Struktur
- Fragen-Verwaltung

---

## Sprint 3: Kurs-Struktur & Datenmodell

**Datum**: 21.01.2026  
**Status**: ✅ Abgeschlossen  
**Checkpoint**: a9b2f5d3

### Features

- [x] 3 Kurstypen (Learning, Sensitization, Certification)
- [x] Themen (Topics) - 12 pro Kurs
- [x] Fragen (Questions) - 4 pro Thema
- [x] Fortschritt-Tracking (user_progress Tabelle)
- [x] Zertifikat-System (certificates Tabelle)

### Bugs

- [x] **BUG-002**: Fragen wurden nicht geladen (Fixed: Seed-Daten)
- [x] **BUG-003**: Fortschritt wurde nicht gespeichert (Fixed: Datenbank-Trigger)

### Lessons Learned

- Seed-Daten sind wichtig für Entwicklung
- Fortschritt sollte nach jeder Frage gespeichert werden
- Zertifikate sollten 1 Jahr gültig sein

### Nächste Schritte

- Lern-Flow UI
- Prüfungs-System

---

## Sprint 4: Lern-Flow Vereinfachung

**Datum**: 27.01.2026  
**Status**: ✅ Abgeschlossen  
**Checkpoint**: 9295c066

### Features

- [x] Schlanker Lern-Flow (1x pro Frage, sofort Feedback)
- [x] Sofortiges Feedback (grün/rot)
- [x] "Nächste Frage" Button
- [x] Am Ende: "Thema abgeschlossen" Meldung

### Bugs

- [x] **BUG-004**: "Quiz abschließen" Button verwirrt Benutzer (Fixed: "Nächste Frage" Button)

### Lessons Learned

- Button-Labels sollten klar sein
- Sofortiges Feedback hilft beim Lernen
- Keine Wiederholung verhindert Frustration

### Nächste Schritte

- Datenbank-Stabilisierung
- Mini-Quiz nach allen Themen

---

## Sprint 5: Datenbank-Stabilisierung

**Datum**: 28.01.2026  
**Status**: ✅ Abgeschlossen  
**Checkpoint**: 395562e9

### Features

Keine neuen Features

### Bugs

- [x] **BUG-005**: "Failed query" Fehler (Fixed: mysql2 Pool statt Direct URL)

### Lessons Learned

- Drizzle ORM braucht mysql2 Pool, nicht Direct URL
- Fehler war schwer zu debuggen (siehe DATABASE_FIX.md)
- Unit Tests hätten das früher gefunden

### Nächste Schritte

- Design System Dokumentation
- Wissensmanagement-System

---

## Sprint 6: Design System Dokumentation

**Datum**: 28.01.2026  
**Status**: ✅ Abgeschlossen  
**Checkpoint**: 191fa6ca

### Features

- [x] DESIGN-TOKENS.md (CSS-Variablen, Farben, Spacing)
- [x] TAILWIND-ARCHITECTURE.md (Tailwind Config, @layer)
- [x] COMPONENT-LIBRARY.md (shadcn/ui Komponenten)
- [x] RESPONSIVE-DESIGN.md (Mobile-First, Breakpoints)
- [x] DO-DONT-DESIGN.md (Praktische Checkliste)
- [x] README.md (Übersicht, Goldstandards)

### Bugs

Keine

### Lessons Learned

- Design-Tokens sind das Fundament für Konsistenz
- Ohne Dokumentation führt KI-Modelle zu Chaos (Gemini Flash Problem)
- Goldstandards sollten explizit dokumentiert sein

### Nächste Schritte

- ADR-Verzeichnis
- Fehler-Katalog
- Pattern-Katalog

---

## Sprint 7: Wissensmanagement-System

**Datum**: 28.01.2026  
**Status**: 🔄 In Progress  
**Checkpoint**: TBD

### Features

- [x] ADR-Verzeichnis (10 Architecture Decision Records)
- [x] Fehler-Katalog (5 Lessons Learned)
- [x] Pattern-Katalog (8 wiederverwendbare Patterns)
- [x] Sprint-Dokumentation (systematisiert)
- [x] Task-Checklisten (für häufige Aufgaben)

### Bugs

Keine

### Lessons Learned

- ADRs helfen zukünftigen Entwicklern das "Warum" zu verstehen
- Fehler-Katalog verhindert Wiederholung
- Patterns ermöglichen schnelle Entwicklung

### Nächste Schritte

- Mini-Quiz nach Lernphase
- E-Mail-Versand
- Passwort-Reset System

---

## Sprint-Statistiken

### Gesamt

| Metrik | Wert |
|--------|------|
| **Sprints** | 7 |
| **Features** | 25 |
| **Bugs** | 6 |
| **Tage** | 14 |
| **Durchschnitt Features/Sprint** | 3.6 |
| **Durchschnitt Bugs/Sprint** | 0.9 |

### Bug-Kategorien

| Kategorie | Anzahl |
|-----------|--------|
| **Datenbank** | 2 |
| **UX/UI** | 1 |
| **CSS/Layout** | 1 |
| **Setup** | 1 |
| **Andere** | 1 |

### Feature-Kategorien

| Kategorie | Anzahl |
|-----------|--------|
| **Backend** | 10 |
| **Frontend** | 8 |
| **Database** | 4 |
| **Documentation** | 3 |

---

## Sprint-Template

```markdown
## Sprint X: [Titel]

**Datum**: [Startdatum - Enddatum]  
**Status**: ✅ Abgeschlossen / 🔄 In Progress  
**Checkpoint**: [Version ID]

### Features

- [x] Feature 1
- [x] Feature 2
- [ ] Feature 3 (nicht fertig)

### Bugs

- [x] **BUG-XXX**: [Beschreibung] (Fixed: [Lösung])
- [ ] **BUG-YYY**: [Beschreibung] (Offen)

### Lessons Learned

- [Lektion 1]
- [Lektion 2]

### Nächste Schritte

- [Schritt 1]
- [Schritt 2]
```

---

## Wie Sprint-Dokumentation nutzen

### Für neue Entwickler

1. Lese Sprint-Übersicht für Projekt-Geschichte
2. Lese relevante Sprints für Kontext
3. Verstehe Entscheidungen und Fehler

### Für Planung

1. Prüfe: Was wurde in ähnlichen Sprints gemacht?
2. Schätze: Wie lange dauert ähnliche Feature?
3. Plane: Basierend auf historischen Daten

### Für Retrospektive

1. Lese: Was wurde gemacht?
2. Prüfe: Was funktionierte?
3. Lerne: Was hätte besser sein können?

---

**Status**: ✅ 7 Sprints dokumentiert  
**Letzte Aktualisierung**: 28.01.2026  
**Skalierbar für**: Neue Sprints, neue Entwickler, andere Projekte
