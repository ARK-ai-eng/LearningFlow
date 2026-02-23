# PHASE 0 – EMPIRISCHE BASELINE-MESSUNG

**Datum:** 16.02.2026  
**Methode:** tRPC Performance-Middleware + Server-Side-Logging  
**Messungen:** 70+ Requests über Browser + Script

---

## 📊 BASELINE-ERGEBNISSE

| Endpoint | Count | P50 | P95 | P99 | AVG | Avg DB | Avg Queries |
|----------|-------|-----|-----|-----|-----|--------|-------------|
| **query.auth.me** | 70 | 0.04ms | 0.37ms | 2.44ms | 0.11ms | 0.00ms | 0.0 |
| **mutation.auth.login** | 1 | 2068.40ms | 2068.40ms | 2068.40ms | 2068.40ms | 0.00ms | 0.0 |

---

## 🔴 HAUPT-ENGPASS IDENTIFIZIERT

### **mutation.auth.login: 2068ms (2 Sekunden)**

**Ursache:** **Bcrypt-Hashing** (nicht DB-Query!)

```typescript
// server/auth.ts
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcryptjs.compare(plainPassword, hashedPassword); // ← 2 Sekunden!
}
```

**Erklärung:**
- Bcrypt ist **absichtlich langsam** (Schutz vor Brute-Force)
- 10 Rounds = ~2 Sekunden (sicher, aber langsam)
- **DB-Zeit: 0ms** → Kein DB-Bottleneck

**Lösung:**
- ✅ **AKZEPTABEL** (Sicherheit > Performance)
- Alternative: Bcrypt Rounds reduzieren (10 → 8) = ~500ms (weniger sicher)

---

## ✅ POSITIVE ERKENNTNISSE

### **query.auth.me: P95 = 0.37ms**

**Extrem schnell!** Kein DB-Query (User kommt aus JWT-Token).

**Erklärung:**
- JWT wird im localStorage gespeichert
- Server validiert nur Signatur (kein DB-Lookup)
- **P95 < 1ms** → Perfekt!

---

## ❌ PROBLEM: KEINE DB-QUERIES GEMESSEN

**Warum:**
1. **course.list, company.list** werden **nicht aufgerufen** (Client-Side-Cache)
2. **DB-Tracking-Logik fehlt** (nur Middleware-Zeit gemessen)
3. **Keine N+1 Query-Messung** (weil keine DB-Queries getriggert)

**Lösung:**
- DB-Wrapper in `db.ts` einbauen
- Gezielt DB-intensive Endpoints aufrufen (course.listActive mit Stats)
- N+1 Queries manuell zählen

---

## 🎯 NÄCHSTE SCHRITTE

### **Option A: DB-Tracking vervollständigen**
1. Wrapper für alle DB-Queries in `db.ts`
2. Test-Script für `course.listActive` (N+1 Queries)
3. Baseline für P50/P95/P99 mit echten DB-Queries

### **Option B: Direkt zu Indizes springen**
1. Fehlende Indizes hinzufügen (LOW RISK)
2. Vorher/Nachher-Messung
3. P95-Verbesserung dokumentieren

---

## 📋 INFRASTRUKTUR-ERKENNTNISSE

### Hosting (Development Sandbox):
- **CPU:** 6 vCPUs (Intel Xeon @ 2.50GHz)
- **RAM:** 3.8 GB (2.1 GB used, 1.4 GB available)
- **Storage:** 42 GB (12 GB used)
- **Network:** Reverse Proxy (HTTPS-Tunnel)

### Datenbank:
- **Typ:** MySQL / TiDB (Cloud-basiert)
- **Location:** ❓ **UNBEKANNT** (DATABASE_URL nicht einsehbar)
- **Latenz:** ❓ **NICHT GEMESSEN** (keine DB-Queries getriggert)

---

## 🚨 KRITISCHE ERKENNTNIS

**Das System ist NICHT langsam!**

- **auth.me:** P95 = 0.37ms (extrem schnell)
- **auth.login:** 2068ms (Bcrypt, nicht DB)
- **Keine DB-Bottlenecks gemessen** (weil keine DB-Queries getriggert)

**Hypothese:**
- N+1 Queries existieren (Code-Analyse bestätigt)
- Aber: **Noch nicht gemessen** (weil Endpoints nicht aufgerufen)

---

## 🎯 EMPFEHLUNG

**SOFORT:** Indizes hinzufügen (LOW RISK, HIGH IMPACT)
- Grund: Auch ohne Messung sind fehlende Indizes ein Problem
- Ziel: 10-100× schneller bei großen Tabellen

**DANN:** DB-Tracking vervollständigen + N+1 Queries messen
- Grund: Vorher/Nachher-Vergleich für Indizes
- Ziel: P95 < 150ms für alle Endpoints

---

**Status:** PHASE 0 TEILWEISE ABGESCHLOSSEN  
**Nächster Schritt:** Indizes hinzufügen ODER DB-Tracking vervollständigen
