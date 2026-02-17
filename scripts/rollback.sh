#!/bin/bash
# LearningFlow - Rollback Script
# Version: 1.0.0
# Last Updated: 2026-02-17

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/learningflow"
BACKUP_DIR="$HOME/learningflow-backups"

# Functions
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Start
echo ""
log "=== LearningFlow Rollback Script ==="
echo ""

# 1. List available backups
log "Available backups:"
echo ""
ls -lht $BACKUP_DIR/ | head -20
echo ""

# 2. Ask for backup timestamp
read -p "Enter backup timestamp (format: YYYYMMDD_HHMMSS): " TIMESTAMP

if [ -z "$TIMESTAMP" ]; then
  error "No timestamp provided!"
  exit 1
fi

CODE_BACKUP="$BACKUP_DIR/code-$TIMESTAMP.tar.gz"
DB_BACKUP="$BACKUP_DIR/db-$TIMESTAMP.sql"

# 3. Verify backups exist
log "Verifying backups..."

if [ ! -f "$CODE_BACKUP" ]; then
  error "Code backup not found: $CODE_BACKUP"
  exit 1
fi

if [ ! -f "$DB_BACKUP" ]; then
  error "Database backup not found: $DB_BACKUP"
  exit 1
fi

log "✓ Code backup found: $CODE_BACKUP ($(du -h $CODE_BACKUP | cut -f1))"
log "✓ Database backup found: $DB_BACKUP ($(du -h $DB_BACKUP | cut -f1))"

# 4. Confirm rollback
echo ""
warning "This will:"
warning "1. Stop the server"
warning "2. Delete all current code"
warning "3. Restore code from backup"
warning "4. Restore database from backup"
warning "5. Restart the server"
echo ""
read -p "Are you sure you want to rollback? (type 'yes' to continue): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  log "Rollback cancelled"
  exit 0
fi

# 5. Stop server
log "Stopping server..."
pm2 stop learningflow || true
log "✓ Server stopped"

# 6. Restore code
log "Restoring code..."
cd $APP_DIR

# Backup current state (just in case)
EMERGENCY_BACKUP="$BACKUP_DIR/emergency-before-rollback-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf $EMERGENCY_BACKUP \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  .
log "✓ Emergency backup created: $EMERGENCY_BACKUP"

# Remove current code (except .env and .git)
find . -maxdepth 1 ! -name '.' ! -name '..' ! -name '.env' ! -name '.git' -exec rm -rf {} +

# Extract backup
tar -xzf $CODE_BACKUP
log "✓ Code restored from backup"

# 7. Restore database
log "Restoring database..."

# Load database credentials from .env
source $APP_DIR/.env

DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Drop and recreate database (clean slate)
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS -e "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME;"

# Restore from backup
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < $DB_BACKUP
log "✓ Database restored from backup"

# 8. Install dependencies
log "Installing dependencies..."
pnpm install
log "✓ Dependencies installed"

# 9. Build
log "Building application..."
pnpm build
log "✓ Build complete"

# 10. Start server
log "Starting server..."
pm2 start learningflow
sleep 3
log "✓ Server started"

# 11. Verification
log "Verifying rollback..."

# Check PM2 status
PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="learningflow") | .pm2_env.status')

if [ "$PM2_STATUS" != "online" ]; then
  error "Server is not running! Status: $PM2_STATUS"
  error "Check logs with: pm2 logs learningflow"
  exit 1
fi

log "✓ Server status: $PM2_STATUS"

# Health check
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")

if [ "$HEALTH_CHECK" == "200" ]; then
  log "✓ Health check passed"
else
  warning "Health check failed! HTTP $HEALTH_CHECK"
  warning "Please verify manually"
fi

# Show logs
log "Recent server logs:"
pm2 logs learningflow --lines 20 --nostream

# Final summary
echo ""
log "=== Rollback completed! ==="
log "Restored from backup: $TIMESTAMP"
log "Emergency backup created: $EMERGENCY_BACKUP"
echo ""
log "Please verify the following:"
log "1. Login works"
log "2. Dashboard shows courses"
log "3. All functionality restored"
echo ""

exit 0
