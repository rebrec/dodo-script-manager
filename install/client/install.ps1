$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition

$projectRoot = $(Get-Item $scriptPath).parent.parent.FullName
$distFolder = "$projectRoot\dist"
$scriptRoot = "$projectRoot\powershell\script_root"
$exampleFolder = "$scriptRoot\examples"

if (Test-Path $distFolder) {
    Write-Host "Removing existing $distFolder"
    Remove-Item "$distFolder" -Recurse -Force | out-null
}

Write-Host "Creation of dist folder ($distFolder)"
New-Item $distFolder -ItemType directory | out-null

Write-Host "Copy of the folder structure"
Copy-Item  $scriptRoot -Destination $distFolder -Recurse | out-null
Rename-Item -Path "$distFolder\script_root\" -NewName "DODO" | out-null
Copy-Item "$exampleFolder\config.ps1" "$distFolder\DODO" -Force | out-null

Write-Host "Removing unuseful stuff"
Remove-Item -Recurse -Force "$distFolder\DODO\examples"| out-null
Remove-Item -Recurse -Force "$distFolder\DODO\src" | out-null

Write-Host @"
################################################################################################
# Setup Done !
################################################################################################
# A few things need to be done manually : 
# - edit $distFolder\DODO\config.ps1
#     - change the variable global:DODO_HOSTNAME = "YOUR_DODO_SERVER_IP_HERE"
# - copy $distFolder\DODO to your company's Netlogon folder
################################################################################################
"@