#!/bin/bash
# LearningFlow - Automated Update Script
# Version: 1.1.0
# Last Updated: 2026-03-02

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/learningflow"
BACKUP_DIR="$HOME/learningflow-backups"
mkdir -p $BACKUP_DIR
LOG_FILE="$BACKUP_DIR/update-$(date +%Y%m%d_%H%M%S).log"

# Sicheres Lesen der DATABASE_URL aus .env (kein 'source' - verhindert Bash-Fehler bei Sonderzeichen)
DATABASE_URL=$(grep -m1 '^DATABASE_URL=' "$APP_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")

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
if [ -n "$DATABASE_URL" ]; then
  # Extrahiere DB-Verbindungsdaten aus der URL mit Node.js (robuster als sed bei Sonderzeichen)
  DB_INFO=$(DATABASE_URL="$DATABASE_URL" node -e "
    try {
      const u = new URL(process.env.DATABASE_URL);
      const sep = '\x1F'; // ASCII Unit Separator - safe delimiter
      process.stdout.write(u.hostname + sep + (u.port||'3306') + sep + u.username + sep + decodeURIComponent(u.password) + sep + u.pathname.replace('/','').split('?')[0] + '\n');
    } catch(e) { process.exit(1); }
  " 2>/dev/null || echo "")

  if [ -n "$DB_INFO" ]; then
    IFS=$'\x1F' read -r DB_HOST DB_PORT DB_USER DB_PASS DB_NAME <<< "$DB_INFO"

    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
      --ssl-mode=REQUIRED \
      --no-tablespaces \
      --set-gtid-purged=OFF \
      "$DB_NAME" > $BACKUP_DIR/db-$TIMESTAMP.sql 2>>$LOG_FILE && \
      DB_BACKUP_SIZE=$(du -h $BACKUP_DIR/db-$TIMESTAMP.sql | cut -f1) && \
      log "✓ Database backup created: db-$TIMESTAMP.sql ($DB_BACKUP_SIZE)" || \
      warning "Database backup failed - continuing without DB backup"
  else
    warning "Could not parse DATABASE_URL - skipping DB backup"
  fi
else
  warning "DATABASE_URL not found in .env - skipping DB backup"
fi

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
pnpm db:push 2>>$LOG_FILE
log "✓ Database schema up to date"

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
PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="learningflow") | .pm2_env.status' 2>/dev/null || echo "unknown")

if [ "$PM2_STATUS" != "online" ]; then
  error "Server is not running! Status: $PM2_STATUS"
  error "Check logs with: pm2 logs learningflow"
  error "Rollback recommended!"
  exit 1
fi

log "✓ Server status: $PM2_STATUS"

# Health check
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")

if [ "$HEALTH_CHECK" == "200" ]; then
  log "✓ Health check passed"
else
  warning "Health check returned HTTP $HEALTH_CHECK (may be normal if /api/health not implemented)"
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
log "1. Login at your domain"
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

exit 0
