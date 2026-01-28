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
- [ ] FirmenAdmin legt Mitarbeiter direkt an (E-Mail + Passwort, keine Einladung)
- [ ] Einladungs-System deaktivieren (Code entfernen, Tabelle behalten)
- [ ] Dokumentation in docs/ aktualisieren
