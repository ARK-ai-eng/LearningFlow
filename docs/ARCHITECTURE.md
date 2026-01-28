# AISmarterFlow Academy - Architektur-Dokumentation

## System-Übersicht

AISmarterFlow Academy ist eine moderne Lernplattform mit **3 Rollen**, **3 Kurstypen** und einem **schlanken Lern-Flow**.

```
┌─────────────────────────────────────────────────────────┐
│                    AISmarterFlow Academy                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (React 19)          Backend (Node.js/tRPC)   │
│  ├── Login                    ├── Auth (JWT + bcrypt)  │
│  ├── Dashboard                ├── Company Management   │
│  ├── Lern-Flow                ├── User Management      │
│  ├── Kurs-Verwaltung          ├── Course Management    │
│  └── Zertifikate              ├── Progress Tracking    │
│                               └── Certificate Gen.     │
│                                                         │
│  Database (MySQL/TiDB)                                 │
│  ├── users (E-Mail als unique ID)                      │
│  ├── companies                                         │
│  ├── courses (3 Typen)                                 │
│  ├── topics (12 pro Kurs)                              │
│  ├── questions (4 pro Thema)                           │
│  ├── user_progress                                     │
│  ├── exam_attempts                                     │
│  └── certificates                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 3-Rollen-System

### 1. SysAdmin (Systemadministrator)
- **Authentifizierung**: E-Mail + Passwort (bcryptjs)
- **Aufgaben**:
  - Firmen anlegen/verwalten
  - FirmenAdmins direkt erstellen (mit E-Mail + Passwort)
  - Kurse erstellen und bearbeiten
  - Themen und Fragen verwalten
- **Dashboard**: System-Übersicht, alle Firmen, alle Kurse
- **Zugriff**: `/admin/*`

### 2. FirmenAdmin (Company Administrator)
- **Authentifizierung**: E-Mail + Passwort (bcryptjs)
- **Aufgaben**:
  - Mitarbeiter direkt anlegen (mit E-Mail + Passwort)
  - CSV-Import für Mitarbeiter
  - Mitarbeiter-Fortschritt überwachen
  - **Doppelrolle**: Kann selbst Kurse absolvieren und Prüfungen ablegen
- **Dashboard**: Mitarbeiter-Übersicht + eigene Kurse
- **Zugriff**: `/company/*` + `/dashboard` (als Lerner)

### 3. User (Mitarbeiter/Employee)
- **Authentifizierung**: E-Mail + Passwort (bcryptjs)
- **Aufgaben**:
  - Kurse absolvieren
  - Fragen beantworten
  - Prüfungen ablegen
  - Zertifikate herunterladen
- **Dashboard**: Verfügbare Kurse, Fortschritt, Zertifikate
- **Zugriff**: `/dashboard`, `/course/*`, `/certificates`

## 3 Kurstypen

### 1. Learning (Freies Lernmodul)
- **Zweck**: Optionales Lernen ohne Bewertung
- **Struktur**: 12 Themen × 4 Fragen = 48 Fragen
- **Feedback**: Sofortiges Feedback (richtig/falsch)
- **Bestehensgrenze**: Keine (es geht ums Lernen)
- **Zertifikat**: Nein
- **Beispiel**: "Datenschutz Grundlagen"

### 2. Sensitization (Awareness-Schulung)
- **Zweck**: Compliance-Schulung mit Mini-Quiz
- **Struktur**: 12 Themen × 4 Fragen = 48 Fragen
- **Feedback**: Sofortiges Feedback + Erklärung
- **Bestehensgrenze**: Mindestens 3 von 4 Fragen pro Thema
- **Zertifikat**: Nein (nur Bestätigung)
- **Beispiel**: "IT Security Awareness"

### 3. Certification (Zertifizierungskurs)
- **Zweck**: Formale Zertifizierung mit Jahresprüfung
- **Struktur**: 12 Themen × 4 Fragen + 20 Prüfungsfragen
- **Feedback**: Sofortiges Feedback in Lernphase
- **Bestehensgrenze**: 80% in der Jahresprüfung
- **Zertifikat**: Ja (1 Jahr gültig, PDF-Download)
- **Beispiel**: "KI-Kompetenz Prüfung"

## Authentifizierung & Autorisierung

### Login-Flow

```
1. User gibt E-Mail + Passwort ein
   ↓
2. Backend: getUserByEmail(email)
   ↓
3. Backend: verifyPassword(password, passwordHash)
   ↓
4. Backend: createToken(userId, email, role) → JWT
   ↓
5. Frontend: localStorage.setItem('token', jwt)
   ↓
6. Frontend: Alle API-Requests mit Authorization Header
   Authorization: Bearer <jwt>
```

### Passwort-Anforderungen

- Mindestens 8 Zeichen
- Großbuchstaben (A-Z)
- Kleinbuchstaben (a-z)
- Mindestens eine Zahl (0-9)
- Beispiel: `Manus§123*` ✅

### Token-Management

- **Format**: JWT (JSON Web Token)
- **Speicherung**: localStorage (nicht cookies - Manus-Proxy-Kompatibilität)
- **Übertragung**: Authorization Header (`Authorization: Bearer <token>`)
- **Gültigkeit**: 7 Tage
- **Refresh**: Automatisch bei jedem Login

## Datenbank-Schema

### Users Tabelle

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(320) UNIQUE NOT NULL,  -- EINZIGER Identifier
  passwordHash VARCHAR(255),            -- bcrypt hash
  name TEXT,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  personnelNumber VARCHAR(50),
  loginMethod VARCHAR(64),              -- 'email' oder 'oauth'
  role ENUM('sysadmin', 'companyadmin', 'user'),
  companyId INT,                        -- NULL für SysAdmin
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  lastSignedIn TIMESTAMP
);
```

**Wichtig**: E-Mail ist der **einzige** eindeutige Identifier im System (nicht openId, nicht Name).

### Courses Tabelle

```sql
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  description TEXT,
  courseType ENUM('learning', 'sensitization', 'certification'),
  isActive BOOLEAN DEFAULT true,
  isMandatory BOOLEAN DEFAULT false,
  passingScore INT DEFAULT 80,          -- Für Certification
  timeLimit INT DEFAULT 15,             -- Minuten für Prüfung
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Topics & Questions

```sql
CREATE TABLE topics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  courseId INT,
  title VARCHAR(255),
  content TEXT,
  orderIndex INT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

CREATE TABLE questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  topicId INT,
  courseId INT,
  questionText TEXT,
  optionA VARCHAR(500),
  optionB VARCHAR(500),
  optionC VARCHAR(500),
  optionD VARCHAR(500),
  correctAnswer ENUM('A', 'B', 'C', 'D'),
  explanation TEXT,
  createdAt TIMESTAMP
);
```

### User Progress

```sql
CREATE TABLE user_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  courseId INT,
  topicId INT,
  status ENUM('not_started', 'in_progress', 'completed'),
  score INT,
  completedAt TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

## Stack & Technologien

| Layer | Technologie | Version |
|-------|-------------|---------|
| **Frontend** | React | 19 |
| **Frontend Routing** | Wouter | Latest |
| **Frontend State** | TanStack Query | Latest |
| **Frontend Styling** | Tailwind CSS | 4 |
| **Backend** | Node.js + Express | Latest |
| **Backend API** | tRPC | 11 |
| **Backend ORM** | Drizzle ORM | 0.44 |
| **Database** | MySQL / TiDB | Latest |
| **Database Driver** | mysql2/promise | 3.15 |
| **Password Hashing** | bcryptjs | 2.4 |
| **Authentication** | JWT | Standard |
| **Testing** | Vitest | 2.1 |
| **Build Tool** | Vite | 7.1 |

## Wichtige Dateien

### Frontend
```
client/src/
├── pages/
│   ├── user/
│   │   ├── Dashboard.tsx         # User-Dashboard
│   │   ├── CourseView.tsx        # Kurs-Übersicht
│   │   ├── TopicView.tsx         # Lern-Flow (Hauptkomponente)
│   │   ├── ExamView.tsx          # Jahresprüfung
│   │   └── Certificates.tsx      # Zertifikate
│   ├── company/
│   │   ├── Dashboard.tsx         # FirmenAdmin-Dashboard
│   │   └── EmployeeManagement.tsx
│   ├── admin/
│   │   ├── Dashboard.tsx         # SysAdmin-Dashboard
│   │   ├── CourseList.tsx        # Kurs-Verwaltung
│   │   └── CourseEditor.tsx      # Kurs-Editor
│   ├── Home.tsx                  # Login-Seite
│   └── Login.tsx                 # Login-Formular
├── components/
│   ├── DashboardLayout.tsx       # Haupt-Layout mit Sidebar
│   └── ui/                       # shadcn/ui Komponenten
└── lib/
    └── trpc.ts                   # tRPC Client Setup
```

### Backend
```
server/
├── routers.ts                    # Alle tRPC Endpoints
├── db.ts                         # Datenbank-Funktionen
├── auth.ts                       # JWT + Passwort-Hashing
├── _core/
│   ├── index.ts                  # Express Server
│   ├── context.ts                # tRPC Context (Auth)
│   ├── trpc.ts                   # tRPC Setup
│   ├── cookies.ts                # Cookie-Optionen
│   └── env.ts                    # Umgebungsvariablen
└── *.test.ts                     # Vitest Tests
```

### Datenbank
```
drizzle/
├── schema.ts                     # Alle Tabellen-Definitionen
└── migrations/                   # Migrations-History
```

## Deployment

### Umgebungsvariablen

```env
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=<random-secret>
NODE_ENV=production
```

### Build & Start

```bash
# Build
pnpm build

# Start
node dist/index.js
```

### Tests

```bash
pnpm test
```

## Sicherheit

### Passwort-Sicherheit
- bcryptjs mit Salt (10 Runden)
- Keine Passwörter in Logs
- Passwort-Validierung vor Speicherung

### Token-Sicherheit
- JWT mit HS256 Signatur
- Kurze Gültigkeit (7 Tage)
- localStorage statt Cookies (Manus-Proxy-Kompatibilität)

### Datenbank-Sicherheit
- E-Mail als unique Identifier (verhindert Duplikate)
- Prepared Statements (Drizzle ORM)
- Keine SQL-Injection möglich

## Performance

### Optimierungen
- Lazy Loading von Kursen
- Pagination für Mitarbeiter-Listen
- Query Caching mit TanStack Query
- Optimistic Updates für Benutzer-Aktionen

### Monitoring
- 32 Vitest Tests für kritische Funktionen
- Error Logging in Browser-Console
- Server-Logs für Debugging

## Fehlerbehandlung

### Häufige Fehler

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| "Failed query" | Datenbank-Verbindung | Pool korrekt initialisieren |
| "E-Mail oder Passwort falsch" | Falsche Credentials | Anmeldedaten prüfen |
| "Einladung abgelaufen" | Token älter als 24h | Neue Einladung versenden |
| "Thema nicht gefunden" | Falsche topicId | URL prüfen |

## Nächste Schritte

1. **Mini-Quiz**: Nach allen 12 Themen ein kurzes Abschluss-Quiz
2. **E-Mail-Versand**: Automatische Benachrichtigungen
3. **Passwort-Reset**: E-Mail-basiertes Reset-System
4. **Analytics**: Fortschritt-Tracking und Reporting
5. **Mobile App**: React Native Version
