# AISmarterFlow Academy - Setup & Einrichtung

## Übersicht

Die AISmarterFlow Academy ist eine Lernplattform für Compliance-Schulungen mit drei Benutzerrollen:
- **SysAdmin**: Verwaltet Firmen und FirmenAdmins
- **FirmenAdmin**: Verwaltet Mitarbeiter, kann selbst Kurse absolvieren
- **User**: Absolviert Kurse und Prüfungen

## Login-System

Das System verwendet E-Mail + Passwort Authentifizierung (kein OAuth).

### SysAdmin-Zugang
- E-Mail: `arton.ritter@aismarterflow.de`
- Passwort: `Manus§123*`

### Technische Details
- JWT-Token wird in localStorage gespeichert
- Token wird als Authorization Header gesendet
- Session-Dauer: 7 Tage

## Flows

### SysAdmin → FirmenAdmin anlegen
1. SysAdmin meldet sich an
2. Geht zu "Firmen" → "Neue Firma"
3. Gibt Firmenname, Admin-E-Mail und Admin-Passwort ein
4. Klickt "Firma erstellen"
5. Ruft FirmenAdmin an und teilt Zugangsdaten mit
6. FirmenAdmin meldet sich unter /login an

### FirmenAdmin → Mitarbeiter anlegen
(Noch zu implementieren - aktuell über Einladungs-Link)

## Datenbank

- MySQL/TiDB via Drizzle ORM
- Schema in `/drizzle/schema.ts`
- Migrationen: `pnpm db:push`

## Entwicklung

```bash
# Abhängigkeiten installieren
pnpm install

# Entwicklungsserver starten
pnpm dev

# Tests ausführen
pnpm test

# TypeScript prüfen
pnpm tsc --noEmit
```

## Umgebungsvariablen

Werden automatisch von der Manus-Plattform injiziert:
- `DATABASE_URL`
- `JWT_SECRET`
- `VITE_APP_ID`
- etc.

## Deployment

Über die Manus-Plattform:
1. Checkpoint speichern
2. "Publish" Button klicken
