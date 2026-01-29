# Pattern-Katalog - Wiederverwendbare Lösungen

## Übersicht

Dieses Verzeichnis dokumentiert **bewährte Patterns** (Lösungsmuster) für häufige Aufgaben.

**Zweck**: Neue Features können Patterns kopieren statt neu erfinden.

---

## Index

| Pattern | Kategorie | Komplexität | Status |
|---------|-----------|-------------|--------|
| [PATTERN-Admin-Dashboard](#pattern-admin-dashboard) | Layout | ⭐⭐ | ✅ Implementiert |
| [PATTERN-Benutzer-Verwaltung](#pattern-benutzer-verwaltung) | CRUD | ⭐⭐⭐ | ✅ Implementiert |
| [PATTERN-Lern-Flow](#pattern-lern-flow) | Feature | ⭐⭐⭐ | ✅ Implementiert |
| [PATTERN-Formular-Validierung](#pattern-formular-validierung) | Forms | ⭐⭐ | ✅ Implementiert |
| [PATTERN-Datenbank-Query](#pattern-datenbank-query) | Database | ⭐⭐ | ✅ Implementiert |
| [PATTERN-tRPC-Procedure](#pattern-trpc-procedure) | API | ⭐⭐ | ✅ Implementiert |
| [PATTERN-Error-Handling](#pattern-error-handling) | Error | ⭐⭐ | ✅ Implementiert |
| [PATTERN-Responsive-Grid](#pattern-responsive-grid) | Layout | ⭐ | ✅ Implementiert |

---

## PATTERN-Admin-Dashboard

**Titel**: Admin-Dashboard mit Sidebar Navigation

**Komplexität**: ⭐⭐ (Mittel)  
**Status**: ✅ Implementiert  
**Komponenten**: DashboardLayout, Sidebar, Content Area

### Problem

Wie baue ich einen Admin-Dashboard mit Sidebar Navigation?

### Lösung

```typescript
// client/src/pages/admin/Dashboard.tsx
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Willkommen zurück</p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Firmen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">42</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mitarbeiter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1,234</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kurse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">56</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### Komponenten

- **DashboardLayout**: Sidebar + Content Area
- **Card**: Daten-Container
- **Responsive Grid**: Mobile/Tablet/Desktop

### Responsive

```typescript
// Mobile: 1 Spalte
// Tablet: 2 Spalten
// Desktop: 3 Spalten
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Checkliste

- [ ] DashboardLayout nutzen
- [ ] Sidebar Navigation definieren
- [ ] Card-Grid für Daten
- [ ] Responsive Breakpoints
- [ ] Loading States
- [ ] Error States

### Referenzen

- [DashboardLayout.tsx](../../client/src/components/DashboardLayout.tsx)
- [RESPONSIVE-DESIGN.md](../design-system/RESPONSIVE-DESIGN.md)

---

## PATTERN-Benutzer-Verwaltung

**Titel**: CRUD für Benutzer (Create, Read, Update, Delete)

**Komplexität**: ⭐⭐⭐ (Komplex)  
**Status**: ✅ Implementiert  
**Komponenten**: UserList, UserForm, UserDialog

### Problem

Wie implementiere ich Benutzer-Verwaltung (Erstellen, Bearbeiten, Löschen)?

### Lösung

**1. Backend - tRPC Procedures**

```typescript
// server/routers.ts
export const userRouter = router({
  // Alle Benutzer abrufen
  list: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getUsersByCompany(input.companyId);
    }),

  // Benutzer erstellen
  create: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      role: z.enum(['companyadmin', 'user']),
      companyId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createUser(input);
    }),

  // Benutzer aktualisieren
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.updateUser(input.id, input);
    }),

  // Benutzer löschen
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await db.deleteUser(input.id);
    }),
});
```

**2. Frontend - React Component**

```typescript
// client/src/pages/admin/UserManagement.tsx
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserForm } from '@/components/UserForm';

export function UserManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Daten abrufen
  const { data: users, isLoading } = trpc.user.list.useQuery({ companyId: 1 });

  // Mutation für Erstellen
  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      setIsOpen(false);
      utils.user.list.invalidate();
    },
  });

  // Mutation für Löschen
  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Benutzer</h1>
        <Button onClick={() => setIsOpen(true)}>Neuer Benutzer</Button>
      </div>

      {/* Benutzer-Tabelle */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">E-Mail</th>
              <th className="text-left p-4">Rolle</th>
              <th className="text-right p-4">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="border-t hover:bg-muted/50">
                <td className="p-4">{user.firstName} {user.lastName}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.role}</td>
                <td className="p-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ id: user.id })}
                  >
                    Löschen
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog für Erstellen */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Benutzer</DialogTitle>
          </DialogHeader>
          <UserForm onSubmit={(data) => createMutation.mutate(data)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Checkliste

- [ ] tRPC Procedures (list, create, update, delete)
- [ ] Input Validation (Zod Schemas)
- [ ] React Component mit Hooks
- [ ] Loading States
- [ ] Error Handling
- [ ] Optimistic Updates (optional)
- [ ] Confirmation Dialogs für Delete
- [ ] Form Validation

### Referenzen

- [server/routers.ts](../../server/routers.ts)
- [TECHNICAL_REFERENCE.md](../TECHNICAL_REFERENCE.md)

---

## PATTERN-Lern-Flow

**Titel**: Schlanker Lern-Flow (Fragen nacheinander, sofort Feedback)

**Komplexität**: ⭐⭐⭐ (Komplex)  
**Status**: ✅ Implementiert  
**Komponenten**: TopicView, QuestionCard

### Problem

Wie implementiere ich einen Lern-Flow, bei dem jede Frage nur 1x beantwortet wird?

### Lösung

```typescript
// client/src/pages/user/TopicView.tsx
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function TopicView({ topicId, courseId }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);

  // Fragen abrufen
  const { data: questions } = trpc.question.listByTopic.useQuery({ topicId });

  // Fortschritt speichern
  const saveMutation = trpc.progress.completeTopic.useMutation();

  if (!questions || questions.length === 0) return <div>Keine Fragen</div>;

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setAnswered(true);
    // Fortschritt speichern
    if (isLastQuestion) {
      saveMutation.mutate({ courseId, topicId });
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Thema abgeschlossen
      window.location.href = `/course/${courseId}`;
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Frage {currentIndex + 1} von {questions.length}
        </p>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Frage */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">{currentQuestion.questionText}</h2>

        {/* Antwort-Optionen */}
        <div className="space-y-3">
          {['A', 'B', 'C', 'D'].map((letter) => {
            const option = currentQuestion[`option${letter}`];
            const isSelected = selectedAnswer === letter;
            const isCorrectOption = currentQuestion.correctAnswer === letter;

            let bgColor = 'bg-card hover:bg-muted';
            if (answered) {
              if (isCorrectOption) bgColor = 'bg-green-100 border-green-500';
              if (isSelected && !isCorrect) bgColor = 'bg-red-100 border-red-500';
            }

            return (
              <button
                key={letter}
                onClick={() => !answered && handleAnswer(letter)}
                disabled={answered}
                className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${bgColor}`}
              >
                <div className="flex items-center">
                  <span className="font-semibold mr-3">{letter}.</span>
                  <span>{option}</span>
                  {answered && isCorrectOption && <span className="ml-auto text-green-600">✓</span>}
                  {answered && isSelected && !isCorrect && <span className="ml-auto text-red-600">✗</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {answered && (
          <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? '✓ Richtig!' : '✗ Falsch'}
            </p>
            {!isCorrect && (
              <p className="text-sm text-red-600 mt-2">
                Richtige Antwort: <strong>{currentQuestion.correctAnswer}</strong>
              </p>
            )}
            {currentQuestion.explanation && (
              <p className="text-sm mt-2">{currentQuestion.explanation}</p>
            )}
          </div>
        )}
      </Card>

      {/* Navigation */}
      {answered && (
        <Button
          onClick={handleNext}
          className="w-full"
        >
          {isLastQuestion ? 'Thema abgeschlossen' : 'Nächste Frage'}
        </Button>
      )}
    </div>
  );
}
```

### Checkliste

- [ ] Fragen sequenziell anzeigen
- [ ] Sofortiges Feedback (grün/rot)
- [ ] Keine Wiederholung möglich
- [ ] Fortschritt speichern
- [ ] Progress Bar anzeigen
- [ ] Erklärung für falsche Antworten
- [ ] "Nächste Frage" Button
- [ ] Am Ende: Thema abgeschlossen

### Referenzen

- [LEARNING_FLOW.md](../LEARNING_FLOW.md)
- [TopicView.tsx](../../client/src/pages/user/TopicView.tsx)

---

## PATTERN-Formular-Validierung

**Titel**: Formular mit Zod Validation

**Komplexität**: ⭐⭐ (Mittel)  
**Status**: ✅ Implementiert

### Problem

Wie validiere ich Formulare auf Frontend und Backend?

### Lösung

```typescript
// shared/schemas.ts
import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email('Ungültige E-Mail'),
  firstName: z.string().min(2, 'Mindestens 2 Zeichen'),
  lastName: z.string().min(2, 'Mindestens 2 Zeichen'),
  password: z.string().min(8, 'Mindestens 8 Zeichen'),
});

export type UserInput = z.infer<typeof userSchema>;

// server/routers.ts
export const userRouter = router({
  create: protectedProcedure
    .input(userSchema)  // ← Automatische Validierung
    .mutation(async ({ input }) => {
      return await db.createUser(input);
    }),
});

// client/src/components/UserForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '@/shared/schemas';

export function UserForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
  });

  const createMutation = trpc.user.create.useMutation();

  return (
    <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
      <div>
        <label>E-Mail</label>
        <input {...register('email')} />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label>Vorname</label>
        <input {...register('firstName')} />
        {errors.firstName && <p className="text-red-500">{errors.firstName.message}</p>}
      </div>

      <button type="submit">Speichern</button>
    </form>
  );
}
```

### Checkliste

- [ ] Zod Schema definieren
- [ ] Frontend Validation mit react-hook-form
- [ ] Backend Validation mit tRPC Input
- [ ] Error Messages anzeigen
- [ ] Loading State während Submit
- [ ] Success/Error Toast

### Referenzen

- [Zod Dokumentation](https://zod.dev/)
- [react-hook-form Dokumentation](https://react-hook-form.com/)

---

## PATTERN-Datenbank-Query

**Titel**: Datenbank-Queries mit Drizzle ORM

**Komplexität**: ⭐⭐ (Mittel)  
**Status**: ✅ Implementiert

### Problem

Wie schreibe ich Datenbank-Queries mit Drizzle?

### Lösung

```typescript
// server/db.ts
import { db } from './db';
import { users, courses } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// SELECT
export async function getUserById(id: number) {
  return await db.select().from(users).where(eq(users.id, id)).limit(1);
}

// INSERT
export async function createUser(data: UserInput) {
  return await db.insert(users).values(data).returning();
}

// UPDATE
export async function updateUser(id: number, data: Partial<UserInput>) {
  return await db.update(users).set(data).where(eq(users.id, id)).returning();
}

// DELETE
export async function deleteUser(id: number) {
  return await db.delete(users).where(eq(users.id, id));
}

// JOIN
export async function getUserWithCourses(userId: number) {
  return await db
    .select()
    .from(users)
    .leftJoin(courses, eq(users.id, courses.userId))
    .where(eq(users.id, userId));
}
```

### Checkliste

- [ ] Drizzle ORM nutzen
- [ ] Type-Safe Queries
- [ ] Prepared Statements (automatisch)
- [ ] Error Handling
- [ ] Returning() für INSERT/UPDATE
- [ ] Joins für Relationen

### Referenzen

- [Drizzle ORM Dokumentation](https://orm.drizzle.team/)
- [server/db.ts](../../server/db.ts)

---

## PATTERN-tRPC-Procedure

**Titel**: tRPC Procedure mit Input Validation

**Komplexität**: ⭐⭐ (Mittel)  
**Status**: ✅ Implementiert

### Problem

Wie schreibe ich eine tRPC Procedure?

### Lösung

```typescript
// server/routers.ts
import { router, publicProcedure, protectedProcedure } from '@/server/_core/trpc';
import { z } from 'zod';

export const courseRouter = router({
  // Public Query
  listActive: publicProcedure.query(async () => {
    return await db.getActiveCourses();
  }),

  // Protected Query
  my: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserCourses(ctx.user.id);
  }),

  // Mutation mit Input
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      courseType: z.enum(['learning', 'sensitization', 'certification']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Nur SysAdmin
      if (ctx.user.role !== 'sysadmin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return await db.createCourse(input);
    }),
});
```

### Checkliste

- [ ] publicProcedure oder protectedProcedure
- [ ] Input mit Zod Schema
- [ ] Type-Safe Output
- [ ] Error Handling (TRPCError)
- [ ] Authorization Checks
- [ ] Logging (optional)

### Referenzen

- [tRPC Dokumentation](https://trpc.io/)
- [server/routers.ts](../../server/routers.ts)

---

## PATTERN-Error-Handling

**Titel**: Error Handling in tRPC und React

**Komplexität**: ⭐⭐ (Mittel)  
**Status**: ✅ Implementiert

### Problem

Wie handle ich Fehler konsistent?

### Lösung

```typescript
// Backend
export const userRouter = router({
  create: protectedProcedure
    .input(userSchema)
    .mutation(async ({ input }) => {
      // Prüfe ob E-Mail existiert
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'E-Mail existiert bereits',
        });
      }

      try {
        return await db.createUser(input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Fehler beim Erstellen des Benutzers',
        });
      }
    }),
});

// Frontend
export function UserForm() {
  const createMutation = trpc.user.create.useMutation({
    onError: (error) => {
      if (error.data?.code === 'CONFLICT') {
        toast.error('E-Mail existiert bereits');
      } else {
        toast.error(error.message || 'Ein Fehler ist aufgetreten');
      }
    },
    onSuccess: () => {
      toast.success('Benutzer erstellt');
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      createMutation.mutate(data);
    }}>
      {/* Form */}
      {createMutation.isPending && <p>Wird gespeichert...</p>}
    </form>
  );
}
```

### Checkliste

- [ ] TRPCError mit Code und Message
- [ ] Validation Errors (Zod)
- [ ] Authorization Errors (FORBIDDEN)
- [ ] Not Found Errors (NOT_FOUND)
- [ ] Conflict Errors (CONFLICT)
- [ ] Loading States
- [ ] Error Messages anzeigen
- [ ] Toast Notifications

### Referenzen

- [TECHNICAL_REFERENCE.md](../TECHNICAL_REFERENCE.md)
- [DATABASE_FIX.md](../DATABASE_FIX.md)

---

## PATTERN-Responsive-Grid

**Titel**: Responsive Grid Layout (Mobile-First)

**Komplexität**: ⭐ (Einfach)  
**Status**: ✅ Implementiert

### Problem

Wie erstelle ich ein responsive Grid?

### Lösung

```typescript
// 1 Spalte Mobile, 2 Spalten Tablet, 3 Spalten Desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</div>

// Mit Auto-Fit (responsive ohne Breakpoints)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map((item) => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</div>
```

### Checkliste

- [ ] Mobile-First (grid-cols-1 zuerst)
- [ ] Breakpoints: md, lg, xl
- [ ] Gap für Spacing
- [ ] Responsive Bilder (w-full h-auto)
- [ ] Touch-Targets mindestens 44x44px

### Referenzen

- [RESPONSIVE-DESIGN.md](../design-system/RESPONSIVE-DESIGN.md)

---

## Wie Patterns nutzen

### Für neue Features

1. Suche ähnliches Pattern
2. Kopiere Code-Struktur
3. Passe an deine Anforderungen an
4. Teste & dokumentiere

### Für Code-Review

1. Prüfe: Gibt es ein Pattern dafür?
2. Wenn ja: Ist es konsistent mit Pattern?
3. Wenn nein: Sollte ein neues Pattern erstellt werden?

### Für neue Entwickler

1. Lese relevante Patterns
2. Verstehe Code-Struktur
3. Kopiere Pattern für neue Features

---

**Status**: ✅ 8 Patterns dokumentiert  
**Letzte Aktualisierung**: 28.01.2026  
**Skalierbar für**: Neue Patterns, neue Entwickler, andere Projekte


---

## PATTERN-Soft-Delete

**Titel**: Soft-Delete statt Hard-Delete

**Komplexität**: ⭐⭐ (Mittel)  
**Kategorie**: Database Pattern  
**Status**: ✅ Implementiert (Sprint 8)

### Wann nutzen?

- Wenn Daten "gelöscht" werden sollen, aber Rollback möglich sein muss
- Wenn Audit-Trail wichtig ist
- Wenn Zertifikate/Referenzen erhalten bleiben sollen

### Implementierung

```typescript
// 1. Datenbank-Schema
export const courses = sqliteTable('courses', {
  id: int('id').primaryKey().autoincrement(),
  title: text('title').notNull(),
  // ... other fields
  isActive: boolean('is_active').default(true), // ← Soft-Delete Flag
  deletedAt: timestamp('deleted_at'), // Optional: Zeitstempel
});

// 2. API-Endpoints
export const courseRouter = router({
  // Deaktivieren (Soft-Delete)
  deactivate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.update(courses)
        .set({
          isActive: false,
          deletedAt: new Date(),
        })
        .where(eq(courses.id, input.id))
        .returning();
    }),

  // Aktivieren (Rollback)
  activate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.update(courses)
        .set({
          isActive: true,
          deletedAt: null,
        })
        .where(eq(courses.id, input.id))
        .returning();
    }),

  // Liste (mit Filter)
  list: adminProcedure
    .input(z.object({
      status: z.enum(['active', 'inactive', 'all']).default('all'),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(courses);
      
      if (input.status === 'active') {
        query = query.where(eq(courses.isActive, true));
      } else if (input.status === 'inactive') {
        query = query.where(eq(courses.isActive, false));
      }
      
      return await query;
    }),
});

// 3. Frontend-UI
export function CourseList() {
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('all');
  const { data: courses } = trpc.course.list.useQuery({ status });

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={status === 'all' ? 'default' : 'outline'}
          onClick={() => setStatus('all')}
        >
          Alle
        </Button>
        <Button
          variant={status === 'active' ? 'default' : 'outline'}
          onClick={() => setStatus('active')}
        >
          Aktiv
        </Button>
        <Button
          variant={status === 'inactive' ? 'default' : 'outline'}
          onClick={() => setStatus('inactive')}
        >
          Inaktiv
        </Button>
      </div>

      {/* Liste */}
      <div className="grid gap-4">
        {courses?.map((course) => (
          <Card
            key={course.id}
            className={!course.isActive ? 'opacity-50' : ''}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{course.title}</CardTitle>
                {!course.isActive && (
                  <Badge variant="secondary">Inaktiv</Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Best Practices

✅ **DO**:
- Nutze `isActive` Boolean (nicht `deleted`)
- Nutze `deletedAt` Timestamp für Audit
- Filter standardmäßig auf `isActive = true`
- Zeige inaktive Elemente visuell unterschiedlich (Opacity, Badge)

❌ **DON'T**:
- Nutze nicht `deleted` Boolean (verwirrend)
- Vergiss nicht Filter in Queries (`WHERE isActive = true`)
- Lösche nicht wirklich aus Datenbank (Hard-Delete)

---

## PATTERN-Fisher-Yates-Shuffle

**Titel**: Fisher-Yates Shuffle-Algorithmus

**Komplexität**: ⭐ (Einfach)  
**Kategorie**: Algorithm Pattern  
**Status**: ✅ Implementiert (Sprint 8)

### Wann nutzen?

- Wenn Arrays zufällig gemischt werden sollen
- Wenn uniform distribution wichtig ist (jede Permutation gleich wahrscheinlich)
- Wenn keine Elemente "verloren" gehen dürfen

### Implementierung

```typescript
/**
 * Fisher-Yates Shuffle Algorithm
 * - Uniform distribution (jede Permutation gleich wahrscheinlich)
 * - O(n) Performance
 * - Keine Elemente gehen verloren
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Kopie erstellen (nicht Original mutieren)
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
  }
  
  return shuffled;
}

// Nutzen in API
const question = await db.select()
  .from(questions)
  .where(eq(questions.id, questionId))
  .limit(1);

const answers = [
  { id: 'A', text: question.answerA, isCorrect: question.correctAnswer === 'A' },
  { id: 'B', text: question.answerB, isCorrect: question.correctAnswer === 'B' },
  { id: 'C', text: question.answerC, isCorrect: question.correctAnswer === 'C' },
  { id: 'D', text: question.answerD, isCorrect: question.correctAnswer === 'D' },
];

const shuffledAnswers = shuffleArray(answers);

return {
  question: question.text,
  answers: shuffledAnswers,
};
```

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('shuffleArray', () => {
  it('should not lose any elements', () => {
    const input = [1, 2, 3, 4];
    const output = shuffleArray(input);
    
    // Sortieren und vergleichen
    expect(output.sort()).toEqual(input.sort());
  });

  it('should shuffle (not always same order)', () => {
    const input = [1, 2, 3, 4];
    const outputs = Array.from({ length: 100 }, () => shuffleArray(input));
    
    // Nicht alle Outputs sollten gleich sein
    const allSame = outputs.every(o => 
      JSON.stringify(o) === JSON.stringify(input)
    );
    expect(allSame).toBe(false);
  });

  it('should not mutate original array', () => {
    const input = [1, 2, 3, 4];
    const inputCopy = [...input];
    
    shuffleArray(input);
    
    expect(input).toEqual(inputCopy);
  });
});
```

### Best Practices

✅ **DO**:
- Nutze Fisher-Yates (nicht `Math.random().sort()`)
- Erstelle Kopie (nicht Original mutieren)
- Schreibe Unit Tests

❌ **DON'T**:
- Nutze nicht `Math.random().sort()` (nicht uniform, kann Elemente verlieren)
- Mutiere nicht Original-Array
- Vergiss nicht Unit Tests

---

## PATTERN-Migration-Script

**Titel**: Migration-Script für Breaking Changes

**Komplexität**: ⭐⭐⭐ (Hoch)  
**Kategorie**: Database Pattern  
**Status**: ✅ Implementiert (Sprint 8)

### Wann nutzen?

- Wenn Breaking Changes in Datenbank-Schema
- Wenn alte Daten migriert werden müssen
- Wenn Rollback-Plan wichtig ist

### Implementierung

```typescript
// migrate-progress.mjs
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { userProgress } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function migrateProgress() {
  // 1. Datenbank-Verbindung
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log('Starting migration...');

  // 2. Backup erstellen (optional, aber empfohlen)
  console.log('Creating backup...');
  await connection.execute(`
    CREATE TABLE user_progress_backup AS 
    SELECT * FROM user_progress
  `);

  // 3. Alle alten Fortschritte laden
  const oldProgress = await db.select()
    .from(userProgress)
    .where(eq(userProgress.scoreType, 'fraction')); // 3/5

  console.log(`Found ${oldProgress.length} records to migrate`);

  // 4. Migrieren
  let migrated = 0;
  let errors = 0;

  for (const progress of oldProgress) {
    try {
      // Umrechnen: 3/5 → 60%
      const percentage = Math.round(
        (progress.correctAnswers / progress.totalQuestions) * 100
      );

      // Update
      await db.update(userProgress)
        .set({
          score: percentage,
          scoreType: 'percentage',
          migratedAt: new Date(), // Optional: Zeitstempel
        })
        .where(eq(userProgress.id, progress.id));

      migrated++;
    } catch (error) {
      console.error(`Error migrating progress ${progress.id}:`, error);
      errors++;
    }
  }

  // 5. Zusammenfassung
  console.log(`Migration complete:`);
  console.log(`- Migrated: ${migrated}`);
  console.log(`- Errors: ${errors}`);

  // 6. Validierung
  const newProgress = await db.select()
    .from(userProgress)
    .where(eq(userProgress.scoreType, 'percentage'));

  console.log(`Validation: ${newProgress.length} records with new format`);

  await connection.end();
}

// Ausführen
migrateProgress()
  .then(() => {
    console.log('Migration successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

### Rollback-Script

```typescript
// rollback-migration.mjs
async function rollbackMigration() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log('Rolling back migration...');

  // Backup wiederherstellen
  await connection.execute(`
    DELETE FROM user_progress
  `);
  await connection.execute(`
    INSERT INTO user_progress 
    SELECT * FROM user_progress_backup
  `);

  console.log('Rollback complete!');
  await connection.end();
}
```

### Checkliste

**Vor Migration**:
- [ ] Backup erstellen
- [ ] Migration-Script auf Staging testen
- [ ] Rollback-Script bereit
- [ ] Downtime kommunizieren (falls nötig)

**Während Migration**:
- [ ] Migration-Script ausführen
- [ ] Logs prüfen (Fehler?)
- [ ] Validierung durchführen

**Nach Migration**:
- [ ] Funktionalität testen
- [ ] Monitoring prüfen
- [ ] Backup aufbewahren (7 Tage)
- [ ] Rollback-Script löschen (nach 7 Tagen)

### Best Practices

✅ **DO**:
- Erstelle Backup vor Migration
- Teste auf Staging zuerst
- Schreibe Rollback-Script
- Logge alle Fehler
- Validiere nach Migration

❌ **DON'T**:
- Migriere nicht ohne Backup
- Teste nicht direkt auf Production
- Vergiss nicht Rollback-Plan
- Ignoriere nicht Fehler

---

## Index aktualisieren

| Pattern | Kategorie | Komplexität | Status |
|---------|-----------|-------------|--------|
| [PATTERN-Soft-Delete](#pattern-soft-delete) | Database | ⭐⭐ | ✅ Implementiert |
| [PATTERN-Fisher-Yates-Shuffle](#pattern-fisher-yates-shuffle) | Algorithm | ⭐ | ✅ Implementiert |
| [PATTERN-Migration-Script](#pattern-migration-script) | Database | ⭐⭐⭐ | ✅ Implementiert |
