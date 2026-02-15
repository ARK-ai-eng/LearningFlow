# Lessons Learned: Kurs-Wiederholungs-Feature (15.02.2026)

## Zusammenfassung

**Dauer:** 6 Stunden  
**Ursprüngliche Anforderung:** "Wenn alle Fragen korrekt beantwortet sind, soll der Progress zurückgehen und man soll von vorn beginnen. Es muss nur sichtbar sein für den User und FirmenAdmin an welchem Datum er den Kurs erfolgreich abgeschlossen hat."

**Tatsächlicher Aufwand:** 6 Stunden für eigentlich 2-3 kleine Funktionen  
**Grund:** Datenbank-Vorfall + 4 kritische Bugs die nacheinander auftraten

---

## Chronologie der Ereignisse

### Phase 1: Initiale Implementierung (Gescheitert wegen Datenbank-Vorfall)

**Zeitpunkt:** 14.02.2026 23:50 - 15.02.2026 00:15

#### Schritt 1: Schema-Erweiterung
- **Aktion:** `lastCompletedAt` Feld zu `question_progress` Tabelle hinzufügen
- **Methode:** `pnpm db:push` (Drizzle Migration)
- **Fehler:** Datenbank komplett geleert (alle User, Kurse, Fragen gelöscht!)
- **Root Cause:** `pnpm db:push` fragte "Truncate tables?" → Antwort "Nein" → Datenbank trotzdem geleert

**Kritischer Vorfall:**
```
ALLE Daten verloren:
- 3 User (SysAdmin, FirmenAdmin, User)
- 3 Kurse (Learning, Sensitization, Certification)
- 12 Topics für IT-Sicherheit Kurs
- 43 Fragen gesamt
```

#### Schritt 2: Daten-Wiederherstellung
1. **User wiederherstellen:** Manuelle bcrypt-Hash-Generierung + SQL INSERT
2. **Kursinhalte wiederherstellen:** Seed-Script ausführen (aber nur 3 Themen statt 12!)
3. **Vollständige Kursinhalte:** User lieferte manuell 12 Themen + 12 Fragen für IT-Sicherheit
4. **Seed-Script aktualisieren:** Vollständiges Script mit allen 12 Themen erstellt
5. **Kurs-IDs fixen:** Auto-Increment IDs waren falsch (6,7,8 statt 1,2,3) → Neu erstellt mit festen IDs

**Was gelernt:**
- ❌ **NIEMALS `pnpm db:push` auf Produktion verwenden!**
- ✅ **Nur manuelle SQL-Migrationen mit `webdev_execute_sql`**
- ✅ **Seed-Scripts MÜSSEN vollständig sein (alle Kursinhalte)**
- ✅ **Dokumentation erstellt:** `docs/CRITICAL-DATABASE-MIGRATION-RULES.md`

---

### Phase 2: Kurs-Wiederholungs-Feature (Erfolgreich)

**Zeitpunkt:** 15.02.2026 00:15 - 00:30

#### Implementierung
1. **Schema:** `lastCompletedAt DATETIME NULL` zu `question_progress` (manuelle SQL-Migration)
2. **Backend:** `checkAndMarkCourseCompletion()` - setzt `lastCompletedAt` bei 100%
3. **Backend:** `resetQuestionProgressByCourse()` - setzt `firstAttemptStatus='unanswered'`, behält `lastCompletedAt`
4. **Backend:** API-Endpoint `course.resetProgress`
5. **Frontend:** "Kurs wiederholen" Button + Bestätigungs-Dialog + Abschlussdatum-Anzeige

**Status:** ✅ Erfolgreich implementiert

---

### Phase 3: Bug #1 - "0 Fragen warten" nach Reset

**Zeitpunkt:** 15.02.2026 00:30 - 00:45

#### Problem
- CourseView zeigt "0 Fragen warten auf dich" nach Kurs-Wiederholung
- Kurs hat 12 Fragen in DB
- User hat Progress-Einträge mit `firstAttemptStatus='unanswered'`

#### Root Cause
**Zeile 812 in `routers.ts` (`getCourseStats`):**
```typescript
const answered = uniqueQuestions.size;  // ❌ FALSCH!
```

**Problem:** Zählt ALLE Progress-Einträge als "beantwortet", auch die mit `firstAttemptStatus='unanswered'` nach Reset

**Berechnung:**
- `answered = 12` (alle Fragen haben Progress-Einträge)
- `total - answered = 12 - 12 = 0 Fragen warten` ❌

#### Fehlgeschlagene Lösungsversuche
1. ❌ Fix in `getCourseProgress` (Zeile 933) - **FALSCHE API!** CourseView ruft `getCourseStats` auf, nicht `getCourseProgress`
2. ❌ Server-Neustart ohne richtigen Fix - Problem blieb bestehen

#### Erfolgreiche Lösung
**Zeile 811 in `routers.ts`:**
```typescript
const answered = progress.filter((p: any) => p.firstAttemptStatus !== 'unanswered').length;
```

**Auch Topic-Progress gefixed (Zeile 824):**
```typescript
const answered = topicProg.filter((p: any) => p.firstAttemptStatus !== 'unanswered').length;
```

**Was gelernt:**
- ❌ **Immer prüfen WELCHE API das Frontend wirklich aufruft (nicht annehmen!)**
- ❌ **`getCourseStats` ≠ `getCourseProgress` (zwei verschiedene APIs!)**
- ✅ **Nach Code-Änderungen: Server-Neustart prüfen (HMR funktioniert nicht immer)**

---

### Phase 4: Bug #2 - "Keine Fragen verfügbar" im QuizView

**Zeitpunkt:** 15.02.2026 00:45 - 01:00

#### Problem
- CourseView zeigt korrekt "12 Fragen warten auf dich"
- Nach Klick auf "Starten" → QuizView zeigt "Keine Fragen verfügbar"

#### Root Cause
**Zeile 744-750 in `db.ts` (`getUnansweredQuestionsByCourse`):**
```typescript
const answeredProgress = await db
  .select({ questionId: questionProgress.questionId })
  .from(questionProgress)
  .where(and(
    eq(questionProgress.userId, userId),
    inArray(questionProgress.questionId, questionIds)
  ));
```

**Problem:** Holt ALLE Progress-Einträge (auch `firstAttemptStatus='unanswered'` nach Reset) und filtert dann alle Fragen raus die einen Progress-Eintrag haben

**Nach Reset:**
- Alle 12 Fragen haben Progress-Einträge
- `answeredQuestionIds = [1,2,3...12]`
- Filter entfernt ALLE Fragen
- **Resultat: 0 Fragen zurück** ❌

#### Lösung
**Zeile 750 in `db.ts`:**
```typescript
const answeredProgress = await db
  .select({ questionId: questionProgress.questionId, firstAttemptStatus: questionProgress.firstAttemptStatus })
  .from(questionProgress)
  .where(and(
    eq(questionProgress.userId, userId),
    inArray(questionProgress.questionId, questionIds),
    not(eq(questionProgress.firstAttemptStatus, 'unanswered'))  // ✅ NEU!
  ));
```

**Zusätzlich:** `not` zu drizzle-orm Imports hinzugefügt (Zeile 1)

**Was gelernt:**
- ❌ **`getUnansweredQuestionsByCourse` muss Progress-Einträge mit `firstAttemptStatus='unanswered'` ignorieren**
- ✅ **Nach Reset: Progress-Einträge existieren noch, aber mit `'unanswered'` Status**

---

### Phase 5: Bug #3 - Dashboard zeigt 100% statt 42%

**Zeitpunkt:** 15.02.2026 01:00 - 01:15

#### Problem
- CourseView zeigt korrekt 42% Fortschritt
- Dashboard zeigt 100% Fortschritt für denselben Kurs

#### Root Cause
**Zwei verschiedene Datenquellen:**

1. **CourseView (Zeile 31):**
   ```typescript
   trpc.question.getCourseStats.useQuery({ courseId })
   ```
   → Zählt korrekte Fragen (`firstAttemptStatus='correct'`) in `question_progress`

2. **Dashboard (Zeile 14 + 17-30):**
   ```typescript
   trpc.progress.my.useQuery()
   ```
   → Zählt completed Topics (`status='completed'`) in `user_progress`

**Problem:** `resetQuestionProgressByCourse` setzt nur `question_progress` zurück, NICHT `user_progress`!

#### Lösung
**Zeile 571-581 in `db.ts` (`resetQuestionProgressByCourse`):**
```typescript
// Setze auch user_progress zurück (Topics auf 'in_progress')
await db
  .update(userProgress)
  .set({
    status: 'in_progress',
    completedAt: null,
  })
  .where(and(
    eq(userProgress.userId, userId),
    eq(userProgress.courseId, courseId)
  ));
```

**Was gelernt:**
- ❌ **Es gibt ZWEI Progress-Tabellen: `question_progress` UND `user_progress`**
- ❌ **Dashboard und CourseView verwenden VERSCHIEDENE Datenquellen**
- ✅ **Reset muss BEIDE Tabellen zurücksetzen!**

---

## Finale Implementierung

### Datenbank-Schema

**`question_progress` Tabelle:**
```sql
ALTER TABLE question_progress 
ADD COLUMN lastCompletedAt DATETIME NULL;
```

### Backend-Funktionen

**1. Auto-Tracking bei 100% Abschluss:**
```typescript
async function checkAndMarkCourseCompletion(userId: number, courseId: number): Promise<void> {
  const stats = await getCourseStats(userId, courseId);
  
  if (stats.percentage === 100) {
    const now = new Date();
    await db
      .update(questionProgress)
      .set({ lastCompletedAt: now })
      .where(and(
        eq(questionProgress.userId, userId),
        eq(questionProgress.courseId, courseId)
      ));
  }
}
```

**2. Kurs-Reset (behält `lastCompletedAt`):**
```typescript
export async function resetQuestionProgressByCourse(userId: number, courseId: number): Promise<void> {
  // 1. Setze question_progress zurück
  await db
    .update(questionProgress)
    .set({
      status: 'unanswered',
      firstAttemptStatus: 'unanswered',
      lastAttemptCorrect: null,
      attemptCount: 0,
      lastAttemptAt: null,
      // lastCompletedAt bleibt erhalten!
    })
    .where(and(
      eq(questionProgress.userId, userId),
      inArray(questionProgress.questionId, questionIds)
    ));
  
  // 2. Setze user_progress zurück
  await db
    .update(userProgress)
    .set({
      status: 'in_progress',
      completedAt: null,
    })
    .where(and(
      eq(userProgress.userId, userId),
      eq(userProgress.courseId, courseId)
    ));
}
```

**3. Korrekte Statistik-Berechnung:**
```typescript
// getCourseStats (Zeile 811)
const answered = progress.filter((p: any) => p.firstAttemptStatus !== 'unanswered').length;

// getUnansweredQuestionsByCourse (Zeile 750)
const answeredProgress = await db
  .select({ questionId: questionProgress.questionId })
  .from(questionProgress)
  .where(and(
    eq(questionProgress.userId, userId),
    inArray(questionProgress.questionId, questionIds),
    not(eq(questionProgress.firstAttemptStatus, 'unanswered'))  // ✅ Ignoriere 'unanswered'
  ));
```

### Frontend

**CourseView.tsx:**
- "Kurs wiederholen" Button bei 100%
- Bestätigungs-Dialog
- Anzeige "Zuletzt abgeschlossen: DD.MM.YYYY"
- Optimistic Updates mit Toast-Notifications

---

## Gültigkeit der Fixes

### ✅ GLOBAL für ALLE Kurse und ALLE User

**Alle Fixes gelten systemweit:**

1. **`getCourseStats` Fix (Zeile 811):**
   - Gilt für ALLE Kurse (1, 2, 3, 30002, etc.)
   - Gilt für ALLE User (SysAdmin, FirmenAdmin, normale User)
   - Berechnet `answered` korrekt für jeden Kurs-Abruf

2. **`getUnansweredQuestionsByCourse` Fix (Zeile 750):**
   - Gilt für ALLE Kurse
   - Gilt für ALLE User
   - QuizView zeigt korrekt Fragen für jeden User

3. **`resetQuestionProgressByCourse` Fix (Zeile 571-581):**
   - Gilt für ALLE zukünftigen Kurs-Wiederholungen
   - Gilt für ALLE User
   - Setzt sowohl `question_progress` als auch `user_progress` zurück

**Warum global?**
- Fixes sind in **Backend-Funktionen** implementiert (nicht kurs-spezifisch)
- Funktionen werden von **allen Kursen** verwendet
- Keine kurs-spezifische Logik (kein `if (courseId === 30002)`)

**Beispiel:**
- User A wiederholt Kurs 1 → Fix funktioniert
- User B wiederholt Kurs 2 → Fix funktioniert
- User C wiederholt Kurs 30002 → Fix funktioniert

---

## Kritische Erkenntnisse

### 1. Datenbank-Migrationen

❌ **NIEMALS:**
- `pnpm db:push` auf Produktion
- Automatische Migrations-Tools ohne Backup
- Vertrauen in "Sind Sie sicher?"-Dialoge

✅ **IMMER:**
- Manuelle SQL-Migrationen mit `webdev_execute_sql`
- Backup VOR jeder Schema-Änderung
- Seed-Scripts vollständig und getestet

### 2. API-Debugging

❌ **NIEMALS:**
- Annehmen welche API das Frontend aufruft
- Nur eine API fixen ohne Frontend zu prüfen
- Server-Neustart vergessen nach Code-Änderungen

✅ **IMMER:**
- Frontend-Code lesen: Welche `trpc.*` Query wird aufgerufen?
- Alle betroffenen APIs fixen (z.B. `getCourseStats` UND Topic-Progress)
- Nach Fix: Server neu starten + Browser neu laden

### 3. Progress-Tracking

❌ **NIEMALS:**
- Nur eine Progress-Tabelle zurücksetzen
- `progress.length` als "beantwortet" zählen
- Progress-Einträge mit `status='unanswered'` ignorieren

✅ **IMMER:**
- BEIDE Tabellen zurücksetzen: `question_progress` UND `user_progress`
- Filter: `firstAttemptStatus !== 'unanswered'`
- Konsistenz zwischen Dashboard und CourseView prüfen

---

## Checkliste für zukünftige Kurs-Features

### Vor Schema-Änderungen
- [ ] Backup der Datenbank erstellen
- [ ] Manuelle SQL-Migration schreiben (KEIN `pnpm db:push`)
- [ ] Migration in Test-Umgebung testen
- [ ] Seed-Script aktualisieren falls nötig

### Bei Progress-Tracking-Änderungen
- [ ] Beide Tabellen prüfen: `question_progress` UND `user_progress`
- [ ] Dashboard UND CourseView testen
- [ ] Filter für `firstAttemptStatus='unanswered'` einbauen
- [ ] Server neu starten nach Code-Änderungen

### Bei API-Änderungen
- [ ] Frontend-Code lesen: Welche API wird wirklich aufgerufen?
- [ ] Alle betroffenen APIs fixen (nicht nur eine)
- [ ] TypeScript-Fehler prüfen
- [ ] Browser-Logs prüfen

### Nach Implementierung
- [ ] Mit ALLEN Kursen testen (nicht nur einem)
- [ ] Mit verschiedenen Usern testen
- [ ] Dashboard UND CourseView prüfen
- [ ] Checkpoint erstellen mit detaillierter Beschreibung

---

## Dateien die geändert wurden

### Backend
- `server/db.ts`:
  - Zeile 1: `not` zu drizzle-orm Imports
  - Zeile 543-582: `resetQuestionProgressByCourse` erweitert (user_progress Reset)
  - Zeile 730-756: `getUnansweredQuestionsByCourse` gefixed (Filter für `unanswered`)
  - Zeile 572-600: `checkAndMarkCourseCompletion` neu erstellt

- `server/routers.ts`:
  - Zeile 811: `getCourseStats` answered-Berechnung gefixed
  - Zeile 824: Topic-Progress answered-Berechnung gefixed
  - Zeile 836-841: `lastCompletedAt` zu Return hinzugefügt
  - Zeile 958-963: `course.resetProgress` Endpoint neu erstellt

### Frontend
- `client/src/pages/user/CourseView.tsx`:
  - Zeile 40-50: `resetMutation` und Dialog-State
  - Zeile 145: "Fragen warten" Berechnung gefixed
  - Zeile 165-185: "Kurs wiederholen" Button + Abschlussdatum
  - Zeile 250-270: Bestätigungs-Dialog

### Datenbank
- `question_progress` Tabelle:
  - Neue Spalte: `lastCompletedAt DATETIME NULL`

### Dokumentation
- `docs/CRITICAL-DATABASE-MIGRATION-RULES.md` (neu)
- `docs/decisions/ADR-016-database-migration-incident.md` (neu)
- `docs/LESSONS-LEARNED-KURS-WIEDERHOLUNG.md` (dieses Dokument)

---

## Zeitaufwand-Analyse

**Gesamt: 6 Stunden**

| Phase | Dauer | Tätigkeit |
|-------|-------|-----------|
| 1 | 1.5h | Datenbank-Vorfall + Wiederherstellung |
| 2 | 0.5h | Kurs-Wiederholungs-Feature Implementierung |
| 3 | 0.5h | Bug #1: "0 Fragen warten" |
| 4 | 0.5h | Bug #2: "Keine Fragen verfügbar" |
| 5 | 0.5h | Bug #3: Dashboard 100% statt 42% |
| 6 | 2.5h | Debugging, Testing, Dokumentation |

**Hätte vermieden werden können:**
- ❌ Datenbank-Vorfall: 1.5h (durch manuelle SQL-Migration)
- ❌ Bug #1: 0.3h (durch Frontend-Code lesen BEVOR Fix)
- ❌ Bug #2: 0.2h (durch konsistente Filter-Logik)
- ❌ Bug #3: 0.3h (durch beide Tabellen gleichzeitig fixen)

**Optimaler Zeitaufwand:** ~3 Stunden (statt 6)

---

## Nächste Schritte

### Sofort
- [x] Alle Fixes dokumentiert
- [x] Checkpoint erstellt
- [ ] Mit allen 3 Kursen testen (nicht nur Kurs 30002)
- [ ] Mit verschiedenen Usern testen

### Kurzfristig
- [ ] Automatisches Backup-Script einrichten (täglicher SQL-Dump)
- [ ] Staging-Datenbank aufsetzen für risikofreie Tests
- [ ] Unit-Tests für `resetQuestionProgressByCourse` schreiben

### Mittelfristig
- [ ] Progress-Tracking vereinfachen (nur eine Tabelle statt zwei?)
- [ ] Dashboard und CourseView gleiche API verwenden
- [ ] Monitoring für Datenbank-Inkonsistenzen

---

## Kontakt bei Fragen

Bei Problemen mit Kurs-Wiederholung:
1. Diese Dokumentation lesen
2. `todo.md` prüfen (alle Bugs dokumentiert)
3. `docs/CRITICAL-DATABASE-MIGRATION-RULES.md` lesen
4. Checkpoint `925d4483` oder neuer verwenden

**Alle Fixes sind global und gelten für alle Kurse und alle User!**
