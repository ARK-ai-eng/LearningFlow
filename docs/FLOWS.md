# AISmarterFlow Academy - User Flows

## Authentifizierung

### Login (alle Rollen)
```
User → /login → E-Mail + Passwort eingeben → JWT-Token in localStorage → Redirect zum Dashboard
```

### Logout
```
User → Logout-Button → Token aus localStorage löschen → Redirect zu /login
```

## SysAdmin Flows

### Firma + FirmenAdmin anlegen
```
SysAdmin → /admin/companies → "Neue Firma" →
Formular ausfüllen:
  - Firmenname
  - Admin-E-Mail
  - Admin-Passwort (wird telefonisch mitgeteilt)
  - Vorname/Nachname (optional)
→ "Firma erstellen" →
Erfolgsseite zeigt Zugangsdaten →
SysAdmin ruft FirmenAdmin an und teilt Passwort mit
```

### Firmen verwalten
- Liste aller Firmen: `/admin/companies`
- Firma bearbeiten: Status ändern, Max-User setzen
- Firma löschen: Löscht auch alle zugehörigen User

## FirmenAdmin Flows

### Mitarbeiter anlegen
```
FirmenAdmin → /company → "Mitarbeiter" → "Neuer Mitarbeiter" →
Formular ausfüllen:
  - E-Mail
  - Passwort (wird telefonisch mitgeteilt)
  - Vorname/Nachname
  - Personalnummer (optional)
→ "Mitarbeiter erstellen" →
Erfolgsseite zeigt Zugangsdaten →
FirmenAdmin ruft Mitarbeiter an und teilt Passwort mit
```

### Eigene Kurse absolvieren
FirmenAdmin hat Doppelrolle und kann selbst Kurse absolvieren:
```
FirmenAdmin → /company → "Meine Schulungen" → Kurs auswählen → Lernen
```

## User Flows

### Kurs absolvieren
```
User → /dashboard → Kurs-Card klicken → Topics durcharbeiten → Mini-Quiz pro Topic
```

### Prüfung ablegen
```
User → Zertifizierungskurs → "Prüfung starten" →
20 Fragen, 15 Minuten, 80% zum Bestehen →
Bei Erfolg: Zertifikat wird erstellt (1 Jahr gültig)
```

### Zertifikat herunterladen
```
User → /certificates → Zertifikat auswählen → "PDF herunterladen"
```

## Technische Details

### Token-Speicherung
- JWT-Token in `localStorage.getItem('auth_token')`
- Wird als `Authorization: Bearer <token>` Header gesendet
- Ablauf: 7 Tage

### Passwort-Anforderungen
- Mindestens 8 Zeichen
- Groß- und Kleinbuchstaben
- Mindestens eine Zahl
