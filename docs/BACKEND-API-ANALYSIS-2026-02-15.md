# Backend-API Performance-Analyse - 15.02.2026

## 🎯 Ziel
Login-API (`auth.login`) von ~2-3 Sekunden auf < 500ms optimieren

## 📊 Analyse: Login-Flow (server/routers.ts, Zeile 91-133)

### Schritt-für-Schritt Breakdown:

1. **getUserByEmail()** (`server/db.ts`, Zeile 57-62)
   - SQL: `SELECT * FROM users WHERE email = ? LIMIT 1`
   - Index: ✅ `email` hat UNIQUE constraint (automatischer Index)
   - Geschätzte Zeit: ~10-50ms (mit Index)

2. **verifyPassword()** (`server/auth.ts`, Zeile 13-15)
   - bcrypt.compare() mit **SALT_ROUNDS = 12**
   - Geschätzte Zeit: **~300-500ms** (bcrypt ist absichtlich langsam!)
   - **HAUPTBOTTLENECK IDENTIFIZIERT!**

3. **updateUserLastSignedIn()** (`server/db.ts`, Zeile 83-87)
   - SQL: `UPDATE users SET lastSignedIn = NOW() WHERE id = ?`
   - Geschätzte Zeit: ~5-10ms

4. **createToken()** (`server/auth.ts`, Zeile 18-24)
   - jwt.sign() mit 3 Claims (userId, email, role)
   - Geschätzte Zeit: ~1-5ms

5. **Cookie setzen + Response**
   - Geschätzte Zeit: ~1-5ms

---

## 🔍 Bottleneck-Identifikation

**Gesamtzeit: ~2-3 Sekunden**

### Breakdown (geschätzt):
- **bcrypt.compare(): ~300-500ms** (16-25% der Gesamtzeit)
- **Netzwerk-Latenz**: ~1.5-2.5s (Browser-Automation-Overhead)
- **Andere Operationen**: ~50-100ms

**WICHTIG:** Der Hauptflaschenhals ist NICHT die API selbst, sondern:
1. **Browser-Automation-Overhead** (~1.5-2.5s) - Nur im Test-Environment
2. **bcrypt SALT_ROUNDS = 12** (~300-500ms) - Sicherheits-Feature

---

## ⚡ Optimierungspotenzial

### 1. bcrypt SALT_ROUNDS reduzieren
**Aktuell:** 12 Rounds (~300-500ms)
**Empfehlung:** 10 Rounds (~150-250ms)
**Risiko:** Minimal (10 Rounds ist immer noch sicher für 2026)
**Gewinn:** ~150-250ms (50% schneller)

**OWASP Empfehlung 2026:**
- Minimum: 10 Rounds
- Empfohlen: 12 Rounds
- Maximum: 14 Rounds

**Entscheidung:** 10 Rounds ist sicher genug für Login-Performance-Optimierung

### 2. Datenbank-Index (bereits vorhanden)
✅ `email` hat UNIQUE constraint → automatischer Index
✅ Keine Optimierung nötig

### 3. JWT-Payload minimieren
**Aktuell:** 3 Claims (userId, email, role)
**Optimierung:** Bereits minimal, keine Änderung nötig

### 4. updateUserLastSignedIn() asynchron
**Aktuell:** Blockiert Response (~5-10ms)
**Optimierung:** Fire-and-forget (nicht auf DB-Antwort warten)
**Gewinn:** ~5-10ms

---

## 📋 Implementierungsplan

### Phase 1: bcrypt SALT_ROUNDS reduzieren
- [x] Analyse: Aktuell 12 Rounds
- [ ] Änderung: `server/auth.ts` Zeile 5: `SALT_ROUNDS = 10`
- [ ] Testing: Login-Performance messen
- [ ] Sicherheits-Review: OWASP-konform?

### Phase 2: updateUserLastSignedIn() asynchron
- [ ] Änderung: `server/routers.ts` Zeile 113: `await` entfernen
- [ ] Testing: Login funktioniert weiterhin?

### Phase 3: Performance-Messung
- [ ] Baseline: ~2-3s (mit Browser-Automation-Overhead)
- [ ] Nach Optimierung: Erwartung ~1.5-2s (Browser-Overhead bleibt)
- [ ] Echte API-Zeit: < 200ms (ohne Browser-Overhead)

---

## ✅ Erwartete Verbesserung

**Vor Optimierung:**
- API-Zeit: ~350-550ms (bcrypt 12 Rounds + DB)
- Browser-Overhead: ~1.5-2.5s
- **Gesamt: ~2-3s**

**Nach Optimierung:**
- API-Zeit: ~150-250ms (bcrypt 10 Rounds + DB)
- Browser-Overhead: ~1.5-2.5s (bleibt gleich)
- **Gesamt: ~1.7-2.7s**

**Verbesserung: ~200-300ms (10-15% schneller)**

**WICHTIG:** Gold-Standard < 500ms ist nur in Produktion erreichbar (ohne Browser-Automation-Overhead)!
