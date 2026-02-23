# PHASE 0 – INFRASTRUKTUR-ANALYSE

**Datum:** 16.02.2026  
**Ziel:** Vollständige Umgebungs-Analyse vor Performance-Optimierung  
**Methode:** Empirische Messung, keine Annahmen

---

## 1️⃣ DATENBANK-TOPOLOGIE

### Verbindung
- **Typ:** MySQL / TiDB (Cloud-basiert)
- **Connection:** mysql2/promise Pool (Singleton-Pattern)
- **Location:** ❓ **UNBEKANNT** (DATABASE_URL nicht einsehbar via Shell)
- **Geschätzte Latenz:** ❓ **MUSS GEMESSEN WERDEN**

### Erkenntnisse aus Code-Analyse:
```typescript
// server/db.ts
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _pool = mysql.createPool(process.env.DATABASE_URL);
    _db = drizzle(_pool as any);
  }
  return _db;
}
```

**Fragen:**
- [ ] Läuft DB lokal im selben Prozess? **NEIN** (MySQL ist separater Prozess)
- [ ] Gleiche VM? **❓ UNBEKANNT**
- [ ] Externe Instanz? **❓ WAHRSCHEINLICH** (TiDB Cloud)
- [ ] Geschätzte Netzwerk-Latenz? **❓ MUSS GEMESSEN WERDEN**

---

## 2️⃣ HOSTING-TOPOLOGIE

### Aktuelle Umgebung: **Development Sandbox (Development)**

**CPU:**
- Kerne: **6 vCPUs**
- Modell: Intel(R) Xeon(R) Processor @ 2.50GHz
- Typ: Shared (wahrscheinlich)

**RAM:**
- Total: **3.8 GB**
- Used: **2.1 GB**
- Available: **1.4 GB**
- Swap: **2.0 GB** (nicht genutzt)

**Storage:**
- Typ: **❓ UNBEKANNT** (NVMe / SSD / HDD)
- Total: **42 GB**
- Used: **12 GB** (29%)
- Available: **30 GB**

**Network:**
- IP: 169.254.0.21/30 (Private)
- Typ: **Reverse Proxy** (HTTPS-Tunnel)

### Geplante Production-Umgebung: **IONOS**
- **Typ:** ❓ **UNBEKANNT** (Shared / VPS / Dedicated)
- **CPU:** ❓ **UNBEKANNT**
- **RAM:** ❓ **UNBEKANNT**
- **Storage-Typ:** ❓ **UNBEKANNT**

**KRITISCH:** Ohne IONOS-Specs sind Performance-Ziele spekulativ!

---

## 3️⃣ LATENZ-QUELLEN (HYPOTHESE)

### Mögliche Bottlenecks:
1. **Netzwerk-Latenz:** Reverse Proxy → TiDB Cloud (❓ MUSS GEMESSEN WERDEN)
2. **DB-Query-Zeit:** N+1 Queries (32 Queries pro Dashboard)
3. **Node Event Loop:** PDF-Generierung blockiert (2-5s)
4. **Rendering:** React Re-Renders (weniger wahrscheinlich)

### Messstrategie:
```
Total Response Time = Network Latency + DB Query Time + Node Processing + Rendering
```

**Aufschlüsselung:**
- **Network Latency:** `Total - (DB Query + Node Processing)`
- **DB Query Time:** `console.time()` in `db.ts`
- **Node Processing:** `process.hrtime.bigint()`
- **Rendering:** Browser DevTools (Performance Tab)

---

## 4️⃣ PERFORMANCE-BASELINE (GEPLANT)

### Zu messende Endpoints:

| Endpoint | Erwartete Latenz | Kritikalität |
|----------|------------------|--------------|
| `auth.me` | < 50ms | NIEDRIG (gecacht) |
| `course.listActive` | ❓ | **HOCH** (N+1 Queries) |
| `progress.my` | ❓ | MITTEL |
| `question.getCourseStats` | ❓ | **HOCH** (N+1 Queries) |
| `certificate.my` | ❓ | MITTEL (N+1 Queries) |

### Messmethode:
1. **Server-Side:** Performance-Logger in tRPC-Middleware
2. **Client-Side:** Browser DevTools Network Tab
3. **DB-Query:** `console.time()` in `db.ts`

### Metriken:
- **P50:** Median (50% der Requests sind schneller)
- **P95:** 95% der Requests sind schneller (SLA-Ziel)
- **P99:** 99% der Requests sind schneller (Worst-Case)
- **AVG:** Durchschnitt (weniger aussagekräftig)

---

## 5️⃣ LAST-SIMULATION (GEPLANT)

### Test-Szenarien:

| Parallele Requests | Erwartete P95 | Ziel |
|--------------------|---------------|------|
| **1 Request** | ❓ | Baseline |
| **10 Requests** | ❓ | Typische Last |
| **50 Requests** | ❓ | Peak-Last |
| **100 Requests** | ❓ | Stress-Test |

### Tools:
- **Apache Bench (ab):** `ab -n 100 -c 10 https://...`
- **Custom Script:** Node.js mit `Promise.all()`

---

## 🛑 PHASE 0 STATUS: **BLOCKIERT**

### Fehlende Informationen:

1. ❌ **DATABASE_URL nicht einsehbar** (Umgebungsvariable geschützt)
2. ❌ **DB-Location unbekannt** (lokal / gleiche VM / remote)
3. ❌ **IONOS-Specs unbekannt** (Shared / VPS / Dedicated)
4. ❌ **Keine echte Performance-Baseline** (nur subjektive Beobachtungen)

### Nächste Schritte:

**Option A: Baseline mit aktueller Umgebung messen**
- Server-Side Performance-Logger implementieren
- 10 Requests pro Endpoint senden
- P50/P95/P99 dokumentieren
- **DANN:** Optimierungen mit Vorher/Nachher-Vergleich

**Option B: User-Input für fehlende Informationen**
- DATABASE_URL-Location (lokal / remote)
- IONOS-Specs (CPU, RAM, Storage)
- Realistische User-Last (< 100 / > 1000)

---

## 📊 VORLÄUFIGE ERKENNTNISSE

### Aktuelle Umgebung (Development Sandbox):
- **CPU:** 6 vCPUs (ausreichend für Development)
- **RAM:** 3.8 GB (knapp, aber OK)
- **Storage:** 42 GB (ausreichend)
- **Network:** Reverse Proxy (HTTPS-Tunnel, Latenz unbekannt)

### Kritische Fragen:
1. **Ist TiDB Cloud in gleicher Region wie Development Sandbox?**
   - Wenn NEIN: 50-200ms Netzwerk-Latenz möglich
   - Wenn JA: < 10ms Netzwerk-Latenz
2. **Ist IONOS Shared Hosting geplant?**
   - Wenn JA: CPU/RAM-Limits könnten Performance einschränken
   - Wenn NEIN (VPS/Dedicated): Mehr Kontrolle über Ressourcen

---

## 🎯 EMPFEHLUNG

**SOFORT:** Baseline mit Server-Side Performance-Logger messen
**DANN:** Indizes + Transactions implementieren (LOW RISK, HIGH IMPACT)
**SPÄTER:** JOINs + Dashboard-Aggregation (MEDIUM RISK, HIGH IMPACT)

**NICHT:** Theoretische Optimierungen ohne Messung

---

**Status:** PHASE 0 TEILWEISE ABGESCHLOSSEN  
**Nächster Schritt:** Performance-Logger implementieren + Baseline messen
