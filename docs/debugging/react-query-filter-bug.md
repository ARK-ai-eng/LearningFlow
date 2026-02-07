# React Query Auto-Update + Filter Bug - Vollständige Dokumentation

**Datum:** 07.02.2026  
**Projekt:** AISmarterFlow Academy  
**Komponente:** QuizView (Wiederholungsmodus)  
**Zeitverlust:** ~6 Stunden  
**Status:** ✅ Behoben

---

## Executive Summary

Ein kritischer UX-Bug im Wiederholungsmodus führte dazu dass Fragen sofort zur nächsten sprangen nach korrekter Beantwortung, ohne dass der User auf "Nächste Frage" klicken konnte. Die Root Cause war eine Kombination aus React Query's automatischer Cache-Aktualisierung und einem Filter der die beantwortete Frage sofort aus der Liste entfernte.

**Kernproblem:** Ich habe nicht verstanden dass React Query Queries automatisch aktualisiert werden wenn der Cache sich ändert, auch ohne expliziten `invalidate()` Aufruf.

---

## Symptome

### Was der User sah:
1. Im Wiederholungsmodus: User klickt auf richtige Antwort (z.B. A)
2. **SOFORT** springt die Frage zur nächsten (ohne "Nächste Frage" Button)
3. Die neue Frage zeigt eine andere richtige Antwort (z.B. D)
4. **D wird automatisch als ausgewählt markiert** (ohne User-Klick!)
5. Fragen-Nummer springt von "1 von 10" auf "1 von 9" (ohne Button-Klick)

### Wichtig:
- **Nur bei RICHTIGER Antwort!** Bei falscher Antwort: alles normal
- **Nur im Wiederholungsmodus!** Im normalen Modus: kein Problem

---

## Root Cause Analysis

### Was war falsch?

**Problem 1: React Query Auto-Update**
```typescript
const { data: progress } = trpc.question.getProgressByCourse.useQuery(
  { courseId },
  { enabled: courseId > 0 }
);
```

React Query aktualisiert `progress` **automatisch** wenn:
- Eine Mutation (`submitAnswer`) den Cache ändert
- Der Server neue Daten zurückgibt
- Ein anderer Query den gleichen Cache-Key invalidiert

**Ich dachte:** Wenn ich `invalidate()` aus `submitAnswer.onSuccess()` entferne, wird `progress` nicht aktualisiert.

**Realität:** React Query aktualisiert `progress` trotzdem automatisch nach `submitAnswer` Mutation!

---

**Problem 2: Filter entfernt Frage sofort**
```typescript
const activeQuestions = useMemo(() => {
  if (isRepeatMode) {
    return questionsWithStatus.filter(q => q.status === 'incorrect');
  }
  return questionsWithStatus;
}, [isRepeatMode, questionsWithStatus]);
```

**Was passiert:**
1. User beantwortet Frage korrekt → `status` ändert sich zu `'correct'`
2. React Query aktualisiert `progress` automatisch
3. `questionsWithStatus` wird neu berechnet (weil `progress` sich änderte)
4. `activeQuestions` Filter entfernt die Frage (weil `status !== 'incorrect'`)
5. `currentQuestion = activeQuestions[currentQuestionIndex]` → **Zeigt jetzt eine ANDERE Frage!**

---

**Problem 3: selectedAnswer bleibt gesetzt**
```typescript
const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
```

Nach Antwort-Klick wird `selectedAnswer` auf "A" gesetzt. Wenn die Frage springt, bleibt `selectedAnswer` "A" und wird auf die neue Frage übertragen!

---

### Warum war es so schwer zu finden?

1. **Ich habe React Query's Auto-Update Mechanismus nicht verstanden**
   - Ich dachte `invalidate()` ist der einzige Weg um Daten zu aktualisieren
   - Ich wusste nicht dass Mutations automatisch den Cache aktualisieren

2. **Ich habe die Filter-Logik nicht durchdacht**
   - Ich habe nicht bedacht dass `questionsWithStatus` sich ändert während User Feedback sieht
   - Ich habe nicht bedacht dass der Filter die aktuelle Frage entfernt

3. **Ich habe den Bug im normalen Modus getestet, nicht im Wiederholungsmodus**
   - Der Bug tritt NUR im Wiederholungsmodus auf (wegen Filter)
   - Ich habe den Wiederholungsmodus nicht sofort getestet

4. **Ich habe gegen meine eigenen Regeln verstoßen**
   - Ich habe NICHT die Backend-API getestet vor Frontend-Implementierung
   - Ich habe NICHT das Schema gelesen vor Code schreiben
   - Ich habe NICHT vollständiges Testing durchgeführt vor Checkpoint

---

## Lösung

### Fix 1: Behalte aktuelle Frage im Filter

**Vorher:**
```typescript
const activeQuestions = useMemo(() => {
  if (isRepeatMode) {
    return questionsWithStatus.filter(q => q.status === 'incorrect');
  }
  return questionsWithStatus;
}, [isRepeatMode, questionsWithStatus]);
```

**Nachher:**
```typescript
const activeQuestions = useMemo(() => {
  if (isRepeatMode) {
    // Show incorrect questions + current question (even if just answered correctly)
    const incorrectQuestions = questionsWithStatus.filter(q => q.status === 'incorrect');
    const currentQ = questionsWithStatus[currentQuestionIndex];
    
    // If current question is not in incorrect list (was just answered correctly),
    // keep it in the list until user clicks "Nächste Frage"
    if (currentQ && !incorrectQuestions.find(q => q.id === currentQ.id)) {
      const result = [...incorrectQuestions];
      const insertIndex = result.findIndex(q => q.id > currentQ.id);
      if (insertIndex === -1) {
        result.push(currentQ);
      } else {
        result.splice(insertIndex, 0, currentQ);
      }
      return result;
    }
    
    return incorrectQuestions;
  }
  return questionsWithStatus;
}, [isRepeatMode, questionsWithStatus, currentQuestionIndex]);
```

**Warum funktioniert das?**
- Die aktuelle Frage bleibt in `activeQuestions` auch wenn `status` sich zu `'correct'` ändert
- Erst nach "Nächste Frage" Klick wird `currentQuestionIndex` erhöht
- Dann zeigt `currentQuestion` die nächste Frage (die noch `status: 'incorrect'` hat)

---

### Fix 2: Verschiebe invalidate() zu handleNextQuestion

**Vorher:**
```typescript
const submitMutation = trpc.question.submitAnswer.useMutation({
  onSuccess: () => {
    utils.question.getProgressByCourse.invalidate({ courseId });
    toast.success('Antwort gespeichert');
  },
});
```

**Nachher:**
```typescript
const submitMutation = trpc.question.submitAnswer.useMutation({
  onSuccess: () => {
    toast.success('Antwort gespeichert');
  },
});

const handleNextQuestion = () => {
  utils.question.getProgressByCourse.invalidate({ courseId });
  
  if (isLastQuestion) {
    // ...
  } else {
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setHasAnswered(false);
  }
};
```

**Warum ist das wichtig?**
- `invalidate()` nach "Nächste Frage" Klick stellt sicher dass Daten aktualisiert werden
- Aber React Query aktualisiert `progress` trotzdem automatisch nach `submitAnswer`!
- Deshalb ist Fix 1 (Filter-Logik) kritisch!

---

## Was ich gelernt habe

### 1. React Query Auto-Update Mechanismus

**Regel:** React Query Queries aktualisieren sich automatisch wenn:
- Eine Mutation den Cache ändert (via `onSuccess` oder `onMutate`)
- Der Server neue Daten zurückgibt
- Ein anderer Query den gleichen Cache-Key invalidiert

**Implikation:** Wenn du `useMutation` verwendest, musst du davon ausgehen dass alle Queries die den gleichen Cache-Key verwenden automatisch aktualisiert werden!

**Beispiel:**
```typescript
// Mutation
const submitMutation = trpc.question.submitAnswer.useMutation();

// Query - wird automatisch aktualisiert nach submitMutation!
const { data: progress } = trpc.question.getProgressByCourse.useQuery({ courseId });
```

---

### 2. Filter + Auto-Update = Gefährliche Kombination

**Regel:** Wenn du einen Filter auf Daten anwendest die sich automatisch aktualisieren, musst du sicherstellen dass der Filter die aktuelle Ansicht nicht zerstört!

**Anti-Pattern:**
```typescript
// BAD: Filter entfernt Elemente sofort nach Änderung
const activeItems = data.filter(item => item.status === 'pending');
const currentItem = activeItems[currentIndex];
// Problem: Wenn currentItem.status sich ändert, wird es aus activeItems entfernt!
```

**Best Practice:**
```typescript
// GOOD: Filter behält aktuelles Element auch wenn es sich ändert
const activeItems = useMemo(() => {
  const filtered = data.filter(item => item.status === 'pending');
  const current = data[currentIndex];
  
  // Keep current item in list even if it doesn't match filter
  if (current && !filtered.find(i => i.id === current.id)) {
    return [...filtered, current].sort((a, b) => a.id - b.id);
  }
  
  return filtered;
}, [data, currentIndex]);
```

---

### 3. Testing-Strategie für Mutations

**Regel:** Wenn du eine Mutation testest, teste ALLE Modi und Szenarien!

**Checkliste:**
- [ ] Normaler Modus: Mutation funktioniert korrekt
- [ ] Wiederholungs-Modus: Mutation funktioniert korrekt
- [ ] Erste Frage: Mutation funktioniert korrekt
- [ ] Letzte Frage: Mutation funktioniert korrekt
- [ ] Richtige Antwort: UI bleibt stabil
- [ ] Falsche Antwort: UI bleibt stabil

---

### 4. Debug-Strategie für React Query Bugs

**Schritt 1:** Identifiziere alle Queries die den gleichen Cache-Key verwenden
```typescript
// Finde alle Queries mit "question.getProgressByCourse"
const { data: progress1 } = trpc.question.getProgressByCourse.useQuery({ courseId });
const { data: progress2 } = trpc.question.getProgressByCourse.useQuery({ courseId });
// Beide werden automatisch aktualisiert!
```

**Schritt 2:** Identifiziere alle Mutations die den Cache ändern
```typescript
const submitMutation = trpc.question.submitAnswer.useMutation();
// Diese Mutation ändert den Cache für "question.getProgressByCourse"!
```

**Schritt 3:** Prüfe ob Queries automatisch aktualisiert werden
```typescript
// Füge Debug-Logging hinzu
const { data: progress } = trpc.question.getProgressByCourse.useQuery({ courseId });

useEffect(() => {
  console.log('[DEBUG] progress changed:', progress);
}, [progress]);
```

**Schritt 4:** Prüfe ob Filter die Ansicht zerstören
```typescript
const activeItems = useMemo(() => {
  console.log('[DEBUG] activeItems recalculated:', data.length);
  return data.filter(item => item.status === 'pending');
}, [data]);
```

---

## Wiederverwendbare Lösung

### Pattern: Stable Current Item Filter

**Use Case:** Du hast eine gefilterte Liste und willst dass das aktuelle Element stabil bleibt auch wenn es den Filter nicht mehr erfüllt.

**Template:**
```typescript
const activeItems = useMemo(() => {
  // Step 1: Apply filter
  const filtered = items.filter(item => matchesFilter(item));
  
  // Step 2: Get current item
  const current = items[currentIndex];
  
  // Step 3: Keep current item in list if it doesn't match filter
  if (current && !filtered.find(i => i.id === current.id)) {
    // Insert current item at correct position (sorted by ID)
    const result = [...filtered];
    const insertIndex = result.findIndex(i => i.id > current.id);
    if (insertIndex === -1) {
      result.push(current);
    } else {
      result.splice(insertIndex, 0, current);
    }
    return result;
  }
  
  return filtered;
}, [items, currentIndex]);
```

**Wann verwenden:**
- Quiz/Test mit Wiederholungs-Modus
- Todo-Liste mit Filter (z.B. nur "pending" anzeigen)
- Inbox mit Filter (z.B. nur "unread" anzeigen)
- Jede Liste wo User ein Element bearbeitet und der Filter sich dadurch ändert

---

## Lessons Learned - Zusammenfassung

### 1. React Query Auto-Update verstehen
- Queries aktualisieren sich automatisch nach Mutations
- `invalidate()` ist NICHT der einzige Weg um Daten zu aktualisieren
- Teste immer ob Queries sich unerwartet aktualisieren

### 2. Filter + Auto-Update = Vorsicht!
- Filter können die aktuelle Ansicht zerstören
- Behalte aktuelles Element im Filter auch wenn es nicht mehr passt
- Verwende "Stable Current Item Filter" Pattern

### 3. Testing-Strategie
- Teste ALLE Modi (normal, repeat, etc.)
- Teste ALLE Szenarien (erste, letzte, richtig, falsch)
- Teste im Browser, nicht nur in Tests!

### 4. Backend-First Development
- IMMER Schema lesen VOR Code schreiben
- IMMER Backend-API testen VOR Frontend-Implementierung
- IMMER "Think First, Code Later" statt "Quick & Dirty"

### 5. Debug-Strategie
- Identifiziere alle Queries mit gleichem Cache-Key
- Identifiziere alle Mutations die den Cache ändern
- Füge Debug-Logging hinzu um Auto-Updates zu sehen
- Prüfe ob Filter die Ansicht zerstören

---

## Vermeidbare Fehler

### Was hätte ich anders machen sollen?

1. **Wiederholungsmodus sofort testen**
   - Ich habe den Bug im normalen Modus getestet
   - Der Bug tritt nur im Wiederholungsmodus auf
   - → Teste IMMER alle Modi!

2. **React Query Dokumentation lesen**
   - Ich wusste nicht dass Queries automatisch aktualisiert werden
   - Ich habe angenommen dass `invalidate()` der einzige Weg ist
   - → Lies die Dokumentation BEVOR du Code schreibst!

3. **Filter-Logik durchdenken**
   - Ich habe nicht bedacht dass der Filter die aktuelle Frage entfernt
   - Ich habe nicht bedacht dass `questionsWithStatus` sich ändert
   - → Denke über Edge Cases nach BEVOR du Code schreibst!

4. **Backend-First Development befolgen**
   - Ich habe gegen meine eigenen Regeln verstoßen
   - Ich habe Code geschrieben ohne Schema zu lesen
   - → Befolge deine eigenen Regeln!

---

## Zeitverlust-Analyse

**Gesamt:** ~6 Stunden

**Breakdown:**
- 2h: Resume-Funktionalität implementieren (ohne vollständiges Testing)
- 1h: Backend-Filter Bug finden und fixen (194 Fragen statt 14)
- 1h: Frontend-Nummerierung Bug fixen (Frage 1 von 194 statt Frage X von 14)
- 1h: URL-Parsing Bug fixen (wouter gibt keinen Query-String zurück)
- 1h: Wiederholungsmodus Bug analysieren und fixen

**Vermeidbarer Zeitverlust:** ~4 Stunden

**Wenn ich Backend-First Development befolgt hätte:**
- 30min: Schema lesen + Backend-API testen
- 30min: Frontend implementieren mit korrektem Verständnis
- 30min: Vollständiges Testing (alle Modi, alle Szenarien)
- **Gesamt: 1.5h statt 6h**

---

## Checkliste für zukünftige Implementierungen

### Vor Code schreiben:
- [ ] Schema lesen (`drizzle/schema.ts`)
- [ ] Backend-API analysieren (`server/routers.ts`, `server/db.ts`)
- [ ] API-Response im Browser prüfen (Network Tab)
- [ ] React Query Auto-Update verstehen (welche Queries werden aktualisiert?)
- [ ] Filter-Logik durchdenken (wird aktuelle Ansicht zerstört?)

### Während Code schreiben:
- [ ] Debug-Logging hinzufügen (console.log)
- [ ] Edge Cases durchdenken (erste, letzte, richtig, falsch)
- [ ] "Stable Current Item Filter" Pattern verwenden wenn nötig

### Nach Code schreiben:
- [ ] Vollständiges Testing (alle Modi, alle Szenarien)
- [ ] Browser-Test mit echten Daten
- [ ] Debug-Logging entfernen
- [ ] Checkpoint erstellen

---

## Referenzen

- React Query Dokumentation: https://tanstack.com/query/latest/docs/framework/react/overview
- React Query Auto-Update: https://tanstack.com/query/latest/docs/framework/react/guides/mutations
- Fisher-Yates Shuffle: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle

---

**Ende der Dokumentation**
