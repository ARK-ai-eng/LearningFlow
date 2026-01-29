# Bug-Fix: Einzelfrage-Dialog zeigt leeren Inhalt

**Datum**: 29.01.2026  
**Status**: ✅ Behoben

## Problem

Der Einzelfrage-Dialog öffnete sich, zeigte aber keinen Inhalt (Frage und Antworten waren nicht sichtbar). Nur ein leerer Dialog mit blauem Rahmen wurde angezeigt.

## Root Cause

Die `QuestionDetailDialog` Komponente versuchte, `trpc.question.getById.useQuery()` aufzurufen, aber dieser Backend-Endpoint existierte nicht:

```typescript
// ❌ Fehler: Endpoint existiert nicht
const { data: question, isLoading } = trpc.question.getById.useQuery(
  { id: questionId! },
  { enabled: !!questionId }
);
```

**Browser-Konsole Fehler**:
```
[API Query Error] TRPCClientError: No procedure found on path "question.getById"
```

## Lösung

Die Komponente wurde so geändert, dass sie die Frage direkt als Prop von `TopicView` erhält, statt sie neu zu laden:

### 1. QuestionDetailDialog Props geändert

```typescript
// ✅ Vorher: questionId als Prop
interface QuestionDetailDialogProps {
  questionId: number | null;
  topicId: number;
  onClose: () => void;
}

// ✅ Nachher: question-Objekt als Prop
interface QuestionDetailDialogProps {
  question: any | null;  // Die komplette Frage aus TopicView
  topicId: number;
  onClose: () => void;
}
```

### 2. TopicView State geändert

```typescript
// ✅ Vorher: selectedQuestionId
const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

// ✅ Nachher: selectedQuestion
const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);

// ✅ Vorher: openQuestion(q.id)
const openQuestion = (questionId: number) => {
  setSelectedQuestionId(questionId);
};

// ✅ Nachher: openQuestion(q)
const openQuestion = (question: any) => {
  setSelectedQuestion(question);
};
```

### 3. Dialog-Aufruf angepasst

```typescript
// ✅ Vorher
<QuestionDetailDialog
  questionId={selectedQuestionId}
  topicId={tId}
  onClose={closeQuestion}
/>

// ✅ Nachher
<QuestionDetailDialog
  question={selectedQuestion}
  topicId={tId}
  onClose={closeQuestion}
/>
```

## Vorteile der Lösung

1. **Effizienter**: Keine zusätzlichen API-Calls nötig (Frage ist bereits geladen)
2. **Einfacher**: Weniger State-Management und weniger Fehlerquellen
3. **Schneller**: Sofortiges Öffnen ohne Loading-State
4. **Robuster**: Keine Abhängigkeit von einem fehlenden Backend-Endpoint

## Tests

- ✅ Dialog öffnet sich mit Frage und Antworten
- ✅ Antwort-Auswahl funktioniert (grün/rot Feedback)
- ✅ "Nächste Frage" speichert Antwort und schließt Dialog
- ✅ Fragen-Liste aktualisiert sich mit neuem Status (✅/❌)
- ✅ Fortschrittsbalken aktualisiert sich
- ✅ 61 Unit Tests bestanden

## Betroffene Dateien

- `client/src/components/QuestionDetailDialog.tsx`
- `client/src/pages/user/TopicView.tsx`
- `todo.md`

## Alternative Lösung (nicht gewählt)

Man hätte auch den `question.getById` Endpoint im Backend implementieren können:

```typescript
// server/routers.ts
getById: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input, ctx }) => {
    return await getQuestionById(input.id);
  }),
```

**Warum nicht gewählt?**
- Unnötiger API-Call (Frage ist bereits im Frontend geladen)
- Mehr Code-Komplexität
- Langsamere User Experience (zusätzlicher Netzwerk-Request)
