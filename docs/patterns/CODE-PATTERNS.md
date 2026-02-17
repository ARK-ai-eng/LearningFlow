# LearningFlow - Code Patterns

**Zweck:** Wiederverwendbare Code-Patterns die sich in 22 Sprints bewährt haben.

**Verwendung:** Copy-Paste diese Patterns für häufige Aufgaben.

**Letzte Aktualisierung:** 17.02.2026

---

## 🔹 tRPC Procedures

### Pattern: Public Procedure
```typescript
// server/routers.ts
export const appRouter = router({
  course: {
    listActive: publicProcedure
      .query(async ({ ctx }) => {
        return await getActiveCoursesWithStats(ctx.user?.id);
      }),
  },
});
```

**Wann verwenden:** Endpoints die ohne Login zugänglich sein sollen

---

### Pattern: Protected Procedure
```typescript
// server/routers.ts
export const appRouter = router({
  course: {
    start: protectedProcedure
      .input(z.object({ courseId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // ctx.user ist garantiert vorhanden
        return await startCourse(ctx.user.id, input.courseId);
      }),
  },
});
```

**Wann verwenden:** Endpoints die Login erfordern

---

### Pattern: Admin Procedure
```typescript
// server/routers.ts
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  course: {
    create: adminProcedure
      .input(z.object({ title: z.string(), courseType: z.enum(['learning', 'sensitization', 'certification']) }))
      .mutation(async ({ ctx, input }) => {
        return await createCourse(input);
      }),
  },
});
```

**Wann verwenden:** Endpoints nur für Admins

---

## 🔹 Drizzle Queries

### Pattern: Simple Select
```typescript
// server/db.ts
export async function getCourseById(courseId: string) {
  const result = await getDb()
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  
  return result[0] || null;
}
```

**Wann verwenden:** Einfache Queries ohne Joins

---

### Pattern: JOIN Query
```typescript
// server/db.ts
export async function getCoursesWithProgress(userId: string) {
  return await getDb()
    .select({
      id: courses.id,
      title: courses.title,
      progress: sql<number>`COALESCE(
        (SELECT COUNT(*) FROM ${questionProgress} 
         WHERE ${questionProgress.userId} = ${userId} 
         AND ${questionProgress.isCorrect} = 1) * 100.0 / 
        (SELECT COUNT(*) FROM ${questions} WHERE ${questions.courseId} = ${courses.id}), 
        0
      )`.as('progress'),
    })
    .from(courses)
    .where(eq(courses.isActive, true));
}
```

**Wann verwenden:** Komplexe Aggregationen, Performance-kritisch

---

### Pattern: Transaction
```typescript
// server/db.ts
export async function createExamWithCertificate(userId: string, courseId: string, score: number) {
  const db = getDb();
  
  return await db.transaction(async (tx) => {
    // 1. Create exam record
    const [exam] = await tx
      .insert(exams)
      .values({
        id: generateId(),
        userId,
        courseId,
        score,
        passed: score >= 80,
        completedAt: new Date(),
      })
      .returning();
    
    // 2. Create certificate if passed
    if (exam.passed) {
      await tx.insert(certificates).values({
        id: generateId(),
        userId,
        courseId,
        examId: exam.id,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      });
    }
    
    return exam;
  });
}
```

**Wann verwenden:** Mehrere abhängige DB-Operationen (Atomarität erforderlich)

---

### Pattern: Bulk Insert
```typescript
// server/db.ts
export async function importEmployees(companyId: string, employees: Array<{ email: string; name: string }>) {
  const db = getDb();
  
  const values = employees.map(emp => ({
    id: generateId(),
    email: emp.email,
    name: emp.name,
    companyId,
    role: 'user' as const,
    createdAt: new Date(),
  }));
  
  return await db.insert(users).values(values).returning();
}
```

**Wann verwenden:** Viele Rows auf einmal einfügen (CSV-Import, Seed-Data)

---

## 🔹 React Patterns

### Pattern: Optimistic Update (List)
```typescript
// client/src/pages/CourseList.tsx
const utils = trpc.useUtils();

const deleteMutation = trpc.course.delete.useMutation({
  onMutate: async (deletedId) => {
    // Cancel outgoing refetches
    await utils.course.list.cancel();
    
    // Snapshot current value
    const previous = utils.course.list.getData();
    
    // Optimistically update
    utils.course.list.setData(undefined, (old) => 
      old?.filter(course => course.id !== deletedId)
    );
    
    return { previous };
  },
  onError: (err, deletedId, context) => {
    // Rollback on error
    utils.course.list.setData(undefined, context?.previous);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    utils.course.list.invalidate();
  },
});
```

**Wann verwenden:** Listen-Operationen (Delete, Toggle), Instant Feedback

---

### Pattern: Form mit Validation
```typescript
// client/src/pages/CourseEditor.tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const courseSchema = z.object({
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein'),
  courseType: z.enum(['learning', 'sensitization', 'certification']),
  description: z.string().optional(),
});

type CourseForm = z.infer<typeof courseSchema>;

export function CourseEditor() {
  const form = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      courseType: 'learning',
      description: '',
    },
  });
  
  const createMutation = trpc.course.create.useMutation({
    onSuccess: () => {
      toast.success('Kurs erstellt!');
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const onSubmit = (data: CourseForm) => {
    createMutation.mutate(data);
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('title')} />
      {form.formState.errors.title && (
        <p className="text-red-500">{form.formState.errors.title.message}</p>
      )}
      {/* ... */}
    </form>
  );
}
```

**Wann verwenden:** Formulare mit Validation

---

### Pattern: Loading/Error/Empty States
```typescript
// client/src/pages/Dashboard.tsx
export function Dashboard() {
  const { data: courses, isLoading, error } = trpc.course.listActive.useQuery();
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Fehler: {error.message}</p>
        <Button onClick={() => window.location.reload()}>Neu laden</Button>
      </div>
    );
  }
  
  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Keine Kurse verfügbar</p>
      </div>
    );
  }
  
  return (
    <div>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

**Wann verwenden:** Alle Komponenten mit Daten-Fetching

---

## 🔹 Datenbank Patterns

### Pattern: Soft Delete
```typescript
// drizzle/schema.ts
export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }), // NULL = aktiv
  // ...
});

// server/db.ts
export async function deleteCourse(courseId: string) {
  return await getDb()
    .update(courses)
    .set({ deletedAt: new Date() })
    .where(eq(courses.id, courseId));
}

export async function getActiveCourses() {
  return await getDb()
    .select()
    .from(courses)
    .where(isNull(courses.deletedAt)); // Nur aktive
}
```

**Wann verwenden:** Daten-Wiederherstellung möglich sein soll

**Quelle:** `ADR-011-Soft-Delete.md`

---

### Pattern: Multi-Tenancy (Composite Index)
```typescript
// drizzle/schema.ts
export const progress = sqliteTable('progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  companyId: text('company_id').notNull(),
  courseId: text('course_id').notNull(),
  // ...
}, (table) => ({
  // Composite Index für firmen-spezifische Queries
  idxCompanyUser: index('idx_company_user').on(table.companyId, table.userId),
}));

// server/db.ts
export async function getCompanyProgress(companyId: string) {
  return await getDb()
    .select()
    .from(progress)
    .where(eq(progress.companyId, companyId)); // Nutzt idx_company_user
}
```

**Wann verwenden:** Multi-Tenancy-Systeme (Firmen, Organisationen)

**Quelle:** `PHASE-2-INDEX-ANALYSIS-2026-02-16.md`

---

### Pattern: Fisher-Yates Shuffle
```typescript
// server/db.ts
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Copy to avoid mutation
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Usage
export async function getQuestionWithShuffledAnswers(questionId: string) {
  const question = await getQuestionById(questionId);
  
  if (!question) return null;
  
  const answers = [
    { text: question.answerA, isCorrect: question.correctAnswer === 'A' },
    { text: question.answerB, isCorrect: question.correctAnswer === 'B' },
    { text: question.answerC, isCorrect: question.correctAnswer === 'C' },
    { text: question.answerD, isCorrect: question.correctAnswer === 'D' },
  ];
  
  return {
    ...question,
    answers: shuffleArray(answers),
  };
}
```

**Wann verwenden:** Zufällige Reihenfolge (Quiz-Antworten, Fragen)

**Quelle:** `ADR-014-Fisher-Yates-Shuffle.md`

---

## 🔹 Security Patterns

### Pattern: Password Hashing
```typescript
// server/db.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // Balance Security/Performance

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Usage in login
export async function loginUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  
  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }
  
  const isValid = await verifyPassword(password, user.passwordHash);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  return user;
}
```

**Wann verwenden:** Passwort-Speicherung, Login

**Quelle:** `SECURITY-HARDENING-2026-02-16.md`

---

### Pattern: JWT Token Generation
```typescript
// server/_core/auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '24h';

export function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyToken(token: string): { userId: string; email: string; role: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

**Wann verwenden:** Session-Management, Auth

**Quelle:** `SECURITY-HARDENING-2026-02-16.md`

---

### Pattern: Rate Limiting
```typescript
// server/_core/rateLimit.ts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(identifier);
  
  // Reset if window expired
  if (record && now > record.resetAt) {
    loginAttempts.delete(identifier);
    return true;
  }
  
  // Check if limit exceeded
  if (record && record.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  // Increment counter
  if (record) {
    record.count++;
  } else {
    loginAttempts.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
  }
  
  return true;
}

// Usage in login endpoint
export const login = publicProcedure
  .input(z.object({ email: z.string().email(), password: z.string() }))
  .mutation(async ({ input }) => {
    if (!checkRateLimit(input.email)) {
      throw new TRPCError({ 
        code: 'TOO_MANY_REQUESTS', 
        message: 'Zu viele Login-Versuche. Bitte warten Sie 15 Minuten.' 
      });
    }
    
    // ... login logic
  });
```

**Wann verwenden:** Auth-Endpoints, Brute-Force-Schutz

**Quelle:** `SECURITY-HARDENING-2026-02-16.md`

---

## 🔹 Performance Patterns

### Pattern: Avoid N+1 (JOIN statt map(async))
```typescript
// ❌ BAD: N+1 Problem (340 Queries!)
export async function getCoursesWithProgress(userId: string) {
  const courses = await getDb().select().from(courses);
  
  return await Promise.all(
    courses.map(async (course) => {
      const progress = await getProgress(userId, course.id); // N Queries!
      return { ...course, progress };
    })
  );
}

// ✅ GOOD: JOIN (1 Query)
export async function getCoursesWithProgress(userId: string) {
  return await getDb()
    .select({
      id: courses.id,
      title: courses.title,
      progress: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${questionProgress} 
           WHERE ${questionProgress.userId} = ${userId} 
           AND ${questionProgress.courseId} = ${courses.id}
           AND ${questionProgress.isCorrect} = 1) * 100.0 / 
          (SELECT COUNT(*) FROM ${questions} 
           WHERE ${questions.courseId} = ${courses.id}), 
          0
        )
      `.as('progress'),
    })
    .from(courses);
}
```

**Wann verwenden:** Immer! Niemals map(async) für DB-Queries

**Impact:** 94% weniger Queries, 50-100× schneller

**Quelle:** `PHASE-1-N+1-ELIMINATION-RESULTS.md`

---

### Pattern: Client-side Navigation
```typescript
// ❌ BAD: Full Page Reload
window.location.href = '/dashboard';

// ✅ GOOD: Client-side Navigation
import { useLocation } from 'wouter';

export function MyComponent() {
  const [, setLocation] = useLocation();
  
  const handleClick = () => {
    setLocation('/dashboard'); // No reload!
  };
  
  return <Button onClick={handleClick}>Go to Dashboard</Button>;
}
```

**Wann verwenden:** Alle internen Navigationen

**Impact:** Schneller + bessere UX

**Quelle:** `PERFORMANCE-RESULTS-2026-02-15.md`

---

## 🔹 Testing Patterns

### Pattern: Vitest Unit Test (tRPC Procedure)
```typescript
// server/course.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from './routers';

describe('course.create', () => {
  it('should create course with valid input', async () => {
    const caller = appRouter.createCaller({
      user: { id: '1', email: 'admin@test.com', role: 'admin' },
    });
    
    const result = await caller.course.create({
      title: 'Test Course',
      courseType: 'learning',
      description: 'Test description',
    });
    
    expect(result.id).toBeDefined();
    expect(result.title).toBe('Test Course');
  });
  
  it('should throw error for non-admin', async () => {
    const caller = appRouter.createCaller({
      user: { id: '2', email: 'user@test.com', role: 'user' },
    });
    
    await expect(
      caller.course.create({
        title: 'Test Course',
        courseType: 'learning',
      })
    ).rejects.toThrow('Admin access required');
  });
});
```

**Wann verwenden:** Alle tRPC Procedures

---

### Pattern: Vitest Unit Test (DB Function)
```typescript
// server/db.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, getCourseById, createCourse } from './db';

describe('getCourseById', () => {
  let testCourseId: string;
  
  beforeEach(async () => {
    // Setup: Create test course
    const course = await createCourse({
      title: 'Test Course',
      courseType: 'learning',
    });
    testCourseId = course.id;
  });
  
  afterEach(async () => {
    // Cleanup: Delete test course
    await getDb()
      .delete(courses)
      .where(eq(courses.id, testCourseId));
  });
  
  it('should return course when exists', async () => {
    const result = await getCourseById(testCourseId);
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(testCourseId);
    expect(result?.title).toBe('Test Course');
  });
  
  it('should return null when not exists', async () => {
    const result = await getCourseById('non-existent-id');
    
    expect(result).toBeNull();
  });
});
```

**Wann verwenden:** Alle DB-Funktionen

---

## 📚 Weiterführende Patterns

### Design Patterns
- `docs/design-system/COMPONENT-LIBRARY.md` - UI-Komponenten
- `docs/design-system/TAILWIND-ARCHITECTURE.md` - CSS-Patterns

### Database Patterns
- `docs/decisions/ADR-011-Soft-Delete.md`
- `docs/decisions/ADR-014-Fisher-Yates-Shuffle.md`

### Performance Patterns
- `docs/PHASE-1-N+1-ELIMINATION-RESULTS.md`
- `docs/PHASE-2-INDIZES-RESULTS-2026-02-16.md`

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 17.02.2026  
**Autor:** Extrahiert aus 22 Sprints Entwicklung  
**Maintainer:** Manus AI Agent
