# ADR-017: Mandantenfähigkeit & Multi-Portal-Integration

**Status:** Proposed (Diskussion am 15.02.2026)  
**Kontext:** Strategische Produktentwicklung  
**Entscheider:** User (Produktowner)

---

## Kontext

### Problem-Statement

**Ausgangssituation:**
- Firmen haben heute **100+ verschiedene Lernportale** (LinkedIn Learning, Udemy Business, SAP SuccessFactors, Moodle, interne Schulungen, etc.)
- Mitarbeiter müssen sich überall separat einloggen
- Admins haben **keine zentrale Übersicht** über Schulungsstand
- **Compliance-Nachweise sind verstreut** über viele Systeme
- Hoher administrativer Aufwand

**User-Anforderung:**
> "Könnten wir eventuell andere Portale hier anbinden, da die Firmen Probleme haben 100 verschiedene Lernportale zu haben?"

### Aktueller Stand (15.02.2026)

**✅ Bereits vorhanden:**
- Firmen-Trennung (`companies` Tabelle)
- User-zu-Firma-Zuordnung (`users.companyId`)
- Rollen-System (SysAdmin, FirmenAdmin, User)
- Firmen-spezifische Admins

**❌ Nicht vorhanden:**
- Kurse sind GLOBAL (alle Firmen sehen dieselben Kurse)
- Keine firmen-spezifischen Inhalte
- Keine White-Label-Optionen (Logo, Farben, Domain)
- Keine Integration externer Lernportale

---

## Zusätzliche Anforderungen

### 1. Arbeitsunterweisung

**User-Zitat:**
> "wichtig wäre eine arbeitsunterweisung"

**Interpretation:**
- **Arbeitsunterweisung** = Dokumentierte Einweisung in Arbeitssicherheit/Prozesse
- Rechtlich verpflichtend nach §12 ArbSchG (Deutschland)
- Muss dokumentiert werden (Unterschrift, Datum)
- Regelmäßige Wiederholung notwendig

**Anforderungen:**
- Unterschriften-Funktion (digital)
- Nachweis wer, wann, welche Unterweisung erhalten hat
- PDF-Export für Audits
- Wiedervorlagen-System (z.B. jährlich)

### 2. Mobile App

**User-Zitat:**
> "dass dies auch als app funktioniert iwann"

**Interpretation:**
- Native Mobile App (iOS + Android)
- Offline-Fähigkeit (Lernen ohne Internet)
- Push-Notifications (Erinnerungen, neue Kurse)
- Mobile-optimierte Quiz-Oberfläche

---

## Lösungsoptionen

### Option 1: Vollständige Mandantenfähigkeit + Portal-Integration

**Konzept:** AISmarterFlow wird zum "Learning Hub" der ALLE Portale vereint

**Architektur:**
```
AISmarterFlow Academy (Zentrale)
├── Eigene Kurse (IT-Sicherheit, Arbeitsunterweisung, etc.)
├── LinkedIn Learning (via API)
├── Udemy Business (via API)
├── SAP SuccessFactors (via LTI)
├── Moodle (via SCORM)
└── Custom Inhalte (Upload)
```

**Schema-Erweiterungen:**

```sql
-- 1. Kurse werden firmen-spezifisch ODER global
ALTER TABLE courses ADD COLUMN companyId INT NULL;
-- NULL = global (alle sehen), Wert = nur diese Firma

-- 2. White-Label pro Firma
ALTER TABLE companies ADD COLUMN logo TEXT;
ALTER TABLE companies ADD COLUMN primaryColor VARCHAR(7);
ALTER TABLE companies ADD COLUMN secondaryColor VARCHAR(7);
ALTER TABLE companies ADD COLUMN customDomain VARCHAR(255);

-- 3. Externe Lernportale
CREATE TABLE external_portals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT NOT NULL,
  name VARCHAR(255), -- "LinkedIn Learning"
  type ENUM('scorm', 'xapi', 'lti', 'api', 'manual'),
  apiEndpoint TEXT,
  apiKey TEXT, -- Encrypted
  ssoConfig JSON,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- 4. Externe Kurse tracken
CREATE TABLE external_courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  portalId INT NOT NULL,
  externalCourseId VARCHAR(255),
  title VARCHAR(255),
  provider VARCHAR(100), -- "LinkedIn", "Udemy"
  thumbnailUrl TEXT,
  lastSyncedAt TIMESTAMP
);

-- 5. User-Progress für externe Kurse
CREATE TABLE external_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  externalCourseId INT NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed'),
  progress INT, -- 0-100%
  completedAt TIMESTAMP,
  certificateUrl TEXT,
  syncedAt TIMESTAMP
);

-- 6. Arbeitsunterweisung: Unterschriften
CREATE TABLE instruction_signatures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  courseId INT NOT NULL, -- Kurs = Arbeitsunterweisung
  signatureData TEXT, -- Base64 Canvas-Signatur
  signedAt TIMESTAMP DEFAULT NOW(),
  ipAddress VARCHAR(45),
  deviceInfo TEXT
);
```

**Features:**
- ✅ **Zentrale Übersicht** - Alle Lernaktivitäten (intern + extern) an einem Ort
- ✅ **SSO-Integration** - Einmal einloggen, überall Zugriff
- ✅ **Compliance-Dashboard** - FirmenAdmin sieht ALLE Schulungen (egal welches Portal)
- ✅ **Automatischer Sync** - API-Integration holt Fortschritt von LinkedIn, Udemy, etc.
- ✅ **White-Label** - Jede Firma kann Logo/Farben/Domain anpassen
- ✅ **Arbeitsunterweisung** - Digitale Unterschrift + Audit-Trail
- ✅ **Mobile App** - iOS + Android mit Offline-Modus

**Integrations-Standards:**
- **SCORM 1.2/2004** - Standard für E-Learning-Inhalte
- **xAPI (Tin Can API)** - Moderner Tracking-Standard
- **LTI 1.3** - Learning Tools Interoperability (SSO + Content)
- **REST APIs** - LinkedIn Learning, Udemy Business, etc.
- **SAML/OAuth** - Single Sign-On

---

### Option 2: Hybrid-Ansatz (Quick Win)

**Konzept:** Interne Kurse + Manuelle Links zu externen Portalen

**Phase 1 (1 Woche):**
- Mandantenfähigkeit für Kurse (`courses.companyId`)
- White-Label Basics (Logo, Farben pro Firma)
- Externe Portal-Links (manuell hinterlegt)
- Dashboard zeigt alle Portale an einem Ort

**Phase 2 (2 Wochen):**
- Arbeitsunterweisung mit digitaler Unterschrift
- CSV-Import für externe Abschlüsse
- Zentrale Compliance-Übersicht

**Phase 3 (1 Monat):**
- API-Integration für LinkedIn Learning
- API-Integration für Udemy Business
- Automatischer Progress-Sync

**Phase 4 (2 Monate):**
- SCORM/xAPI Support
- LTI-Integration (SAP, Moodle)
- Mobile App (React Native)

---

### Option 3: Nur Mandantenfähigkeit (Minimal)

**Konzept:** Jede Firma kann eigene Kurse erstellen, keine externe Integration

**Änderungen:**
- `courses.companyId` hinzufügen
- White-Label (Logo, Farben)
- Arbeitsunterweisung mit Unterschrift

**Vorteil:** Schnell umsetzbar (1 Woche)  
**Nachteil:** Löst nicht das "100 Portale"-Problem

---

## Geschäftsmodell-Überlegung

### Wettbewerbsvorteil

**Unique Selling Proposition:**
> "AISmarterFlow Academy - Das EINZIGE Lernportal das Sie brauchen.  
> Wir binden alle Ihre bestehenden Portale ein!"

**Differenzierung:**
- **Andere LMS:** Nur eigene Inhalte
- **AISmarterFlow:** Aggregiert ALLE Lernaktivitäten (intern + extern)

### Pricing-Modell

| Plan | Features | Preis/User/Monat |
|------|----------|------------------|
| **Basic** | Eigene Kurse, Quiz, Zertifikate | 5€ |
| **Professional** | + 3 externe Portal-Integrationen<br>+ White-Label (Logo, Farben)<br>+ Arbeitsunterweisung | 12€ |
| **Enterprise** | + Unlimited Integrationen<br>+ Custom Domain<br>+ API-Zugriff<br>+ Dedicated Support | 25€ |

**Zusatz-Optionen:**
- Mobile App: +3€/User/Monat
- Custom Integration: 500€ Setup + 50€/Monat

---

## Technische Umsetzung

### Mobile App (React Native)

**Warum React Native?**
- Code-Sharing mit Web (React-Komponenten wiederverwendbar)
- Ein Codebase für iOS + Android
- Schnellere Entwicklung als Native

**Architektur:**
```
aismarterflow-academy/
├── client/              # Web (React)
├── mobile/              # Mobile (React Native)
│   ├── src/
│   │   ├── screens/     # Screens (Dashboard, Quiz, etc.)
│   │   ├── components/  # Shared Components
│   │   └── lib/         # tRPC Client (gleich wie Web)
│   ├── ios/
│   └── android/
└── server/              # Backend (shared)
```

**Offline-Modus:**
- SQLite für lokale Datenbank
- Sync bei Internet-Verbindung
- Download von Kursen für Offline-Lernen

**Push-Notifications:**
- Firebase Cloud Messaging (FCM)
- Erinnerungen: "Kurs läuft in 7 Tagen ab"
- Neue Kurse: "Neuer Kurs verfügbar"

---

## Arbeitsunterweisung: Rechtliche Anforderungen

### Deutschland (§12 ArbSchG)

**Verpflichtungen:**
1. **Erstunterweisung** vor Aufnahme der Tätigkeit
2. **Wiederholungsunterweisung** mindestens jährlich
3. **Dokumentation** wer, wann, welche Unterweisung erhalten hat
4. **Unterschrift** des Mitarbeiters

**Inhalte:**
- Gefährdungen am Arbeitsplatz
- Schutzmaßnahmen
- Verhalten im Notfall
- Bedienung von Arbeitsmitteln

### Umsetzung in AISmarterFlow

**Kurs-Typ:** `instruction` (zusätzlich zu learning, sensitization, certification)

**Workflow:**
1. User absolviert Arbeitsunterweisung (Video + Quiz)
2. Nach Bestehen: Unterschriften-Seite
3. User unterschreibt digital (Canvas-Signatur)
4. System speichert: Unterschrift + Timestamp + IP + Device
5. PDF-Zertifikat mit Unterschrift wird generiert
6. FirmenAdmin sieht Übersicht: Wer hat wann unterschrieben?
7. Wiedervorlage-System: Automatische Erinnerung nach 12 Monaten

**Audit-Trail:**
```json
{
  "userId": 123,
  "courseId": 456,
  "courseName": "Arbeitsschutz Grundlagen",
  "completedAt": "2026-02-15T10:30:00Z",
  "score": 95,
  "signedAt": "2026-02-15T10:35:00Z",
  "signature": "data:image/png;base64,...",
  "ipAddress": "192.168.1.100",
  "deviceInfo": "Mozilla/5.0 (iPhone; iOS 17.0)...",
  "certificateUrl": "https://..."
}
```

---

## Roadmap

### Phase 1: Mandantenfähigkeit (1 Woche)
- [ ] Schema: `courses.companyId` hinzufügen
- [ ] Schema: `companies` erweitern (logo, colors)
- [ ] Backend: Kurs-Filtering nach Firma
- [ ] Frontend: White-Label (Logo, Farben)
- [ ] Test: Mehrere Firmen mit eigenen Kursen

### Phase 2: Arbeitsunterweisung (1 Woche)
- [ ] Schema: `instruction_signatures` Tabelle
- [ ] Kurs-Typ: `instruction` hinzufügen
- [ ] Frontend: Unterschriften-Canvas
- [ ] Backend: Unterschrift speichern + PDF generieren
- [ ] Wiedervorlage-System (Cron-Job)
- [ ] FirmenAdmin: Unterschriften-Übersicht

### Phase 3: Externe Portale (Manuell) (1 Woche)
- [ ] Schema: `external_portals`, `external_courses`, `external_progress`
- [ ] FirmenAdmin: Externe Portale hinterlegen (Name, URL, Logo)
- [ ] Dashboard: Zeigt alle Portale (intern + extern)
- [ ] Manuelle Progress-Eingabe (CSV-Import)
- [ ] Zentrale Compliance-Übersicht

### Phase 4: API-Integrationen (2-4 Wochen)
- [ ] LinkedIn Learning API-Integration
- [ ] Udemy Business API-Integration
- [ ] Automatischer Progress-Sync (Cron-Job)
- [ ] SSO-Integration (SAML/OAuth)

### Phase 5: SCORM/xAPI Support (2 Wochen)
- [ ] SCORM 1.2/2004 Player
- [ ] xAPI (Tin Can) Tracking
- [ ] Upload von SCORM-Paketen
- [ ] LRS (Learning Record Store) Integration

### Phase 6: Mobile App (4-6 Wochen)
- [ ] React Native Setup
- [ ] Screens: Dashboard, Kurse, Quiz
- [ ] Offline-Modus (SQLite + Sync)
- [ ] Push-Notifications (FCM)
- [ ] App Store Submission (iOS + Android)

---

## Offene Fragen (für User)

1. **Externe Portale:**
   - Welche Portale sind für deine Kunden am wichtigsten? (LinkedIn, Udemy, SAP, Moodle, ...?)
   - Haben die Firmen bereits API-Zugriff auf diese Portale?

2. **Mandantenfähigkeit:**
   - Soll jede Firma eigene Kurse erstellen können oder nur SysAdmin?
   - Sollen Firmen Kurse untereinander teilen können?

3. **White-Label:**
   - Ist Custom Domain wichtig? (z.B. `academy.firma-xyz.de`)
   - Welche Anpassungen sind wichtig? (Logo, Farben, Texte, ...?)

4. **Arbeitsunterweisung:**
   - Welche Branchen/Firmen brauchen das? (Bau, Produktion, Logistik, ...?)
   - Welche Inhalte sollen standardmäßig dabei sein?

5. **Mobile App:**
   - Wie wichtig ist Offline-Modus? (Baustellen ohne Internet?)
   - Welche Features sind mobile am wichtigsten?

6. **Pricing:**
   - Ist das vorgeschlagene Pricing-Modell realistisch?
   - Wie viel würden Firmen für "All-in-One"-Lösung zahlen?

---

## Entscheidung

**Status:** OFFEN - Wartet auf User-Feedback

**Nächste Schritte:**
1. User beantwortet offene Fragen
2. Priorisierung der Features
3. Entscheidung für Option 1, 2 oder 3
4. Start der Implementierung

---

## Konsequenzen

### Bei Option 1 (Vollständig):
**Vorteile:**
- Echter Wettbewerbsvorteil ("All-in-One")
- Höherer Preis rechtfertigbar
- Langfristig skalierbares Produkt

**Nachteile:**
- Lange Entwicklungszeit (3-6 Monate)
- Komplexe Integrationen
- Hoher Wartungsaufwand

### Bei Option 2 (Hybrid):
**Vorteile:**
- Schneller Markteintritt (4-8 Wochen)
- Iterative Entwicklung möglich
- Frühes User-Feedback

**Nachteile:**
- Anfangs nur teilweise Lösung
- Manueller Aufwand für Admins

### Bei Option 3 (Minimal):
**Vorteile:**
- Sehr schnell (1-2 Wochen)
- Geringes Risiko

**Nachteile:**
- Löst Hauptproblem nicht ("100 Portale")
- Kein USP gegenüber Wettbewerb

---

## Referenzen

- [LinkedIn Learning API Docs](https://docs.microsoft.com/en-us/linkedin/learning/)
- [Udemy Business API](https://business-support.udemy.com/hc/en-us/articles/360045405634)
- [SCORM Specification](https://scorm.com/scorm-explained/)
- [xAPI Specification](https://xapi.com/)
- [LTI 1.3 Standard](https://www.imsglobal.org/spec/lti/v1p3/)
- [§12 ArbSchG (Deutschland)](https://www.gesetze-im-internet.de/arbschg/__12.html)

---

**Erstellt:** 15.02.2026, 02:00 Uhr  
**Autor:** Manus AI (basierend auf User-Diskussion)  
**Review:** Ausstehend
