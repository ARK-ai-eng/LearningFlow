# Sprint 8 - Schritt 2.1: Fragen-Liste UI

**Datum**: 29.01.2026  
**Status**: In Arbeit  
**Ziel**: Pausier baren Lern-Flow mit Fragen-Übersicht implementieren

---

## Kontext

**Problem**: User muss alle Fragen auf einmal beantworten, kann nicht pausieren.  
**Lösung**: Fragen-Liste mit Status-Icons, Fortschritt wird gespeichert.

---

## Architektur-Entscheidung

### Alte Architektur (vor Schritt 2.1)

```
TopicView.tsx:
- Zeigt eine Frage nach der anderen
- State: currentQuestion (Index)
- Shuffle bei Page-Load
- Kein Fortschritt-Tracking
```

### Neue Architektur (nach Schritt 2.1)

```
TopicView.tsx:
- Zeigt Liste aller Fragen
- Lädt Fortschritt aus DB (questionProgress)
- Status-Icons: ✅ correct, ❌ incorrect, ⚪ unanswered
- Sortierung: Unbeantwortete oben
- Klick auf Frage → Einzelfrage-Ansicht (Schritt 2.2)
```

---

## Datenfluss

```
1. User öffnet Thema
   ↓
2. TopicView.tsx lädt:
   - trpc.question.listByTopic() → Alle Fragen
   - trpc.question.getProgress() → Fortschritt aus DB
   ↓
3. Merge: Fragen + Fortschritt
   ↓
4. Sortierung: Unbeantwortete oben, beantwortete unten
   ↓
5. Render: Fragen-Liste mit Icons
```

---

## UI-Komponenten

### Fragen-Liste

```tsx
<div className="space-y-3">
  {sortedQuestions.map(q => (
    <div 
      key={q.id}
      className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-accent"
      onClick={() => openQuestion(q.id)}
    >
      {/* Status-Icon */}
      {q.status === 'correct' && <CheckCircle className="text-emerald-400" />}
      {q.status === 'incorrect' && <XCircle className="text-red-400" />}
      {q.status === 'unanswered' && <Circle className="text-muted-foreground" />}
      
      {/* Frage-Text */}
      <span className="flex-1">{q.questionText}</span>
      
      {/* Pfeil */}
      <ArrowRight className="w-4 h-4" />
    </div>
  ))}
</div>
```

### Pause-Button

```tsx
<Button 
  variant="outline"
  onClick={() => navigate(`/course/${courseId}`)}
>
  <Pause className="w-4 h-4 mr-2" />
  Pause
</Button>
```

---

## Sortierungs-Logik

```typescript
const sortedQuestions = useMemo(() => {
  return [...questions].sort((a, b) => {
    // Unbeantwortete zuerst
    if (a.status === 'unanswered' && b.status !== 'unanswered') return -1;
    if (a.status !== 'unanswered' && b.status === 'unanswered') return 1;
    
    // Dann nach ursprünglicher Reihenfolge
    return a.orderIndex - b.orderIndex;
  });
}, [questions, progress]);
```

---

## Fortschritt-Berechnung

```typescript
const stats = useMemo(() => {
  const total = questions.length;
  const answered = progress.filter(p => p.status !== 'unanswered').length;
  const correct = progress.filter(p => p.status === 'correct').length;
  const incorrect = progress.filter(p => p.status === 'incorrect').length;
  
  return {
    total,
    answered,
    correct,
    incorrect,
    percentage: Math.round((correct / total) * 100),
  };
}, [questions, progress]);
```

---

## API-Integration

### Laden beim Öffnen

```typescript
const { data: questions } = trpc.question.listByTopic.useQuery({ topicId });
const { data: progress } = trpc.question.getProgress.useQuery({ topicId });
```

### Merge

```typescript
const questionsWithStatus = useMemo(() => {
  return questions.map(q => {
    const p = progress?.find(pr => pr.questionId === q.id);
    return {
      ...q,
      status: p?.status || 'unanswered',
      attemptCount: p?.attemptCount || 0,
    };
  });
}, [questions, progress]);
```

---

## Risiken & Mitigationen

| Risiko | Mitigation |
|--------|-----------|
| **Performance**: Viele Fragen (100+) | Virtualisierung (react-window) später |
| **Race Condition**: Progress lädt langsamer | Loading-State, Skeleton |
| **Stale Data**: Progress nicht aktuell | Invalidate nach submitAnswer |

---

## Lessons Learned

### ✅ Was funktioniert

- **Granulares Tracking**: Jede Frage einzeln speichern (nicht nur Thema-Score)
- **Status-Icons**: Sofort erkennbar, was bearbeitet wurde
- **Sortierung**: Unbeantwortete oben = klare Priorisierung

### ❌ Was vermieden wurde

- **Komplexe State-Maschine**: Zu viele Zustände (loading, error, empty, etc.)
- **Optimistic Updates**: Zu fehleranfällig bei Netzwerkproblemen
- **Lokaler State**: Fortschritt nur in DB, nicht in localStorage

---

## Nächste Schritte

1. **Schritt 2.2**: Einzelfrage-Ansicht (modal oder route)
2. **Schritt 2.3**: Dialog für Wiederholung
3. **Schritt 2.4**: Fortschritt-Dashboard (% pro Thema)

---

## Dokumentations-Standort

Alle Dokumentation für Sprint 8 befindet sich in:
- `/home/ubuntu/aismarterflow-academy/docs/sprint-8-*.md`
- ADRs: `/home/ubuntu/aismarterflow-academy/docs/decisions/README.md`
- Patterns: `/home/ubuntu/aismarterflow-academy/docs/patterns/README.md`
