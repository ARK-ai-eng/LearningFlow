# Sprint 8 - Roadmap & Zeitplan

**Datum**: 29.01.2026  
**Sprint-Dauer**: 2-3 Tage  
**Gesamt-Aufwand**: 10-13 Stunden  
**Ziel**: Kurs-Management & Lern-Flow Verbesserungen

---

## Sprint-Übersicht

| Sprint | Thema | Features | Aufwand | Status |
|--------|-------|----------|---------|--------|
| **Sprint 8** | Kurs-Management & Lern-Flow | 2 | 10-13h | 🔄 Geplant |
| **Sprint 9** | E-Mail & Mini-Quiz | 3 | 8-10h | ⏳ Später |
| **Sprint 10+** | Analytics & Gamification | TBD | TBD | ⏳ Später |

---

## Sprint 8 - Detaillierter Zeitplan

### Phase 1: Kurs-Status-Management (Tag 1)

**Aufwand**: 3-4 Stunden  
**Priorität**: 🔴 Hoch  
**Abhängigkeiten**: Keine

#### Aufgaben

| Aufgabe | Aufwand | Verantwortlich | Status |
|---------|---------|----------------|--------|
| **1.1 Datenbank prüfen** | 15 min | Backend Dev | ⏳ |
| - Prüfen ob `courses.isActive` existiert | | | |
| - Falls nicht: Migration erstellen | | | |
| **1.2 Backend-Endpoints** | 1h | Backend Dev | ⏳ |
| - `course.deactivate()` | 20 min | | |
| - `course.activate()` | 20 min | | |
| - `course.list()` mit Sortierung | 20 min | | |
| **1.3 Frontend-UI** | 1.5h | Frontend Dev | ⏳ |
| - Visuelle Unterscheidung (Opacity, Badge) | 30 min | | |
| - Toggle-Button (Aktivieren/Deaktivieren) | 30 min | | |
| - Filter (Alle/Aktiv/Inaktiv) | 30 min | | |
| **1.4 Testing** | 30 min | QA | ⏳ |
| - Unit Tests | 15 min | | |
| - Manual Testing | 15 min | | |
| **1.5 Code Review** | 30 min | Senior Dev | ⏳ |

**Checkpoint**: Feature 1 abgeschlossen, getestet, reviewed

---

### Phase 2: ADR-Dokumentation (Tag 1-2)

**Aufwand**: 1 Stunde  
**Priorität**: 🔴 Kritisch (Blocker für Phase 3)  
**Abhängigkeiten**: Keine

#### Aufgaben

| Aufgabe | Aufwand | Verantwortlich | Status |
|---------|---------|----------------|--------|
| **2.1 ADR-013 schreiben** | 20 min | Senior Dev | ⏳ |
| - Thema: Soft-Delete für Kurse | | | |
| - Problem, Optionen, Entscheidung | | | |
| **2.2 ADR-014 schreiben** | 20 min | Senior Dev | ⏳ |
| - Thema: Breaking Change Strategie | | | |
| - Migration-Plan dokumentieren | | | |
| **2.3 ADR-015 schreiben** | 20 min | Senior Dev | ⏳ |
| - Thema: Fortschritt-Berechnung bei Wiederholung | | | |
| - Optionen vergleichen, Entscheidung treffen | | | |

**Checkpoint**: ADRs geschrieben, Phase 3 kann starten

---

### Phase 3: Lern-Flow Logik (Tag 2-3)

**Aufwand**: 6-8 Stunden  
**Priorität**: 🔴 Hoch  
**Abhängigkeiten**: ADR-014, ADR-015

#### Aufgaben

| Aufgabe | Aufwand | Verantwortlich | Status |
|---------|---------|----------------|--------|
| **3.1 Migration-Script** | 1h | Backend Dev | ⏳ |
| - Alte Fortschritte analysieren | 20 min | | |
| - Migration-Script schreiben | 30 min | | |
| - Auf Staging testen | 10 min | | |
| **3.2 Shuffle-Algorithmus** | 1h | Backend Dev | ⏳ |
| - Fisher-Yates implementieren | 30 min | | |
| - Unit Tests schreiben | 30 min | | |
| **3.3 Backend-Endpoints** | 2h | Backend Dev | ⏳ |
| - `progress.getIncorrectQuestions()` | 30 min | | |
| - `progress.calculateScore()` (% basiert) | 30 min | | |
| - `progress.repeatIncorrectQuestions()` | 30 min | | |
| - Antworten-Shuffle in API | 30 min | | |
| **3.4 Frontend-UI** | 2-3h | Frontend Dev | ⏳ |
| - "Nächste Frage" Button (statt "Thema abschließen") | 30 min | | |
| - Dialog: "Fehlerhafte Fragen wiederholen?" | 30 min | | |
| - Anzeige: Nur falsche Fragen | 30 min | | |
| - Fortschritt-Anzeige: % statt "3/5 richtig" | 30 min | | |
| - Antworten-Reihenfolge shuffeln | 30 min | | |
| **3.5 Testing** | 1-2h | QA | ⏳ |
| - Unit Tests (Shuffle, Fortschritt) | 30 min | | |
| - Integration Tests | 30 min | | |
| - Manual Testing | 30 min | | |
| - User Testing (5 Personen) | 30 min | | |
| **3.6 Code Review** | 1h | Senior Dev | ⏳ |

**Checkpoint**: Feature 2 abgeschlossen, getestet, reviewed

---

## Zeitplan-Visualisierung

```
Tag 1 (29.01.2026):
├── 09:00 - 10:00 │ 1.1 Datenbank prüfen + 1.2 Backend-Endpoints (Teil 1)
├── 10:00 - 11:30 │ 1.2 Backend-Endpoints (Teil 2) + 1.3 Frontend-UI (Teil 1)
├── 11:30 - 13:00 │ 1.3 Frontend-UI (Teil 2)
├── 13:00 - 14:00 │ Pause
├── 14:00 - 15:00 │ 1.4 Testing + 1.5 Code Review
├── 15:00 - 16:00 │ 2.1 ADR-013, 2.2 ADR-014, 2.3 ADR-015
└── 16:00 - 17:00 │ Puffer / Dokumentation

Tag 2 (30.01.2026):
├── 09:00 - 10:00 │ 3.1 Migration-Script
├── 10:00 - 11:00 │ 3.2 Shuffle-Algorithmus
├── 11:00 - 13:00 │ 3.3 Backend-Endpoints
├── 13:00 - 14:00 │ Pause
├── 14:00 - 17:00 │ 3.4 Frontend-UI
└── 17:00 - 18:00 │ Puffer

Tag 3 (31.01.2026):
├── 09:00 - 11:00 │ 3.5 Testing (Unit + Integration + Manual)
├── 11:00 - 12:00 │ 3.6 Code Review
├── 12:00 - 13:00 │ Pause
├── 13:00 - 14:00 │ Fixes nach Code Review
├── 14:00 - 15:00 │ Staging-Deployment + Test
├── 15:00 - 16:00 │ Production-Deployment
└── 16:00 - 17:00 │ Monitoring + Dokumentation
```

---

## Meilensteine

| Meilenstein | Datum | Kriterien | Status |
|-------------|-------|-----------|--------|
| **M1: Feature 1 abgeschlossen** | 29.01 15:00 | Tests bestehen, Code reviewed | ⏳ |
| **M2: ADRs dokumentiert** | 29.01 16:00 | ADR-013, 014, 015 geschrieben | ⏳ |
| **M3: Migration-Script bereit** | 30.01 10:00 | Auf Staging getestet | ⏳ |
| **M4: Backend abgeschlossen** | 30.01 13:00 | Endpoints implementiert, getestet | ⏳ |
| **M5: Frontend abgeschlossen** | 30.01 17:00 | UI implementiert, getestet | ⏳ |
| **M6: Sprint 8 abgeschlossen** | 31.01 16:00 | Production-Deployment erfolgreich | ⏳ |

---

## Risiko-Puffer

| Risiko | Wahrscheinlichkeit | Puffer-Zeit | Mitigation |
|--------|-------------------|-------------|------------|
| **Migration-Script Fehler** | 🟡 Mittel | +1h | Staging-Test vor Production |
| **Shuffle-Algorithmus Bug** | 🟢 Niedrig | +30min | Unit Tests |
| **UX-Verwirrung** | 🟡 Mittel | +1h | User Testing |
| **Code Review Feedback** | 🟡 Mittel | +1h | Fixes einplanen |
| **Deployment-Probleme** | 🟢 Niedrig | +30min | Rollback-Plan bereit |

**Gesamt-Puffer**: 4 Stunden (eingerechnet in Tag 3)

---

## Sprint 9 - Vorschau (Später)

**Datum**: 03.02.2026 - 05.02.2026  
**Aufwand**: 8-10 Stunden

### Features

| Feature | Aufwand | Priorität | Beschreibung |
|---------|---------|-----------|--------------|
| **Mini-Quiz** | 3-4h | Mittel | 5 zufällige Fragen nach Lernphase |
| **E-Mail-Versand** | 4-5h | Hoch | Benachrichtigungen bei Kurszuweisungen |
| **Passwort-Reset** | 3-4h | Mittel | E-Mail-basiertes Self-Service |

---

## Sprint 10+ - Langfristige Roadmap

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

---

## Erfolgs-Kriterien

### Sprint 8

| Kriterium | Ziel | Messung |
|-----------|------|---------|
| **Feature 1 abgeschlossen** | 100% | ✅ Tests bestehen, Code reviewed |
| **Feature 2 abgeschlossen** | 100% | ✅ Tests bestehen, Code reviewed |
| **Keine kritischen Bugs** | 0 | ✅ Production läuft stabil |
| **User Feedback** | >80% positiv | ✅ User Testing (5 Personen) |
| **Performance** | <2s Ladezeit | ✅ Monitoring |

### Sprint 9

| Kriterium | Ziel | Messung |
|-----------|------|---------|
| **E-Mail-Versand funktioniert** | 100% | ✅ Test-E-Mails erhalten |
| **Mini-Quiz funktioniert** | 100% | ✅ 5 zufällige Fragen |
| **Passwort-Reset funktioniert** | 100% | ✅ E-Mail erhalten, Passwort geändert |

---

## Team-Kapazität

| Rolle | Verfügbarkeit | Aufgaben |
|-------|---------------|----------|
| **Senior Dev** | 100% (8h/Tag) | ADRs, Code Review, Risiko-Management |
| **Backend Dev** | 100% (8h/Tag) | Endpoints, Migration, Shuffle |
| **Frontend Dev** | 100% (8h/Tag) | UI, UX, Testing |
| **QA** | 50% (4h/Tag) | Testing, User Testing |

**Gesamt-Kapazität**: 28 Stunden/Tag  
**Sprint 8 Aufwand**: 10-13 Stunden  
**Puffer**: 15+ Stunden

---

## Kommunikations-Plan

| Event | Frequenz | Teilnehmer | Zweck |
|-------|----------|------------|-------|
| **Daily Standup** | Täglich 09:00 | Alle | Status, Blocker, Plan |
| **Code Review** | Nach jedem Feature | Senior Dev + Dev | Qualität sichern |
| **Sprint Review** | Ende Sprint 8 | Alle + Stakeholder | Demo, Feedback |
| **Sprint Retrospective** | Ende Sprint 8 | Alle | Lessons Learned |

---

**Status**: ✅ Roadmap erstellt  
**Nächster Schritt**: Wissensmanagement-System aktualisieren  
**Kritische Punkte**: ADRs MÜSSEN am Tag 1 geschrieben werden
