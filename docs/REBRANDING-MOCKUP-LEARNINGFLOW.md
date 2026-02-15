# LearningFlow Rebranding - Visuelle Vorschau (Option 2)

**Status:** 🎨 MOCKUP - NICHT UMGESETZT

**Datum:** 15.02.2026

**Ziel:** Zeigen wie "LearningFlow by AISmarterFlow" auf der Plattform aussehen würde

---

## 📱 Header/Navigation (Alle Seiten)

### Aktuell:
```
┌─────────────────────────────────────────────────────┐
│  🎓 AISmarterFlow Academy              [Anmelden]  │
└─────────────────────────────────────────────────────┘
```

### NEU (Option 2):
```
┌─────────────────────────────────────────────────────┐
│  🎓 LearningFlow                       [Anmelden]  │
│     by AISmarterFlow                                │
└─────────────────────────────────────────────────────┘
```

**Visuell:**
- **"LearningFlow"** = Groß, fett, prominent (text-xl font-bold)
- **"by AISmarterFlow"** = Klein, dezent, grau (text-xs text-muted-foreground)
- Logo-Icon bleibt gleich (🎓 GraduationCap)

---

## 🏠 Landing Page - Hero Section

### Aktuell:
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│         🎓 AISmarterFlow Academy                   │
│                                                     │
│    KI-gestützte Compliance-Schulungen              │
│                                                     │
│         Compliance-Schulungen                       │
│            neu gedacht                              │
│                                                     │
│    Moderne Lernplattform für Datenschutz,          │
│    IT-Sicherheit und Compliance...                 │
│                                                     │
│         [Jetzt starten →]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### NEU (Option 2):
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│         🎓 LearningFlow                            │
│            by AISmarterFlow                        │
│                                                     │
│    KI-gestützte Compliance-Schulungen              │
│                                                     │
│         Compliance-Schulungen                       │
│            neu gedacht                              │
│                                                     │
│    Moderne Lernplattform für Datenschutz,          │
│    IT-Sicherheit und Compliance...                 │
│                                                     │
│         [Jetzt starten →]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Änderungen:**
- Logo-Bereich: "LearningFlow" (groß) + "by AISmarterFlow" (klein darunter)
- Subline "KI-gestützte Compliance-Schulungen" bleibt
- Rest bleibt identisch

---

## 📄 Footer (Alle Seiten)

### Aktuell:
```
┌─────────────────────────────────────────────────────┐
│  🎓 AISmarterFlow Academy                          │
│                                                     │
│  Datenschutz  Impressum  Kontakt                   │
│                                                     │
│  © 2026 AISmarterFlow. Alle Rechte vorbehalten.   │
└─────────────────────────────────────────────────────┘
```

### NEU (Option 2):
```
┌─────────────────────────────────────────────────────┐
│  🎓 LearningFlow                                   │
│     by AISmarterFlow                               │
│                                                     │
│  Datenschutz  Impressum  Kontakt                   │
│                                                     │
│  © 2026 LearningFlow. Eine Marke der              │
│  AISmarterFlow UG (haftungsbeschränkt).           │
│  Alle Rechte vorbehalten.                          │
└─────────────────────────────────────────────────────┘
```

**Änderungen:**
- Logo: "LearningFlow" + "by AISmarterFlow" (wie Header)
- Copyright: Rechtlich korrekte Formulierung mit UG-Hinweis

---

## 📋 Impressum (Neue Seite)

### NEU:
```
Impressum

Angaben gemäß § 5 TMG:

LearningFlow
Eine Marke der AISmarterFlow UG (haftungsbeschränkt)

Vertreten durch:
Arton Ritter (Geschäftsführer)

Adresse:
[Straße, Hausnummer]
[PLZ, Stadt]

Kontakt:
E-Mail: info@aismarterflow.de
Telefon: [Telefonnummer]

Registereintrag:
Registergericht: [Amtsgericht]
Registernummer: HRB [Nummer]

Umsatzsteuer-ID:
USt-IdNr.: DE[Nummer]

Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:
Arton Ritter
[Adresse]

Hinweis:
LearningFlow ist eine eingetragene Marke der 
AISmarterFlow UG (haftungsbeschränkt).
```

---

## 🎨 Design-Details

### Farbschema (bleibt gleich):
- Primary: Cyan/Türkis (#06b6d4)
- Accent: Lila/Pink
- Background: Dark (#0a0f1e)
- Text: Weiß/Grau

### Typografie:
- **"LearningFlow"**: text-xl font-bold (20px, fett)
- **"by AISmarterFlow"**: text-xs text-muted-foreground (12px, grau)
- Abstand zwischen beiden: 2px (gap-0.5)

### Logo-Struktur:
```
┌─────────────────┐
│  🎓             │  ← Icon (40x40px, gradient background)
│                 │
│  LearningFlow   │  ← Hauptmarke (20px, bold, weiß)
│  by AISmarterFlow│  ← Subline (12px, regular, grau)
└─────────────────┘
```

---

## 📱 Responsive Verhalten

### Desktop (>1024px):
- Logo + Subline nebeneinander im Header
- Volle Copyright-Zeile im Footer

### Tablet (768-1024px):
- Logo + Subline nebeneinander (etwas kleiner)
- Copyright zweizeilig im Footer

### Mobile (<768px):
- Logo + Subline untereinander
- Copyright mehrzeilig im Footer

---

## 🔄 Änderungen im Code (Übersicht)

### Dateien die geändert werden müssten:

1. **client/src/pages/Home.tsx**
   - Header Logo-Bereich (Zeile 114-119)
   - Footer Logo-Bereich (Zeile 313-318)
   - Footer Copyright (Zeile 325-327)

2. **client/src/components/DashboardLayout.tsx** (falls vorhanden)
   - Header Logo für eingeloggte User

3. **Neue Seite: client/src/pages/Impressum.tsx**
   - Vollständiges Impressum mit rechtlichen Angaben

4. **client/src/pages/Home.tsx** (Footer)
   - Link zu Impressum aktivieren

5. **Datenbank/Seed-Daten** (NICHT ändern)
   - Kurse, Fragen, etc. bleiben unverändert
   - Nur Frontend-Texte ändern

---

## ✅ Was bleibt GLEICH:

- ✅ Design/Farbschema
- ✅ Logo-Icon (GraduationCap)
- ✅ Alle Funktionen
- ✅ Datenbank-Struktur
- ✅ API-Endpoints
- ✅ Dokumentation (nur Titel anpassen)

---

## 📊 Vergleich: Vorher vs. Nachher

| Element | Aktuell | NEU (Option 2) |
|---------|---------|----------------|
| **Produktname** | AISmarterFlow Academy | LearningFlow |
| **Unternehmensmarke** | Nicht sichtbar | "by AISmarterFlow" (dezent) |
| **Header** | "AISmarterFlow Academy" | "LearningFlow" + "by AISmarterFlow" |
| **Footer** | "© 2026 AISmarterFlow" | "© 2026 LearningFlow. Eine Marke der AISmarterFlow UG" |
| **Impressum** | Fehlt | Vollständig mit UG-Angaben |
| **Rechtliche Klarheit** | ⚠️ Unklar | ✅ Klar (Marke vs. Unternehmen) |

---

## 🎯 Vorteile dieser Lösung:

1. ✅ **Klare Produktmarke**: "LearningFlow" steht im Vordergrund
2. ✅ **Sichtbare Unternehmensmarke**: "by AISmarterFlow" immer präsent
3. ✅ **Rechtlich sauber**: Footer macht Eigentumsverhältnisse klar
4. ✅ **Professionell**: B2B-Kunden sehen beide Marken
5. ✅ **Skalierbar**: Zukünftige "Flow"-Produkte folgen gleichem Muster
6. ✅ **Lizenzmodell-ready**: Klare Trennung Marke (LearningFlow) vs. Inhaber (AISmarterFlow UG)

---

## 🚀 Nächste Schritte (wenn genehmigt):

1. [ ] Rebranding in todo.md dokumentieren
2. [ ] Home.tsx Header anpassen
3. [ ] Home.tsx Footer anpassen
4. [ ] Impressum-Seite erstellen
5. [ ] DashboardLayout anpassen (falls vorhanden)
6. [ ] Browser-Test
7. [ ] Checkpoint erstellen

**Zeitaufwand:** ~30 Minuten

---

## ❓ Offene Fragen:

1. **Impressum-Daten:** Vollständige Adresse, Registernummer, USt-IdNr.?
2. **Domain:** Soll learningflow.de registriert werden?
3. **Markenanmeldung:** Soll "LearningFlow" als Wortmarke beim DPMA angemeldet werden?
4. **E-Mail:** info@learningflow.de oder weiter info@aismarterflow.de?

---

**Status:** ✋ WARTE AUF FREIGABE - NICHTS UMGESETZT
