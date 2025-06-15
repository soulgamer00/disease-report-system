@echo off
REM scripts/backup.bat
REM Daily Database Backup Script for Windows

REM ===========================================
REM CONFIGURATION
REM ===========================================

set DB_NAME=dxdb
set DB_USER=dxdbadmin
set DB_PASSWORD=123456
set CONTAINER_NAME=dxdb-postgres

set BACKUP_DIR=.\backups
set DATE_TIME=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATE_TIME=%DATE_TIME: =0%
set BACKUP_FILE=dxdb_backup_%DATE_TIME%.sql
set LOG_FILE=backup_%DATE_TIME%.log

REM ===========================================
REM FUNCTIONS
REM ===========================================

:log_message
echo [%date% %time%] %~1
echo [%date% %time%] %~1 >> "%BACKUP_DIR%\%LOG_FILE%"
goto :eof

:check_docker
docker ps | findstr "%CONTAINER_NAME%" >nul
if %errorlevel% neq 0 (
    call :log_message "ERROR: Docker container %CONTAINER_NAME% is not running"
    exit /b 1
)
goto :eof

:create_backup_dir
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    call :log_message "Created backup directory: %BACKUP_DIR%"
)
goto :eof

:perform_backup
call :log_message "Starting database backup..."

REM Create backup using docker exec
docker exec %CONTAINER_NAME% pg_dump -U %DB_USER% -d %DB_NAME% > "%BACKUP_DIR%\%BACKUP_FILE%"

if %errorlevel% equ 0 (
    call :log_message "✅ Database backup created: %BACKUP_FILE%"
    
    REM Compress using 7zip if available
    where 7z >nul 2>&1
    if %errorlevel% equ 0 (
        7z a "%BACKUP_DIR%\%BACKUP_FILE%.7z" "%BACKUP_DIR%\%BACKUP_FILE%"
        if %errorlevel% equ 0 (
            del "%BACKUP_DIR%\%BACKUP_FILE%"
            call :log_message "✅ Backup compressed: %BACKUP_FILE%.7z"
        )
    )
    
    goto :backup_success
) else (
    call :log_message "❌ Database backup failed"
    goto :backup_failed
)

:backup_success
exit /b 0

:backup_failed
exit /b 1

:cleanup_old_backups
call :log_message "Cleaning up backups older than 30 days..."

REM Delete files older than 30 days
forfiles /p "%BACKUP_DIR%" /m "dxdb_backup_*" /d -30 /c "cmd /c del @path" 2>nul

call :log_message "Cleanup completed"
goto :eof

REM ===========================================
REM MAIN EXECUTION
REM ===========================================

call :log_message "🚀 Starting daily database backup process..."

REM Check prerequisites
call :check_docker
if %errorlevel% neq 0 exit /b 1

call :create_backup_dir

REM Perform backup
call :perform_backup
if %errorlevel% equ 0 (
    call :cleanup_old_backups
    call :log_message "✅ Backup process completed successfully"
) else (
    call :log_message "❌ Backup process failed"
    exit /b 1
)

call :log_message "Backup process finished"