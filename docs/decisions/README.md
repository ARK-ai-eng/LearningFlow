# Architecture Decision Records (ADR)

## Übersicht

**ADRs** dokumentieren wichtige Architektur-Entscheidungen: Was wurde entschieden, warum, welche Optionen gab es, welche Konsequenzen entstehen.

**Zweck**: Zukünftige Entwickler verstehen das "Warum", nicht nur das "Was".

**Format**: Markdown, strukturiert, zeitlos

---

## Index

| ADR | Titel | Datum | Status |
|-----|-------|-------|--------|
| [ADR-001](#adr-001-drizzle-orm) | Drizzle ORM als Datenbank-Abstraktionsschicht | 15.01.2026 | ✅ Akzeptiert |
| [ADR-002](#adr-002-jwt-authentication) | JWT für Authentifizierung | 16.01.2026 | ✅ Akzeptiert |
| [ADR-003](#adr-003-trpc-api) | tRPC für Backend-API | 17.01.2026 | ✅ Akzeptiert |
| [ADR-004](#adr-004-tailwind-css) | Tailwind CSS für Styling | 18.01.2026 | ✅ Akzeptiert |
| [ADR-005](#adr-005-shadcn-ui) | shadcn/ui für Komponenten | 19.01.2026 | ✅ Akzeptiert |
| [ADR-006](#adr-006-3-rollen-system) | 3-Rollen-System (SysAdmin, FirmenAdmin, User) | 20.01.2026 | ✅ Akzeptiert |
| [ADR-007](#adr-007-3-kurstypen) | 3 Kurstypen (Learning, Sensitization, Certification) | 21.01.2026 | ✅ Akzeptiert |
| [ADR-008](#adr-008-schlanker-lern-flow) | Schlanker Lern-Flow (1x pro Frage, sofort Feedback) | 27.01.2026 | ✅ Akzeptiert |
| [ADR-009](#adr-009-mysql2-pool) | mysql2 Pool statt Direct URL für Drizzle | 28.01.2026 | ✅ Akzeptiert |
| [ADR-010](#adr-010-design-tokens) | Design-Tokens für zentrale Kontrolle | 28.01.2026 | ✅ Akzeptiert |

---

## ADR-001: Drizzle ORM

**Titel**: Drizzle ORM als Datenbank-Abstraktionsschicht

**Datum**: 15.01.2026  
**Status**: ✅ Akzeptiert  
**Entscheidungsträger**: Tech Lead

### Problem

Wie sollte die Datenbank abstrahiert werden? Welches ORM?

### Optionen

| Option | Vorteile | Nachteile |
|--------|----------|----------|
| **Prisma** | Einfach, populär, gute DX | Größer, weniger Type-Safe, Vendor Lock-in |
| **TypeORM** | Flexibel, Decorators | Komplexer, mehr Boilerplate |
| **Drizzle** | Type-Safe, lightweight, SQL-like | Weniger populär, kleinere Community |

### Entscheidung

**Drizzle ORM** wählen.

### Begründung

- Type-Safe über alle Layers
- Lightweight (kein Overhead)
- SQL-like Syntax (leicht zu verstehen)
- Perfekt für tRPC + TypeScript Stack
- Migrationen sind einfach

### Konsequenzen

✅ **Positiv**:
- Vollständige Type-Safety
- Einfache Migrationen
- Schnelle Queries

❌ **Negativ**:
- mysql2 Pool muss korrekt initialisiert werden (siehe ADR-009)
- Kleinere Community als Prisma
- Weniger Stack Overflow Antworten

### Implementierung

```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const db = drizzle(pool);
```

### Referenzen

- [Drizzle ORM Dokumentation](https://orm.drizzle.team/)
- [mysql2 Pool Dokumentation](https://github.com/sidorares/node-mysql2)

---

## ADR-002: JWT Authentication

**Titel**: JWT für Authentifizierung

**Datum**: 16.01.2026  
**Status**: ✅ Akzeptiert

### Problem

Wie sollte Authentifizierung implementiert werden?

### Optionen

| Option | Vorteile | Nachteile |
|--------|----------|----------|
| **JWT** | Stateless, einfach, skalierbar | Token-Revocation schwierig |
| **Sessions** | Einfach, sicher | Stateful, schwer zu skalieren |
| **OAuth** | Sicher, delegiert | Komplexer, externe Abhängigkeit |

### Entscheidung

**JWT + localStorage** für Frontend, **Cookies** für Backend.

### Begründung

- Stateless (skalierbar)
- Einfach zu implementieren
- Funktioniert mit Manus OAuth
- Token-Expiration (7 Tage) reduziert Risiko

### Konsequenzen

✅ **Positiv**:
- Einfache Implementierung
- Skalierbar
- Funktioniert mit Manus Proxy

❌ **Negativ**:
- Token-Revocation braucht zusätzliche Logik
- localStorage ist nicht 100% sicher
- Braucht HTTPS in Production

### Implementierung

```typescript
// server/_core/auth.ts
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId, email, role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

---

## ADR-003: tRPC API

**Titel**: tRPC für Backend-API

**Datum**: 17.01.2026  
**Status**: ✅ Akzeptiert

### Problem

Wie sollte die Backend-API strukturiert werden?

### Optionen

| Option | Vorteile | Nachteile |
|--------|----------|----------|
| **REST** | Standard, einfach | Keine Type-Safety, viel Boilerplate |
| **GraphQL** | Flexibel, Type-Safe | Komplexer, Overfetching möglich |
| **tRPC** | Type-Safe, einfach, keine Schema | Weniger populär, TypeScript-only |

### Entscheidung

**tRPC** für vollständige Type-Safety.

### Begründung

- End-to-End Type-Safety (Frontend → Backend)
- Keine separaten Schema-Dateien
- Einfache Procedures (Queries, Mutations)
- Perfekt für TypeScript Stack
- Superjson für Date/BigInt Serialisierung

### Konsequenzen

✅ **Positiv**:
- Keine Runtime-Fehler durch Type-Mismatch
- Einfache API-Entwicklung
- Automatische Dokumentation

❌ **Negativ**:
- TypeScript-only (kein JavaScript Client)
- Weniger populär als REST/GraphQL
- Schwerer zu debuggen (kein HTTP)

### Implementierung

```typescript
// server/routers.ts
export const appRouter = router({
  auth: authRouter,
  course: courseRouter,
  // ...
});

// client/src/lib/trpc.ts
export const trpc = createTRPCReact<AppRouter>();
```

---

## ADR-004: Tailwind CSS

**Titel**: Tailwind CSS für Styling

**Datum**: 18.01.2026  
**Status**: ✅ Akzeptiert

### Problem

Wie sollte CSS strukturiert werden?

### Optionen

| Option | Vorteile | Nachteile |
|--------|----------|----------|
| **Tailwind** | Utility-First, schnell, konsistent | Lange Klassen-Listen |
| **CSS Modules** | Scoped, sicher | Viel Boilerplate |
| **Styled Components** | Dynamic, einfach | Runtime Overhead |

### Entscheidung

**Tailwind CSS 4** mit Design-Tokens.

### Begründung

- Utility-First (schnell zu entwickeln)
- Konsistente Designs
- Mobile-First Responsive
- Kleine Bundle-Size
- Design-Tokens für zentrale Kontrolle

### Konsequenzen

✅ **Positiv**:
- Schnelle Entwicklung
- Konsistente Designs
- Einfache Responsive Design
- Kleine CSS-Datei

❌ **Negativ**:
- Lange Klassen-Listen
- Braucht Konfiguration
- Lernkurve für Anfänger

### Implementierung

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary) / <alpha-value>)',
      },
    },
  },
}
```

---

## ADR-005: shadcn/ui

**Titel**: shadcn/ui für Komponenten

**Datum**: 19.01.2026  
**Status**: ✅ Akzeptiert

### Problem

Wie sollten UI-Komponenten strukturiert werden?

### Optionen

| Option | Vorteile | Nachteile |
|--------|----------|----------|
| **shadcn/ui** | Kopierbar, anpassbar, Radix UI | Nicht npm-Paket |
| **Material UI** | Populär, vollständig | Schwer anzupassen, Overhead |
| **Chakra UI** | Einfach, flexibel | Größer, weniger Kontrolle |

### Entscheidung

**shadcn/ui** für volle Kontrolle und Konsistenz.

### Begründung

- Komponenten sind kopierbar (nicht npm-Paket)
- Volle Kontrolle über Code
- Basiert auf Radix UI (zugänglich)
- Tailwind CSS Integration
- Einfach zu erweitern

### Konsequenzen

✅ **Positiv**:
- Volle Kontrolle
- Einfach anzupassen
- Konsistente Komponenten

❌ **Negativ**:
- Manuelles Kopieren
- Updates müssen manuell durchgeführt werden
- Größere Codebase

### Implementierung

```typescript
// client/src/components/ui/button.tsx
import { Button } from '@/components/ui/button';
<Button variant="primary">Click</Button>
```

---

## ADR-006: 3-Rollen-System

**Titel**: 3-Rollen-System (SysAdmin, FirmenAdmin, User)

**Datum**: 20.01.2026  
**Status**: ✅ Akzeptiert

### Problem

Wie sollte Autorisierung strukturiert werden?

### Optionen

| Option | Vorteile | Nachteile |
|--------|----------|----------|
| **2 Rollen** (Admin, User) | Einfach | Nicht granular genug |
| **3 Rollen** (SysAdmin, FirmenAdmin, User) | Granular, skalierbar | Komplexer |
| **RBAC** (Role-Based Access Control) | Sehr flexibel | Zu komplex für MVP |

### Entscheidung

**3-Rollen-System** für Skalierbarkeit.

### Begründung

- SysAdmin: Verwaltet Firmen, Kurse, Fragen
- FirmenAdmin: Verwaltet Mitarbeiter, Schulungen
- User: Absolviert Kurse, macht Prüfungen
- Einfach zu verstehen
- Skalierbar auf weitere Rollen

### Konsequenzen

✅ **Positiv**:
- Klare Verantwortlichkeiten
- Skalierbar
- Einfach zu testen

❌ **Negativ**:
- Mehr Autorisierungs-Logik
- Komplexere Datenbank-Queries

### Implementierung

```typescript
// drizzle/schema.ts
export const users = sqliteTable('users', {
  role: text('role').enum('sysadmin', 'companyadmin', 'user'),
});

// server/routers.ts
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'sysadmin') throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx });
});
```

---

## ADR-007: 3 Kurstypen

**Titel**: 3 Kurstypen (Learning, Sensitization, Certification)

**Datum**: 21.01.2026  
**Status**: ✅ Akzeptiert

### Problem

Wie sollten verschiedene Kurs-Formate unterstützt werden?

### Optionen

| Option | Vorteile | Nachteile |
|--------|----------|----------|
| **1 Typ** | Einfach | Nicht flexibel |
| **3 Typen** | Flexibel, verschiedene Use Cases | Komplexer |
| **Unbegrenzte Typen** | Sehr flexibel | Zu komplex |

### Entscheidung

**3 Kurstypen** für verschiedene Use Cases.

### Begründung

- **Learning**: Freies Lernen, keine Bewertung
- **Sensitization**: Compliance-Schulung, Min. 3/4 richtig, kein Zertifikat
- **Certification**: Formale Zertifizierung, 80% in Prüfung, Zertifikat (1 Jahr)

### Konsequenzen

✅ **Positiv**:
- Verschiedene Use Cases unterstützt
- Klare Unterscheidung
- Skalierbar

❌ **Negativ**:
- Mehr Logik in Procedures
- Komplexere Datenbank-Queries

### Implementierung

```typescript
// drizzle/schema.ts
export const courses = sqliteTable('courses', {
  courseType: text('courseType').enum('learning', 'sensitization', 'certification'),
});
```

---

## ADR-008: Schlanker Lern-Flow

**Titel**: Schlanker Lern-Flow (1x pro Frage, sofort Feedback)

**Datum**: 27.01.2026  
**Status**: ✅ Akzeptiert

### Problem

Wie sollte der Lern-Flow strukturiert sein?

### Optionen

| Option | Vorteile | Nachteile |
|--------|----------|----------|
| **Quiz-Modus** | Traditionell, Scoring | Verwirrend für Lernende |
| **Schlanker Lern-Modus** | Fokus auf Lernen, sofort Feedback | Keine Wiederholung |
| **Hybrid** | Beide Optionen | Komplexer |

### Entscheidung

**Schlanker Lern-Modus**: Jede Frage nur 1x, sofort Feedback (grün/rot).

### Begründung

- Fokus auf Lernen, nicht auf Scoring
- Sofortiges Feedback hilft beim Lernen
- Keine Wiederholung verhindert Frustration
- Einfach zu implementieren
- Benutzer sieht Lernfortschritt

### Konsequenzen

✅ **Positiv**:
- Besseres Lern-Erlebnis
- Einfache Implementierung
- Klarer Fortschritt

❌ **Negativ**:
- Keine Wiederholung möglich
- Kein Scoring
- Braucht Mini-Quiz später für Prüfung

### Implementierung

```typescript
// client/src/pages/user/TopicView.tsx
const [currentQuestion, setCurrentQuestion] = useState(0);
const [answered, setAnswered] = useState(false);

const handleAnswer = (answer) => {
  setAnswered(true);
  // Zeige Feedback (grün/rot)
  // Speichere Fortschritt
};

const handleNext = () => {
  setCurrentQuestion(prev => prev + 1);
  setAnswered(false);
};
```

---

## ADR-009: mysql2 Pool statt Direct URL

**Titel**: mysql2 Pool für Drizzle ORM

**Datum**: 28.01.2026  
**Status**: ✅ Akzeptiert

### Problem

Drizzle ORM mit mysql2 - sollte Direct URL oder Pool verwendet werden?

### Optionen

| Option | Vorteile | Nachteile |
|--------|----------|----------|
| **Direct URL** | Einfach, schnell | Fehler bei Queries |
| **mysql2 Pool** | Robust, skalierbar | Mehr Setup |

### Entscheidung

**mysql2 Pool** für Robustheit.

### Begründung

- Direct URL funktioniert nicht mit mysql2
- Pool verwaltet Verbindungen automatisch
- Bessere Performance
- Skalierbar

### Konsequenzen

✅ **Positiv**:
- Queries funktionieren
- Bessere Performance
- Skalierbar

❌ **Negativ**:
- Mehr Setup nötig
- Fehler war schwer zu debuggen

### Implementierung

```typescript
// server/db.ts - RICHTIG
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const pool = mysql.createPool({
  host: process.env.DATABASE_URL.split('@')[1].split('/')[0],
  user: process.env.DATABASE_URL.split('://')[1].split(':')[0],
  password: process.env.DATABASE_URL.split(':')[2].split('@')[0],
  database: process.env.DATABASE_URL.split('/').pop(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(pool);
```

---

## ADR-010: Design-Tokens

**Titel**: Design-Tokens für zentrale Kontrolle

**Datum**: 28.01.2026  
**Status**: ✅ Akzeptiert

### Problem

Wie sollte Design konsistent bleiben, wenn neue Features hinzukommen?

### Optionen

| Option | Vorteile | Nachteile |
|--------|----------|----------|
| **Hardcodierte Werte** | Schnell | Inkonsistent, schwer zu ändern |
| **Design-Tokens** | Konsistent, zentral | Mehr Setup |
| **Komponenten-Bibliothek** | Einfach | Nicht genug |

### Entscheidung

**Design-Tokens** (CSS-Variablen) + Tailwind CSS + shadcn/ui.

### Begründung

- Zentrale Kontrolle (eine Stelle ändern = überall ändern)
- Konsistentes Design
- Dark Mode automatisch
- Skalierbar
- Funktioniert "auf Anhieb"

### Konsequenzen

✅ **Positiv**:
- Konsistentes Design
- Einfache Änderungen
- Skalierbar
- Verhindert Chaos (wie Gemini Flash)

❌ **Negativ**:
- Mehr Dokumentation nötig
- Braucht Disziplin

### Implementierung

```css
/* client/src/index.css */
:root {
  --primary: 200 100% 50%;
  --spacing-md: 1rem;
}

/* Tailwind nutzt diese */
@apply bg-primary p-md;
```

---

## Wie ADRs nutzen

### Für neue Entwickler

1. Lese relevante ADRs für Kontext
2. Verstehe das "Warum" hinter Entscheidungen
3. Implementiere konsistent

### Für neue Entscheidungen

1. Prüfe: Gibt es bereits eine ADR dafür?
2. Wenn nein: Erstelle neue ADR
3. Dokumentiere: Problem, Optionen, Entscheidung, Konsequenzen

### Template für neue ADR

```markdown
## ADR-XXX: [Titel]

**Titel**: [Beschreibung]

**Datum**: [Datum]  
**Status**: ⏳ Vorgeschlagen / ✅ Akzeptiert / ❌ Abgelehnt

### Problem
[Beschreibe das Problem]

### Optionen
[Tabelle mit Optionen, Vorteilen, Nachteilen]

### Entscheidung
[Welche Option wurde gewählt?]

### Begründung
[Warum diese Entscheidung?]

### Konsequenzen
[Positive und negative Konsequenzen]

### Implementierung
[Code-Beispiel]
```

---

**Status**: ✅ 10 ADRs dokumentiert  
**Letzte Aktualisierung**: 28.01.2026  
**Skalierbar für**: Neue Entscheidungen, neue Entwickler, andere Projekte
