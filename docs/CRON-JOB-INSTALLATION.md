# Cron-Job Installation - Data Integrity Check

**Zweck:** Automatische wöchentliche Prüfung der Datenintegrität jeden Montag um 3 Uhr morgens.

**Status:** ✅ Script erstellt und getestet, bereit für Installation auf Produktions-Server

---

## Voraussetzungen

- Linux-Server mit Cron installiert
- Projekt deployed auf Server
- Node.js 18+ installiert
- Schreibrechte für `/var/log/aismarterflow/`

---

## Installation (Produktions-Server)

### Schritt 1: Log-Verzeichnis erstellen

```bash
sudo mkdir -p /var/log/aismarterflow
sudo chown $USER:$USER /var/log/aismarterflow
```

### Schritt 2: Script-Pfad anpassen (falls nötig)

Öffne `scripts/cron-integrity-check.sh` und passe `PROJECT_DIR` an:

```bash
# Zeile 20:
PROJECT_DIR="/pfad/zu/deinem/projekt"
```

### Schritt 3: Cron-Job installieren

```bash
# Öffne Crontab-Editor
crontab -e

# Füge folgende Zeile hinzu (jeden Montag um 3 Uhr):
0 3 * * 1 /pfad/zu/projekt/scripts/cron-integrity-check.sh

# Speichern und schließen (Ctrl+X, dann Y, dann Enter)
```

### Schritt 4: Cron-Job verifizieren

```bash
# Liste alle Cron-Jobs auf
crontab -l

# Erwartete Ausgabe:
# 0 3 * * 1 /pfad/zu/projekt/scripts/cron-integrity-check.sh
```

### Schritt 5: Manueller Test

```bash
# Führe Script manuell aus
/pfad/zu/projekt/scripts/cron-integrity-check.sh

# Prüfe Log
cat /var/log/aismarterflow/integrity-check.log
```

---

## Alternative: Systemd Timer (empfohlen für moderne Linux-Systeme)

### Schritt 1: Service-Unit erstellen

```bash
sudo nano /etc/systemd/system/integrity-check.service
```

Inhalt:

```ini
[Unit]
Description=Data Integrity Check for AISmarterFlow Academy
After=network.target

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/home/ubuntu/aismarterflow-academy
ExecStart=/home/ubuntu/aismarterflow-academy/scripts/cron-integrity-check.sh
StandardOutput=append:/var/log/aismarterflow/integrity-check.log
StandardError=append:/var/log/aismarterflow/integrity-check-error.log

[Install]
WantedBy=multi-user.target
```

### Schritt 2: Timer-Unit erstellen

```bash
sudo nano /etc/systemd/system/integrity-check.timer
```

Inhalt:

```ini
[Unit]
Description=Weekly Data Integrity Check Timer
Requires=integrity-check.service

[Timer]
# Jeden Montag um 3 Uhr
OnCalendar=Mon *-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

### Schritt 3: Timer aktivieren

```bash
# Reload systemd
sudo systemctl daemon-reload

# Aktiviere Timer
sudo systemctl enable integrity-check.timer

# Starte Timer
sudo systemctl start integrity-check.timer

# Prüfe Status
sudo systemctl status integrity-check.timer
```

### Schritt 4: Manueller Test

```bash
# Führe Service manuell aus
sudo systemctl start integrity-check.service

# Prüfe Status
sudo systemctl status integrity-check.service

# Prüfe Log
cat /var/log/aismarterflow/integrity-check.log
```

---

## Monitoring

### Log-Dateien

```bash
# Haupt-Log (alle Ausführungen)
tail -f /var/log/aismarterflow/integrity-check.log

# Error-Log (nur Fehler)
tail -f /var/log/aismarterflow/integrity-check-error.log
```

### Cron-Job Status prüfen

```bash
# Letzte Ausführung (Cron)
grep "Data Integrity Check" /var/log/syslog | tail -5

# Letzte Ausführung (Systemd)
sudo journalctl -u integrity-check.service -n 50
```

### Email-Benachrichtigungen

Das Script sendet automatisch Benachrichtigungen an den Owner wenn:
- ✅ Mehr als 5 Inkonsistenzen gefunden wurden
- ❌ Script mit Fehler abbricht

**Hinweis:** Benachrichtigungen verwenden `notifyOwner()` aus dem Projekt.

---

## Deinstallation

### Cron-Job entfernen

```bash
# Öffne Crontab
crontab -e

# Lösche Zeile mit "cron-integrity-check.sh"
# Speichern und schließen
```

### Systemd Timer entfernen

```bash
# Stoppe Timer
sudo systemctl stop integrity-check.timer

# Deaktiviere Timer
sudo systemctl disable integrity-check.timer

# Entferne Units
sudo rm /etc/systemd/system/integrity-check.service
sudo rm /etc/systemd/system/integrity-check.timer

# Reload systemd
sudo systemctl daemon-reload
```

---

## Troubleshooting

### Problem: Script läuft nicht

**Prüfe:**
1. Ist Script ausführbar? `chmod +x scripts/cron-integrity-check.sh`
2. Existiert Projekt-Verzeichnis? `ls -la /pfad/zu/projekt`
3. Ist Node.js installiert? `node --version`

### Problem: Keine Logs

**Prüfe:**
1. Existiert Log-Verzeichnis? `ls -la /var/log/aismarterflow`
2. Hat User Schreibrechte? `touch /var/log/aismarterflow/test.log`

### Problem: Script schlägt fehl

**Prüfe:**
1. Datenbank-Verbindung: `mysql -u user -p -h host database`
2. Node-Modules installiert: `cd /pfad/zu/projekt && pnpm install`
3. Error-Log: `cat /var/log/aismarterflow/integrity-check-error.log`

---

## Best Practices

### Log-Rotation

Logs werden automatisch rotiert wenn sie 10MB überschreiten. Du kannst auch `logrotate` verwenden:

```bash
sudo nano /etc/logrotate.d/aismarterflow
```

Inhalt:

```
/var/log/aismarterflow/*.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
}
```

### Monitoring mit Healthchecks.io (optional)

Füge am Ende von `cron-integrity-check.sh` hinzu:

```bash
# Ping Healthchecks.io bei Erfolg
if [ $EXIT_CODE -eq 0 ]; then
  curl -fsS -m 10 --retry 5 https://hc-ping.com/your-uuid-here
fi
```

---

## Zeitplan-Optionen

### Andere Zeitpläne

```bash
# Täglich um 3 Uhr
0 3 * * * /pfad/zu/script.sh

# Jeden Sonntag um 2 Uhr
0 2 * * 0 /pfad/zu/script.sh

# Jeden 1. des Monats um 4 Uhr
0 4 1 * * /pfad/zu/script.sh

# Alle 6 Stunden
0 */6 * * * /pfad/zu/script.sh
```

---

## Support

Bei Fragen oder Problemen:

1. **Dokumentation lesen:** `docs/DATA-INTEGRITY-CHECK.md`
2. **Logs prüfen:** `/var/log/aismarterflow/`
3. **Issue melden:** GitHub Issue mit Details

---

**Letzte Aktualisierung:** 15. Februar 2026  
**Version:** 1.0
