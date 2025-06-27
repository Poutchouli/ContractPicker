# ContractPicker Version Control

## Manual Version Control Strategy

### Version Naming Convention
- `ContractPicker_v1.0_working` - Original working prototype
- `ContractPicker_v1.1_YYYY-MM-DD` - Daily backups
- `ContractPicker_v2.0_development` - Major changes
- `ContractPicker_experimental` - Testing new features

### Backup Schedule
1. **Before major changes**: Create timestamped backup
2. **Daily**: Quick copy if actively developing
3. **Before refactoring**: Full backup with version tag

### Example Backup Script (PowerShell)
```powershell
# Save as backup_project.ps1
$sourceDir = "f:\CODAGE\GITS\ContractPicker"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupDir = "f:\CODAGE\GITS\ContractPicker_backup_$timestamp"

Copy-Item -Path $sourceDir -Destination $backupDir -Recurse
Write-Host "Backup created: $backupDir"
```
