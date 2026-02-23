# Pragmatische Sicherheits-Härtung - LearningFlow

**Datum:** 16. Februar 2026  
**Zielgruppe:** Max. 60 User  
**Ansatz:** Pragmatisch, ohne unnötige Komplexität

---

## 🎯 Ziel

Sicherheit für kleine User-Basis (< 60 User) erhöhen ohne E-Mail-Reset-Flows oder komplexe Token-Systeme.

---

## ✅ Implementierte Maßnahmen

### 1. JWT-Lifetime: 7 Tage → 24 Stunden

**Problem:** Lange JWT-Laufzeit erhöht Risiko bei Token-Diebstahl.

**Lösung:**
- JWT-Token: 7 Tage → **24 Stunden**
- Cookie maxAge: 7 Tage → **24 Stunden**

**Dateien:**
- `server/auth.ts` (Zeile 31: `expiresIn: '24h'`)
- `server/routers.ts` (Zeile 145, 203: `maxAge: 24 * 60 * 60 * 1000`)

**Impact:**
- ✅ Reduziert Risiko bei Token-Diebstahl
- ⚠️ User müssen sich täglich neu einloggen (akzeptabel für 60 User)

---

### 2. forcePasswordChange Boolean-Feld

**Problem:** Kein Mechanismus um User zur Passwort-Änderung zu zwingen.

**Lösung:**
- Neues Boolean-Feld `forcePasswordChange` im User-Modell
- Default: `false`
- Admin kann Feld auf `true` setzen → User muss beim nächsten Login Passwort ändern

**Dateien:**
- `drizzle/schema.ts` (Zeile 21: `forcePasswordChange: boolean('forcePasswordChange').default(false)`)
- SQL-Migration: `ALTER TABLE users ADD COLUMN forcePasswordChange BOOLEAN DEFAULT FALSE;`

---

### 3. Login-Prüfung + Passwort-Änderungs-Seite

**Problem:** Kein Redirect auf Passwort-Änderung wenn `forcePasswordChange = true`.

**Lösung:**

**Backend:**
- Login-Mutation prüft `forcePasswordChange`
- Wenn `true`: Return `{ success: false, forcePasswordChange: true, tempToken }`
- Temporäres Token (15 Minuten gültig) für Passwort-Änderung

**Frontend:**
- Neue Seite: `/change-password`
- Login-Mutation prüft `forcePasswordChange` → Redirect zu `/change-password`
- Passwort-Änderungs-Formular mit Validierung (min. 8 Zeichen)

**Dateien:**
- `server/routers.ts` (Zeile 112-134: Login-Prüfung)
- `server/routers.ts` (Zeile 229-258: `auth.changePassword` Endpoint)
- `client/src/pages/ChangePassword.tsx` (neue Datei)
- `client/src/pages/Login.tsx` (Zeile 20-29: Redirect-Logik)
- `client/src/App.tsx` (Zeile 17, 53: Route `/change-password`)

**Flow:**
1. User loggt sich ein
2. Backend prüft `forcePasswordChange`
3. Wenn `true`: Redirect zu `/change-password`
4. User ändert Passwort
5. `forcePasswordChange` wird auf `false` gesetzt
6. Redirect zu Dashboard

---

### 4. Rate Limiting (5 Versuche / 15 Minuten)

**Problem:** Keine Begrenzung von Login-Versuchen → Brute-Force-Angriffe möglich.

**Lösung:**
- In-Memory Map für Login-Versuche (IP-basiert)
- Max. 5 Versuche pro 15 Minuten
- Nach 5 Versuchen: Blockierung für 15 Minuten
- Cleanup alter Einträge alle 15 Minuten

**Dateien:**
- `server/rate-limit.ts` (neue Datei)
- `server/routers.ts` (Zeile 98-109: Rate-Limiting-Prüfung)
- `server/routers.ts` (Zeile 138: Reset nach erfolgreichem Login)

**Mechanismus:**
```typescript
const rateLimitMap = new Map<string, RateLimitEntry>();

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number; // Timestamp
  blockedUntil?: number; // Timestamp
}
```

**Beispiel:**
- User versucht 5× falsches Passwort
- 6. Versuch: `TOO_MANY_REQUESTS` Error
- Blockierung bis: 15 Minuten nach 5. Versuch
- Nach erfolgreichem Login: Rate Limit zurückgesetzt

---

### 5. Admin-Funktion: Passwort manuell setzen

**Problem:** Admin kann Passwort nicht manuell zurücksetzen.

**Lösung:**
- Neuer Endpoint: `admin.resetUserPassword`
- Nur für SysAdmin zugänglich
- Input: `userId`, `newPassword`, `forcePasswordChange` (optional, default: `true`)
- Validiert Passwort-Stärke (min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen)
- Setzt neues Passwort + `forcePasswordChange = true`

**Dateien:**
- `server/routers.ts` (Zeile 1332-1361: `admin.resetUserPassword`)

**Verwendung:**
```typescript
// Admin setzt neues Passwort für User
await trpc.admin.resetUserPassword.mutate({
  userId: 123,
  newPassword: "NeuesPasswort123!",
  forcePasswordChange: true, // User muss beim nächsten Login ändern
});
```

---

## 📊 Sicherheits-Matrix

| Maßnahme | Risiko vorher | Risiko nachher | Impact |
|----------|---------------|----------------|--------|
| JWT-Lifetime | MEDIUM | LOW | Token-Diebstahl-Fenster: 7 Tage → 24h |
| forcePasswordChange | HIGH | LOW | Admin kann kompromittierte Passwörter zwingen |
| Rate Limiting | HIGH | LOW | Brute-Force-Angriffe: ∞ Versuche → 5 Versuche |
| Admin-Reset | MEDIUM | LOW | Passwort-Reset ohne E-Mail-Flow |

---

## 🚀 Deployment-Checkliste

- [x] JWT-Lifetime reduziert (24h)
- [x] `forcePasswordChange` Spalte zur Datenbank hinzugefügt
- [x] Login-Prüfung implementiert
- [x] Passwort-Änderungs-Seite erstellt
- [x] Rate Limiting aktiviert
- [x] Admin-Reset-Endpoint erstellt
- [ ] User über neue 24h-Token-Laufzeit informieren
- [ ] Admin-Schulung: Passwort-Reset-Funktion

---

## 🔒 Best Practices

### Für Admins:

1. **Passwort-Reset:**
   - Neues Passwort generieren (min. 12 Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen)
   - `forcePasswordChange = true` setzen
   - User per Telefon/Slack informieren (NICHT per E-Mail!)

2. **Kompromittiertes Passwort:**
   - Sofort `forcePasswordChange = true` setzen
   - User informieren
   - Nach Passwort-Änderung: `forcePasswordChange = false` (automatisch)

### Für User:

1. **Täglicher Login:**
   - Token läuft nach 24h ab
   - Erneuter Login erforderlich

2. **Passwort-Änderung:**
   - Min. 8 Zeichen
   - Groß- und Kleinbuchstaben
   - Mindestens 1 Zahl

3. **Rate Limiting:**
   - Max. 5 Login-Versuche in 15 Minuten
   - Bei Blockierung: 15 Minuten warten

---

## 📝 Lessons Learned

### Was funktioniert gut:

1. **In-Memory Rate Limiting:** Einfach, schnell, keine externe Abhängigkeit (Redis)
2. **forcePasswordChange:** Pragmatisch für kleine User-Basis (< 60 User)
3. **24h Token-Laufzeit:** Guter Kompromiss zwischen Sicherheit und UX

### Was zu beachten ist:

1. **In-Memory Rate Limiting:** Wird bei Server-Restart zurückgesetzt (akzeptabel für 60 User)
2. **Kein E-Mail-Reset:** Admin muss Passwort manuell setzen (akzeptabel für 60 User)
3. **IP-basiertes Rate Limiting:** Kann bei Shared IPs (Firmen-Proxy) problematisch sein

---

## 🔮 Zukünftige Erweiterungen (bei > 100 User)

1. **Redis-basiertes Rate Limiting:** Persistent, skalierbar
2. **E-Mail-basierter Passwort-Reset:** Self-Service für User
3. **2FA (Two-Factor Authentication):** SMS oder Authenticator-App
4. **Session-Management:** Aktive Sessions anzeigen + beenden
5. **Audit-Log:** Alle Login-Versuche, Passwort-Änderungen, Admin-Aktionen loggen

---

## 📚 Referenzen

- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- Rate Limiting Patterns: https://cloud.google.com/architecture/rate-limiting-strategies-techniques

---

**Erstellt von:** Development Team  
**Review:** Pending  
**Status:** ✅ Implementiert, bereit für Deployment
