# Impact-Analyse: `isExamQuestion` Flag in questions Tabelle

**Datum:** 07.02.2026  
**Änderung:** Hinzufügen von `isExamQuestion BOOLEAN DEFAULT false` zur `questions` Tabelle  
**Ziel:** Trennung von Lernfragen und Prüfungsfragen für Course 3 (Certification)

---

## Zusammenfassung

**Risiko-Level:** 🟢 **NIEDRIG** (wenn korrekt implementiert)

**Grund:** 
- Neue Spalte mit DEFAULT false → Keine Breaking Changes für existierende Daten
- Alle existierenden Fragen werden automatisch als Lernfragen markiert (isExamQuestion = false)
- Keine Änderung an existierenden APIs nötig (nur Erweiterung)

---

## Betroffene Komponenten

### 1. Datenbank Schema

**Datei:** `drizzle/schema.ts`

**Aktuelle Struktur:**
```typescript
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  courseId: int("courseId").notNull(),
  questionText: text("questionText").notNull(),
  optionA: varchar("optionA", { length: 500 }).notNull(),
  optionB: varchar("optionB", { length: 500 }).notNull(),
  optionC: varchar("optionC", { length: 500 }).notNull(),
  optionD: varchar("optionD", { length: 500 }).notNull(),
  correctAnswer: mysqlEnum("correctAnswer", ["A", "B", "C", "D"]).notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

**Neue Struktur:**
```typescript
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  courseId: int("courseId").notNull(),
  questionText: text("questionText").notNull(),
  optionA: varchar("optionA", { length: 500 }).notNull(),
  optionB: varchar("optionB", { length: 500 }).notNull(),
  optionC: varchar("optionC", { length: 500 }).notNull(),
  optionD: varchar("optionD", { length: 500 }).notNull(),
  correctAnswer: mysqlEnum("correctAnswer", ["A", "B", "C", "D"]).notNull(),
  explanation: text("explanation"),
  isExamQuestion: boolean("isExamQuestion").default(false).notNull(), // ← NEU
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

**Migration:**
```sql
ALTER TABLE questions ADD COLUMN isExamQuestion BOOLEAN DEFAULT false NOT NULL;
```

**Impact:** ✅ **KEIN Breaking Change**
- Alle existierenden Fragen bekommen automatisch `isExamQuestion = false`
- Keine Daten gehen verloren
- Keine NULL-Werte (DEFAULT false)

---

### 2. Backend DB-Funktionen

**Datei:** `server/db.ts`

**Betroffene Funktionen:**

#### 2.1 `getQuestionsByTopic(topicId)`
```typescript
// AKTUELL
export async function getQuestionsByTopic(topicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questions).where(eq(questions.topicId, topicId));
}
```

**Problem:** Gibt ALLE Fragen zurück (Lern + Prüfung)

**Lösung:** Optional Filter hinzufügen
```typescript
export async function getQuestionsByTopic(
  topicId: number, 
  options?: { isExamQuestion?: boolean }
) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(questions).where(eq(questions.topicId, topicId));
  
  // Optional: Nur Lern- oder Prüfungsfragen
  if (options?.isExamQuestion !== undefined) {
    query = query.where(eq(questions.isExamQuestion, options.isExamQuestion));
  }
  
  return query;
}
```

**Impact:** ✅ **Backward Compatible**
- Ohne `options` Parameter: Gibt alle Fragen zurück (wie vorher)
- Mit `options.isExamQuestion = false`: Nur Lernfragen
- Mit `options.isExamQuestion = true`: Nur Prüfungsfragen

---

#### 2.2 `getQuestionsByCourse(courseId)`
```typescript
// AKTUELL
export async function getQuestionsByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questions).where(eq(questions.courseId, courseId));
}
```

**Problem:** Gibt ALLE Fragen zurück (Lern + Prüfung)

**Lösung:** Optional Filter hinzufügen
```typescript
export async function getQuestionsByCourse(
  courseId: number,
  options?: { isExamQuestion?: boolean }
) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(questions).where(eq(questions.courseId, courseId));
  
  // Optional: Nur Lern- oder Prüfungsfragen
  if (options?.isExamQuestion !== undefined) {
    query = query.where(eq(questions.isExamQuestion, options.isExamQuestion));
  }
  
  return query;
}
```

**Impact:** ✅ **Backward Compatible**

---

#### 2.3 `createQuestion(data)`
```typescript
// AKTUELL
export async function createQuestion(data: InsertQuestion): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(questions).values(data);
  return result[0].insertId;
}
```

**Änderung:** `InsertQuestion` Type wird automatisch erweitert (durch Drizzle)

**Impact:** ✅ **Kein Code-Change nötig**
- `isExamQuestion` ist optional (DEFAULT false)
- Admin kann beim Erstellen `isExamQuestion: true` setzen

---

#### 2.4 `updateQuestion(id, data)`
```typescript
// AKTUELL
export async function updateQuestion(id: number, data: Partial<InsertQuestion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(questions).set(data).where(eq(questions.id, id));
}
```

**Impact:** ✅ **Kein Code-Change nötig**
- Admin kann `isExamQuestion` später ändern (Lern → Prüfung oder umgekehrt)

---

### 3. Backend API-Endpoints

**Datei:** `server/routers.ts`

**Betroffene Endpoints:**

#### 3.1 `question.listByTopic`
```typescript
// AKTUELL
listByTopic: protectedProcedure
  .input(z.object({ topicId: z.number() }))
  .query(async ({ input }) => {
    return db.getQuestionsByTopic(input.topicId);
  }),
```

**Änderung:** Optional `isExamQuestion` Filter
```typescript
listByTopic: protectedProcedure
  .input(z.object({ 
    topicId: z.number(),
    isExamQuestion: z.boolean().optional() // ← NEU
  }))
  .query(async ({ input }) => {
    return db.getQuestionsByTopic(input.topicId, {
      isExamQuestion: input.isExamQuestion
    });
  }),
```

**Impact:** ✅ **Backward Compatible**
- Frontend muss nicht geändert werden (optional Parameter)
- Nur für Course 3 (Prüfung) wird `isExamQuestion: true` übergeben

---

#### 3.2 `question.listByCourse`
```typescript
// AKTUELL
listByCourse: protectedProcedure
  .input(z.object({ courseId: z.number() }))
  .query(async ({ input }) => {
    return db.getQuestionsByCourse(input.courseId);
  }),
```

**Änderung:** Optional `isExamQuestion` Filter
```typescript
listByCourse: protectedProcedure
  .input(z.object({ 
    courseId: z.number(),
    isExamQuestion: z.boolean().optional() // ← NEU
  }))
  .query(async ({ input }) => {
    return db.getQuestionsByCourse(input.courseId, {
      isExamQuestion: input.isExamQuestion
    });
  }),
```

**Impact:** ✅ **Backward Compatible**

---

#### 3.3 `question.create`
```typescript
// AKTUELL
create: adminProcedure
  .input(z.object({
    topicId: z.number(),
    courseId: z.number(),
    questionText: z.string().min(1),
    optionA: z.string().min(1),
    optionB: z.string().min(1),
    optionC: z.string().min(1),
    optionD: z.string().min(1),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']),
    explanation: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const id = await db.createQuestion(input);
    return { success: true, id };
  }),
```

**Änderung:** `isExamQuestion` hinzufügen
```typescript
create: adminProcedure
  .input(z.object({
    topicId: z.number(),
    courseId: z.number(),
    questionText: z.string().min(1),
    optionA: z.string().min(1),
    optionB: z.string().min(1),
    optionC: z.string().min(1),
    optionD: z.string().min(1),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']),
    explanation: z.string().optional(),
    isExamQuestion: z.boolean().optional().default(false), // ← NEU
  }))
  .mutation(async ({ input }) => {
    const id = await db.createQuestion(input);
    return { success: true, id };
  }),
```

**Impact:** ✅ **Backward Compatible**
- DEFAULT false → Alte Aufrufe funktionieren weiter

---

#### 3.4 `question.update`
```typescript
// AKTUELL
update: adminProcedure
  .input(z.object({
    id: z.number(),
    questionText: z.string().optional(),
    optionA: z.string().optional(),
    optionB: z.string().optional(),
    optionC: z.string().optional(),
    optionD: z.string().optional(),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']).optional(),
    explanation: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateQuestion(id, data);
    return { success: true };
  }),
```

**Änderung:** `isExamQuestion` hinzufügen
```typescript
update: adminProcedure
  .input(z.object({
    id: z.number(),
    questionText: z.string().optional(),
    optionA: z.string().optional(),
    optionB: z.string().optional(),
    optionC: z.string().optional(),
    optionD: z.string().optional(),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']).optional(),
    explanation: z.string().optional(),
    isExamQuestion: z.boolean().optional(), // ← NEU
  }))
  .mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateQuestion(id, data);
    return { success: true };
  }),
```

**Impact:** ✅ **Backward Compatible**

---

### 4. Frontend-Komponenten

**Betroffene Dateien:**
1. `client/src/pages/user/QuizView.tsx` (Course 2 - Sensitization)
2. `client/src/pages/user/TopicView.tsx` (Course 1 - Learning)
3. `client/src/pages/admin/CourseEditor.tsx` (Admin)

#### 4.1 QuizView.tsx (Course 2)
```typescript
// AKTUELL
const { data: questions } = trpc.question.listByCourse.useQuery(
  { courseId },
  { enabled: courseId > 0 }
);
```

**Änderung:** Filter für Lernfragen
```typescript
const { data: questions } = trpc.question.listByCourse.useQuery(
  { 
    courseId,
    isExamQuestion: false // ← Nur Lernfragen
  },
  { enabled: courseId > 0 }
);
```

**Impact:** ✅ **Explizit aber sicher**
- Zeigt nur Lernfragen (wie bisher)
- Prüfungsfragen werden ausgeblendet

---

#### 4.2 TopicView.tsx (Course 1)
```typescript
// AKTUELL
const { data: questions } = trpc.question.listByTopic.useQuery(
  { topicId: tId },
  { enabled: tId > 0 }
);
```

**Änderung:** Filter für Lernfragen
```typescript
const { data: questions } = trpc.question.listByTopic.useQuery(
  { 
    topicId: tId,
    isExamQuestion: false // ← Nur Lernfragen
  },
  { enabled: tId > 0 }
);
```

**Impact:** ✅ **Explizit aber sicher**

---

#### 4.3 CourseEditor.tsx (Admin)
```typescript
// AKTUELL
const { data: questions } = trpc.question.listByTopic.useQuery(
  { topicId: topic.id },
  { enabled: expanded }
);
```

**Änderung:** Admin sieht ALLE Fragen (Lern + Prüfung)
```typescript
const { data: questions } = trpc.question.listByTopic.useQuery(
  { 
    topicId: topic.id 
    // KEIN isExamQuestion Filter → Admin sieht alle
  },
  { enabled: expanded }
);
```

**Zusätzlich:** Checkbox im Admin-UI
```tsx
<Checkbox 
  checked={question.isExamQuestion}
  onCheckedChange={(checked) => updateQuestion({ 
    id: question.id, 
    isExamQuestion: checked 
  })}
/>
<Label>Prüfungsfrage</Label>
```

**Impact:** ✅ **Admin UI muss erweitert werden**

---

### 5. Tests

**Betroffene Dateien:**
- `server/question.progress.test.ts`
- Alle Tests die `createQuestion()` verwenden

**Änderung:** `isExamQuestion: false` explizit setzen (optional)
```typescript
const questionId = await db.createQuestion({
  topicId: testTopicId,
  courseId: testCourseId,
  questionText: 'Test Question?',
  optionA: 'A',
  optionB: 'B',
  optionC: 'C',
  optionD: 'D',
  correctAnswer: 'A',
  isExamQuestion: false, // ← Optional aber explizit
});
```

**Impact:** ✅ **Optional** (DEFAULT false)

---

## Neue Funktionalität für Course 3

### Workflow

1. **Lernphase:**
   - User beantwortet Lernfragen (`isExamQuestion = false`)
   - Shuffle, Progress-Tracking, Wiederholung wie Course 2
   - Nach allen Fragen: Dialog mit 3 Optionen

2. **Dialog (wenn <80%):**
   ```
   📚 Du hast 18 von 25 Fragen richtig (72%).
   
   [Fehlerhafte Fragen wiederholen]
   [Alles nochmal von vorne]
   [Später fortsetzen]
   ```

3. **Dialog (wenn ≥80%):**
   ```
   🎉 Bereit für die Prüfung! (21/25 = 84%)
   
   [Prüfung ablegen] ✨
   [Fehlerhafte Fragen wiederholen]
   [Alles nochmal von vorne]
   [Später fortsetzen]
   ```

4. **Prüfung:**
   - 20 zufällige Prüfungsfragen (`isExamQuestion = true`)
   - 15 Minuten Timer
   - 80% Mindestpunktzahl
   - Bei Bestehen: Zertifikat generieren

### Neue API-Endpoints

```typescript
// Holt 20 zufällige Prüfungsfragen
exam.getRandomQuestions: protectedProcedure
  .input(z.object({ courseId: z.number(), count: z.number() }))
  .query(async ({ input }) => {
    const examQuestions = await db.getQuestionsByCourse(input.courseId, {
      isExamQuestion: true
    });
    
    // Shuffle und nimm 20 zufällige
    return shuffleArray(examQuestions).slice(0, input.count);
  }),
```

---

## Risiko-Bewertung

### 🟢 Niedrige Risiken (Mitigiert)

1. **Breaking Changes:** ✅ KEINE
   - DEFAULT false für alle existierenden Fragen
   - Optional Parameter in APIs (Backward Compatible)

2. **Daten-Verlust:** ✅ KEIN Risiko
   - Nur neue Spalte hinzufügen
   - Keine Daten werden gelöscht

3. **Frontend-Fehler:** ✅ Kontrolliert
   - Explizite Filter für Course 1 & 2 (`isExamQuestion: false`)
   - Nur Course 3 verwendet Prüfungsfragen

### 🟡 Mittlere Risiken (Zu beachten)

1. **Admin UI muss erweitert werden:**
   - Checkbox "Prüfungsfrage" hinzufügen
   - Visuell unterscheiden (z.B. Badge "Prüfung")

2. **Seed-Daten müssen angepasst werden:**
   - Bestehende Fragen: `isExamQuestion = false`
   - Neue Prüfungsfragen für Course 3 erstellen

3. **Tests müssen erweitert werden:**
   - Tests für Prüfungsfragen-Filter
   - Tests für exam.getRandomQuestions

---

## Implementierungs-Plan

### Phase 1: Schema & Migration (30 Min)
1. `drizzle/schema.ts` erweitern
2. Migration erstellen: `pnpm db:push`
3. Verifizieren: Spalte in DB vorhanden

### Phase 2: Backend (1h)
1. `server/db.ts`: Optional Filter hinzufügen
2. `server/routers.ts`: APIs erweitern
3. Tests anpassen

### Phase 3: Frontend (1h)
1. QuizView.tsx: `isExamQuestion: false` Filter
2. TopicView.tsx: `isExamQuestion: false` Filter
3. CourseEditor.tsx: Checkbox hinzufügen

### Phase 4: Testing (30 Min)
1. Unit Tests ausführen
2. Browser Testing (Course 1, 2, 3)
3. Admin UI testen

### Phase 5: Course 3 Implementierung (2-3h)
1. Neue Komponente: ExamView.tsx
2. Dialog mit 3/4 Optionen
3. Prüfungs-Logik (Timer, 80%, Zertifikat)

---

## Fazit

**✅ GRÜNES LICHT FÜR IMPLEMENTIERUNG**

**Gründe:**
1. **Keine Breaking Changes** (DEFAULT false, optional Parameter)
2. **Backward Compatible** (alle existierenden APIs funktionieren weiter)
3. **Kontrolliertes Rollout** (nur Course 3 betroffen)
4. **Einfache Wartung** (1 Tabelle, kein Duplikat-Schema)
5. **Flexibel** (Fragen können später umgewandelt werden)

**Empfehlung:** Implementierung in 5 Phasen durchführen mit Testing nach jeder Phase.
