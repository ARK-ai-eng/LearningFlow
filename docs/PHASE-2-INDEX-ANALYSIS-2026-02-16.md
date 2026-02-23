# PHASE 2: INDEX-ANALYSE - PRÄZISE COMPOSITE-INDIZES

**Datum:** 2026-02-16  
**Ziel:** Präzise Composite-Indizes basierend auf JOIN-Queries ableiten  
**Regel:** Reihenfolge der Spalten = Reihenfolge in WHERE/JOIN

---

## 📊 ANALYSE DER JOIN-QUERIES

### Query 1: `getActiveCoursesWithStats(userId)`

```sql
SELECT ...
FROM courses c
LEFT JOIN topics t ON t.courseId = c.id
LEFT JOIN questions q ON q.topicId = t.id
LEFT JOIN question_progress qp ON qp.questionId = q.id AND qp.userId = ${userId}
WHERE c.isActive = 1
GROUP BY c.id, c.title, c.description, c.courseType, c.isActive
```

**JOIN-Analyse:**
1. `topics.courseId` → JOIN mit `courses.id`
2. `questions.topicId` → JOIN mit `topics.id`
3. `question_progress.questionId` + `question_progress.userId` → JOIN mit `questions.id`
4. `courses.isActive` → WHERE-Filter

---

### Query 2: `getCourseStatsWithTopics(userId, courseId)` - Kurs-Stats

```sql
SELECT ...
FROM courses c
LEFT JOIN topics t ON t.courseId = c.id
LEFT JOIN questions q ON q.topicId = t.id
LEFT JOIN question_progress qp ON qp.questionId = q.id AND qp.userId = ${userId}
WHERE c.id = ${courseId}
```

**JOIN-Analyse:**
1. `topics.courseId` → JOIN mit `courses.id`
2. `questions.topicId` → JOIN mit `topics.id`
3. `question_progress.questionId` + `question_progress.userId` → JOIN mit `questions.id`
4. `courses.id` → WHERE-Filter

---

### Query 3: `getCourseStatsWithTopics(userId, courseId)` - Topic-Progress

```sql
SELECT ...
FROM topics t
LEFT JOIN questions q ON q.topicId = t.id
LEFT JOIN question_progress qp ON qp.questionId = q.id AND qp.userId = ${userId}
WHERE t.courseId = ${courseId}
GROUP BY t.id, t.title
```

**JOIN-Analyse:**
1. `questions.topicId` → JOIN mit `topics.id`
2. `question_progress.questionId` + `question_progress.userId` → JOIN mit `questions.id`
3. `topics.courseId` → WHERE-Filter

---

### Query 4: `getUserCertificatesWithCourse(userId)`

```sql
SELECT ...
FROM certificates cert
INNER JOIN courses c ON c.id = cert.courseId
WHERE cert.userId = ${userId}
ORDER BY cert.issuedAt DESC
```

**JOIN-Analyse:**
1. `certificates.courseId` → JOIN mit `courses.id`
2. `certificates.userId` → WHERE-Filter
3. `certificates.issuedAt` → ORDER BY

---

## 🎯 ABGELEITETE INDIZES

### Index 1: `topics.courseId`
**Begründung:** JOIN-Bedingung in allen 3 Queries  
**Erwarteter Impact:** 10-50× schneller (Full Table Scan → Index Scan)  
**SQL:**
```sql
CREATE INDEX idx_topics_course_id ON topics(courseId);
```

---

### Index 2: `questions.topicId`
**Begründung:** JOIN-Bedingung in allen 3 Queries  
**Erwarteter Impact:** 10-50× schneller (Full Table Scan → Index Scan)  
**SQL:**
```sql
CREATE INDEX idx_questions_topic_id ON questions(topicId);
```

---

### Index 3: `question_progress(questionId, userId)`
**Begründung:** JOIN-Bedingung mit 2 Spalten (questionId AND userId)  
**Reihenfolge:** questionId zuerst (JOIN), dann userId (Filter)  
**Erwarteter Impact:** 10-100× schneller (Composite Index für Multi-Tenancy)  
**SQL:**
```sql
CREATE INDEX idx_question_progress_question_user ON question_progress(questionId, userId);
```

---

### Index 4: `question_progress.firstAttemptStatus`
**Begründung:** Wird in CASE-Statements gefiltert (correct/incorrect/unanswered)  
**Erwarteter Impact:** 5-10× schneller (Conditional Aggregation)  
**SQL:**
```sql
CREATE INDEX idx_question_progress_status ON question_progress(firstAttemptStatus);
```

---

### Index 5: `courses.isActive`
**Begründung:** WHERE-Filter in Query 1  
**Erwarteter Impact:** 2-5× schneller (Boolean Index)  
**SQL:**
```sql
CREATE INDEX idx_courses_is_active ON courses(isActive);
```

---

### Index 6: `certificates(userId, issuedAt DESC)`
**Begründung:** WHERE-Filter + ORDER BY  
**Reihenfolge:** userId zuerst (WHERE), dann issuedAt DESC (ORDER BY)  
**Erwarteter Impact:** 5-10× schneller (Covering Index)  
**SQL:**
```sql
CREATE INDEX idx_certificates_user_issued ON certificates(userId, issuedAt DESC);
```

---

## 📋 ZUSAMMENFASSUNG

| Index | Tabelle | Spalten | Typ | Impact |
|-------|---------|---------|-----|--------|
| 1 | `topics` | `courseId` | Single | 10-50× |
| 2 | `questions` | `topicId` | Single | 10-50× |
| 3 | `question_progress` | `(questionId, userId)` | Composite | 10-100× |
| 4 | `question_progress` | `firstAttemptStatus` | Single | 5-10× |
| 5 | `courses` | `isActive` | Boolean | 2-5× |
| 6 | `certificates` | `(userId, issuedAt DESC)` | Composite | 5-10× |

**Gesamt:** 6 Indizes, davon 2 Composite-Indizes

---

## 🚀 NÄCHSTE SCHRITTE

1. SQL-Migrations-Script erstellen
2. Indizes in Datenbank erstellen
3. Vorher/Nachher-Messung (P50/P95)
4. Dokumentation aktualisieren

---

**Erstellt von:** Performance Team  
**Review:** ✅ Bereit für Implementierung
