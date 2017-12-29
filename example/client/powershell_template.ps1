$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition
Import-Module "$scriptPath\dodoLib.psm1"

#$global:DODO_BASE_URL          = "http://YOUR_HOSTNAME:8088/api/script"
$global:DODO_SCRIPT_NAME       = "Some_Scriptname"
$global:DODO_SCRIPT_VERSION    = "1.0"

# If needed, uncomment this function to be able to track script execution
# According to something different than just the computername
# IE, host-user, or host-user-some_uniq_id_per_installation, ...
#
# Function global:Get-UniqueExecutionId {  
#     return "$env:COMPUTERNAME-$env:USERNAME"
# }

Function Main{
    param()
    # Your code goes here
	Write-Host "Ne pas tenir compte de ce message"


    # We save the execution status so that we do not execute it twice
    Save-ExecutionStatus
}

################ do not modify below
if ($(isAlreadyExecuted) -ne $true){
    Main
}