# AISmarterFlow SaaS Template Guide

Dieses Dokument beschreibt, wie das AISmarterFlow Academy Template für neue SaaS-Projekte wiederverwendet werden kann.

## Architektur-Übersicht

Das Template basiert auf einer modernen, skalierbaren Architektur:

| Komponente | Technologie | Zweck |
|------------|-------------|-------|
| Frontend | React 19 + TypeScript | Single Page Application |
| Styling | Tailwind CSS 4 + shadcn/ui | Dark Theme Design System |
| Backend | Express + tRPC | Typsichere API |
| Datenbank | MySQL/TiDB + Drizzle ORM | Relationale Daten |
| Auth | Manus OAuth | Benutzerauthentifizierung |

## Verzeichnisstruktur

```
├── client/
│   ├── src/
│   │   ├── components/     # Wiederverwendbare UI-Komponenten
│   │   ├── contexts/       # React Context Provider
│   │   ├── hooks/          # Custom Hooks
│   │   ├── pages/          # Seitenkomponenten
│   │   │   ├── admin/      # SysAdmin-Bereich
│   │   │   ├── company/    # FirmenAdmin-Bereich
│   │   │   └── user/       # User-Bereich
│   │   ├── App.tsx         # Router und Layout
│   │   └── index.css       # Design System Variablen
├── server/
│   ├── routers.ts          # tRPC Router
│   ├── db.ts               # Datenbank-Funktionen
│   └── _core/              # Framework-Code (nicht ändern)
├── drizzle/
│   └── schema.ts           # Datenbank-Schema
└── docs/
    └── TEMPLATE_GUIDE.md   # Diese Dokumentation
```

## 3-Rollen-System

Das Template implementiert ein flexibles Rollensystem:

| Rolle | Beschreibung | Hauptfunktionen |
|-------|--------------|-----------------|
| `sysadmin` | System-Administrator | Firmen verwalten, Kurse/Module erstellen |
| `companyadmin` | Firmen-Administrator | Mitarbeiter einladen, Fortschritt überwachen |
| `user` | Endbenutzer | Kurse absolvieren, Zertifikate erhalten |

### Rollen anpassen

Die Rollen werden in `drizzle/schema.ts` definiert:

```typescript
role: mysqlEnum("role", ["sysadmin", "companyadmin", "user"])
```

Die Navigation wird in `client/src/components/DashboardLayout.tsx` gesteuert:

```typescript
const getMenuItems = (role: string | undefined) => {
  if (role === 'sysadmin') {
    return [/* Admin-Menü */];
  }
  // ...
};
```

## Design System

### Farben (OKLCH Format)

Die Farbpalette ist in `client/src/index.css` definiert:

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.7 0.15 180);  /* Cyan */
  --accent: oklch(0.75 0.15 320);  /* Magenta */
  /* ... */
}
```

### Komponenten

Alle UI-Komponenten befinden sich in `client/src/components/ui/` und basieren auf shadcn/ui.

## Neues Projekt erstellen

### Schritt 1: Projekt kopieren

```bash
cp -r aismarterflow-academy neues-projekt
cd neues-projekt
```

### Schritt 2: Anpassungen vornehmen

1. **package.json**: Name ändern
2. **drizzle/schema.ts**: Tabellen anpassen
3. **server/routers.ts**: API-Endpunkte anpassen
4. **client/src/pages/**: Seiten anpassen

### Schritt 3: Datenbank migrieren

```bash
pnpm db:push
```

### Schritt 4: Testen

```bash
pnpm test
pnpm dev
```

## Module hinzufügen/entfernen

Das System ist modular aufgebaut. Um neue Module hinzuzufügen:

1. **Schema erweitern** in `drizzle/schema.ts`
2. **DB-Funktionen** in `server/db.ts` hinzufügen
3. **Router** in `server/routers.ts` erweitern
4. **Pages** in `client/src/pages/` erstellen
5. **Routes** in `client/src/App.tsx` registrieren

Das Entfernen funktioniert analog – einfach die entsprechenden Teile löschen.

## Einladungssystem

Das Template enthält ein vollständiges Einladungssystem:

1. Admin erstellt Einladung mit E-Mail
2. System generiert 24h-gültigen Token
3. Eingeladener klickt Link und registriert sich
4. Nach Registrierung wird Token als "verwendet" markiert

### Token-Logik

```typescript
// Token generieren
const token = nanoid(32);
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

// Token validieren
const invitation = await getInvitationByToken(token);
if (!invitation || invitation.expiresAt < new Date() || invitation.usedAt) {
  throw new Error('Ungültige oder abgelaufene Einladung');
}
```

## Best Practices

1. **Keine Hardcoded Texte**: Alle Texte sollten aus der Datenbank kommen
2. **Typsicherheit**: tRPC sorgt für End-to-End Typsicherheit
3. **Modularität**: Jedes Feature in eigenen Dateien
4. **Tests**: Vitest für Backend-Logik
5. **Checkpoints**: Vor großen Änderungen speichern

## Support

Bei Fragen zur Wiederverwendung dieses Templates, erstelle einen neuen Chat mit dem Kontext "AISmarterFlow Template".
