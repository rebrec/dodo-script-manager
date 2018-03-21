param (
	[string] $build="prod",
    [string] $RemotePath="d:\tmp\netlogon\"
)
if (($build -ine "dev") -and ($build -ine "prod")){
    throw "-Build must be folowed by keyword 'dev' or 'build'"
}

$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition

$projectRoot   = $(Get-Item $scriptPath).parent.FullName
$distFolder    = "$projectRoot\dist"
$configFolder  = "$projectRoot\config"
$configFile    = "$configFolder\config-$build.ps1"
$dodoFolder    = "$distFolder\DODO"
$scriptRoot    = "$projectRoot\powershell\script_root"
$exampleFolder = "$scriptRoot\examples"

Write-Host @"

This script update the dist folder to reflect the latest modifications you
may have done within $projectRoot
projectRoot     = $projectRoot
distFolder      = $distFolder
configFolder    = $configFolder
configFile      = $configFile
dodoFolder      = $dodoFolder
scriptRoot      = $scriptRoot
exampleFolder   = $exampleFolder

"@

if ((Test-Path $distFolder) -ne $true) {
    Write-Warning "$distFolder doesn't exist ! Please run first SetupDist.ps1 !"
    
} else {
    Remove-Item "$distFolder" -Recurse -Force | out-null
}
if ((Test-Path "$configFolder") -ne $true) { 
    Write-Warning "$configFolder doesn't exist ! Please run first SetupDist.ps1 !"
}

Write-Host "[+] Creation of dist folder ($distFolder)"
New-Item $distFolder -ItemType directory | out-null

Write-Host "[+] Copy of the folder structure"
Copy-Item  $scriptRoot -Destination $distFolder -Recurse | out-null
Rename-Item -Path "$distFolder\script_root\" -NewName "DODO" | out-null

Write-Host "[+] Removing unuseful stuff"
Remove-Item -Recurse -Force "$dodoFolder\examples"| out-null
Remove-Item -Recurse -Force "$dodoFolder\src" | out-null

Copy-Item -path "$configFile" -Destination "$dodoFolder\config.ps1" -Force | out-null




if ($build -ieq "prod") {
    if ($RemotePath -eq ""){
    Write-Warning @"
You will now have to copy manually $distFolder to your Netlogon directory.
Please note that you can automatically copy this folder to any location (your Netlogon directory
for instance) by using 
    
    RebuildDist.ps1 -RemotePath "\\YourDomain.corp\Netlogon"

This would copy files to \\YourDomain.corp\Netlogon\Dodo
"@
    } else {
        Write-Host "[+] Copying files to $RemotePath"
        if (Test-Path "$RemotePath"){
            Copy-Item "$dodoFolder" -Destination "$RemotePath" -Recurse -Force
        } else {
            Write-Warning "$RemotePath doesn't exists ! Skipping..."
            }
    }
}


Write-Host @"
################################################################################################
Upgrade Done ! Build "$build"
################################################################################################
"@