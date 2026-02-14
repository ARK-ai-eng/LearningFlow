# ADR-016: Datenbank-Migrations-Vorfall und Prozess-Änderungen

**Status:** Accepted  
**Datum:** 14.02.2026  
**Kontext:** Kritischer Datenverlust durch unsichere Migrations-Methode  
**Entscheidung:** Verbot von automatischen Migrations-Tools, Einführung manueller SQL-Migrations

---

## Kontext

Am 14.02.2026 um ca. 23:00 Uhr kam es zu einem kritischen Vorfall:

### Was sollte passieren
- Schema-Erweiterung: `lastCompletedAt` Feld zu `question_progress` Tabelle hinzufügen
- Methode: `pnpm db:push` (Drizzle Kit)
- Erwartung: Nur Schema ändern, Daten behalten

### Was tatsächlich passierte
- **Alle User-Daten gelöscht** (38 User → 0)
- **Alle Progress-Daten gelöscht** (131 Einträge → 0)
- **Alle anderen Tabellen betroffen**
- Drizzle Kit fragte "Truncate table?" → "Nein" gewählt → **Daten trotzdem gelöscht**

### Warum es passierte
1. **Drizzle Kit Bug/Feature:** "Nein" bei Truncate-Frage schützt NICHT vor Datenverlust
2. **Kein Backup:** Keine Backup-Strategie implementiert
3. **Falsche Annahme:** Git-Rollback würde Daten wiederherstellen (tut es nicht!)
4. **Produktions-Datenbank:** Migrations-Tool auf Prod-DB verwendet

### Wiederherstellung
- Manuelle SQL-Inserts mit bcrypt-Hashes
- 3 User wiederhergestellt (SysAdmin, FirmenAdmin, User)
- **Alle anderen Daten verloren** (kein Backup vorhanden)

---

## Entscheidung

### Ab sofort VERBOTEN:
1. ❌ `pnpm db:push` auf Produktion
2. ❌ `drizzle-kit push` ohne Backup
3. ❌ Automatische Migrations-Tools mit echten Daten
4. ❌ Schema-Änderungen ohne Backup

### Ab sofort PFLICHT:
1. ✅ **Backup VOR jeder Migration** (SQL-Dump oder TiDB Cloud)
2. ✅ **Manuelle SQL-Migrations** (ALTER TABLE, CREATE TABLE)
3. ✅ **Migrations-Checkliste** (siehe CRITICAL-DATABASE-MIGRATION-RULES.md)
4. ✅ **Daten-Verifizierung** (Count vorher/nachher)

### Neuer Migrations-Prozess:
```bash
# 1. BACKUP (IMMER!)
mysqldump -h $HOST -u $USER -p$PASS $DB > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. SQL-Statement schreiben
ALTER TABLE xyz ADD COLUMN abc TIMESTAMP NULL;

# 3. Ausführen (über webdev_execute_sql oder mysql CLI)
mysql -h $HOST -u $USER -p$PASS $DB -e "ALTER TABLE xyz ADD COLUMN abc TIMESTAMP NULL;"

# 4. Verifizieren
mysql -h $HOST -u $USER -p$PASS $DB -e "SELECT COUNT(*) FROM users;"
```

---

## Konsequenzen

### Positiv
- ✅ Klare Regeln für Datenbank-Migrations
- ✅ Backup-Strategie wird implementiert
- ✅ Risiko von Datenverlust minimiert
- ✅ Dokumentation für zukünftige Entwickler

### Negativ
- ❌ Manuelle Migrations sind langsamer
- ❌ Mehr Aufwand pro Schema-Änderung
- ❌ Kein automatisches Schema-Sync mehr

### Neutral
- 🔄 Drizzle ORM weiterhin für Queries verwenden (nur nicht für Migrations)
- 🔄 Schema-Definitionen bleiben in `drizzle/schema.ts`
- 🔄 SQL-Statements werden manuell geschrieben

---

## Alternativen

### Alternative 1: Drizzle Migrations (drizzle-kit generate)
- **Vorteil:** Automatische SQL-Generierung
- **Nachteil:** Immer noch Risiko bei `drizzle-kit migrate`
- **Entscheidung:** ABGELEHNT (zu riskant)

### Alternative 2: Prisma Migrate
- **Vorteil:** Besseres Migrations-Management
- **Nachteil:** Kompletter ORM-Wechsel notwendig
- **Entscheidung:** ABGELEHNT (zu großer Aufwand)

### Alternative 3: Manuelle SQL + Drizzle Schema
- **Vorteil:** Volle Kontrolle, kein Datenverlust-Risiko
- **Nachteil:** Mehr manueller Aufwand
- **Entscheidung:** ✅ AKZEPTIERT (beste Balance)

---

## Implementierung

### Sofort-Maßnahmen (14.02.2026)
- [x] User wiederhergestellt (3 User)
- [x] Dokumentation erstellt (CRITICAL-DATABASE-MIGRATION-RULES.md)
- [x] ADR geschrieben (dieses Dokument)

### Kurzfristig (diese Woche)
- [ ] Automatisches Backup-Script einrichten (täglich)
- [ ] Staging-Datenbank aufsetzen
- [ ] Migrations-Log-Template erstellen

### Mittelfristig (nächsten 2 Wochen)
- [ ] Monitoring für Daten-Counts einrichten
- [ ] Backup-Restore-Prozess testen
- [ ] Team-Schulung zu neuen Prozessen

---

## Lessons Learned

### Technisch
1. **Drizzle Kit ist NICHT production-ready** für Migrations
2. **Git speichert KEINE Datenbank-Daten**
3. **"Nein" bei Truncate ≠ Daten sicher**
4. **Backup ist PFLICHT, nicht optional**

### Prozess
1. **Nie ohne Backup arbeiten**
2. **Immer Daten-Count vor/nach Migration prüfen**
3. **Bei Unsicherheit: Staging-Environment nutzen**
4. **Dokumentation ist kritisch**

### Kommunikation
1. **Transparent mit User kommunizieren**
2. **Fehler schnell eingestehen**
3. **Wiederherstellung priorisieren**
4. **Lessons Learned dokumentieren**

---

## Referenzen

- [CRITICAL-DATABASE-MIGRATION-RULES.md](../CRITICAL-DATABASE-MIGRATION-RULES.md)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [MySQL ALTER TABLE Syntax](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)

---

**Autor:** Manus AI Agent  
**Reviewer:** Arton Ritter  
**Status:** Accepted  
**Letzte Änderung:** 14.02.2026 23:10 Uhr
