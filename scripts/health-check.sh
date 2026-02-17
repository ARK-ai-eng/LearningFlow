#!/bin/bash
# LearningFlow - Health Check Script
# Version: 1.0.0
# Last Updated: 2026-02-17
#
# This script checks if LearningFlow is running correctly
# Can be used as a cron job for monitoring

# Configuration
HEALTH_URL="http://localhost:3000/api/health"
APP_NAME="learningflow"
LOG_FILE="/var/log/learningflow-health.log"
ALERT_EMAIL="admin@example.com"  # Change this!

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

send_alert() {
  local subject="$1"
  local message="$2"
  
  # Send email alert (requires mail/sendmail configured)
  if command -v mail &> /dev/null; then
    echo "$message" | mail -s "$subject" $ALERT_EMAIL
  fi
  
  # Log alert
  log "ALERT SENT: $subject"
}

# 1. Check if PM2 process is running
PM2_STATUS=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" || echo "not_found")

if [ "$PM2_STATUS" == "not_found" ]; then
  log "❌ PM2 process not found!"
  send_alert "LearningFlow Down" "PM2 process '$APP_NAME' not found. Server may have crashed."
  exit 1
elif [ "$PM2_STATUS" != "online" ]; then
  log "❌ PM2 process status: $PM2_STATUS"
  send_alert "LearningFlow Unhealthy" "PM2 process status: $PM2_STATUS"
  
  # Auto-restart
  log "Attempting auto-restart..."
  pm2 restart $APP_NAME
  sleep 5
  
  # Check again
  NEW_STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status")
  if [ "$NEW_STATUS" == "online" ]; then
    log "✓ Auto-restart successful"
    send_alert "LearningFlow Recovered" "Server was restarted automatically and is now online."
  else
    log "❌ Auto-restart failed"
    send_alert "LearningFlow Critical" "Auto-restart failed. Manual intervention required!"
    exit 1
  fi
fi

# 2. Check HTTP health endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL || echo "000")

if [ "$HTTP_CODE" != "200" ]; then
  log "❌ Health check failed! HTTP $HTTP_CODE"
  send_alert "LearningFlow Health Check Failed" "Health endpoint returned HTTP $HTTP_CODE instead of 200."
  
  # Auto-restart
  log "Attempting auto-restart..."
  pm2 restart $APP_NAME
  sleep 5
  
  # Check again
  NEW_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL || echo "000")
  if [ "$NEW_HTTP_CODE" == "200" ]; then
    log "✓ Auto-restart successful"
    send_alert "LearningFlow Recovered" "Health check passed after restart."
  else
    log "❌ Auto-restart failed"
    send_alert "LearningFlow Critical" "Health check still failing after restart. HTTP $NEW_HTTP_CODE"
    exit 1
  fi
fi

# 3. Check database connectivity
DB_CHECK=$(curl -s $HEALTH_URL | jq -r '.database' || echo "unknown")

if [ "$DB_CHECK" != "connected" ] && [ "$DB_CHECK" != "ok" ]; then
  log "⚠️  Database status: $DB_CHECK"
  send_alert "LearningFlow Database Issue" "Database health check returned: $DB_CHECK"
fi

# 4. Check memory usage
MEMORY_USAGE=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.memory" || echo "0")
MEMORY_MB=$((MEMORY_USAGE / 1024 / 1024))

if [ $MEMORY_MB -gt 1024 ]; then
  log "⚠️  High memory usage: ${MEMORY_MB}MB"
  send_alert "LearningFlow High Memory" "Memory usage is ${MEMORY_MB}MB. Consider restarting."
fi

# 5. Check CPU usage
CPU_USAGE=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.cpu" || echo "0")

if [ $CPU_USAGE -gt 80 ]; then
  log "⚠️  High CPU usage: ${CPU_USAGE}%"
  send_alert "LearningFlow High CPU" "CPU usage is ${CPU_USAGE}%. Possible performance issue."
fi

# 6. Check restart count
RESTART_COUNT=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.restart_time" || echo "0")

if [ $RESTART_COUNT -gt 10 ]; then
  log "⚠️  High restart count: $RESTART_COUNT"
  send_alert "LearningFlow Unstable" "Server has restarted $RESTART_COUNT times. Check logs for errors."
fi

# All checks passed
log "✓ All health checks passed (HTTP: $HTTP_CODE, DB: $DB_CHECK, Mem: ${MEMORY_MB}MB, CPU: ${CPU_USAGE}%)"

exit 0
