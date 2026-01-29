# AISmarterFlow Academy - TODO

## Phase 1: Datenbank & Core
- [x] Datenbank-Schema erstellen (users, companies, invitations, courses, topics, questions, progress, certificates)
- [x] 3-Rollen-System (sysadmin, companyadmin, user)
- [x] Dark-Theme Design-System einrichten

## Phase 2: Auth & Einladungen
- [x] Einladungssystem mit 24h-Token
- [x] Firmen-Onboarding Flow
- [x] Mitarbeiter-Registrierung Flow
- [x] Abgelaufene Einladungen automatisch löschen

## Phase 3: SysAdmin-Bereich
- [x] Dashboard mit Übersicht
- [x] Firmenverwaltung (anlegen, bearbeiten, löschen)
- [x] FirmenAdmin einladen und verwalten
- [x] Kurs-Editor (3 Kurstypen)
- [x] Topic/Fragen-Editor
- [x] Nicht zahlende Kunden löschen

## Phase 4: FirmenAdmin-Bereich
- [x] Dashboard mit Mitarbeiter-Übersicht
- [x] Mitarbeiter einzeln anlegen (Personalnr, Name, Vorname, E-Mail)
- [x] CSV-Import für Mitarbeiter
- [x] Einladungen versenden und verwalten
- [x] Lernfortschritt der Mitarbeiter einsehen

## Phase 5: User-Bereich
- [x] Dashboard mit 3 Kurs-Cards
- [x] Lernfortschritt-Anzeige
- [x] Kurs-Ansicht mit Topics
- [x] Mini-Quiz pro Topic (A/B/C/D)
- [x] Kurstyp-spezifische Logik (Learning, Sensitization, Certification)

## Phase 6: Prüfung & Zertifikate
- [x] Jahresprüfung (20 Fragen, 80%, 15 Min)
- [x] PDF-Zertifikat-Generierung (Backend-Logik)
- [ ] PDF-Zertifikat-Download (Frontend)

## Phase 7: Seed-Daten
- [x] Datenschutz-Kurs mit Fragen
- [x] IT-Sicherheit-Kurs mit Fragen
- [x] Zertifizierungskurs mit 25+ Fragen

## Phase 8: Testing & Polish
- [x] Vitest-Tests für kritische Funktionen (12 Tests bestanden)
- [x] UI-Polish und Responsiveness
- [ ] E-Mail-Versand für Einladungen (OAuth/API)

## Demo-Modus
- [x] Rollen-Switcher Dropdown im Header
- [x] Zwischen SysAdmin, FirmenAdmin und User wechseln ohne Anmeldung

## Sprint 2 - Testversion vorbereiten
- [x] Demo-Modus entfernen (echte Auth verwenden)
- [x] Kurse umbenennen: "Datenschutz Zertifizierung" → "KI-Kompetenz Prüfung"
- [x] Learning-Kurs flexibel/frei lassen (jetzt "Freies Lernmodul")
- [x] Alle Funktionen testen (12/12 Tests bestanden)
- [x] Bugs fixen die beim Testen gefunden werden
- [x] Wiederverwendbares Template-Paket erstellen (docs/TEMPLATE_GUIDE.md)
- [x] Sprint-Dokumentation schreiben (docs/SPRINT_2_DOKUMENTATION.md)
- [x] Test-Ready Checkpoint erstellen (30e8110d)

## Sprint 3 - Bugfixes
- [x] BUG: FirmenAdmin sieht User-Dashboard statt FirmenAdmin-Dashboard nach Registrierung
  - Ursache: Nach OAuth-Login wurde User nicht zur Einladungsseite zurückgeleitet
  - Fix: returnTo Parameter in getLoginUrl() und OAuth Callback implementiert
- [x] BUG: Firma wird erst bei Einladungsannahme erstellt statt beim Anlegen durch SysAdmin
  - Fix: company.create erstellt jetzt sofort die Firma
  - Fix: invitation.accept ordnet FirmenAdmin nur noch der bestehenden Firma zu
- [x] BUG: Fehler 10002 - War kein Bug, User war mit falschem Account eingeloggt
- [x] BUG: React-Fehler "Cannot update a component while rendering" in Home.tsx
  - Fix: setLocation in useEffect gewrappt
- [ ] BUG: OAuth-Fehler "code and state are required" nach Anmeldung
- [x] BUG: OAuth returnTo Parameter verursacht doppeltes ? in URL - code/state werden nicht erkannt
  - Fix: returnTo wird jetzt im state als JSON kodiert statt in der URL
- [x] BUG: FirmenAdmin sieht keine Lernmodule - muss Mitarbeiterverwaltung UND Kurse sehen können
  - Fix: Company Dashboard mit Lernmodulen erweitert
  - Fix: Navigation für FirmenAdmin um "Meine Kurse" und "Zertifikate" erweitert

## Backlog / Später umsetzen
- [ ] Personalnummer von optional auf Pflichtfeld ändern (Eindeutige Identifikation bei Namensgleichheit)
- [ ] BUG: User kann Einladung ohne Anmeldung annehmen - muss erst OAuth durchlaufen
- [x] BUG: E-Mail-Validierung fehlt - jeder eingeloggte User kann jede Einladung annehmen
  - Fix: Backend prüft ob eingeloggte E-Mail mit Einladungs-E-Mail übereinstimmt
  - Fix: Frontend zeigt Warnung wenn E-Mail nicht übereinstimmt mit "Abmelden und neu anmelden" Button
- [x] BUG: OAuth erstellt automatisch User ohne Einladung - muss verhindert werden
  - Fix: OAuth-Callback erstellt User nur noch wenn: 1) User existiert bereits, 2) User ist Owner/SysAdmin, 3) Gültige Einladung für E-Mail vorhanden
  - Fix: Ohne Einladung wird User auf Startseite mit Fehlermeldung umgeleitet
- [x] E-Mail als einziger Identifier im gesamten System (Industriestandard)
  - Schema geändert: email ist jetzt unique in users-Tabelle
  - getUserByEmail() als Haupt-Identifikationsfunktion
- [x] Duplikat-Prüfung bei Einladungs-Erstellung (E-Mail bereits als User oder offene Einladung)
  - company.create, inviteAdmin, employee.invite, importCSV alle mit Prüfung
  - Fehlermeldung wenn E-Mail bereits registriert oder aktive Einladung existiert
- [x] OAuth: User nur erstellen wenn gültige Einladung für E-Mail existiert
  - OAuth-Callback komplett neu geschrieben
  - SDK authenticateRequest sucht User über E-Mail, nicht openId
  - Keine automatische User-Erstellung mehr
- [x] Altlasten/toter Code entfernen
  - getInvitationByEmail durch getActiveInvitationByEmail ersetzt
  - 20 Tests bestanden
- [x] FirmenAdmin Doppelrolle: Kann selbst Kurse absolvieren und Prüfungen ablegen
  - Company Dashboard zeigt "Meine Schulungen" Sektion
  - FirmenAdmin kann Kurse starten, Fortschritt sehen, Prüfungen ablegen
- [x] Automatische Zertifikat-Erstellung nach bestandener Prüfung
  - Bereits implementiert in exam.submit (Zeile 709-719)
  - Zertifikat wird automatisch mit 1 Jahr Gültigkeit erstellt
- [x] PDF-Download für Zertifikate
  - PDF-Generator mit pdfkit implementiert
  - certificate.generatePdf Endpoint erstellt
  - Frontend Download-Button funktioniert
- [x] Zertifikate 1 Jahr gültig (KI-Kompetenz)
  - expiresAt wird auf 365 Tage gesetzt
  - Abgelaufene Zertifikate werden rot markiert

## Ausstehende Features

- [ ] Automatischer E-Mail-Versand für Einladungslinks
  - Aktuell werden Links nur erstellt, nicht versendet
  - Benötigt externen E-Mail-Service (Resend, SendGrid, oder SMTP)
  - E-Mail an FirmenAdmin bei Firmen-Erstellung
  - E-Mail an Mitarbeiter bei Einladung
  - "Link erneut senden" Funktion für abgelaufene/nicht erhaltene Links

## Erledigt (Session 28.01.2026)

- [x] Eigenes Login-System mit E-Mail + Passwort (ohne Manus OAuth)
  - Passwort-Hash in Users-Tabelle (bcryptjs)
  - Login-Seite mit E-Mail + Passwort (/login)
  - JWT-Token in localStorage (Cookies funktionieren nicht im Manus-Proxy)
  - Authorization Header für API-Requests
  - OAuth komplett entfernt
  - SysAdmin: arton.ritter@aismarterflow.de / Manus§123*

## Aktuell: Direktes Anlegen ohne Einladung

- [x] SysAdmin legt FirmenAdmin direkt an (E-Mail + Passwort, keine Einladung)
- [x] FirmenAdmin legt Mitarbeiter direkt an (E-Mail + Passwort, keine Einladung)
- [ ] Einladungs-System deaktivieren (Code entfernen, Tabelle behalten)
- [ ] Dokumentation in docs/ aktualisieren

## Sprint 4 - Schlanker Lern-Flow (28.01.2026)

- [x] Lern-Flow vereinfachen: Jede Frage nur 1x beantworten
- [x] Sofortiges Feedback nach Antwort (grün = richtig, rot = falsch)
- [x] Bei falscher Antwort: Rotes Kreuz + richtige Antwort mit grünem Haken zeigen
- [x] "Nächste Frage" Button nach Feedback
- [x] Keine Wiederholung der Fragen möglich
- [x] Nach allen 12 Themen: "Lernmodul abgeschlossen" Meldung
- [x] Lernfortschritt speichern (welche Fragen bereits bearbeitet)
- [x] "Quiz abschließen" Button entfernen für Lernmodule
- [ ] Mini-Quiz für IT Security Awareness (später) - 5 Fragen a 4 Antworten

## Später (Backlog)

- [ ] SysAdmin: Alle Antwortmöglichkeiten (A, B, C, D) anzeigen und bearbeiten können


## Sprint 8 - Kurs-Management & Lern-Flow Verbesserungen (29.01.2026)

### Feature 1: Kurs-Status-Management
- [x] Backend: `isActive` Boolean-Feld in `courses` Tabelle prüfen/hinzufügen
- [x] Backend: `course.deactivate()` API-Endpoint
- [x] Backend: `course.activate()` API-Endpoint
- [x] Backend: `course.list()` mit Sortierung (aktiv zuerst, inaktiv hinten)
- [x] Frontend: Visuelle Unterscheidung (Opacity 50%, Badge "Inaktiv")
- [x] Frontend: Toggle-Button (Aktivieren/Deaktivieren)
- [x] Frontend: Filter (Alle/Aktiv/Inaktiv)
- [x] Tests: Unit Tests für Endpoints (9 Tests, alle bestanden)
- [ ] Tests: Manual Testing im Browser (Smoke Test)
- [x] Code Review

### Feature 2: Lern-Flow Logik (Sensitization-Kurse)
- [ ] ADR-014: Breaking Change Strategie dokumentieren
- [ ] ADR-015: Fortschritt-Berechnung bei Wiederholung dokumentieren
- [ ] Backend: Migration-Script für alte Fortschritte (3/5 → %)
- [ ] Backend: Fisher-Yates Shuffle-Algorithmus implementieren
- [ ] Backend: `progress.getIncorrectQuestions()` API-Endpoint
- [ ] Backend: `progress.calculateScore()` (% basiert) API-Endpoint
- [ ] Backend: `progress.repeatIncorrectQuestions()` API-Endpoint
- [ ] Backend: Antworten-Shuffle in API integrieren
- [ ] Frontend: "Nächste Frage" Button (statt "Thema abschließen")
- [ ] Frontend: Dialog "Fehlerhafte Fragen wiederholen?"
- [ ] Frontend: Anzeige nur falsche Fragen
- [ ] Frontend: Fortschritt-Anzeige % statt "3/5 richtig"
- [ ] Frontend: Antworten-Reihenfolge shuffeln bei Wiederholung
- [ ] Tests: Unit Tests (Shuffle, Fortschritt, Wiederholung)
- [ ] Tests: Integration Tests
- [ ] Tests: Manual Testing
- [ ] Tests: User Testing (5 Personen)
- [ ] Code Review
- [ ] Staging-Deployment + Test
- [ ] Production-Deployment

### Wissensmanagement
- [x] ADR-011: Soft-Delete für Kurse
- [x] ADR-012: Mitarbeiter sehen zugewiesene inaktive Kurse
- [x] ADR-013: Erste Antwort zählt bei Wiederholung
- [x] ADR-014: Fisher-Yates Shuffle für Antworten
- [x] ADR-015: Migration-Strategie für Breaking Changes
- [x] PATTERN-Soft-Delete
- [x] PATTERN-Fisher-Yates-Shuffle
- [x] PATTERN-Migration-Script
- [x] Sprint-8-Analyse dokumentiert
- [x] Sprint-8-Dependencies-Risks dokumentiert
- [x] Sprint-8-Roadmap dokumentiert

## Sprint 9 - E-Mail & Mini-Quiz (Geplant: 03.02.2026)

### Feature 1: Mini-Quiz nach Lernphase
- [ ] Backend: 5 zufällige Fragen aus allen Themen auswählen
- [ ] Backend: Quiz-Score berechnen
- [ ] Frontend: Quiz-UI mit 5 Fragen
- [ ] Frontend: Ergebnis-Anzeige
- [ ] Tests: Unit Tests

### Feature 2: E-Mail-Versand
- [ ] Backend: E-Mail-Service Integration (Resend/SendGrid)
- [ ] Backend: E-Mail-Templates (Einladung, Kurszuweisung, Zertifikat)
- [ ] Backend: E-Mail-Versand bei Einladung
- [ ] Backend: E-Mail-Versand bei Kurszuweisung
- [ ] Backend: E-Mail-Versand bei Zertifikat
- [ ] Tests: E-Mail-Versand testen

### Feature 3: Passwort-Reset
- [ ] Backend: Passwort-Reset-Token generieren
- [ ] Backend: E-Mail mit Reset-Link
- [ ] Frontend: Passwort-Reset-Seite
- [ ] Tests: Passwort-Reset Flow testen

## Sprint 10+ - Langfristige Features (Q1-Q3 2026)

### Q1 2026 (Feb-März)
- [ ] Analytics-Dashboard (Welche Fragen sind am schwierigsten?)
- [ ] Gamification (Badges, Punkte, Leaderboard)
- [ ] Video-Tutorials (Optional)
- [ ] Mobile App (Optional)

### Q2 2026 (Apr-Jun)
- [ ] Multi-Language Support (Englisch, Französisch)
- [ ] Advanced Reporting (Excel-Export, PDF-Reports)
- [ ] API für externe Systeme
- [ ] Single Sign-On (SSO)

### Q3 2026 (Jul-Sep)
- [ ] AI-gestützte Fragen-Generierung
- [ ] Adaptive Learning (Schwierigkeit anpassen)
- [ ] Live-Chat Support
- [ ] White-Label Option


### Bug-Fix: Dashboard zeigt inaktive Kurse
- [x] Dashboard.tsx: `listAll` → `listActive` ändern
- [x] Anzahl nur aktive Kurse zählen (nicht alle 8)
- [x] Nur aktive Kurse in Kurs-Vorschau anzeigen


### Micro-Prompt 2a: Backend-Vorbereitung (29.01.2026)
- [x] Schema: courseType enum prüfen (learning/sensitization/certification)
- [x] Frontend: Kurstyp-Dropdown Label ändern ("Sensitization (Lernmodus)" statt "3/5 richtig")
- [x] Backend: Fisher-Yates Shuffle-Algorithmus implementieren
- [x] Backend: `shuffleQuestionAnswers()` Helper-Funktion
- [x] Tests: Shuffle-Algorithmus Unit Tests (12 Tests, alle bestanden)
