# Lern-Flow Dokumentation

## Übersicht

Der Lern-Flow wurde für maximale Einfachheit und Benutzerfreundlichkeit optimiert. Jeder Mitarbeiter bearbeitet Fragen sequenziell, erhält sofortiges Feedback und kann nicht zurückgehen - ein linearer, fokussierter Lernprozess.

## Architektur

### Kurstypen

| Typ | Beschreibung | Fragen pro Thema | Bestehensgrenze | Zertifikat |
|-----|--------------|------------------|-----------------|-----------|
| **Learning** | Freies Lernmodul | 4 pro Thema | Keine (Lernmodus) | Nein |
| **Sensitization** | Awareness-Schulung | 4 pro Thema | 3 von 4 richtig | Nein |
| **Certification** | Zertifizierungskurs | 4 pro Thema + 20 Prüfungsfragen | 80% | Ja (1 Jahr gültig) |

### Datenmodell

```
Course (3 Typen)
  ├── Topic (z.B. 12 Themen)
  │   ├── Questions (4 pro Thema)
  │   │   ├── optionA, optionB, optionC, optionD
  │   │   ├── correctAnswer (A|B|C|D)
  │   │   └── explanation
  │   └── UserProgress (Status: not_started|in_progress|completed)
  └── ExamAttempt (nur für Certification)
      └── Certificate (nach bestandener Prüfung)
```

## Lern-Flow (Learning & Sensitization)

### Benutzer-Perspektive

1. **Kurs starten** → User sieht Kurs-Übersicht mit 12 Themen
2. **Thema öffnen** → Erste Frage wird angezeigt mit 4 Antwortmöglichkeiten (A, B, C, D)
3. **Antwort klicken** → Sofortiges Feedback:
   - ✅ **Richtig**: Grüner Haken bei der Antwort
   - ❌ **Falsch**: Rotes Kreuz + Anzeige der richtigen Antwort mit grünem Haken
4. **Nächste Frage** → Button wird aktiv nach Feedback
5. **Alle 4 Fragen bearbeitet** → "Thema abgeschlossen" Meldung
6. **Option: Nächstes Thema** → Direkt zum nächsten Thema oder zurück zur Übersicht
7. **Nach 12 Themen** → Kurs zu 100% abgeschlossen

### Wichtige Regeln

- **Jede Frage nur 1x**: Keine Wiederholung möglich
- **Kein Scoring im Learning-Modus**: Im Lernmodus zählt nur das Durcharbeiten
- **Sensitization-Modus**: Mindestens 3 von 4 Fragen richtig pro Thema zum Bestehen
- **Kein "Quiz wiederholen"**: Nach Abschluss eines Themas ist es erledigt

## Frontend-Implementierung

### Komponente: `TopicView.tsx`

**Datei**: `/client/src/pages/user/TopicView.tsx`

**State-Management**:
```typescript
const [currentQuestion, setCurrentQuestion] = useState(0);      // Aktuelle Frage (0-3)
const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);  // Gewählte Antwort
const [answered, setAnswered] = useState(false);                // Wurde bereits beantwortet?
const [topicCompleted, setTopicCompleted] = useState(false);    // Thema fertig?
```

**Workflow**:
1. Frage wird angezeigt (mit Progress-Bar)
2. User klickt auf Antwort → `handleAnswerClick()`
3. Feedback wird sofort angezeigt (Farben + Erklärung)
4. "Nächste Frage" Button wird aktiv
5. Bei letzter Frage: "Thema abschließen" statt "Nächste Frage"
6. Thema-Abschluss-Meldung mit Option zum nächsten Thema

**Styling**:
- Richtige Antwort: `.correct` (grüner Haken, grüner Hintergrund)
- Falsche Antwort: `.incorrect` (rotes Kreuz, roter Hintergrund)
- Noch nicht beantwortet: `.selected` (Highlight)

## Backend-Implementierung

### Datenbank-Abfragen

**Fragen abrufen**:
```typescript
trpc.question.listByTopic.useQuery(
  { topicId: tId },
  { enabled: tId > 0 }
)
```

**Thema abschließen**:
```typescript
completeMutation = trpc.progress.completeTopic.useMutation({
  courseId: cId,
  topicId: tId,
  score: 100,  // Im Lernmodus immer 100%
})
```

### Endpoints

**`progress.completeTopic`** (Mutation)
- Input: `{ courseId, topicId, score? }`
- Speichert: `userProgress` mit Status `completed`
- Trigger: Automatisch nach letzter Frage

**`question.listByTopic`** (Query)
- Input: `{ topicId }`
- Output: Array von Questions mit optionA-D, correctAnswer, explanation

## Datenbank-Fix (28.01.2026)

### Problem
Die Drizzle ORM Initialisierung war fehlerhaft:
```typescript
// ❌ Falsch
_db = drizzle(process.env.DATABASE_URL);
```

Dies führte zu "Failed query" Fehlern, obwohl die Daten in der Datenbank existierten.

### Lösung
```typescript
// ✅ Richtig
import mysql from "mysql2/promise";

const pool = mysql.createPool(process.env.DATABASE_URL);
_db = drizzle(pool);
```

**Datei**: `/server/db.ts` (Zeilen 1-36)

**Grund**: `drizzle-orm/mysql2` erwartet einen mysql2 Connection Pool, nicht nur die URL.

## Testing

### Vitest Tests
- **32 Tests bestanden** (alle Kategorien)
- Login-Tests mit Passwort-Hashing
- Academy-Tests (Kurse, Themen, Fragen)
- Certificate-Tests (PDF-Generierung)

**Ausführen**:
```bash
pnpm test
```

## Deployment-Checklist

- [x] Datenbank-Migrations durchgeführt
- [x] Seed-Daten geladen (3 Kurse, 12 Themen, 40+ Fragen)
- [x] SysAdmin erstellt (arton.ritter@aismarterflow.de)
- [x] Lern-Flow Frontend implementiert
- [x] Datenbank-Fehler behoben
- [x] 32 Tests bestanden
- [x] Dev-Server läuft

## Nächste Schritte

1. **Mini-Quiz** (optional): Nach allen 12 Themen ein kurzes Abschluss-Quiz
2. **SysAdmin Fragen-Editor**: Alle Antwortmöglichkeiten (A-D) anzeigen und bearbeitbar
3. **E-Mail-Versand**: Automatische Benachrichtigungen bei Einladungen (später)
4. **Passwort-Reset**: E-Mail-basiertes Password-Reset-System (später)

## Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `/client/src/pages/user/TopicView.tsx` | Lern-Flow Frontend |
| `/server/db.ts` | Datenbank-Initialisierung + Queries |
| `/server/routers.ts` | tRPC Endpoints |
| `/drizzle/schema.ts` | Datenbank-Schema |
| `/scripts/seed-courses.mjs` | Seed-Daten laden |
