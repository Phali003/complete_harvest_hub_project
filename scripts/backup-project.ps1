<#
backup-project.ps1
Creates a timestamped ZIP of the project (excludes node_modules and backups by default),
optionally runs mysqldump if a db-credentials.cnf file exists, and prunes old backups.

Defaults:
- DB dump: only if .\db-credentials.cnf exists and mysqldump is on PATH
- rclone upload: disabled by default
- retention: 14 backups

Usage (from project root):
  PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup-project.ps1
#>

param(
  [int]$Keep = 14,
  [string]$RcloneRemote = '',  # e.g. 'gdrive:backups/harvest-hub-project' - leave empty to disable
  [string]$OutDir = ''         # optional output directory for backups; defaults to $env:USERPROFILE\Backups\harvest-hub-project
)

Set-StrictMode -Version Latest
Write-Output "Starting backup script..."

$root = Split-Path -Path $PSScriptRoot -Parent
Set-Location -Path $root

$now = Get-Date -Format yyyyMMdd_HHmmss
$defaultOut = Join-Path -Path $env:USERPROFILE -ChildPath 'Backups\harvest-hub-project'
if ([string]::IsNullOrWhiteSpace($OutDir)) { $backupsDir = $defaultOut } else { $backupsDir = $OutDir }
if (-not (Test-Path $backupsDir)) { New-Item -ItemType Directory -Path $backupsDir -Force | Out-Null }
Write-Output "Backups will be written to: $backupsDir"

# Optional DB dump if credentials file exists and mysqldump is available
$dbCredFile = Join-Path -Path $root -ChildPath 'db-credentials.cnf'
$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue
$dbDumpFile = $null
if ( (Test-Path $dbCredFile -PathType Leaf -ErrorAction SilentlyContinue) -and $mysqldump ) {
  Write-Output "Found db-credentials.cnf and mysqldump. Preparing DB dump..."
  # Try to read DB_NAME from .env if present
  $envFile = Join-Path -Path $root -ChildPath '.env'
  $dbName = 'test'
  if (Test-Path $envFile) {
    $lines = Get-Content $envFile -ErrorAction SilentlyContinue
    foreach ($ln in $lines) {
      if ($ln -match '^DB_NAME\s*=\s*(.+)$') { $dbName = $Matches[1].Trim(); break }
    }
  }

  $dbDumpFile = Join-Path -Path $backupsDir -ChildPath "${dbName}-dump-$now.sql"
  Write-Output "Running mysqldump for database '$dbName' -> $dbDumpFile"
  try {
    & $mysqldump.Path --defaults-extra-file=$dbCredFile --databases $dbName --single-transaction > $dbDumpFile
    if ($LASTEXITCODE -ne 0) { Write-Warning "mysqldump exited with code $LASTEXITCODE" }
    else { Write-Output "DB dump completed: $dbDumpFile" }
  } catch {
    Write-Warning "DB dump failed: $_"
    if (Test-Path $dbDumpFile) { Remove-Item -Force $dbDumpFile }
    $dbDumpFile = $null
  }
} else {
  if (-not $mysqldump) { Write-Output "mysqldump not found on PATH; skipping DB dump." }
  elseif (-not (Test-Path $dbCredFile)) { Write-Output "No db-credentials.cnf found; skipping DB dump." }
}

# Build list of items to archive (exclude node_modules and backups)
$items = Get-ChildItem -Path $root -Force -Exclude 'node_modules','backups' | ForEach-Object { $_.FullName }
$zipFile = Join-Path -Path $backupsDir -ChildPath "harvest-hub-project-backup-$now.zip"
Write-Output "Creating ZIP: $zipFile"
try {
  Compress-Archive -Path $items -DestinationPath $zipFile -Force
  Write-Output "Archive created: $zipFile"

  # If we produced a DB dump outside the project folder, add it to the ZIP
  if ($dbDumpFile -and (Test-Path $dbDumpFile)) {
    try {
      # Add the dump into the existing ZIP
      Compress-Archive -Path $dbDumpFile -DestinationPath $zipFile -Update
      Write-Output "DB dump added to ZIP: $dbDumpFile"
    } catch {
      Write-Warning "Failed to add DB dump to ZIP: $_"
    }
  }

  if ($dbDumpFile) { Write-Output "DB dump location: $dbDumpFile" }
} catch {
  Write-Warning "Failed to create archive: $_"
  exit 1
}

# Optional rclone upload
if ($RcloneRemote -ne '') {
  $rclone = Get-Command rclone -ErrorAction SilentlyContinue
  if ($rclone) {
    Write-Output "Uploading $zipFile to rclone remote $RcloneRemote"
    & $rclone.Path copy $zipFile $RcloneRemote --progress
    if ($LASTEXITCODE -ne 0) { Write-Warning "rclone returned exit code $LASTEXITCODE" }
  } else {
    Write-Output "rclone not found; skipping upload." }
}

# Prune old backups (keep $Keep latest ZIP files)
Write-Output "Pruning old backups, keeping $Keep most recent ZIP files..."
$zips = @(Get-ChildItem -Path $backupsDir -Filter 'harvest-hub-project-backup-*.zip' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
$zipCount = $zips.Count
if ($zipCount -gt $Keep) {
  $toRemove = $zips | Select-Object -Skip $Keep
  foreach ($f in $toRemove) { Remove-Item -Force $f.FullName -ErrorAction SilentlyContinue; Write-Output "Removed old backup: $($f.Name)" }
}

Write-Output "Backup completed successfully. Latest archive: $zipFile"
exit 0
