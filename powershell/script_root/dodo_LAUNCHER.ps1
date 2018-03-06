# This script will run every PS1 scripts within $DODO_BASE_DIR
# For being executed, scripts filenames must start with either 'computermode' 
# or 'usermode'
# Scripts withing the 'disabled' subfolder won't be executed
#
# This script is supposed to be run as SYSTEM account. When named as 'usermode'
# The current user will be extracted from the owner of the explorer.exe process
# Then this user will be impersonated to run the script within the user environment

$DODO_BASE_DIR   = "\\sdis72.fr\NETLOGON\Public\DODO"
# $DODO_BIN_DIR 	 = "$DODO_BASE_DIR\bin"
$DODO_BIN_DIR 	 = "c:\Windows" # Files must be copied there... could be automated
$DODO_SCRIPT_DIR = "$DODO_BASE_DIR\scripts"
$DODO_LIB_PATH   = "\\sdis72.fr\NETLOGON\Public\scripts\powershell\dodoLib.ps1"
$RUN_HIDDEN                    = "$DODO_BIN_DIR\run_hidden.exe"

if ((gwmi win32_operatingsystem | select osarchitecture).osarchitecture -imatch '64') { 
    $RUNFROMPROCESS                = "$DODO_BIN_DIR\RunFromProcess-x64.exe"
} else { 
    $RUNFROMPROCESS                = "$DODO_BIN_DIR\RunFromProcess.exe"
}

Function Main{
	$scripts 		= Get-ChildItem -Path "$DODO_SCRIPT_DIR\" -Filter "*.ps1"     -Recurse | ? { $_.FullName -notmatch 'disabled' }
	$scripts | % {
		$file = $_
		if ($file.Name -imatch '^usermode-.*'){
			Run-DodoScript -Usermode $_.FullName
		} elseif ($file.Name -imatch '^computermode-.*'){
			Run-DodoScript $_.FullName #-debug
		} else {
			Write-Host "Skipping malformed scriptname $($file.Name)"
		}
	}
}

Function Get-DodoEncodedLauncher{
	param (
        [ValidateNotNullOrEmpty()]
        [string] $scriptFullPath,
        [switch] $Debug
    )
	$command =  '';
	$command += 'Import-Module "' + $DODO_LIB_PATH + '";' + "`r`n"
	$command += ". '" + $scriptFullPath +"';" + "`r`n"
	$command += 'Write-Host "Running Script $DODO_SCRIPT_NAME (v $DODO_SCRIPT_VERSION)";' + "`r`n"
	$command += 'Update-EnvironmentData;' + "`r`n"
	$command += 'if ("$(isDodoExecutionContextCorrect)" -eq "$false") {' + "`r`n"
	$command += '    Write-Host "Conditions are not met, so, we will exit now.";' + "`r`n"
	$command += '    return' + "`r`n"
	$command += '};' + "`r`n"
	$command += 'if ($(isAlreadyExecuted) -ne $true){' + "`r`n"
	$command += '    $executionResult = (Main);' + "`r`n"
	$command += '    Write-Host "Execution Result: $executionResult";' + "`r`n"
	$command += '    if ($executionResult -ne $true) { $executionResult = $false }' + "`r`n"
	$command += '    Write-Host "Execution Result: $executionResult";' + "`r`n"
	$command += '    Save-ExecutionStatus $executionResult' + "`r`n"
	$command += '};' + "`r`n"
	if ($debug) { Write-Host "Generating base64 string from : `r`n $command" }
	$b64command = [System.Convert]::ToBase64String([System.Text.Encoding]::UNICODE.GetBytes($command))	
	return $b64command
}

Function Run-DodoScript{
	param (
        [ValidateNotNullOrEmpty()]
        [string] $scriptFullPath,
        [switch] $Usermode,
        [switch] $Debug
    )
	$b64command = (Get-DodoEncodedLauncher -Debug:$Debug -scriptFullPath $scriptFullPath)
	if ($Usermode -eq $true) {
		$cmd        = "$RUNFROMPROCESS"
		$parameters = "nomsg explorer.exe $RUN_HIDDEN powershell.exe"
	} else {
		$cmd        = "powershell.exe"
		$parameters = ""
	}
	if ($Debug -eq $true) {
		$parameters += " -NoExit"
	}
	$parameters += " -NonInteractive -ExecutionPolicy Unrestricted -EncodedCommand $b64command"
	Write-Host "Going to launch $scriptFullPath (Usermode=$Usermode)"
	if ($Debug -eq $true) {
		Write-Host "Starting $cmd $parameters"
	}
	Start-Process -FilePath $cmd -ArgumentList $parameters -wait
}

Main