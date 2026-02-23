# Sprint 8 - Schritt 2.4: Fortschritt-Dashboard mit prozentualer Anzeige

**Datum**: 29.01.2026  
**Implementiert von**: Development Team  
**Status**: ✅ Abgeschlossen

---

## Überblick

Schritt 2.4 implementiert das **Fortschritt-Dashboard** mit:
- **Backend**: Zwei neue API-Endpoints für Fortschritt-Berechnung
- **CourseView**: Prozentuale Fortschrittsanzeige pro Thema
- **Dashboard**: Prozentuale Fortschrittsanzeige pro Kurs
- **Berechnung**: Fortschritt basiert auf richtigen Antworten (nicht abgeschlossenen Themen)

---

## Was wurde implementiert?

### 1. Backend API-Endpoints

**Datei**: `server/routers.ts`

#### Endpoint 1: `question.getTopicProgress`

**Funktionalität**: Berechnet Fortschritt für ein einzelnes Thema

**Input**:
```ts
{ topicId: number }
```

**Output**:
```ts
{
  topicId: number;
  total: number;           // Gesamtanzahl Fragen
  answered: number;        // Anzahl beantworteter Fragen
  correct: number;         // Anzahl richtiger Antworten
  incorrect: number;       // Anzahl falscher Antworten
  percentage: number;      // % richtig (correct / total * 100)
}
```

**Logik**:
```ts
const questions = await db.getQuestionsByTopic(input.topicId);
const progress = await db.getQuestionProgressByTopic(ctx.user.id, input.topicId);

const total = questions.length;
const answered = progress.length;
const correct = progress.filter(p => p.status === 'correct').length;
const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
```

**Wichtig**: Percentage basiert auf `correct / total`, nicht `answered / total`

---

#### Endpoint 2: `question.getCourseProgress`

**Funktionalität**: Berechnet Fortschritt für einen gesamten Kurs

**Input**:
```ts
{ courseId: number }
```

**Output**:
```ts
{
  courseId: number;
  totalQuestions: number;      // Gesamtanzahl Fragen im Kurs
  answeredQuestions: number;   // Anzahl beantworteter Fragen
  correctAnswers: number;      // Anzahl richtiger Antworten
  percentage: number;          // % richtig (correctAnswers / totalQuestions * 100)
  topicProgress: Array<{       // Fortschritt pro Thema
    topicId: number;
    topicTitle: string;
    total: number;
    answered: number;
    correct: number;
    percentage: number;
  }>;
}
```

**Logik**:
```ts
// 1. Alle Fragen des Kurses holen
const allQuestions = await db.getQuestionsByCourse(input.courseId);
const totalQuestions = allQuestions.length;

// 2. Fortschritt für alle Topics holen
const topicProgress = await Promise.all(
  course.topics.map(async (topic) => {
    const questions = await db.getQuestionsByTopic(topic.id);
    const progress = await db.getQuestionProgressByTopic(ctx.user.id, topic.id);
    
    const total = questions.length;
    const answered = progress.length;
    const correct = progress.filter(p => p.status === 'correct').length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { topicId: topic.id, topicTitle: topic.title, total, answered, correct, percentage };
  })
);

// 3. Gesamt-Fortschritt berechnen
const answeredQuestions = topicProgress.reduce((sum, t) => sum + t.answered, 0);
const correctAnswers = topicProgress.reduce((sum, t) => sum + t.correct, 0);
const percentage = Math.round((correctAnswers / totalQuestions) * 100);
```

---

### 2. CourseView - Themen-Fortschritt

**Datei**: `client/src/pages/user/CourseView.tsx`

**Änderungen**:
```tsx
// Hole Kurs-Fortschritt mit allen Themen
const { data: courseProgress } = trpc.question.getCourseProgress.useQuery(
  { courseId },
  { enabled: courseId > 0 }
);

// Helper-Funktion für Themen-Fortschritt
const getTopicProgressPercentage = (topicId: number) => {
  if (!courseProgress?.topicProgress) return 0;
  const topicProg = courseProgress.topicProgress.find(t => t.topicId === topicId);
  return topicProg?.percentage || 0;
};

// In der Themen-Liste
<p className="text-sm text-muted-foreground">
  {getTopicProgressPercentage(topic.id)}% abgeschlossen
</p>
```

**Vorher**: "Abgeschlossen" / "In Bearbeitung" / "Nicht gestartet"  
**Nachher**: "25% abgeschlossen" / "50% abgeschlossen" / "100% abgeschlossen"

---

### 3. Dashboard - Kurs-Fortschritt

**Datei**: `client/src/pages/user/Dashboard.tsx`

**Änderungen**:
```tsx
// Hole Fortschritt für alle Kurse
const courseProgressQueries = courses?.map(course => 
  trpc.question.getCourseProgress.useQuery(
    { courseId: course.id },
    { enabled: !!course.id }
  )
) || [];

// Helper-Funktion für Kurs-Fortschritt
const getCourseProgress = (courseId: number) => {
  const courseIndex = courses?.findIndex(c => c.id === courseId) ?? -1;
  if (courseIndex >= 0 && courseProgressQueries[courseIndex]?.data) {
    return courseProgressQueries[courseIndex].data.percentage;
  }
  return 0;
};

// In der Kurs-Card
<div className="flex justify-between text-sm mb-2">
  <span className="text-muted-foreground">Fortschritt</span>
  <span className="font-medium">{progressPercent}%</span>
</div>
<div className="progress-bar">
  <div 
    className="progress-bar-fill" 
    style={{ width: `${progressPercent}%` }}
  />
</div>
```

**Vorher**: Fortschritt basierte auf abgeschlossenen Themen (completeTopic)  
**Nachher**: Fortschritt basiert auf richtigen Antworten (questionProgress)

---

## Technische Entscheidungen

### 1. Fortschritt basiert auf richtigen Antworten

**Entscheidung**: `percentage = (correct / total) * 100`  
**Begründung**:
- Genauer als "Thema abgeschlossen" (binär)
- User kann Fortschritt während des Lernens sehen
- Konsistent mit Lern-Flow (jede Frage zählt)
- Motivierender (kontinuierlicher Fortschritt)

**Alternative** (nicht gewählt):
- `percentage = (answered / total) * 100` → würde falsche Antworten als Fortschritt zählen
- `percentage = (completedTopics / totalTopics) * 100` → zu grob, keine Granularität

### 2. getCourseProgress aggregiert alle Themen

**Entscheidung**: Ein API-Call für gesamten Kurs (inkl. Themen)  
**Begründung**:
- Effizienter als N separate Calls (N = Anzahl Themen)
- Konsistente Daten (alle aus einer Query)
- Einfachere Frontend-Logik

**Trade-off**:
- Längere Response-Zeit bei vielen Themen
- Mehr Daten übertragen (auch wenn nur Kurs-Fortschritt benötigt)

**Akzeptiert**: IT Security Awareness hat nur 12 Themen → Performance OK

### 3. Frontend verwendet useQuery Array

**Entscheidung**: Array von useQuery für alle Kurse im Dashboard  
**Begründung**:
- React Query cached automatisch
- Parallele Requests (schneller als sequenziell)
- Einfache Implementierung

**Alternative** (nicht gewählt):
- Batch-Endpoint für alle Kurse → würde zusätzlichen Backend-Endpoint erfordern
- Manuelles Caching → komplexer, fehleranfällig

### 4. Percentage gerundet auf ganze Zahlen

**Entscheidung**: `Math.round((correct / total) * 100)`  
**Begründung**:
- Einfacher zu lesen (25% statt 25.5%)
- Konsistent mit anderen Fortschritts-Anzeigen
- Keine Nachkommastellen nötig bei kleinen Zahlen (4 Fragen → 25%, 50%, 75%, 100%)

---

## User Flow

### Dashboard

1. **User öffnet Dashboard**
2. **System lädt Kurs-Fortschritt** für alle Kurse (parallel)
3. **Kurs-Cards zeigen Fortschritt**: "25% abgeschlossen" (basierend auf richtigen Antworten)
4. **User klickt auf Kurs** → CourseView

### CourseView

1. **User öffnet Kurs**
2. **System lädt Kurs-Fortschritt** (inkl. alle Themen)
3. **Themen-Liste zeigt Fortschritt**: "50% abgeschlossen" pro Thema
4. **User klickt auf Thema** → TopicView

### TopicView

1. **User beantwortet Fragen**
2. **Fortschritt aktualisiert sich** in Echtzeit (via invalidate)
3. **User kehrt zurück zu CourseView** → Fortschritt ist aktualisiert
4. **User kehrt zurück zu Dashboard** → Kurs-Fortschritt ist aktualisiert

---

## Performance

### API-Calls

**Dashboard**:
- 1x `course.listActive` (alle Kurse)
- Nx `question.getCourseProgress` (N = Anzahl Kurse, parallel)

**CourseView**:
- 1x `course.get` (Kurs-Details)
- 1x `question.getCourseProgress` (Fortschritt für Kurs + alle Themen)

**TopicView**:
- 1x `question.getProgress` (Fortschritt für Thema)
- 1x `question.listByTopic` (alle Fragen)

### Caching

- React Query cached alle Responses automatisch
- Invalidierung nur nach `submitAnswer` (gezielt für betroffenes Thema)
- Keine unnötigen Re-Fetches

### Optimierung (später möglich)

- Batch-Endpoint für Dashboard (alle Kurse in einem Call)
- Server-Side Caching (Redis) für Fortschritt-Berechnung
- Incremental Updates (nur geänderte Themen neu berechnen)

---

## Tests

**Status**: ✅ 61 Tests bestanden (keine neuen Tests hinzugefügt)

**Begründung**:
- Backend-Logik ist einfach (nur Aggregation)
- Keine komplexe Business-Logic
- Manuelle Tests ausreichend

**Manuelle Tests durchgeführt**:
- ✅ Dashboard zeigt Kurs-Fortschritt korrekt (% basiert auf richtigen Antworten)
- ✅ CourseView zeigt Themen-Fortschritt korrekt (% pro Thema)
- ✅ Fortschritt aktualisiert sich nach Antwort (via invalidate)
- ✅ 0% bei keinen Antworten, 100% bei allen richtig
- ✅ Fortschritt bleibt bei 0% wenn alle Antworten falsch

---

## Lessons Learned

### 1. Fortschritt-Berechnung muss klar definiert sein

**Problem**: Was bedeutet "Fortschritt"? Beantwortet? Richtig? Abgeschlossen?  
**Lösung**: Explizite Entscheidung: Fortschritt = % richtige Antworten

### 2. Aggregation vs. Einzelne Calls

**Problem**: Soll Frontend N Calls machen oder Backend aggregieren?  
**Lösung**: Backend aggregiert → einfacher, konsistenter, effizienter

### 3. Frontend useQuery Array Pattern

**Problem**: Wie mehrere Queries für verschiedene Kurse handhaben?  
**Lösung**: Array von useQuery → React Query cached automatisch

### 4. Percentage vs. Fraction

**Problem**: 25% oder 1/4 anzeigen?  
**Lösung**: Percentage → universell verständlich, konsistent mit Progress Bar

---

## Offene Punkte

### 1. Fortschritt bei Wiederholung

**Aktuell**: Wiederholung ändert Status (correct/incorrect)  
**Frage**: Soll Wiederholung den Fortschritt ändern?  
**Entscheidung**: Siehe ADR-013 (Erste Antwort zählt) - noch nicht implementiert

### 2. Fortschritt-Persistierung

**Aktuell**: Fortschritt wird live berechnet (nicht gespeichert)  
**Frage**: Soll Fortschritt in `userProgress` Tabelle gespeichert werden?  
**Entscheidung**: Nein → Live-Berechnung ist genauer und einfacher

### 3. Fortschritt-History

**Aktuell**: Nur aktueller Fortschritt sichtbar  
**Frage**: Soll Fortschritt-Verlauf gespeichert werden (Zeitreihe)?  
**Entscheidung**: Später → Analytics-Feature (Sprint 10+)

---

## Nächste Schritte

### Sprint 8 abgeschlossen ✅

Alle Schritte von Sprint 8 sind implementiert:
- ✅ Schritt 1: Question Progress Tracking System
- ✅ Schritt 2.1: Fragen-Liste UI
- ✅ Schritt 2.2: Einzelfrage-Ansicht mit Shuffle
- ✅ Schritt 2.3: Dialog für Wiederholung
- ✅ Schritt 2.4: Fortschritt-Dashboard

### Sprint 9 - Nächste Features

1. **ADR-013 implementieren**: Erste Antwort zählt (Wiederholung ändert Score nicht)
2. **Mini-Quiz**: 5 zufällige Fragen nach Lernphase
3. **E-Mail-Versand**: Einladungen, Kurszuweisungen, Zertifikate

---

## Zusammenfassung

**Was funktioniert**:
- ✅ Backend: getTopicProgress und getCourseProgress Endpoints
- ✅ CourseView: Themen-Fortschritt als % angezeigt
- ✅ Dashboard: Kurs-Fortschritt als % angezeigt
- ✅ Fortschritt basiert auf richtigen Antworten (nicht abgeschlossenen Themen)
- ✅ 61 Tests bestanden

**Was fehlt noch**:
- ADR-013: Erste Antwort zählt (Wiederholung ändert Score nicht)
- Unit Tests für neue Endpoints (optional)

**Zeitaufwand**: ~1.5h (geplant: 1h)
