param(
    [switch] $Force
)
$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition

$projectRoot = $(Get-Item $scriptPath).parent.FullName
$distFolder = "$projectRoot\dist"
$dodoFolder = "$distFolder\DODO"
$scriptRoot = "$projectRoot\powershell\script_root"
$exampleFolder = "$scriptRoot\examples"
Write-Host @"
projectRoot     = $projectRoot
distFolder      = $distFolder
dodoFolder      = $dodoFolder
scriptRoot      = $scriptRoot
exampleFolder   = $exampleFolder
"@

# Remove DIST FOLDER
if (Test-Path $distFolder) {
    if ($Force){
        Write-Host "Removing existing $distFolder"
        Remove-Item "$distFolder" -Recurse -Force | out-null
    } else {
        Write-Warning @"
This script has already been executed !

This will then :
- Remove dist folder
- Remove config folder (please make backups if needed)
- Remove script folder (which may contain your personal scripts !)

It is STRONGLY adviced to make a copy of :
- $distFolder
- $scriptRoot\scripts
- $projectRoot\config

If you are SURE to want to start from scratch all over again, use the -Force parameter (after doing backups !).
"@
        throw "SetupDist has already been executed ! If you are sure to want to start all over again use the -Force parameter"
    }
}

# Copy of Script folder example structure
if (Test-Path $scriptRoot\scripts) {
    Write-Host "[+] Removing $scriptRoot\scripts"
    Remove-Item -Recurse -force "$scriptRoot\scripts"
}

Write-Host "[+] Creation of script folder ($scriptRoot\scripts)"
Write-Host "[+] Copy of example scripts"
Copy-Item  "$scriptRoot\examples\scripts" -Destination $scriptRoot -Recurse | out-null   


New-Item -ItemType directory "$distFolder" | out-null
Copy-Item  $scriptRoot -Destination $distFolder -Recurse | out-null
Rename-Item -Path "$distFolder\script_root\" -NewName "DODO" | out-null

Write-Host "[+] Removing unuseful stuff"
Remove-Item -Recurse -Force "$dodoFolder\examples"| out-null
Remove-Item -Recurse -Force "$dodoFolder\src" | out-null


if (Test-Path "$projectRoot\config") { 
    Write-Host "[+] Removing $projectRoot\config"
    Remove-Item -Recurse -force "$projectRoot\config"
}

Write-Host "[+] Copy of config folder"
New-Item "$projectRoot\config" -ItemType directory -Force | out-null
Write-Host "[+] Creating $projectRoot\config"
Copy-Item -path "$exampleFolder\config.ps1" -Destination "$projectRoot\config\config-prod.ps1" -Force | out-null
Copy-Item -path "$exampleFolder\config.ps1" -Destination "$projectRoot\config\config-dev.ps1" -Force | out-null
Write-Warning @"

Please edit at least the variable global:DODO_HOSTNAME in :
- $dodoFolder\config\config-prod.ps1 (MUST be filled)
- $dodoFolder\config\config-dev.ps1 (if you plan to have a dev platform)

Then you can run RebuildDist.ps1
"@

Write-Host @"
################################################################################################
# Setup Done !
################################################################################################
"@