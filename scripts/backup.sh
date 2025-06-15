#!/bin/bash
# scripts/backup.sh
# Daily Database Backup Script

# ===========================================
# CONFIGURATION
# ===========================================

# Database configuration
DB_NAME="dxdb"
DB_USER="dxdbadmin"
DB_PASSWORD="123456"
DB_HOST="localhost"
DB_PORT="5432"

# Backup configuration
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="dxdb_backup_${DATE}.sql"
COMPRESSED_FILE="dxdb_backup_${DATE}.sql.gz"

# Retention policy (keep backups for 30 days)
RETENTION_DAYS=30

# Docker container name
CONTAINER_NAME="dxdb-postgres"

# ===========================================
# FUNCTIONS
# ===========================================

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_docker_container() {
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        log_message "ERROR: Docker container $CONTAINER_NAME is not running"
        exit 1
    fi
}

create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_message "Created backup directory: $BACKUP_DIR"
    fi
}

perform_backup() {
    log_message "Starting database backup..."
    
    # Create backup using docker exec
    if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}"; then
        log_message "✅ Database backup created: ${BACKUP_FILE}"
        
        # Compress the backup
        if gzip "${BACKUP_DIR}/${BACKUP_FILE}"; then
            log_message "✅ Backup compressed: ${COMPRESSED_FILE}"
            
            # Get file size
            FILE_SIZE=$(du -h "${BACKUP_DIR}/${COMPRESSED_FILE}" | cut -f1)
            log_message "📊 Backup size: ${FILE_SIZE}"
            
            return 0
        else
            log_message "❌ Failed to compress backup"
            return 1
        fi
    else
        log_message "❌ Database backup failed"
        return 1
    fi
}

cleanup_old_backups() {
    log_message "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Find and delete old backup files
    find "$BACKUP_DIR" -name "dxdb_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    REMAINING_BACKUPS=$(ls -1 "${BACKUP_DIR}"/dxdb_backup_*.sql.gz 2>/dev/null | wc -l)
    log_message "📁 Remaining backups: $REMAINING_BACKUPS files"
}

send_notification() {
    local status="$1"
    local message="$2"
    
    if [ "$status" = "success" ]; then
        log_message "🎉 Backup completed successfully"
    else
        log_message "🚨 Backup failed: $message"
    fi
    
    # Optional: Send notification to Discord/Slack/Email
    # Uncomment and configure as needed
    # send_discord_notification "$status" "$message"
}

send_discord_notification() {
    local status="$1"
    local message="$2"
    local webhook_url="YOUR_DISCORD_WEBHOOK_URL"
    
    if [ -n "$webhook_url" ] && [ "$webhook_url" != "YOUR_DISCORD_WEBHOOK_URL" ]; then
        local color
        if [ "$status" = "success" ]; then
            color="3066993"  # Green
        else
            color="15158332"  # Red
        fi
        
        curl -H "Content-Type: application/json" \
             -X POST \
             -d "{
                 \"embeds\": [{
                     \"title\": \"Database Backup Report\",
                     \"description\": \"$message\",
                     \"color\": $color,
                     \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
                 }]
             }" \
             "$webhook_url"
    fi
}

# ===========================================
# MAIN EXECUTION
# ===========================================

main() {
    log_message "🚀 Starting daily database backup process..."
    
    # Check prerequisites
    check_docker_container
    create_backup_dir
    
    # Perform backup
    if perform_backup; then
        cleanup_old_backups
        send_notification "success" "Database backup completed successfully. File: ${COMPRESSED_FILE}"
        log_message "✅ Backup process completed successfully"
        exit 0
    else
        send_notification "error" "Database backup failed"
        log_message "❌ Backup process failed"
        exit 1
    fi
}

# Run main function
main "$@"