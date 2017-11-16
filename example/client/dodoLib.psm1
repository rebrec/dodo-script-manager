$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition

$global:DODO_HOSTNAME = "localhost"
$global:DODO_PORT = 8088
Import-Module "$scriptPath\dodoConfig.ps1"

$global:DODO_BASE_URL          = "http://$DODO_HOSTNAME" + ":" + "$DODO_PORT/api/script"
$global:DODO_SCRIPT_NAME       = "Scriptname-not-defined"
$global:DODO_SCRIPT_VERSION    = "Scriptversion-not-defined"

#override this function if you need a different way to identify unique execution (per user, per computer, etc)
Function global:Get-UniqueExecutionId {  
    return "$env:COMPUTERNAME"
}


Function global:Get-AdditionnalData{
    return @{
            username           = $env:USERNAME
            computername       = $env:COMPUTERNAME
            os                 = $env:OS
            powershell_version = "$($host.version)"
    } | ConvertTo-Json
}


Function isAlreadyExecuted {
    param()
    $state = Invoke-RestMethod -Method Get -Uri "$DODO_BASE_URL/$DODO_SCRIPT_NAME/$DODO_SCRIPT_VERSION/$(Get-UniqueExecutionId)"
    if ($state.status -ne 'success'){ 
        Write-Host "Error calling isAlreadyExecuted, returned non successfull value"
        # Check wether the Log function is defined :
        if ($(Get-ChildItem function: | where {$_.name -eq 'Log' }) -ne $null) {
            Log "Something went wrong while running isAlreadyExecuted function. Result is $(ConvertTo-JSON $state)"
        }
        return $false # default is to run if no answer from the server
    }
    $res = $($state.data)
    Write-Host "isAlreadyExecuted : $res"
    
    return $res
}

Function Save-ExecutionStatus {
    param()
    $additionnalJSONData = Get-AdditionnalData


    $state = Invoke-RestMethod -Method Put -Uri "$DODO_BASE_URL/$DODO_SCRIPT_NAME/$DODO_SCRIPT_VERSION/$(Get-UniqueExecutionId)" -ContentType 'application/json' -Body $additionnalJSONData
    if ($state.status -ne 'success'){ 
        Write-Host "Error calling isAlreadyExecuted, returned non successfull value"
        # Check wether the Log function is defined :
        if ($(Get-ChildItem function: | where {$_.name -eq 'Log' }) -ne $null) {
            Log "Something went wrong while running Save-ExecutionStatus function. Result is $(ConvertTo-JSON $state)"
        }
        return $false # default is to run if no answer from the server
    }
    Write-Host "Save-ExecutionStatus : done"
    return $state.data
}

