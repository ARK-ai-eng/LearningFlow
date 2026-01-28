# AISmarterFlow Academy - Benutzer-Handbuch

## Inhaltsverzeichnis

1. [SysAdmin-Handbuch](#sysadmin-handbuch)
2. [FirmenAdmin-Handbuch](#firmenadmin-handbuch)
3. [Mitarbeiter-Handbuch](#mitarbeiter-handbuch)
4. [FAQ](#faq)

---

## SysAdmin-Handbuch

### Anmeldung

| Feld | Wert |
|------|------|
| **URL** | https://3000-iy4m5go6oz49picqmrknl-a63212b2.us1.manus.computer/login |
| **E-Mail** | arton.ritter@aismarterflow.de |
| **Passwort** | Manus§123* |

### Dashboard

Nach dem Login sehen Sie das **SysAdmin-Dashboard** mit:
- Übersicht aller Firmen
- Anzahl der Mitarbeiter pro Firma
- Verfügbare Kurse
- Schnellzugriff auf Kurs-Verwaltung

### Aufgaben

#### 1. Firma anlegen

1. Klicken Sie auf **"Neue Firma"** im Dashboard
2. Geben Sie ein:
   - **Firmenname**: z.B. "Acme GmbH"
   - **Max. Benutzer**: z.B. 100
3. Klicken Sie **"Speichern"**
4. Die Firma wird sofort erstellt

#### 2. FirmenAdmin erstellen

1. Klicken Sie auf die Firma
2. Klicken Sie auf **"FirmenAdmin hinzufügen"**
3. Geben Sie ein:
   - **E-Mail**: z.B. "admin@acme.de"
   - **Passwort**: Muss 8+ Zeichen, Groß- und Kleinbuchstaben, mindestens 1 Zahl enthalten
   - **Vorname**: z.B. "Max"
   - **Nachname**: z.B. "Mustermann"
4. Klicken Sie **"Erstellen"**
5. Teilen Sie dem FirmenAdmin die Anmeldedaten per Telefon mit

#### 3. Kurs erstellen

1. Klicken Sie auf **"Kurse"** in der Navigation
2. Klicken Sie auf **"Neuer Kurs"**
3. Geben Sie ein:
   - **Kurstitel**: z.B. "Datenschutz Grundlagen"
   - **Kurstyp**: Learning / Sensitization / Certification
   - **Beschreibung**: Kurze Zusammenfassung
   - **Bestehensgrenze**: z.B. 80% (nur für Certification)
   - **Zeitlimit**: z.B. 15 Minuten (nur für Prüfung)
4. Klicken Sie **"Speichern"**

#### 4. Themen hinzufügen

1. Öffnen Sie einen Kurs
2. Klicken Sie auf **"Thema hinzufügen"**
3. Geben Sie den Themennamen ein: z.B. "Was ist Datenschutz?"
4. Klicken Sie **"Hinzufügen"**

#### 5. Fragen hinzufügen

1. Klicken Sie auf ein Thema (Expand-Button)
2. Klicken Sie auf **"Frage hinzufügen"**
3. Geben Sie ein:
   - **Frage**: z.B. "Was ist das Hauptziel des Datenschutzes?"
   - **Antwort A**: z.B. "Daten zu löschen"
   - **Antwort B**: z.B. "Persönliche Daten zu schützen" ← **Richtig**
   - **Antwort C**: z.B. "Daten zu verkaufen"
   - **Antwort D**: z.B. "Daten zu sammeln"
   - **Richtige Antwort**: Wählen Sie B
   - **Erklärung**: "Datenschutz zielt darauf ab, die Privatsphäre zu schützen"
4. Klicken Sie **"Speichern"**

### Tipps

- **Passwörter**: Teilen Sie diese per Telefon mit, nicht per E-Mail
- **Kurse aktivieren**: Kurse müssen aktiv sein, um für Mitarbeiter sichtbar zu sein
- **Pflicht-Kurse**: Markieren Sie wichtige Kurse als "Pflicht"
- **Fragen-Reihenfolge**: Die Reihenfolge wird automatisch gespeichert

---

## FirmenAdmin-Handbuch

### Anmeldung

Sie erhalten von Ihrem SysAdmin:
- **E-Mail**: z.B. admin@acme.de
- **Passwort**: z.B. SecurePass123!

**Login-URL**: https://3000-iy4m5go6oz49picqmrknl-a63212b2.us1.manus.computer/login

### Dashboard

Nach dem Login sehen Sie:
- **Mitarbeiter-Verwaltung**: Alle Ihre Mitarbeiter
- **Meine Schulungen**: Kurse, die Sie selbst absolvieren können
- **Zertifikate**: Ihre eigenen Zertifikate

### Aufgaben

#### 1. Mitarbeiter einzeln anlegen

1. Klicken Sie auf **"Mitarbeiter"** im Dashboard
2. Klicken Sie auf **"Mitarbeiter hinzufügen"**
3. Geben Sie ein:
   - **E-Mail**: z.B. "max.mueller@acme.de"
   - **Passwort**: Muss 8+ Zeichen, Groß- und Kleinbuchstaben, mindestens 1 Zahl enthalten
   - **Vorname**: z.B. "Max"
   - **Nachname**: z.B. "Müller"
   - **Personalnummer**: z.B. "P001" (optional)
4. Klicken Sie **"Erstellen"**
5. Teilen Sie dem Mitarbeiter die Anmeldedaten per Telefon mit

#### 2. Mitarbeiter per CSV importieren

1. Klicken Sie auf **"CSV importieren"**
2. Laden Sie eine CSV-Datei hoch mit Spalten:
   ```
   email,firstName,lastName,personnelNumber,password
   max@acme.de,Max,Müller,P001,SecurePass123!
   anna@acme.de,Anna,Schmidt,P002,SecurePass456!
   ```
3. Klicken Sie **"Importieren"**
4. Alle Mitarbeiter werden erstellt

#### 3. Mitarbeiter-Fortschritt überwachen

1. Klicken Sie auf einen Mitarbeiter
2. Sie sehen:
   - Verfügbare Kurse
   - Lernfortschritt (%)
   - Abgeschlossene Themen
   - Zertifikate

#### 4. Selbst Kurse absolvieren

1. Klicken Sie auf **"Meine Schulungen"**
2. Wählen Sie einen Kurs
3. Folgen Sie dem Lern-Flow (siehe Mitarbeiter-Handbuch)
4. Nach Abschluss: Zertifikat herunterladen

### Tipps

- **Passwörter**: Teilen Sie diese per Telefon mit, nicht per E-Mail
- **Personalnummer**: Hilft bei Namensgleichheit
- **CSV-Format**: Achten Sie auf korrekte Spalten-Namen
- **Doppelrolle**: Sie können selbst lernen UND Ihre Mitarbeiter verwalten

---

## Mitarbeiter-Handbuch

### Anmeldung

Sie erhalten von Ihrem FirmenAdmin:
- **E-Mail**: z.B. max.mueller@acme.de
- **Passwort**: z.B. SecurePass123!

**Login-URL**: https://3000-iy4m5go6oz49picqmrknl-a63212b2.us1.manus.computer/login

### Dashboard

Nach dem Login sehen Sie:
- **Verfügbare Kurse**: Alle Kurse, auf die Sie Zugriff haben
- **Lernfortschritt**: Prozentuale Fortschritt pro Kurs
- **Zertifikate**: Ihre erworbenen Zertifikate

### Lern-Flow

#### Schritt 1: Kurs starten

1. Klicken Sie auf einen Kurs (z.B. "IT Security Awareness")
2. Sie sehen die **Kurs-Übersicht** mit:
   - Kursbeschreibung
   - Lernfortschritt (%)
   - 12 Themen

#### Schritt 2: Thema öffnen

1. Klicken Sie auf ein Thema (z.B. "Sichere Passwörter")
2. Die **erste Frage** wird angezeigt mit:
   - Frage-Text
   - 4 Antwortmöglichkeiten (A, B, C, D)
   - Progress-Bar (Frage 1 von 4)

#### Schritt 3: Antwort wählen

1. Klicken Sie auf eine Antwort
2. **Sofortiges Feedback**:
   - ✅ **Richtig**: Grüner Haken + Erklärung
   - ❌ **Falsch**: Rotes Kreuz + Anzeige der richtigen Antwort + Erklärung

#### Schritt 4: Nächste Frage

1. Der **"Nächste Frage"** Button wird aktiv
2. Klicken Sie darauf
3. Sie sehen die nächste Frage (2 von 4)
4. Wiederholen Sie Schritte 3-4 für alle 4 Fragen

#### Schritt 5: Thema abschließen

1. Nach der 4. Frage: **"Thema abgeschlossen"** Meldung
2. Sie sehen:
   - Grüner Haken
   - Anzahl richtig beantworteter Fragen
   - Optionen: "Zurück zur Übersicht" oder "Nächstes Thema"

#### Schritt 6: Alle 12 Themen

1. Wiederholen Sie Schritte 1-5 für alle 12 Themen
2. Nach dem letzten Thema: **Kurs zu 100% abgeschlossen**

### Zertifikate

#### Für Certification-Kurse

1. Nach Abschluss aller 12 Themen: **"Jahresprüfung"** Button
2. Klicken Sie darauf
3. Sie haben 15 Minuten Zeit für 20 Fragen
4. Bestehensgrenze: 80%
5. **Nach bestandener Prüfung**: Automatisches Zertifikat
6. Klicken Sie auf **"Zertifikat herunterladen"** (PDF)

#### Zertifikat-Details

- **Gültigkeit**: 1 Jahr
- **Ausstellung**: Automatisch nach bestandener Prüfung
- **Format**: PDF mit QR-Code
- **Download**: Jederzeit möglich

### Tipps

- **Konzentration**: Beantworten Sie jede Frage sorgfältig - Sie können nicht zurückgehen
- **Erklärungen lesen**: Nach jeder Antwort gibt es eine Erklärung - lesen Sie diese!
- **Fortschritt speichern**: Ihr Fortschritt wird automatisch gespeichert
- **Zertifikate**: Laden Sie Ihre Zertifikate herunter und speichern Sie diese

---

## FAQ

### Allgemein

**F: Wie lange sind Zertifikate gültig?**
A: Zertifikate sind 1 Jahr gültig. Das Ablaufdatum wird im PDF angezeigt.

**F: Kann ich einen Kurs wiederholen?**
A: Ja, Sie können jeden Kurs beliebig oft wiederholen. Der Fortschritt wird aktualisiert.

**F: Was ist der Unterschied zwischen Learning und Sensitization?**
A: Learning ist optional ohne Bewertung. Sensitization ist eine Compliance-Schulung mit Mini-Quiz (mindestens 3 von 4 richtig).

### Passwörter

**F: Mein Passwort funktioniert nicht. Was kann ich tun?**
A: Kontaktieren Sie Ihren FirmenAdmin (oder SysAdmin). Passwörter können nicht selbst zurückgesetzt werden.

**F: Welche Anforderungen hat ein Passwort?**
A: Mindestens 8 Zeichen, Großbuchstaben, Kleinbuchstaben, mindestens 1 Zahl. Beispiel: `SecurePass123!`

### Kurse & Lernmaterial

**F: Kann ich eine Frage überspringen?**
A: Nein, Sie müssen jede Frage beantworten, bevor Sie zur nächsten gehen.

**F: Was passiert, wenn ich eine Frage falsch beantworte?**
A: Sie sehen sofort die richtige Antwort und eine Erklärung. Der Fortschritt wird trotzdem gespeichert.

**F: Wie lange dauert ein Kurs?**
A: Das hängt vom Kurs ab. 12 Themen × 4 Fragen dauern ca. 30-60 Minuten.

### Zertifikate

**F: Wann erhalte ich ein Zertifikat?**
A: Nur bei Certification-Kursen nach bestandener Jahresprüfung (80%).

**F: Kann ich ein Zertifikat erneut herunterladen?**
A: Ja, Sie können es jederzeit unter "Zertifikate" herunterladen.

**F: Kann ich ein abgelaufenes Zertifikat erneuern?**
A: Ja, indem Sie den Kurs erneut absolvieren und die Prüfung bestehen.

### Technische Probleme

**F: Der Kurs lädt nicht.**
A: Versuchen Sie die Seite zu aktualisieren (F5). Überprüfen Sie Ihre Internetverbindung.

**F: Ich bin plötzlich abgemeldet.**
A: Sessions verfallen nach 7 Tagen. Melden Sie sich erneut an.

**F: Mein Fortschritt wurde nicht gespeichert.**
A: Der Fortschritt wird automatisch nach jeder Frage gespeichert. Aktualisieren Sie die Seite.

---

## Support

Bei Fragen oder Problemen:
1. Kontaktieren Sie Ihren **FirmenAdmin** (für Mitarbeiter)
2. Kontaktieren Sie den **SysAdmin** (für FirmenAdmins)
3. Lesen Sie diese Dokumentation erneut

**Wichtig**: Alle Passwörter werden per **Telefon** mitgeteilt, nicht per E-Mail!
