#!/bin/bash
# LearningFlow - Automated Update Script
# Version: 1.0.0
# Last Updated: 2026-02-17

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/learningflow"
BACKUP_DIR="$HOME/learningflow-backups"
LOG_FILE="$BACKUP_DIR/update-$(date +%Y%m%d_%H%M%S).log"

# Database credentials (from .env)
source $APP_DIR/.env

# Functions
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Start
log "=== LearningFlow Update Script ==="
log "Log file: $LOG_FILE"

# 1. Pre-flight checks
log "[1/9] Pre-flight checks..."

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then 
  error "Do not run this script as root!"
  exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
  error "Git is not installed!"
  exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  error "pnpm is not installed!"
  exit 1
fi

# Check if pm2 is installed
if ! command -v pm2 &> /dev/null; then
  error "pm2 is not installed!"
  exit 1
fi

log "✓ All dependencies installed"

# 2. Create backup directory
log "[2/9] Preparing backup directory..."
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
log "✓ Backup directory ready: $BACKUP_DIR"

# 3. Backup current code
log "[3/9] Creating code backup..."
cd $APP_DIR
tar -czf $BACKUP_DIR/code-$TIMESTAMP.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='*.log' \
  .
CODE_BACKUP_SIZE=$(du -h $BACKUP_DIR/code-$TIMESTAMP.tar.gz | cut -f1)
log "✓ Code backup created: code-$TIMESTAMP.tar.gz ($CODE_BACKUP_SIZE)"

# 4. Backup database
log "[4/9] Creating database backup..."
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db-$TIMESTAMP.sql 2>>$LOG_FILE
DB_BACKUP_SIZE=$(du -h $BACKUP_DIR/db-$TIMESTAMP.sql | cut -f1)
log "✓ Database backup created: db-$TIMESTAMP.sql ($DB_BACKUP_SIZE)"

# 5. Record current version
log "[5/9] Recording current version..."
CURRENT_VERSION=$(git rev-parse --short HEAD)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "Current version: $CURRENT_VERSION (branch: $CURRENT_BRANCH)"

# 6. Pull latest code
log "[6/9] Pulling latest code from GitHub..."
git fetch origin $CURRENT_BRANCH
NEW_VERSION=$(git rev-parse --short origin/$CURRENT_BRANCH)

if [ "$CURRENT_VERSION" == "$NEW_VERSION" ]; then
  log "Already up to date! No update needed."
  log "Current version: $CURRENT_VERSION"
  exit 0
fi

log "Update available: $CURRENT_VERSION → $NEW_VERSION"
git pull origin $CURRENT_BRANCH 2>>$LOG_FILE
log "✓ Code updated successfully"

# Show what changed
log "Changes in this update:"
git log --oneline $CURRENT_VERSION..$NEW_VERSION | tee -a $LOG_FILE

# 7. Update dependencies and check for schema changes
log "[7/9] Updating dependencies..."
pnpm install 2>>$LOG_FILE
log "✓ Dependencies updated"

log "Checking for database schema changes..."
pnpm drizzle-kit generate 2>>$LOG_FILE

# Check if new migrations exist
NEW_MIGRATIONS=$(find drizzle/migrations -name '*.sql' -newer $BACKUP_DIR/code-$TIMESTAMP.tar.gz 2>/dev/null || true)

if [ -n "$NEW_MIGRATIONS" ]; then
  warning "NEW DATABASE MIGRATIONS DETECTED!"
  echo ""
  echo "New migration files:"
  echo "$NEW_MIGRATIONS"
  echo ""
  
  # Show migration content
  for migration in $NEW_MIGRATIONS; do
    echo "=== Content of $migration ==="
    cat $migration
    echo ""
  done
  
  # Check for dangerous statements
  DANGEROUS=$(grep -iE "(DROP TABLE|TRUNCATE|DELETE FROM.*WHERE 1=1)" $NEW_MIGRATIONS || true)
  
  if [ -n "$DANGEROUS" ]; then
    error "DANGEROUS SQL STATEMENTS DETECTED!"
    echo "$DANGEROUS"
    echo ""
    error "Please review migrations manually before proceeding!"
    echo ""
    read -p "Do you want to continue anyway? (type 'yes' to continue): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
      error "Update aborted by user"
      log "Rolling back to $CURRENT_VERSION..."
      git reset --hard $CURRENT_VERSION
      pnpm install
      error "Rollback complete. System is back to version $CURRENT_VERSION"
      exit 1
    fi
  else
    log "No dangerous SQL statements detected"
    echo ""
    read -p "Execute database migration? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
      error "Update aborted by user"
      log "Rolling back to $CURRENT_VERSION..."
      git reset --hard $CURRENT_VERSION
      pnpm install
      error "Rollback complete. System is back to version $CURRENT_VERSION"
      exit 1
    fi
  fi
  
  log "Executing database migration..."
  pnpm db:push 2>>$LOG_FILE
  log "✓ Database migration completed"
else
  log "✓ No schema changes detected"
fi

# 8. Build application
log "[8/9] Building application..."
pnpm build 2>>$LOG_FILE
log "✓ Build successful"

# 9. Restart server
log "[9/9] Restarting server..."
pm2 restart learningflow 2>>$LOG_FILE
sleep 3
log "✓ Server restarted"

# Verification
log "Verifying deployment..."
sleep 2

# Check PM2 status
PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="learningflow") | .pm2_env.status')

if [ "$PM2_STATUS" != "online" ]; then
  error "Server is not running! Status: $PM2_STATUS"
  error "Check logs with: pm2 logs learningflow"
  error "Rollback recommended!"
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

# Final summary
log ""
log "=== Update completed successfully! ==="
log "Old version: $CURRENT_VERSION"
log "New version: $NEW_VERSION"
log "Backup location: $BACKUP_DIR/*-$TIMESTAMP.*"
log "Log file: $LOG_FILE"
log ""
log "Please verify the following manually:"
log "1. Login at https://your-domain.com/login"
log "2. Dashboard shows courses correctly"
log "3. Course start works"
log "4. Quiz/Exam functionality"
log "5. Certificate generation"
log ""
log "If anything is broken, rollback with:"
log "  cd $APP_DIR"
log "  git reset --hard $CURRENT_VERSION"
log "  pnpm install && pnpm build"
log "  pm2 restart learningflow"
log ""

# Send notification (optional - uncomment if you have mail configured)
# echo "LearningFlow updated: $CURRENT_VERSION → $NEW_VERSION" | mail -s "LearningFlow Update Success" admin@example.com

exit 0
