@echo off
REM scripts/windows_health_check.bat
REM Windows Health Check and Auto-Recovery Script

setlocal enabledelayedexpansion

REM ===========================================
REM CONFIGURATION
REM ===========================================

set LOG_DIR=.\logs
set LOG_FILE=%LOG_DIR%\health_check.log
set ALERT_FILE=%LOG_DIR%\alerts.log

REM Services to monitor
set SERVICES=dxdb-postgres dxdb-backend dxdb-frontend

REM URLs to check
set POSTGRES_URL=localhost:5432
set BACKEND_URL=http://localhost:3000/health
set FRONTEND_URL=http://localhost:5173

REM Thresholds
set MAX_RESTART_ATTEMPTS=3

REM ===========================================
REM UTILITY FUNCTIONS
REM ===========================================

:log_message
set "timestamp=%date% %time%"
echo [%timestamp%] [%~1] %~2
echo [%timestamp%] [%~1] %~2 >> "%LOG_FILE%"
goto :eof

:send_alert
set "alert_msg=🚨 ALERT [%~1]: %~2 - %~3"
echo %date% %time% !alert_msg! >> "%ALERT_FILE%"
call :log_message "ALERT" "!alert_msg!"
goto :eof

REM ===========================================
REM HEALTH CHECK FUNCTIONS
REM ===========================================

:check_container_health
set container=%~1
docker ps --format "{{.Names}}" | findstr /c:"%container%" >nul
if %errorlevel% neq 0 (
    call :log_message "ERROR" "Container %container% is not running"
    exit /b 1
)

REM Check health status
for /f "delims=" %%i in ('docker inspect --format="{{.State.Health.Status}}" %container% 2^>nul') do set health_status=%%i

if "%health_status%"=="unhealthy" (
    call :log_message "ERROR" "Container %container% is unhealthy"
    exit /b 1
) else if "%health_status%"=="starting" (
    call :log_message "WARN" "Container %container% is still starting"
    exit /b 2
)

call :log_message "INFO" "Container %container% is healthy"
exit /b 0

:check_service_url
set service=%~1
set url=%~2

REM Use curl to check URL
curl -s --max-time 10 "%url%" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_message "INFO" "Service %service% is responding at %url%"
    exit /b 0
) else (
    call :log_message "ERROR" "Service %service% is not responding at %url%"
    exit /b 1
)

:restart_container
set container=%~1
set attempt_file=%TEMP%\restart_%container%.txt

REM Check restart attempts
set attempts=0
if exist "%attempt_file%" (
    set /p attempts=<"%attempt_file%"
)

if %attempts% geq %MAX_RESTART_ATTEMPTS% (
    call :send_alert "CRITICAL" "%container%" "Max restart attempts (%MAX_RESTART_ATTEMPTS%) reached"
    exit /b 1
)

REM Increment restart attempts
set /a attempts+=1
echo %attempts% > "%attempt_file%"

call :log_message "INFO" "Attempting to restart %container% (attempt %attempts%/%MAX_RESTART_ATTEMPTS%)"
call :send_alert "WARNING" "%container%" "Restarting container (attempt %attempts%/%MAX_RESTART_ATTEMPTS%)"

docker restart "%container%"
if %errorlevel% equ 0 (
    call :log_message "INFO" "Successfully restarted %container%"
    call :send_alert "INFO" "%container%" "Container restarted successfully"
    
    REM Wait for service to come up
    timeout /t 30 /nobreak >nul
    
    REM Reset restart counter
    del "%attempt_file%" 2>nul
    exit /b 0
) else (
    call :log_message "ERROR" "Failed to restart %container%"
    call :send_alert "CRITICAL" "%container%" "Failed to restart container"
    exit /b 1
)

:restart_all_services
call :log_message "INFO" "Restarting all services..."
call :send_alert "WARNING" "SYSTEM" "Restarting all services"

docker-compose restart
if %errorlevel% equ 0 (
    call :log_message "INFO" "All services restarted successfully"
    call :send_alert "INFO" "SYSTEM" "All services restarted successfully"
) else (
    call :log_message "ERROR" "Failed to restart services"
    call :send_alert "CRITICAL" "SYSTEM" "Failed to restart all services"
)
goto :eof

REM ===========================================
REM MAIN HEALTH CHECK LOGIC
REM ===========================================

:perform_health_check
call :log_message "INFO" "Starting health check..."

set failed_services=
set healthy_services=0
set total_services=3

REM Check PostgreSQL
call :check_container_health "dxdb-postgres"
if %errorlevel% equ 0 (
    set /a healthy_services+=1
) else (
    set failed_services=%failed_services% dxdb-postgres
)

REM Check Backend
call :check_container_health "dxdb-backend"
set container_status=%errorlevel%
call :check_service_url "dxdb-backend" "%BACKEND_URL%"
set url_status=%errorlevel%

if %container_status% equ 0 if %url_status% equ 0 (
    set /a healthy_services+=1
) else (
    set failed_services=%failed_services% dxdb-backend
)

REM Check Frontend
call :check_container_health "dxdb-frontend"
set container_status=%errorlevel%
call :check_service_url "dxdb-frontend" "%FRONTEND_URL%"
set url_status=%errorlevel%

if %container_status% equ 0 if %url_status% equ 0 (
    set /a healthy_services+=1
) else (
    set failed_services=%failed_services% dxdb-frontend
)

call :log_message "INFO" "Health check completed: %healthy_services%/%total_services% services healthy"

REM Handle failed services
if not "%failed_services%"=="" (
    call :log_message "ERROR" "Failed services:%failed_services%"
    
    REM Restart failed services
    for %%s in (%failed_services%) do (
        call :restart_container "%%s"
    )
)

goto :eof

:cleanup_old_logs
REM Keep only last 1000 lines in log files (Windows doesn't have tail, so we skip this)
REM Could implement with PowerShell if needed
goto :eof

REM ===========================================
REM MAIN EXECUTION
REM ===========================================

:main
REM Ensure log directory exists
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

call :log_message "INFO" "Health check service started"

REM Perform health check
call :perform_health_check

REM Cleanup old logs
call :cleanup_old_logs

call :log_message "INFO" "Health check completed"

goto :eof

REM Run main function
call :main