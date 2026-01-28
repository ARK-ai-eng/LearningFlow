# Cookie-Problem bei OAuth-Login

## Das Problem

Nach erfolgreichem Manus OAuth-Login wird das Session-Cookie gesetzt, aber beim nächsten Request nicht vom Browser zurückgesendet.

## Logs zeigen:

```
[OAuth] Cookie options: { httpOnly: true, path: '/', sameSite: 'lax', secure: false }
[OAuth] Cookie set, redirecting to /
[Auth] Cookie name: app_session_id Token present: false  <-- Cookie kommt nicht an!
```

## Relevante Dateien:

1. `server/_core/oauth.ts` - OAuth Callback, setzt Cookie (Zeile 113)
2. `server/_core/cookies.ts` - Cookie-Optionen
3. `server/_core/context.ts` - Liest Cookie für Auth
4. `server/auth.ts` - JWT Token Erstellung/Verifizierung

## Bereits getestet:

- `sameSite: "none"` → Cookie nicht gespeichert
- `sameSite: "lax"` → Cookie nicht gespeichert  
- `secure: true` → Cookie nicht gespeichert
- `secure: false` → Cookie nicht gespeichert

## Vermutung:

Cross-Domain Problem zwischen:
- OAuth Server: `manus.im`
- App Server: `3000-xxx.us1.manus.computer`

Der Browser blockiert möglicherweise das Cookie wegen unterschiedlicher Domains oder wegen des Manus-Proxy.

## Mögliche Lösungen:

1. **Token in URL statt Cookie**: Nach OAuth-Callback Token als URL-Parameter übergeben und im Frontend in localStorage speichern
2. **Cookie-Domain explizit setzen**: `.manus.computer` als Domain
3. **Proxy-Konfiguration prüfen**: Manus-Proxy könnte Set-Cookie Header entfernen

## Code-Änderung für Lösung 1 (Token in URL):

In `oauth.ts` Zeile 116 ändern von:
```typescript
res.redirect(302, "/");
```
zu:
```typescript
res.redirect(302, `/?token=${token}`);
```

Und im Frontend das Token aus URL lesen und in localStorage speichern.
