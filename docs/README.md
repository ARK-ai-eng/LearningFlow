# AISmarterFlow Academy - Dokumentation

Willkommen zur vollständigen Dokumentation von **AISmarterFlow Academy** - einer modernen Lernplattform für Compliance-Schulungen, Awareness-Training und Zertifizierungen.

## 📚 Dokumentations-Übersicht

### 1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Systemarchitektur
Detaillierte Übersicht der Systemarchitektur:
- 3-Rollen-System (SysAdmin, FirmenAdmin, User)
- 3 Kurstypen (Learning, Sensitization, Certification)
- Datenbank-Schema
- Authentifizierung & Autorisierung
- Tech-Stack

**Für**: Entwickler, Architekten, Tech-Leads

---

### 2. **[LEARNING_FLOW.md](./LEARNING_FLOW.md)** - Lern-Flow Dokumentation
Detaillierte Dokumentation des schlanken Lern-Flows:
- Benutzer-Perspektive (Schritt-für-Schritt)
- Frontend-Implementierung
- Backend-Implementierung
- Datenmodell
- Testing-Informationen

**Für**: Entwickler, QA, Product Manager

---

### 3. **[DATABASE_FIX.md](./DATABASE_FIX.md)** - Datenbank-Fix (28.01.2026)
Dokumentation des kritischen Datenbank-Fehlers und dessen Lösung:
- Problem-Beschreibung
- Root Cause Analysis
- Implementierte Lösung
- Debugging-Tipps
- Deployment-Checklist

**Für**: Entwickler, DevOps, Troubleshooting

---

### 4. **[USER_GUIDE.md](./USER_GUIDE.md)** - Benutzer-Handbuch
Praktisches Handbuch für alle 3 Rollen:
- SysAdmin-Handbuch (Firmen, Kurse, Fragen verwalten)
- FirmenAdmin-Handbuch (Mitarbeiter, Schulungen)
- Mitarbeiter-Handbuch (Lernmaterial, Zertifikate)
- FAQ

**Für**: End-Users, Support-Team, Administratoren

---

### 5. **[TECHNICAL_REFERENCE.md](./TECHNICAL_REFERENCE.md)** - Technische Referenz
Vollständige API-Dokumentation:
- tRPC Endpoints (alle Routen)
- Frontend-Hooks
- Datenbank-Funktionen
- Fehlerbehandlung
- Performance-Tipps
- Debugging-Guide

**Für**: Entwickler, API-Konsumenten, Integratoren

---

## 🚀 Quick Start

### Für Benutzer

1. **Anmeldung**: https://3000-iy4m5go6oz49picqmrknl-a63212b2.us1.manus.computer/login
2. **Rolle auswählen**:
   - **SysAdmin**: arton.ritter@aismarterflow.de / Manus§123*
   - **FirmenAdmin**: Von SysAdmin erstellt
   - **Mitarbeiter**: Von FirmenAdmin erstellt
3. **Lesen**: [USER_GUIDE.md](./USER_GUIDE.md)

### Für Entwickler

1. **Architektur verstehen**: [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Lern-Flow**: [LEARNING_FLOW.md](./LEARNING_FLOW.md)
3. **API-Referenz**: [TECHNICAL_REFERENCE.md](./TECHNICAL_REFERENCE.md)
4. **Fehlerbehandlung**: [DATABASE_FIX.md](./DATABASE_FIX.md)

### Für Administratoren

1. **Benutzer-Handbuch**: [USER_GUIDE.md](./USER_GUIDE.md)
2. **Troubleshooting**: [DATABASE_FIX.md](./DATABASE_FIX.md)

---

## 📋 Inhaltsverzeichnis

| Dokument | Zweck | Zielgruppe |
|----------|-------|-----------|
| ARCHITECTURE.md | Systemdesign, Datenmodell, Tech-Stack | Entwickler, Architekten |
| LEARNING_FLOW.md | Lern-Flow Implementierung, Frontend/Backend | Entwickler, QA |
| DATABASE_FIX.md | Fehlerbehandlung, Debugging, Deployment | Entwickler, DevOps |
| USER_GUIDE.md | Schritt-für-Schritt Anleitung für Benutzer | End-Users, Support |
| TECHNICAL_REFERENCE.md | API-Dokumentation, Code-Beispiele | Entwickler, Integratoren |

---

## 🎯 Wichtige Konzepte

### 3-Rollen-System

```
┌─────────────┐
│  SysAdmin   │  Verwaltet Firmen, Kurse, Fragen
└─────────────┘
       ↓
┌─────────────────────┐
│  FirmenAdmin        │  Verwaltet Mitarbeiter, Schulungen
└─────────────────────┘
       ↓
┌──────────────────┐
│  Mitarbeiter     │  Absolviert Kurse, macht Prüfungen
└──────────────────┘
```

### 3 Kurstypen

| Typ | Zweck | Bewertung | Zertifikat |
|-----|-------|-----------|-----------|
| **Learning** | Freies Lernen | Keine | Nein |
| **Sensitization** | Compliance-Schulung | Min. 3/4 richtig | Nein |
| **Certification** | Formale Zertifizierung | 80% in Prüfung | Ja (1 Jahr) |

### Schlanker Lern-Flow

```
1. Frage anzeigen
   ↓
2. User klickt Antwort
   ↓
3. Sofortiges Feedback (grün/rot)
   ↓
4. Nächste Frage
   ↓
5. Nach 4 Fragen: Thema abgeschlossen
   ↓
6. Nach 12 Themen: Kurs 100% abgeschlossen
```

---

## 🔧 Technologie-Stack

- **Frontend**: React 19, Tailwind CSS 4, TanStack Query
- **Backend**: Node.js, Express 4, tRPC 11
- **Database**: MySQL / TiDB
- **ORM**: Drizzle ORM 0.44
- **Auth**: JWT + bcryptjs
- **Testing**: Vitest 2.1
- **Build**: Vite 7.1

---

## 📊 Datenbank-Schema

```sql
-- Kern-Tabellen
users              -- Alle Benutzer (E-Mail als unique ID)
companies          -- Firmen
courses            -- Kurse (3 Typen)
topics             -- Themen (12 pro Kurs)
questions          -- Fragen (4 pro Thema)

-- Tracking
user_progress      -- Fortschritt pro User/Thema
exam_attempts      -- Prüfungsversuche
certificates       -- Ausgestellte Zertifikate
```

---

## 🔐 Sicherheit

- **Passwort-Hashing**: bcryptjs (10 Runden)
- **Token**: JWT mit 7 Tagen Gültigkeit
- **Autorisierung**: Role-based Access Control (RBAC)
- **E-Mail als ID**: Verhindert Duplikate und Missbrauch
- **Prepared Statements**: Schutz vor SQL-Injection

---

## 🐛 Häufige Fehler

### "Failed query" Fehler
**Ursache**: Datenbank-Verbindung nicht korrekt initialisiert
**Lösung**: Siehe [DATABASE_FIX.md](./DATABASE_FIX.md)

### "E-Mail oder Passwort falsch"
**Ursache**: Falsche Anmeldedaten
**Lösung**: Anmeldedaten prüfen, ggf. Passwort zurücksetzen

### "Thema nicht gefunden"
**Ursache**: Falsche topicId in URL
**Lösung**: Kurs-Übersicht prüfen, richtige Thema-ID verwenden

---

## 📞 Support

### Für Benutzer
Kontaktieren Sie Ihren **FirmenAdmin** oder **SysAdmin**

### Für Entwickler
Siehe [TECHNICAL_REFERENCE.md](./TECHNICAL_REFERENCE.md) für Debugging-Tipps

### Für Administratoren
Siehe [USER_GUIDE.md](./USER_GUIDE.md) für Schritt-für-Schritt Anleitungen

---

## 📝 Changelog

### 28.01.2026
- ✅ Schlanker Lern-Flow implementiert
- ✅ Datenbank-Fehler behoben (mysql2 Pool)
- ✅ 32 Vitest Tests bestanden
- ✅ Vollständige Dokumentation erstellt

---

## 🎓 Nächste Schritte

1. **Mini-Quiz**: Nach allen 12 Themen ein kurzes Abschluss-Quiz
2. **E-Mail-Versand**: Automatische Benachrichtigungen
3. **Passwort-Reset**: E-Mail-basiertes Reset-System
4. **Analytics**: Fortschritt-Tracking und Reporting
5. **Mobile App**: React Native Version

---

## 📖 Weitere Ressourcen

- [Drizzle ORM Dokumentation](https://orm.drizzle.team/)
- [tRPC Dokumentation](https://trpc.io/)
- [React Dokumentation](https://react.dev/)
- [Tailwind CSS Dokumentation](https://tailwindcss.com/)

---

**Letzte Aktualisierung**: 28.01.2026  
**Version**: 1.0.0  
**Status**: ✅ Produktionsbereit
