# Senior Dev Review: Schritt 1 - Datenmodell Migration + API

**Datum**: 29.01.2026  
**Reviewer**: Senior Fullstack Dev (30 Jahre Erfahrung)  
**Sprint**: Sprint 8 - Lern-Flow Persistenz & Pausierung

---

## Anforderung

**User Story**:
> Als Mitarbeiter möchte ich den Lern-Flow jederzeit pausieren und später weitermachen können, wobei ich visuell sehe, welche Fragen ich bereits beantwortet habe (richtig/falsch) und welche noch offen sind.

---

## Kategorisierung

| Aspekt | Bewertung |
|--------|-----------|
| **Typ** | 70% Feature (neue Funktionalität), 30% Bug-Fix (Fortschritt 100% Problem) |
| **Komplexität** | Hoch (Datenmodell-Änderung + Migration + API + UI) |
| **Priorität** | **Kritisch** - Blockiert User Experience, verhindert sinnvolles Lernen |
| **Risiko** | **Hoch** - Datenmodell-Änderung kann bestehende Daten brechen |
| **Aufwand** | 6-8 Stunden (Migration 2h, API 2h, UI 3h, Tests 1h) |

---

## Abhängigkeiten

### Voraussetzungen (MUST)
1. ✅ Bestehende `progress` Tabelle (vorhanden)
2. ✅ `question` Tabelle mit allen Fragen (vorhanden)
3. ✅ User-Authentication (vorhanden)

### Blockiert durch (NONE)
- Keine Blocker

### Blockiert (CRITICAL)
- **Schritt 2-6** können nicht ohne Schritt 1 implementiert werden
- **Fortschritt-Dashboard** zeigt falsche Werte ohne neue Datenstruktur
- **Dialog-Logik** funktioniert nicht ohne Tracking

---

## Risiko-Analyse

### 🔴 Kritische Risiken

#### 1. Daten-Migration kann fehlschlagen
**Problem**: Bestehende `progress` Einträge haben keine `questionProgress` Daten  
**Impact**: User verlieren ihren Fortschritt  
**Wahrscheinlichkeit**: Mittel  
**Mitigation**:
- Migration-Script mit Rollback-Plan
- Backup vor Migration
- Staging-Test mit Produktions-Daten-Klon

#### 2. Performance-Problem bei vielen Fragen
**Problem**: 1000 User × 50 Fragen = 50.000 Rows in `questionProgress`  
**Impact**: Langsame Queries, schlechte UX  
**Wahrscheinlichkeit**: Hoch (bei Skalierung)  
**Mitigation**:
- Index auf `(userId, questionId)`
- Index auf `(userId, topicId, status)`
- Lazy Loading (nur aktuelle Thema-Fragen laden)

#### 3. Race Conditions bei gleichzeitigen Antworten
**Problem**: User klickt schnell mehrere Antworten → Doppelte Einträge  
**Impact**: Falsche Fortschritts-Berechnung  
**Wahrscheinlichkeit**: Niedrig (aber möglich)  
**Mitigation**:
- Unique Constraint auf `(userId, questionId)`
- Optimistic Locking mit `updatedAt`

### 🟡 Mittlere Risiken

#### 4. Komplexität der Fortschritts-Berechnung
**Problem**: Fortschritt muss aus `questionProgress` aggregiert werden  
**Impact**: Komplexe Queries, schwer zu debuggen  
**Wahrscheinlichkeit**: Mittel  
**Mitigation**:
- Denormalisierung: `topicProgress.completedQuestions` Counter
- Cached Aggregation

#### 5. UI-Komplexität steigt
**Problem**: Fragen-Liste + Einzelfrage-Ansicht + Sortierung + Filtering  
**Impact**: Mehr Code, mehr Bugs  
**Wahrscheinlichkeit**: Hoch  
**Mitigation**:
- Komponenten-Aufteilung (QuestionList, QuestionCard, QuestionDetail)
- Shared State Management (React Context oder Zustand)

---

## Technische Entscheidungen

### Datenmodell-Design

**Option A: Neue Tabelle `questionProgress`** ⭐ **EMPFOHLEN**
```sql
CREATE TABLE questionProgress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  questionId INT NOT NULL,
  topicId INT NOT NULL,
  status ENUM('unanswered', 'correct', 'incorrect') DEFAULT 'unanswered',
  attemptCount INT DEFAULT 0,
  lastAttemptAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_question (userId, questionId),
  INDEX idx_user_topic_status (userId, topicId, status),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (topicId) REFERENCES topics(id) ON DELETE CASCADE
);
```

**Vorteile**:
- ✅ Granulares Tracking (pro Frage)
- ✅ Einfache Queries für "falsche Fragen"
- ✅ Skalierbar (Indexes)
- ✅ Historische Daten (attemptCount)

**Nachteile**:
- ❌ Viele Rows (User × Fragen)
- ❌ Migration komplex

**Option B: JSON-Feld in `progress` Tabelle** ❌ **NICHT EMPFOHLEN**
```sql
ALTER TABLE progress ADD COLUMN questionStatuses JSON;
-- Beispiel: {"123": "correct", "124": "incorrect"}
```

**Vorteile**:
- ✅ Keine neue Tabelle
- ✅ Einfache Migration

**Nachteile**:
- ❌ Schwer zu querien ("Zeige alle falschen Fragen")
- ❌ Keine Foreign Keys
- ❌ Nicht skalierbar
- ❌ Schwer zu debuggen

**Entscheidung**: **Option A** - Neue Tabelle `questionProgress`

---

### API-Design

**Endpoints**:

1. `question.getProgress` - Holt Fortschritt für ein Thema
```typescript
input: { topicId: number }
output: {
  questions: Array<{
    id: number;
    questionText: string;
    status: 'unanswered' | 'correct' | 'incorrect';
    attemptCount: number;
  }>;
  stats: {
    total: number;
    answered: number;
    correct: number;
    incorrect: number;
    percentComplete: number;
  };
}
```

2. `question.submitAnswer` - Speichert Antwort
```typescript
input: { 
  questionId: number; 
  answer: 'A' | 'B' | 'C' | 'D';
  topicId: number;
}
output: {
  correct: boolean;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  newStatus: 'correct' | 'incorrect';
}
```

3. `question.getIncorrectQuestions` - Holt nur falsche Fragen
```typescript
input: { topicId: number }
output: Array<{
  id: number;
  questionText: string;
  options: Array<{ label: string; text: string }>;
  attemptCount: number;
}>
```

---

## Implementierungs-Plan

### Phase 1: Datenmodell (2h)
1. Schema erweitern (`drizzle/schema.ts`)
2. Migration-Script schreiben
3. `pnpm db:push` ausführen
4. Daten verifizieren

### Phase 2: API (2h)
1. `question.getProgress` Endpoint
2. `question.submitAnswer` Endpoint
3. `question.getIncorrectQuestions` Endpoint
4. Unit Tests (9 Tests)

### Phase 3: UI (3h)
1. Fragen-Liste Komponente
2. Einzelfrage-Ansicht
3. Status-Icons (✅❌⚪)
4. Sortierung & Filtering

### Phase 4: Integration & Tests (1h)
1. E2E-Tests
2. Manual Testing
3. Checkpoint

---

## Warnung vor technischer Schuld

### ⚠️ Wenn wir das NICHT richtig machen

**Problem 1: Keine Indexes**
- Queries werden langsam bei 10.000+ Users
- Dashboard lädt 5+ Sekunden
- User beschweren sich

**Problem 2: Keine Unique Constraint**
- Doppelte Einträge
- Fortschritt zeigt 150% an
- Datenbank-Inkonsistenz

**Problem 3: Keine Migration-Rollback**
- Migration schlägt fehl
- Produktions-Datenbank kaputt
- Downtime 2+ Stunden

**Problem 4: Keine Denormalisierung**
- Jede Fortschritts-Anzeige braucht Aggregation
- 10+ SQL Queries pro Page Load
- Server-Überlastung

---

## Empfehlung

**Implementierung**: ✅ **GO**

**Begründung**:
1. Kritisch für User Experience
2. Technisch machbar (6-8h)
3. Risiken sind bekannt und mitigierbar
4. Blockiert andere Features

**Vorgehen**:
1. **Staging zuerst**: Migration auf Staging testen
2. **Backup**: Produktions-DB vor Migration
3. **Schrittweise**: Phase 1 → Test → Phase 2 → Test → ...
4. **Rollback-Plan**: Wenn Migration fehlschlägt, wie zurück?

**Nicht implementieren wenn**:
- ❌ Keine Zeit für Tests (Risiko zu hoch)
- ❌ Keine Staging-Umgebung (Produktions-Test zu riskant)
- ❌ Keine DB-Backup-Strategie (Datenverlust-Risiko)

---

## Nächste Schritte

1. **Jetzt**: Todo.md aktualisieren mit detaillierten Tasks
2. **Dann**: Phase 1 implementieren (Datenmodell)
3. **Danach**: Phase 2 implementieren (API)
4. **Zuletzt**: Phase 3+4 (UI + Tests)

**Geschätzte Fertigstellung**: 29.01.2026 (Ende des Tages)
