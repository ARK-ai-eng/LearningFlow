#!/bin/bash

###############################################################################
# Cron-Job Wrapper für Data-Integrity-Check
#
# Führt wöchentlich (jeden Montag um 3 Uhr) das Data-Integrity-Check Script aus
# mit automatischem Logging, Error-Handling und Email-Benachrichtigung.
#
# Installation:
#   sudo cp scripts/cron-integrity-check.sh /usr/local/bin/
#   sudo chmod +x /usr/local/bin/cron-integrity-check.sh
#   sudo crontab -e
#   # Füge hinzu: 0 3 * * 1 /usr/local/bin/cron-integrity-check.sh
#
# Manueller Test:
#   /usr/local/bin/cron-integrity-check.sh
###############################################################################

# Konfiguration
PROJECT_DIR="/home/ubuntu/aismarterflow-academy"
LOG_DIR="/var/log/aismarterflow"
LOG_FILE="$LOG_DIR/integrity-check.log"
ERROR_LOG="$LOG_DIR/integrity-check-error.log"
MAX_LOG_SIZE=10485760  # 10MB

# Erstelle Log-Verzeichnis falls nicht vorhanden
mkdir -p "$LOG_DIR"

# Funktion: Log-Rotation (wenn > 10MB)
rotate_logs() {
  if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Log rotated (exceeded 10MB)" > "$LOG_FILE"
  fi
}

# Funktion: Logging
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: $1" | tee -a "$LOG_FILE" >> "$ERROR_LOG"
}

# Funktion: Email-Benachrichtigung bei Fehlern (optional)
notify_owner() {
  local title="$1"
  local content="$2"
  
  # Verwende notifyOwner aus dem Projekt
  cd "$PROJECT_DIR" || return
  npx tsx -e "
    import { notifyOwner } from './server/_core/notification';
    notifyOwner({ title: '$title', content: '$content' })
      .then(() => console.log('Notification sent'))
      .catch(err => console.error('Notification failed:', err));
  " 2>&1
}

# Start
log "═══════════════════════════════════════════════════════════"
log "Data Integrity Check - Cron Job Started"
log "═══════════════════════════════════════════════════════════"

# Log-Rotation
rotate_logs

# Prüfe ob Projekt-Verzeichnis existiert
if [ ! -d "$PROJECT_DIR" ]; then
  log_error "Project directory not found: $PROJECT_DIR"
  notify_owner "Integrity Check Failed" "Project directory not found: $PROJECT_DIR"
  exit 1
fi

# Wechsle ins Projekt-Verzeichnis
cd "$PROJECT_DIR" || {
  log_error "Failed to change directory to $PROJECT_DIR"
  exit 1
}

# Prüfe ob Script existiert
if [ ! -f "scripts/check-data-integrity.ts" ]; then
  log_error "Integrity check script not found: scripts/check-data-integrity.ts"
  notify_owner "Integrity Check Failed" "Script not found: scripts/check-data-integrity.ts"
  exit 1
fi

# Führe Integrity-Check aus (mit --fix)
log "Running integrity check with --fix..."
OUTPUT=$(npx tsx scripts/check-data-integrity.ts --fix 2>&1)
EXIT_CODE=$?

# Logge Output
echo "$OUTPUT" >> "$LOG_FILE"

# Prüfe Exit-Code
if [ $EXIT_CODE -eq 0 ]; then
  # Erfolgreich
  INCONSISTENCIES=$(echo "$OUTPUT" | grep "Inconsistencies Found" | grep -oE '[0-9]+' | head -1)
  FIXED=$(echo "$OUTPUT" | grep "Successfully Fixed" | grep -oE '[0-9]+' | head -1)
  
  if [ -n "$INCONSISTENCIES" ] && [ "$INCONSISTENCIES" -gt 0 ]; then
    log "✅ Check completed: $INCONSISTENCIES inconsistencies found, $FIXED fixed"
    
    # Benachrichtige Owner wenn Inkonsistenzen gefunden wurden
    if [ "$INCONSISTENCIES" -gt 5 ]; then
      notify_owner "Data Integrity Issues Fixed" "Found and fixed $INCONSISTENCIES inconsistencies. Check logs for details: $LOG_FILE"
    fi
  else
    log "✅ Check completed: No inconsistencies found"
  fi
else
  # Fehler
  log_error "Integrity check failed with exit code $EXIT_CODE"
  log_error "Last 20 lines of output:"
  echo "$OUTPUT" | tail -20 >> "$ERROR_LOG"
  
  # Benachrichtige Owner
  notify_owner "Data Integrity Check Failed" "Exit code: $EXIT_CODE. Check error log: $ERROR_LOG"
  
  exit $EXIT_CODE
fi

log "═══════════════════════════════════════════════════════════"
log "Data Integrity Check - Cron Job Completed"
log "═══════════════════════════════════════════════════════════"
log ""

exit 0
