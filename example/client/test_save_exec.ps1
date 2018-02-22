# Import-Module "\\sdis72.fr\NETLOGON\Public\scripts\powershell\dodoLib.ps1"
Import-Module "d:\tmp\dev\js\script_state_persist\example\client\dodoLib.ps1"
$global:DODO_SCRIPT_NAME       = "test-exec"
$global:DODO_SCRIPT_VERSION    = "0.1"

Function global:Get-UniqueExecutionId {  
    return "$env:COMPUTERNAME"
}

Function global:Get-AdditionnalData{
    return @{
            username           = "$(Get-Username)"
            lastBootTime       = "$(Get-LastBootTime)"
            ipaddresses        = "$(Get-IpAddresses)"
            computername       = $env:COMPUTERNAME
            os                 = $env:OS
            zazaza = "aasssssa"
            powershell_version = "$($host.version)"
            logs               = $DODO_LOGS
    }
}
Function Main{
    param()
    # Your code goes here
    [System.Collections.ArrayList]$global:DODO_LOGS = @()
	logDodo "[+] Err Premier log $(Get-Date)"
	logDodo "[+] Err 2eme log $(Get-Date)"
    Save-ExecutionStatus $false    

    [System.Collections.ArrayList]$global:DODO_LOGS = @()
	logDodo "[+] Err Premier log $(Get-Date)"
	logDodo "[+] Err 2emefffff log $(Get-Date)"
    Save-ExecutionStatus $false    
   
}
Main
################ do not modify below
#if ($(isAlreadyExecuted) -ne $true){
    
#}