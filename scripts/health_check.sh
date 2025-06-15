#!/bin/bash
# scripts/health_check.sh
# System Health Check and Auto-Recovery Script

# ===========================================
# CONFIGURATION
# ===========================================

LOG_FILE="/logs/health_check.log"
ALERT_FILE="/logs/alerts.log"
DISCORD_WEBHOOK="${DISCORD_WEBHOOK:-}"
EMAIL_RECIPIENT="${EMAIL_RECIPIENT:-}"

# Service configurations
SERVICES=("dxdb-postgres" "dxdb-backend" "dxdb-frontend")
URLS=("http://postgres:5432" "http://backend:3000/health" "http://frontend:5173")

# Thresholds
MAX_RESTART_ATTEMPTS=3
RESTART_COOLDOWN=300  # 5 minutes
MEMORY_THRESHOLD=90   # 90% memory usage
CPU_THRESHOLD=90      # 90% CPU usage

# ===========================================
# UTILITY FUNCTIONS
# ===========================================

log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

send_alert() {
    local level="$1"
    local service="$2" 
    local message="$3"
    
    local alert_msg="🚨 ALERT [$level]: $service - $message"
    echo "$(date '+%Y-%m-%d %H:%M:%S') $alert_msg" >> "$ALERT_FILE"
    
    # Send Discord notification
    if [ -n "$DISCORD_WEBHOOK" ]; then
        send_discord_alert "$level" "$service" "$message"
    fi
    
    # Send email (if configured)
    if [ -n "$EMAIL_RECIPIENT" ]; then
        send_email_alert "$level" "$service" "$message"
    fi
    
    log_message "ALERT" "$alert_msg"
}

send_discord_alert() {
    local level="$1"
    local service="$2"
    local message="$3"
    
    local color
    case "$level" in
        "CRITICAL") color="15158332" ;;  # Red
        "WARNING")  color="16776960" ;;  # Yellow
        "INFO")     color="3066993" ;;   # Green
        *) color="7506394" ;;            # Default
    esac
    
    curl -s -H "Content-Type: application/json" \
         -X POST \
         -d "{
             \"embeds\": [{
                 \"title\": \"🖥️ System Alert - $service\",
                 \"description\": \"$message\",
                 \"color\": $color,
                 \"fields\": [
                     {\"name\": \"Level\", \"value\": \"$level\", \"inline\": true},
                     {\"name\": \"Service\", \"value\": \"$service\", \"inline\": true},
                     {\"name\": \"Time\", \"value\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"inline\": true}
                 ],
                 \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
             }]
         }" \
         "$DISCORD_WEBHOOK" > /dev/null 2>&1
}

send_email_alert() {
    local level="$1"
    local service="$2"
    local message="$3"
    
    if command -v mail >/dev/null 2>&1; then
        echo "Alert: $service - $message" | mail -s "[$level] System Alert - $service" "$EMAIL_RECIPIENT"
    fi
}

# ===========================================
# HEALTH CHECK FUNCTIONS
# ===========================================

check_container_health() {
    local container="$1"
    
    # Check if container is running
    if ! docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        log_message "ERROR" "Container $container is not running"
        return 1
    fi
    
    # Check container health status
    local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
    
    if [ "$health_status" = "unhealthy" ]; then
        log_message "ERROR" "Container $container is unhealthy"
        return 1
    elif [ "$health_status" = "starting" ]; then
        log_message "WARN" "Container $container is still starting"
        return 2
    fi
    
    log_message "INFO" "Container $container is healthy"
    return 0
}

check_service_url() {
    local service="$1"
    local url="$2"
    
    if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
        log_message "INFO" "Service $service is responding at $url"
        return 0
    else
        log_message "ERROR" "Service $service is not responding at $url"
        return 1
    fi
}

check_resource_usage() {
    local container="$1"
    
    # Get container stats
    local stats=$(docker stats --no-stream --format "{{.CPUPerc}};{{.MemPerc}}" "$container" 2>/dev/null)
    
    if [ -z "$stats" ]; then
        log_message "WARN" "Could not get stats for $container"
        return 1
    fi
    
    local cpu_usage=$(echo "$stats" | cut -d';' -f1 | sed 's/%//')
    local mem_usage=$(echo "$stats" | cut -d';' -f2 | sed 's/%//')
    
    # Check CPU usage
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        send_alert "WARNING" "$container" "High CPU usage: ${cpu_usage}%"
    fi
    
    # Check Memory usage
    if (( $(echo "$mem_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        send_alert "WARNING" "$container" "High memory usage: ${mem_usage}%"
    fi
    
    log_message "INFO" "$container - CPU: ${cpu_usage}%, Memory: ${mem_usage}%"
}

# ===========================================
# RECOVERY FUNCTIONS
# ===========================================

restart_container() {
    local container="$1"
    local attempt_file="/tmp/restart_${container}"
    
    # Check restart attempts
    local attempts=0
    if [ -f "$attempt_file" ]; then
        attempts=$(cat "$attempt_file")
    fi
    
    if [ "$attempts" -ge "$MAX_RESTART_ATTEMPTS" ]; then
        send_alert "CRITICAL" "$container" "Max restart attempts ($MAX_RESTART_ATTEMPTS) reached. Manual intervention required."
        return 1
    fi
    
    # Increment restart attempts
    echo $((attempts + 1)) > "$attempt_file"
    
    log_message "INFO" "Attempting to restart $container (attempt $((attempts + 1))/$MAX_RESTART_ATTEMPTS)"
    send_alert "WARNING" "$container" "Restarting container (attempt $((attempts + 1))/$MAX_RESTART_ATTEMPTS)"
    
    if docker restart "$container"; then
        log_message "INFO" "Successfully restarted $container"
        send_alert "INFO" "$container" "Container restarted successfully"
        
        # Wait for service to come up
        sleep 30
        
        # Reset restart counter on successful restart
        rm -f "$attempt_file"
        return 0
    else
        log_message "ERROR" "Failed to restart $container"
        send_alert "CRITICAL" "$container" "Failed to restart container"
        return 1
    fi
}

restart_all_services() {
    log_message "INFO" "Restarting all services..."
    send_alert "WARNING" "SYSTEM" "Restarting all services"
    
    docker-compose restart
    
    if [ $? -eq 0 ]; then
        log_message "INFO" "All services restarted successfully"
        send_alert "INFO" "SYSTEM" "All services restarted successfully"
    else
        log_message "ERROR" "Failed to restart services"
        send_alert "CRITICAL" "SYSTEM" "Failed to restart all services"
    fi
}

# ===========================================
# MAIN HEALTH CHECK LOGIC
# ===========================================

perform_health_check() {
    log_message "INFO" "Starting health check..."
    
    local failed_services=()
    local total_services=${#SERVICES[@]}
    local healthy_services=0
    
    # Check each service
    for i in "${!SERVICES[@]}"; do
        local service="${SERVICES[$i]}"
        local url="${URLS[$i]}"
        
        log_message "INFO" "Checking $service..."
        
        # Check container health
        check_container_health "$service"
        local container_status=$?
        
        # Check resource usage
        check_resource_usage "$service"
        
        # Check service URL (skip postgres URL check)
        if [[ "$url" != *"postgres"* ]]; then
            check_service_url "$service" "$url"
            local url_status=$?
        else
            local url_status=0
        fi
        
        # Determine if service is healthy
        if [ $container_status -eq 0 ] && [ $url_status -eq 0 ]; then
            healthy_services=$((healthy_services + 1))
        elif [ $container_status -eq 1 ] || [ $url_status -eq 1 ]; then
            failed_services+=("$service")
        fi
    done
    
    # Report overall status
    log_message "INFO" "Health check completed: $healthy_services/$total_services services healthy"
    
    # Handle failed services
    if [ ${#failed_services[@]} -gt 0 ]; then
        log_message "ERROR" "Failed services: ${failed_services[*]}"
        
        # Restart failed services
        for service in "${failed_services[@]}"; do
            restart_container "$service"
        done
        
        # If more than half services failed, restart all
        if [ ${#failed_services[@]} -gt $((total_services / 2)) ]; then
            restart_all_services
        fi
    fi
}

cleanup_old_logs() {
    # Keep only last 1000 lines in log files
    if [ -f "$LOG_FILE" ]; then
        tail -n 1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
    
    if [ -f "$ALERT_FILE" ]; then
        tail -n 500 "$ALERT_FILE" > "${ALERT_FILE}.tmp" && mv "${ALERT_FILE}.tmp" "$ALERT_FILE"
    fi
}

# ===========================================
# MAIN EXECUTION
# ===========================================

main() {
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    log_message "INFO" "Health check service started"
    
    # Perform health check
    perform_health_check
    
    # Cleanup old logs
    cleanup_old_logs
    
    log_message "INFO" "Health check completed"
}

# Install required packages if not present
if ! command -v bc >/dev/null 2>&1; then
    apk add --no-cache bc curl
fi

# Run main function
main "$@"