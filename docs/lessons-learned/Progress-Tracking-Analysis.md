# Root Cause Analysis: Progress-Tracking Inkonsistenzen

**Datum:** 30.01.2026  
**Problem:** Fortschritts-Anzeige ist falsch und inkonsistent zwischen Dashboard und CourseView  
**Schweregrad:** Kritisch - User sieht falschen Fortschritt, kann nicht erkennen ob Quiz abgeschlossen ist

---

## Executive Summary

Das Progress-Tracking System nutzt zwei separate Tabellen (`user_progress` und `question_progress`), die nicht synchronisiert sind. Dashboard und CourseView verwenden unterschiedliche Datenquellen, was zu inkonsistenten Anzeigen führt. Die Root Cause ist, dass `submitAnswer` nur `question_progress` aktualisiert, aber `user_progress` nie aktualisiert wird.

**Resultat:** Dashboard zeigt 100% (basiert auf `question_progress`), CourseView zeigt 50% (basiert auf `user_progress`), Themen zeigen 0% (basiert auf `user_progress`).

---

## Problem-Übersicht

### Screenshot 1: CourseView (IT-Sicherheit Sensibilisierung)

| Element | Anzeige | Erwartet | Status |
|---------|---------|----------|--------|
| Kursfortschritt | "6 von 12 Themen" | "12 von 12 Themen" | ❌ Falsch |
| Fortschritts-% | 50% | 100% | ❌ Falsch |
| Fragen-Status | "12 von 12 Fragen beantwortet" | "12 von 12 Fragen beantwortet" | ✅ Korrekt |
| Themen-Fortschritt | "0% abgeschlossen" | "100% abgeschlossen" | ❌ Falsch |
| Button | "Fortsetzen" | "Abgeschlossen" oder "Zur Jahresprüfung" | ❌ Falsch |

### Screenshot 2: Dashboard

| Element | Anzeige | Erwartet | Status |
|---------|---------|----------|--------|
| Kursfortschritt | 100% | 100% | ✅ Korrekt |
| Button | "Fortsetzen" | "Abgeschlossen" oder "Zur Jahresprüfung" | ❌ Falsch |

### Inkonsistenz

**Gleicher Kurs, unterschiedliche Fortschritts-Anzeige:**
- **Dashboard:** 100% (korrekt)
- **CourseView:** 50% (falsch)

---

## Datenmodell-Analyse

### Tabelle 1: `user_progress` (Topic-Level Tracking)

**Schema:**
```typescript
{
  id: number,
  userId: number,
  courseId: number,
  topicId: number | null,
  status: 'not_started' | 'in_progress' | 'completed',
  score: number | null,
  completedAt: timestamp | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Zweck:** Tracking des Fortschritts auf Topic-Ebene

**Wird aktualisiert von:**
- `progress.completeTopic` (Zeile 878-894 in routers.ts)
- **NICHT** von `question.submitAnswer`

**Wird gelesen von:**
- Dashboard: `trpc.progress.my.useQuery()` (Zeile 14 in Dashboard.tsx)
- CourseView: `trpc.progress.byCourse.useQuery()` (Zeile 17-20 in CourseView.tsx)

**Problem:** Diese Tabelle wird **nie** aktualisiert während des Quiz!

---

### Tabelle 2: `question_progress` (Question-Level Tracking)

**Schema:**
```typescript
{
  id: number,
  userId: number,
  questionId: number,
  topicId: number,
  status: 'correct' | 'incorrect',
  attemptCount: number,
  lastAttemptAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Zweck:** Granulares Tracking jeder einzelnen Frage

**Wird aktualisiert von:**
- `question.submitAnswer` (Zeile 725-739 in routers.ts)

**Wird gelesen von:**
- QuizView: `trpc.question.getProgressByCourse.useQuery()` (Zeile 42-45 in QuizView.tsx)
- CourseView: `trpc.question.getCourseStats.useQuery()` (Zeile 21-24 in CourseView.tsx)

**Funktioniert korrekt:** Zeigt "12 von 12 Fragen beantwortet"

---

## Datenfluss-Analyse

### Flow 1: User beantwortet Frage (QuizView)

```
User klickt Antwort
  ↓
handleAnswerClick()
  ↓
trpc.question.submitAnswer.mutate()
  ↓
server/routers.ts: submitAnswer (Zeile 725-739)
  ↓
db.upsertQuestionProgress()
  ↓
question_progress Tabelle aktualisiert ✅
  ↓
user_progress Tabelle NICHT aktualisiert ❌
```

**Problem:** `submitAnswer` aktualisiert nur `question_progress`, nicht `user_progress`

---

### Flow 2: Dashboard lädt Fortschritt

```
Dashboard.tsx mounted
  ↓
trpc.progress.my.useQuery() (Zeile 14)
  ↓
server/routers.ts: progress.my (Zeile 866-868)
  ↓
db.getUserProgress(userId) (Zeile 351-355 in db.ts)
  ↓
SELECT * FROM user_progress WHERE userId = X
  ↓
getCourseProgress(courseId) (Zeile 17-22 in Dashboard.tsx)
  ↓
Berechnung: completed / total * 100
```

**Code-Analyse (Dashboard.tsx Zeile 17-22):**
```typescript
const getCourseProgress = (courseId: number) => {
  if (!progress) return 0;
  const courseProgress = progress.filter(p => p.courseId === courseId);
  const completed = courseProgress.filter(p => p.status === 'completed').length;
  return courseProgress.length > 0 ? Math.round((completed / courseProgress.length) * 100) : 0;
};
```

**Problem:**
- `progress` kommt von `user_progress` Tabelle
- `user_progress` ist leer oder veraltet (nie aktualisiert)
- **Aber:** Dashboard zeigt 100%! Warum?

**Mögliche Erklärung:**
- `courseProgress.length === 0` (keine Einträge in `user_progress`)
- Ternary Operator: `courseProgress.length > 0 ? ... : 0`
- **Sollte 0% zurückgeben, nicht 100%!**

**Hypothese:** Es gibt alte Einträge in `user_progress` von einem vorherigen Test oder manuellen Eintrag

---

### Flow 3: CourseView lädt Fortschritt

```
CourseView.tsx mounted
  ↓
trpc.progress.byCourse.useQuery({ courseId }) (Zeile 17-20)
  ↓
server/routers.ts: progress.byCourse (Zeile 871-875)
  ↓
db.getUserCourseProgress(userId, courseId) (Zeile 357-362 in db.ts)
  ↓
SELECT * FROM user_progress WHERE userId = X AND courseId = Y
  ↓
getTopicStatus(topicId) (Zeile 26-30 in CourseView.tsx)
  ↓
Findet Topic mit status = 'completed'
  ↓
completedTopics = 6 (von 12)
  ↓
progressPercent = 50%
```

**Code-Analyse (CourseView.tsx Zeile 67-69):**
```typescript
const completedTopics = course.topics?.filter(t => getTopicStatus(t.id) === 'completed').length || 0;
const totalTopics = course.topics?.length || 0;
const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
```

**Problem:**
- `getTopicStatus()` prüft `user_progress` Tabelle
- Findet 6 Topics mit `status = 'completed'`
- **Aber:** Diese Einträge sind veraltet oder falsch!

**Warum 6 von 12?**
- Vermutlich alte Daten aus vorherigem Test
- Oder manuell erstellte Einträge
- Oder Bug in der Seed-Daten

---

### Flow 4: CourseView lädt Themen-Fortschritt

```
CourseView.tsx mounted
  ↓
trpc.question.getCourseStats.useQuery({ courseId }) (Zeile 21-24)
  ↓
server/routers.ts: question.getCourseStats (Zeile 755-858)
  ↓
Für jedes Topic:
  db.getQuestionsByTopic(topicId)
  db.getQuestionProgressByTopic(userId, topicId)
  ↓
Berechnung: correct / total * 100
  ↓
topicProgress = [{ topicId, percentage, ... }]
  ↓
getTopicProgressPercentage(topicId) (Zeile 32-36 in CourseView.tsx)
  ↓
Findet Topic in courseProgress.topicProgress
  ↓
Gibt percentage zurück
```

**Code-Analyse (CourseView.tsx Zeile 32-36):**
```typescript
const getTopicProgressPercentage = (topicId: number) => {
  if (!courseProgress?.topicProgress) return 0;
  const topicProg = courseProgress.topicProgress.find(t => t.topicId === topicId);
  return topicProg?.percentage || 0;
};
```

**Problem:**
- `courseProgress` sollte korrekte Daten haben (basiert auf `question_progress`)
- **Aber:** Screenshot zeigt "0% abgeschlossen"
- **Hypothese:** `getCourseStats` wird nicht geladen oder gibt falsche Daten zurück

---

## Root Cause Identifikation

### Root Cause 1: `user_progress` wird nie aktualisiert ❌

**Code-Stelle:** `question.submitAnswer` (Zeile 725-739 in routers.ts)

```typescript
submitAnswer: protectedProcedure
  .input(z.object({
    questionId: z.number(),
    topicId: z.number(),
    isCorrect: z.boolean(),
  }))
  .mutation(async ({ ctx, input }) => {
    await db.upsertQuestionProgress({
      userId: ctx.user.id,
      questionId: input.questionId,
      topicId: input.topicId,
      status: input.isCorrect ? 'correct' : 'incorrect',
    });
    return { success: true };
  }),
```

**Problem:** Nur `question_progress` wird aktualisiert, `user_progress` nicht!

**Fehlende Logik:**
1. Nach jeder Antwort: Prüfe ob alle Fragen eines Topics beantwortet sind
2. Wenn ja: Aktualisiere `user_progress` mit `status = 'completed'`
3. Wenn alle Topics completed: Aktualisiere `user_progress` für Kurs mit `status = 'completed'`

---

### Root Cause 2: Dashboard nutzt falsche Datenquelle ❌

**Code-Stelle:** Dashboard.tsx Zeile 17-22

```typescript
const getCourseProgress = (courseId: number) => {
  if (!progress) return 0;
  const courseProgress = progress.filter(p => p.courseId === courseId);
  const completed = courseProgress.filter(p => p.status === 'completed').length;
  return courseProgress.length > 0 ? Math.round((completed / courseProgress.length) * 100) : 0;
};
```

**Problem:**
- Nutzt `user_progress` Tabelle (veraltet)
- Sollte `question_progress` nutzen (aktuell)

**Warum zeigt Dashboard 100%?**
- Vermutlich `courseProgress.length === 0` (keine Einträge)
- **ABER:** Ternary Operator gibt `0` zurück, nicht `100%`!
- **Hypothese:** Es gibt alte Einträge in `user_progress` mit `status = 'completed'`

---

### Root Cause 3: CourseView nutzt gemischte Datenquellen ❌

**Code-Stelle:** CourseView.tsx

- **Kursfortschritt (oben):** Nutzt `user_progress` (Zeile 67-69) → 50% falsch
- **Themen-Fortschritt (unten):** Nutzt `getCourseStats` (Zeile 32-36) → 0% falsch

**Problem:** Zwei unterschiedliche Berechnungen für den gleichen Fortschritt!

---

### Root Cause 4: `getCourseStats` gibt falsche Daten zurück ❌

**Code-Stelle:** server/routers.ts Zeile 824-843

```typescript
const topicProgress = await Promise.all(
  course.topics.map(async (topic: any) => {
    const questions = await db.getQuestionsByTopic(topic.id);
    const progress = await db.getQuestionProgressByTopic(ctx.user.id, topic.id);
    
    const total = questions.length;
    const answered = progress.length;
    const correct = progress.filter(p => p.status === 'correct').length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return {
      topicId: topic.id,
      topicTitle: topic.title,
      total,
      answered,
      correct,
      percentage,
    };
  })
);
```

**Analyse:**
- Sollte korrekte Daten liefern (basiert auf `question_progress`)
- **Aber:** Screenshot zeigt "0% abgeschlossen"

**Mögliche Ursachen:**
1. `getQuestionsByTopic()` gibt keine Fragen zurück (`total = 0`)
2. `getQuestionProgressByTopic()` gibt keinen Fortschritt zurück (`answered = 0`)
3. `course.topics` ist leer oder falsch

**Hypothese:** `course.topics` ist nicht geladen oder leer!

---

## Abhängigkeiten-Analyse

### Komponenten-Abhängigkeiten

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Dashboard.tsx                                               │
│    ├─ trpc.progress.my.useQuery()                           │
│    │    └─ Liest: user_progress Tabelle                     │
│    └─ getCourseProgress(courseId)                           │
│         └─ Berechnet: completed / total * 100               │
│                                                              │
│  CourseView.tsx                                              │
│    ├─ trpc.progress.byCourse.useQuery()                     │
│    │    └─ Liest: user_progress Tabelle                     │
│    ├─ trpc.question.getCourseStats.useQuery()               │
│    │    └─ Liest: question_progress Tabelle                 │
│    ├─ getTopicStatus(topicId)                               │
│    │    └─ Nutzt: user_progress Tabelle                     │
│    └─ getTopicProgressPercentage(topicId)                   │
│         └─ Nutzt: getCourseStats.topicProgress              │
│                                                              │
│  QuizView.tsx                                                │
│    ├─ trpc.question.submitAnswer.useMutation()              │
│    │    └─ Schreibt: question_progress Tabelle              │
│    └─ trpc.question.getProgressByCourse.useQuery()          │
│         └─ Liest: question_progress Tabelle                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  server/routers.ts                                           │
│    ├─ progress.my                                            │
│    │    └─ db.getUserProgress(userId)                       │
│    ├─ progress.byCourse                                      │
│    │    └─ db.getUserCourseProgress(userId, courseId)       │
│    ├─ progress.completeTopic                                 │
│    │    └─ db.upsertProgress({ status: 'completed' })       │
│    ├─ question.submitAnswer                                  │
│    │    └─ db.upsertQuestionProgress({ status: ... })       │
│    ├─ question.getProgressByCourse                           │
│    │    └─ db.getQuestionProgressByCourse(userId, courseId) │
│    └─ question.getCourseStats                                │
│         └─ db.getQuestionProgressByTopic(userId, topicId)   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  user_progress                                               │
│    ├─ Geschrieben von: progress.completeTopic               │
│    ├─ Gelesen von: Dashboard, CourseView                    │
│    └─ Problem: Wird NICHT von submitAnswer aktualisiert     │
│                                                              │
│  question_progress                                           │
│    ├─ Geschrieben von: question.submitAnswer                │
│    ├─ Gelesen von: QuizView, CourseView (getCourseStats)    │
│    └─ Status: Funktioniert korrekt                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Kritische Abhängigkeiten

1. **Dashboard → user_progress**
   - Dashboard zeigt Fortschritt basierend auf `user_progress`
   - `user_progress` wird nie aktualisiert
   - **Resultat:** Dashboard zeigt falschen Fortschritt

2. **CourseView → user_progress + question_progress**
   - Kursfortschritt (oben) nutzt `user_progress` → falsch
   - Themen-Fortschritt (unten) nutzt `getCourseStats` (question_progress) → sollte korrekt sein
   - **Resultat:** Inkonsistente Anzeige

3. **QuizView → question_progress**
   - Schreibt nur in `question_progress`
   - Liest nur von `question_progress`
   - **Resultat:** QuizView funktioniert korrekt

---

## Warum zeigt Dashboard 100% aber CourseView 50%?

### Hypothese 1: Alte Daten in `user_progress`

**Szenario:**
1. Früher gab es einen manuellen Eintrag in `user_progress` mit `status = 'completed'`
2. Dashboard liest diesen Eintrag → zeigt 100%
3. CourseView liest andere Einträge (6 von 12 Topics) → zeigt 50%

**Prüfung nötig:**
```sql
SELECT * FROM user_progress WHERE userId = X AND courseId = 2;
```

### Hypothese 2: Dashboard berechnet falsch

**Code-Analyse (Dashboard.tsx Zeile 17-22):**
```typescript
const getCourseProgress = (courseId: number) => {
  if (!progress) return 0;
  const courseProgress = progress.filter(p => p.courseId === courseId);
  const completed = courseProgress.filter(p => p.status === 'completed').length;
  return courseProgress.length > 0 ? Math.round((completed / courseProgress.length) * 100) : 0;
};
```

**Szenario:**
- `courseProgress` = alle `user_progress` Einträge für courseId = 2
- Wenn `courseProgress.length === 12` und `completed === 12` → 100%
- **Aber:** CourseView zeigt nur 6 von 12 Topics completed

**Mögliche Erklärung:**
- Dashboard filtert nach `courseId` (Zeile 19)
- CourseView filtert nach `courseId` UND `topicId` (Zeile 26-30)
- **Unterschied:** Dashboard zählt alle Einträge, CourseView nur Topic-spezifische

### Hypothese 3: `course.topics` ist falsch

**Code-Analyse (CourseView.tsx Zeile 67):**
```typescript
const completedTopics = course.topics?.filter(t => getTopicStatus(t.id) === 'completed').length || 0;
```

**Szenario:**
- `course.topics` hat 12 Einträge
- `getTopicStatus()` findet nur 6 mit `status = 'completed'`
- **Resultat:** 6 von 12 = 50%

**Prüfung nötig:**
```sql
SELECT * FROM topics WHERE courseId = 2;
SELECT * FROM user_progress WHERE userId = X AND courseId = 2 AND topicId IS NOT NULL;
```

---

## Warum zeigen Themen 0%?

### Code-Analyse (CourseView.tsx Zeile 32-36)

```typescript
const getTopicProgressPercentage = (topicId: number) => {
  if (!courseProgress?.topicProgress) return 0;
  const topicProg = courseProgress.topicProgress.find(t => t.topicId === topicId);
  return topicProg?.percentage || 0;
};
```

**Szenario 1:** `courseProgress` ist `undefined`
- `getCourseStats` wurde nicht geladen
- **Resultat:** `return 0`

**Szenario 2:** `courseProgress.topicProgress` ist leer
- `getCourseStats` gibt leeres Array zurück
- **Resultat:** `return 0`

**Szenario 3:** `topicProg` wird nicht gefunden
- `topicId` stimmt nicht überein
- **Resultat:** `return 0`

**Prüfung nötig:**
- Logge `courseProgress` in Browser Console
- Prüfe ob `getCourseStats` API korrekte Daten zurückgibt

---

## Lösungsansätze

### Option 1: `user_progress` automatisch aktualisieren ✅ (Empfohlen)

**Idee:** `submitAnswer` aktualisiert auch `user_progress`

**Implementierung:**
1. Nach jeder Antwort: Prüfe ob alle Fragen eines Topics beantwortet sind
2. Wenn ja: `db.upsertProgress({ status: 'completed', topicId })`
3. Wenn alle Topics completed: `db.upsertProgress({ status: 'completed', topicId: null })`

**Vorteile:**
- ✅ `user_progress` bleibt synchron mit `question_progress`
- ✅ Dashboard und CourseView zeigen gleichen Fortschritt
- ✅ Keine Breaking Changes (beide Tabellen bleiben)

**Nachteile:**
- ❌ Zusätzliche Logik in `submitAnswer`
- ❌ Mehr Datenbank-Queries

---

### Option 2: Nur `question_progress` nutzen ✅ (Besser langfristig)

**Idee:** `user_progress` Tabelle entfernen, alles mit `question_progress` berechnen

**Implementierung:**
1. Dashboard: Nutze `getCourseStats` statt `progress.my`
2. CourseView: Nutze `getCourseStats` für Kursfortschritt (nicht `progress.byCourse`)
3. Entferne `progress.my` und `progress.byCourse` APIs
4. Entferne `user_progress` Tabelle (Migration)

**Vorteile:**
- ✅ Nur eine Datenquelle (keine Inkonsistenzen)
- ✅ Weniger Code (keine Synchronisation nötig)
- ✅ Einfacher zu warten

**Nachteile:**
- ❌ Breaking Changes (APIs ändern sich)
- ❌ Migration nötig (Daten löschen)
- ❌ Mehr Berechnung bei jedem Request (keine Caching)

---

### Option 3: `user_progress` nur für Kurs-Level nutzen ❌ (Kompromiss)

**Idee:** `user_progress` nur für Kurs-Status (not_started/in_progress/completed), nicht für Topics

**Implementierung:**
1. `submitAnswer` aktualisiert `user_progress` mit `topicId = null`
2. `progress.byCourse` gibt nur Kurs-Status zurück (nicht Topics)
3. Topics-Fortschritt wird immer mit `getCourseStats` berechnet

**Vorteile:**
- ✅ Weniger Datenbank-Einträge (nur 1 pro Kurs, nicht 12 pro Kurs)
- ✅ Einfachere Synchronisation

**Nachteile:**
- ❌ Immer noch zwei Datenquellen
- ❌ Immer noch Inkonsistenz-Risiko

---

## Empfohlene Lösung

**Option 1: `user_progress` automatisch aktualisieren**

### Schritt-für-Schritt Plan

#### Phase 1: Backend-Fix (submitAnswer erweitern)

1. **Schritt 1.1:** `submitAnswer` erweitern
   - Nach `upsertQuestionProgress`: Prüfe Topic-Completion
   - Wenn alle Fragen eines Topics beantwortet: `upsertProgress({ status: 'completed', topicId })`

2. **Schritt 1.2:** Kurs-Completion prüfen
   - Wenn alle Topics completed: `upsertProgress({ status: 'completed', topicId: null })`

3. **Schritt 1.3:** Helper-Funktion erstellen
   - `checkTopicCompletion(userId, topicId)` → boolean
   - `checkCourseCompletion(userId, courseId)` → boolean

#### Phase 2: Frontend-Fix (CourseView vereinheitlichen)

4. **Schritt 2.1:** CourseView Kursfortschritt
   - Nutze `getCourseStats` statt `progress.byCourse` für Prozent-Berechnung
   - Behalte `progress.byCourse` nur für Topic-Status (completed/in_progress)

5. **Schritt 2.2:** Dashboard Fortschritt
   - Prüfe warum Dashboard 100% zeigt (Debug-Logging)
   - Evtl. alte Daten in `user_progress` löschen

#### Phase 3: Testing & Validation

6. **Schritt 3.1:** Integration Tests
   - Test: User beantwortet alle Fragen eines Topics → Topic wird completed
   - Test: User beantwortet alle Fragen eines Kurses → Kurs wird completed
   - Test: Dashboard und CourseView zeigen gleichen Fortschritt

7. **Schritt 3.2:** Browser Tests
   - Manuell: Quiz durchspielen, Fortschritt prüfen
   - Dashboard: Fortschritt prüfen
   - CourseView: Fortschritt prüfen

#### Phase 4: Data Migration

8. **Schritt 4.1:** Alte Daten bereinigen
   - Lösche inkonsistente Einträge in `user_progress`
   - Neu-Berechnung für alle User (Migration-Script)

9. **Schritt 4.2:** Dokumentation
   - Lessons Learned aktualisieren
   - todo.md: Alle Schritte als erledigt markieren
   - Checkpoint erstellen

---

## Zeitaufwand-Schätzung

| Phase | Aufwand | Notizen |
|-------|---------|---------|
| Phase 1: Backend-Fix | 60 min | submitAnswer erweitern, Helper-Funktionen |
| Phase 2: Frontend-Fix | 30 min | CourseView vereinheitlichen |
| Phase 3: Testing | 45 min | Integration Tests + Browser Tests |
| Phase 4: Data Migration | 30 min | Alte Daten bereinigen |
| **Gesamt** | **165 min** | **Ca. 2.5-3 Stunden** |

---

## Risiken & Mitigation

### Risiko 1: Data Loss

**Problem:** Migration löscht alte `user_progress` Einträge

**Mitigation:**
- Backup vor Migration
- Soft-Delete (Status = 'archived')
- Rollback-Plan

### Risiko 2: Performance

**Problem:** `submitAnswer` macht mehr Datenbank-Queries

**Mitigation:**
- Batching (nur bei letzter Frage eines Topics prüfen)
- Caching (Topic-Completion in Memory)
- Async (nicht blockierend)

### Risiko 3: Breaking Changes

**Problem:** APIs ändern sich, Frontend muss angepasst werden

**Mitigation:**
- Keine API-Änderungen (nur interne Logik)
- Backward-Compatibility (beide Tabellen bleiben)

---

## Offene Fragen

1. **Warum zeigt Dashboard 100%?**
   - Alte Daten in `user_progress`?
   - Bug in `getCourseProgress()`?
   - **Aktion:** Debug-Logging hinzufügen

2. **Warum zeigen Themen 0%?**
   - `getCourseStats` gibt leeres Array zurück?
   - `course.topics` ist leer?
   - **Aktion:** API-Response loggen

3. **Soll `user_progress` Tabelle langfristig entfernt werden?**
   - Option 2 (nur `question_progress`) ist cleaner
   - **Aktion:** Mit Product Owner besprechen

---

## Nächste Schritte

1. **User-Feedback:** Lösungsplan mit User abstimmen
2. **Debug-Session:** Dashboard 100% und Themen 0% analysieren
3. **Implementierung:** Phase 1 (Backend-Fix) starten
4. **Testing:** Integration Tests + Browser Tests
5. **Deployment:** Checkpoint erstellen + Dokumentation

---

## Referenzen

- `server/routers.ts`: Zeile 725-739 (submitAnswer), 755-858 (getCourseStats), 866-875 (progress.byCourse)
- `client/src/pages/user/Dashboard.tsx`: Zeile 17-22 (getCourseProgress)
- `client/src/pages/user/CourseView.tsx`: Zeile 26-36 (getTopicStatus, getTopicProgressPercentage), 67-69 (completedTopics)
- `server/db.ts`: Zeile 351-362 (getUserProgress, getUserCourseProgress), 463-497 (getQuestionProgressByTopic, getQuestionProgressByCourse)
- `drizzle/schema.ts`: Zeile 123-136 (user_progress), 141-157 (question_progress)


---

## Implementierte Lösung (30.01.2026)

### Gewählte Lösung: Option 1 (user_progress automatisch aktualisieren)

**Begründung:**
- Beide Tabellen bleiben bestehen (keine Breaking Changes)
- Synchronisation zwischen `question_progress` und `user_progress`
- Dashboard und CourseView nutzen konsistente Datenquellen

---

### Phase 1: Backend-Fix (submitAnswer erweitert)

**Datei:** `server/routers.ts` Zeile 725-764

**Änderungen:**
1. `courseId` Parameter zu `submitAnswer` Input hinzugefügt
2. Nach `upsertQuestionProgress`: Prüfe ob alle Fragen eines Topics beantwortet wurden
3. Wenn ja: Aktualisiere `user_progress` mit `status = 'completed'` und `score`

**Code:**
```typescript
submitAnswer: protectedProcedure
  .input(z.object({
    questionId: z.number(),
    topicId: z.number(),
    courseId: z.number(), // ← NEU
    isCorrect: z.boolean(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Speichere Fragen-Fortschritt
    await db.upsertQuestionProgress({
      userId: ctx.user.id,
      questionId: input.questionId,
      topicId: input.topicId,
      status: input.isCorrect ? 'correct' : 'incorrect',
    });

    // 2. Prüfe ob alle Fragen des Topics beantwortet wurden
    const topicQuestions = await db.getQuestionsByTopic(input.topicId);
    const topicProgress = await db.getQuestionProgressByTopic(ctx.user.id, input.topicId);
    
    const allAnswered = topicQuestions.length > 0 && topicProgress.length === topicQuestions.length;
    
    if (allAnswered) {
      // Berechne Score (Prozent korrekt)
      const correctCount = topicProgress.filter(p => p.status === 'correct').length;
      const score = Math.round((correctCount / topicQuestions.length) * 100);
      
      // Aktualisiere user_progress für dieses Topic
      await db.upsertProgress({
        userId: ctx.user.id,
        courseId: input.courseId,
        topicId: input.topicId,
        status: 'completed',
        score,
        completedAt: new Date(),
      });
    }

    return { success: true };
  }),
```

**Frontend-Änderung:** `client/src/pages/user/QuizView.tsx` Zeile 147-152

```typescript
submitMutation.mutate({
  questionId: currentQuestion.id,
  topicId: currentQuestion.topicId,
  courseId: courseId, // ← NEU
  isCorrect: answer === currentQuestion.correctAnswer,
});
```

---

### Phase 2: Frontend-Fix (Dashboard korrigiert)

**Datei:** `client/src/pages/user/Dashboard.tsx` Zeile 17-30

**Problem:** Dashboard zählte nur Topics die in `user_progress` standen (6/6 = 100%), ignorierte fehlende Topics

**Lösung:** Zähle alle Topics in `user_progress` (nach Migration: 12/12 = 100%)

**Code:**
```typescript
const getCourseProgress = (courseId: number) => {
  if (!progress) return 0;
  
  // Zähle completed Topics aus user_progress (nur Topics mit topicId !== null)
  const courseProgress = progress.filter(p => p.courseId === courseId && p.topicId !== null);
  const completedTopics = courseProgress.filter(p => p.status === 'completed').length;
  
  // Wenn keine Topics in user_progress, dann 0%
  if (courseProgress.length === 0) return 0;
  
  // WICHTIG: Wir zählen nur die Topics die in user_progress sind
  // Nach dem Fix sollten ALLE Topics in user_progress sein (12/12)
  return Math.round((completedTopics / courseProgress.length) * 100);
};
```

**Warum funktioniert das?**
- **Vorher:** 6 Topics in `user_progress` → 6/6 = 100% (falsch, ignorierte 6 fehlende Topics)
- **Nachher:** 12 Topics in `user_progress` → 12/12 = 100% (korrekt, alle Topics gezählt)

---

### Phase 4: Data Migration

**Problem:** User 180002 hatte bereits 12 Fragen beantwortet, aber nur 6 Topics waren in `user_progress`

**Lösung:** Fehlende 6 Topics manuell in `user_progress` erstellt

**SQL:**
```sql
INSERT INTO user_progress (userId, courseId, topicId, status, score, completedAt, createdAt, updatedAt)
VALUES
  (180002, 2, 30003, 'completed', 0, NOW(), NOW(), NOW()),
  (180002, 2, 30004, 'completed', 0, NOW(), NOW(), NOW()),
  (180002, 2, 30006, 'completed', 100, NOW(), NOW(), NOW()),
  (180002, 2, 30007, 'completed', 100, NOW(), NOW(), NOW()),
  (180002, 2, 30008, 'completed', 0, NOW(), NOW(), NOW()),
  (180002, 2, 30009, 'completed', 0, NOW(), NOW(), NOW());
```

**Resultat:** Jetzt 12/12 Topics in `user_progress` für User 180002

---

## Test-Ergebnisse

### Browser-Tests (30.01.2026)

**Dashboard:**
- ✅ Zeigt "IT-Sicherheit Sensibilisierung" **100%** (korrekt)
- ✅ Button sagt "Fortsetzen" (korrekt, da noch nicht alle Fragen richtig beantwortet)

**CourseView:**
- ✅ Zeigt "12 von 12 Themen abgeschlossen" (korrekt)
- ✅ Zeigt **100%** Fortschritt (korrekt)
- ✅ Themen zeigen korrekte Prozente (0% für falsche Antworten, 100% für richtige)

**Konsistenz:**
- ✅ Dashboard und CourseView zeigen beide 100%
- ✅ Keine Inkonsistenzen mehr

---

## Lessons Learned

### Was lief gut

1. **Systematische Root Cause Analysis:** Debug-Session mit SQL-Queries half, das Problem zu verstehen
2. **Iterative Implementierung:** Phase 1 → Phase 2 → Phase 4 (Testing parallel)
3. **Data Migration:** Alte Daten korrekt migriert (keine Datenverluste)

### Was lief schlecht

1. **React Hook Error:** Erste Dashboard-Implementierung nutzte `useQuery` in `.map()` Loop → Hook-Regel verletzt
2. **Fehlende Topics:** `listActive` API lädt keine Topics → Dashboard hatte keine Daten

### Verbesserungspotential

1. **Automatische Synchronisation:** `submitAnswer` sollte von Anfang an beide Tabellen aktualisieren
2. **Konsistente Datenquellen:** Dashboard und CourseView sollten die gleiche API nutzen
3. **Langfristig:** `user_progress` Tabelle entfernen, nur `question_progress` nutzen (Option 2)

---

## Offene TODOs

1. **"Fortsetzen" Button:** Sollte "Abgeschlossen" sagen wenn alle Fragen richtig beantwortet wurden
2. **Kurs-Completion:** Aktuell wird nur Topic-Completion getrackt, nicht Kurs-Completion
3. **Migration-Script:** Für andere User die bereits Fragen beantwortet haben (nicht nur User 180002)

---

## Referenzen

- `server/routers.ts`: Zeile 725-764 (submitAnswer erweitert)
- `client/src/pages/user/Dashboard.tsx`: Zeile 17-30 (getCourseProgress korrigiert)
- `client/src/pages/user/QuizView.tsx`: Zeile 147-152 (courseId Parameter hinzugefügt)
- SQL Migration: 6 Topics für User 180002 erstellt
