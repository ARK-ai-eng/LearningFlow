# Technische Referenz - AISmarterFlow Academy

## API-Endpoints (tRPC)

### Authentication

#### `auth.login`
**Mutation** - Benutzer anmelden

```typescript
Input: {
  email: string,
  password: string
}

Output: {
  success: boolean,
  role: 'sysadmin' | 'companyadmin' | 'user',
  token: string  // JWT Token für localStorage
}

Error: "E-Mail oder Passwort falsch"
```

**Beispiel**:
```typescript
const { mutate: login } = trpc.auth.login.useMutation();
login({ 
  email: 'arton.ritter@aismarterflow.de', 
  password: 'SecurePass2026!' 
});
```

#### `auth.logout`
**Mutation** - Benutzer abmelden

```typescript
Output: { success: boolean }
```

#### `auth.me`
**Query** - Aktuelle Benutzer-Info

```typescript
Output: {
  id: number,
  email: string,
  role: 'sysadmin' | 'companyadmin' | 'user',
  firstName: string,
  lastName: string,
  companyId?: number
}
```

---

### Kurse (Courses)

#### `course.listActive`
**Query** - Alle aktiven Kurse

```typescript
Output: Course[]

Course: {
  id: number,
  title: string,
  description: string,
  courseType: 'learning' | 'sensitization' | 'certification',
  isActive: boolean,
  isMandatory: boolean,
  passingScore: number,
  timeLimit: number,
  topics?: Topic[]
}
```

#### `course.get`
**Query** - Einzelnen Kurs abrufen

```typescript
Input: { id: number }

Output: Course (mit Topics)
```

#### `course.create`
**Mutation** - Neuen Kurs erstellen (SysAdmin only)

```typescript
Input: {
  title: string,
  description: string,
  courseType: 'learning' | 'sensitization' | 'certification',
  isActive: boolean,
  isMandatory: boolean,
  passingScore?: number,
  timeLimit?: number
}

Output: { id: number }
```

#### `course.update`
**Mutation** - Kurs aktualisieren (SysAdmin only)

```typescript
Input: {
  id: number,
  title?: string,
  description?: string,
  courseType?: string,
  isActive?: boolean,
  isMandatory?: boolean,
  passingScore?: number,
  timeLimit?: number
}

Output: { success: boolean }
```

#### `course.delete`
**Mutation** - Kurs löschen (SysAdmin only)

```typescript
Input: { id: number }

Output: { success: boolean }
```

---

### Themen (Topics)

#### `topic.create`
**Mutation** - Neues Thema erstellen

```typescript
Input: {
  courseId: number,
  title: string,
  content?: string,
  orderIndex: number
}

Output: { id: number }
```

#### `topic.update`
**Mutation** - Thema aktualisieren

```typescript
Input: {
  id: number,
  title?: string,
  content?: string,
  orderIndex?: number
}

Output: { success: boolean }
```

#### `topic.delete`
**Mutation** - Thema löschen

```typescript
Input: { id: number }

Output: { success: boolean }
```

---

### Fragen (Questions)

#### `question.listByTopic`
**Query** - Alle Fragen eines Themas

```typescript
Input: { topicId: number }

Output: Question[]

Question: {
  id: number,
  topicId: number,
  courseId: number,
  questionText: string,
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string,
  correctAnswer: 'A' | 'B' | 'C' | 'D',
  explanation: string
}
```

#### `question.create`
**Mutation** - Neue Frage erstellen

```typescript
Input: {
  topicId: number,
  courseId: number,
  questionText: string,
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string,
  correctAnswer: 'A' | 'B' | 'C' | 'D',
  explanation: string
}

Output: { id: number }
```

#### `question.update`
**Mutation** - Frage aktualisieren

```typescript
Input: {
  id: number,
  questionText?: string,
  optionA?: string,
  optionB?: string,
  optionC?: string,
  optionD?: string,
  correctAnswer?: 'A' | 'B' | 'C' | 'D',
  explanation?: string
}

Output: { success: boolean }
```

#### `question.delete`
**Mutation** - Frage löschen

```typescript
Input: { id: number }

Output: { success: boolean }
```

---

### Fortschritt (Progress)

#### `progress.my`
**Query** - Eigener Fortschritt

```typescript
Output: UserProgress[]

UserProgress: {
  id: number,
  userId: number,
  courseId: number,
  topicId: number,
  status: 'not_started' | 'in_progress' | 'completed',
  score: number,
  completedAt: Date
}
```

#### `progress.byCourse`
**Query** - Fortschritt für einen Kurs

```typescript
Input: { courseId: number }

Output: UserProgress[]
```

#### `progress.completeTopic`
**Mutation** - Thema als abgeschlossen markieren

```typescript
Input: {
  courseId: number,
  topicId: number,
  score?: number
}

Output: { success: boolean }
```

---

### Prüfungen (Exams)

#### `exam.getQuestions`
**Query** - Prüfungsfragen abrufen

```typescript
Input: { courseId: number }

Output: Question[] (20 zufällige Fragen)
```

#### `exam.submit`
**Mutation** - Prüfung einreichen

```typescript
Input: {
  courseId: number,
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>,
  timeTaken: number  // in Sekunden
}

Output: {
  passed: boolean,
  score: number,
  correctAnswers: number,
  totalQuestions: number,
  certificateId?: number
}
```

---

### Zertifikate (Certificates)

#### `certificate.my`
**Query** - Eigene Zertifikate

```typescript
Output: Certificate[]

Certificate: {
  id: number,
  userId: number,
  courseId: number,
  certificateNumber: string,
  issuedAt: Date,
  expiresAt: Date,
  pdfUrl: string
}
```

#### `certificate.generatePdf`
**Query** - PDF-Download

```typescript
Input: { certificateId: number }

Output: { url: string }  // PDF-URL zum Download
```

---

### Firmen (Companies)

#### `company.list`
**Query** - Alle Firmen (SysAdmin only)

```typescript
Output: Company[]

Company: {
  id: number,
  name: string,
  status: 'active' | 'inactive' | 'suspended',
  maxUsers: number,
  createdAt: Date
}
```

#### `company.create`
**Mutation** - Neue Firma erstellen (SysAdmin only)

```typescript
Input: {
  name: string,
  maxUsers?: number
}

Output: { id: number }
```

#### `company.update`
**Mutation** - Firma aktualisieren (SysAdmin only)

```typescript
Input: {
  id: number,
  name?: string,
  status?: 'active' | 'inactive' | 'suspended',
  maxUsers?: number
}

Output: { success: boolean }
```

---

### Benutzer (Users)

#### `user.create`
**Mutation** - Neuen Benutzer erstellen

```typescript
Input: {
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: 'companyadmin' | 'user',
  companyId: number,
  personnelNumber?: string
}

Output: { id: number }
```

#### `user.list`
**Query** - Benutzer einer Firma (FirmenAdmin only)

```typescript
Input: { companyId: number }

Output: User[]

User: {
  id: number,
  email: string,
  firstName: string,
  lastName: string,
  role: 'companyadmin' | 'user',
  companyId: number,
  personnelNumber: string,
  isActive: boolean,
  createdAt: Date
}
```

---

## Frontend-Hooks

### `useAuth()`
```typescript
const { user, isLoading } = useAuth();

// user: { id, email, role, firstName, lastName, companyId }
// isLoading: boolean
```

### `trpc.*.useQuery()`
```typescript
const { data, isLoading, error } = trpc.course.listActive.useQuery();
```

### `trpc.*.useMutation()`
```typescript
const { mutate, isPending } = trpc.course.create.useMutation({
  onSuccess: (data) => {
    console.log('Kurs erstellt:', data);
  },
  onError: (error) => {
    console.error('Fehler:', error.message);
  }
});

mutate({ title: 'Neuer Kurs', ... });
```

---

## Datenbank-Funktionen

### User-Funktionen

```typescript
// User per E-Mail finden
const user = await db.getUserByEmail('test@example.com');

// User per ID finden
const user = await db.getUserById(1);

// User erstellen
const userId = await db.createUser({
  email: 'test@example.com',
  passwordHash: 'bcrypt_hash',
  firstName: 'Max',
  lastName: 'Müller',
  role: 'user'
});

// User aktualisieren
await db.updateUser(1, { firstName: 'Maximilian' });

// Passwort aktualisieren
await db.updateUserPassword(1, 'new_bcrypt_hash');

// Last Sign In aktualisieren
await db.updateUserLastSignedIn(1);

// User löschen
await db.deleteUser(1);

// Benutzer einer Firma abrufen
const users = await db.getUsersByCompany(1);
```

### Course-Funktionen

```typescript
// Alle aktiven Kurse
const courses = await db.getActiveCourses();

// Kurs per ID
const course = await db.getCourseById(1);

// Kurs erstellen
const courseId = await db.createCourse({
  title: 'Neuer Kurs',
  courseType: 'learning',
  isActive: true
});

// Kurs aktualisieren
await db.updateCourse(1, { title: 'Aktualisierter Kurs' });

// Kurs löschen
await db.deleteCourse(1);
```

### Progress-Funktionen

```typescript
// Fortschritt eines Users abrufen
const progress = await db.getUserProgress(userId);

// Fortschritt für einen Kurs
const progress = await db.getUserCourseProgress(userId, courseId);

// Fortschritt aktualisieren/erstellen
await db.upsertProgress({
  userId: 1,
  courseId: 1,
  topicId: 1,
  status: 'completed',
  score: 100
});
```

---

## Fehlerbehandlung

### tRPC Error Codes

```typescript
// Authentifizierung
'UNAUTHORIZED' - Benutzer nicht angemeldet
'FORBIDDEN' - Benutzer hat keine Berechtigung

// Validierung
'BAD_REQUEST' - Ungültige Eingabe
'PARSE_ERROR' - JSON Parse Fehler

// Ressourcen
'NOT_FOUND' - Ressource nicht gefunden
'CONFLICT' - Konflikt (z.B. E-Mail existiert bereits)

// Server
'INTERNAL_SERVER_ERROR' - Unerwarteter Fehler
```

### Fehlerbehandlung im Frontend

```typescript
const { mutate } = trpc.auth.login.useMutation({
  onError: (error) => {
    if (error.code === 'UNAUTHORIZED') {
      console.error('Falsche Anmeldedaten');
    } else if (error.code === 'INTERNAL_SERVER_ERROR') {
      console.error('Server-Fehler:', error.message);
    }
  }
});
```

---

## Performance-Tipps

1. **Query Caching**: TanStack Query cached Queries automatisch
2. **Lazy Loading**: Nutzen Sie `enabled` Parameter um Queries zu verzögern
3. **Optimistic Updates**: Aktualisieren Sie UI sofort, bevor Server antwortet
4. **Pagination**: Implementieren Sie für große Listen

---

## Sicherheit

1. **Passwort-Hashing**: Alle Passwörter werden mit bcryptjs gehasht
2. **JWT-Tokens**: Kurze Gültigkeit (7 Tage)
3. **Authorization Header**: Tokens werden per Header übertragen
4. **E-Mail als ID**: Verhindert Duplikate und Missbrauch

---

## Debugging

### Server-Logs anschauen

```bash
tail -f .manus-logs/devserver.log
```

### Browser-Console

```bash
tail -f .manus-logs/browserConsole.log
```

### Datenbank-Abfragen testen

```bash
mysql -u user -p -h host database
SELECT * FROM users WHERE email = 'test@example.com';
```

---

## Deployment

### Build

```bash
pnpm build
```

### Start

```bash
node dist/index.js
```

### Environment Variables

```env
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=<random-secret>
NODE_ENV=production
```
