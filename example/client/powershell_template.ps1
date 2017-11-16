# Exemple of file
$BASE_URL          = "http://www.dodo.sdis72.fr:8088/api/script"
$SCRIPT_NAME       = "MyFirstScript"
$SCRIPT_VERSION    = "1.0"

Function Main{
    param()
    # Your code goes here



    # We save the execution status so that we do not execute it twice
    Save-ExecutionStatus
}


############################## DO NOT CHANGE BELOW ###########################


Function isAlreadyExecuted {
    param()
    $state = Invoke-RestMethod -Method Get -Uri "$BASE_URL/$SCRIPT_NAME/$SCRIPT_VERSION/$($env:COMPUTERNAME)"
    if ($state.status -ne 'success'){ 
        Write-Host "Error calling isAlreadyExecuted, returned non successfull value"
        # Check wether the Log function is defined :
        if ($(Get-ChildItem function: | where {$_.name -eq 'Log' }) -ne $null) {
            Log "Something went wrong while running isAlreadyExecuted function. Result is $(ConvertTo-JSON $state)"
        }
        return $false # default is to run if no answer from the server
    }
    Write-Host "isAlreadyExecuted : $($state.data)"
    return $state.data
}

Function Get-AdditionnalData{
    return @{
            username          = $env:USERNAME
    } | ConvertTo-Json
}

Function Save-ExecutionStatus {
    param()
    $additionnalJSONData = Get-AdditionnalData


    $state = Invoke-RestMethod -Method Put -Uri "$BASE_URL/$SCRIPT_NAME/$SCRIPT_VERSION/$($env:COMPUTERNAME)" -ContentType 'application/json' -Body $additionnalJSONData
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


$alreadyExecuted = isAlreadyExecuted

if ($alreadyExecuted -eq $true){
    Write-Host "Script has already being executed"
} else {
    Main
}