# Exemple of file
$BASE_URL          = "http://localhost:8088/api/script"
$SCRIPT_NAME       = "script_name_1"
$SCRIPT_VERSION    = "0.2"

# # GET
# Get Script List
# Write-Host "Script List"
# Write-Host "    $(ConvertTo-JSON (Invoke-RestMethod -Method Get -Uri "$BASE_URL"))"
# 
# # Get Script Version List for script 
# Write-Host "Version List"
# Write-Host "    $(ConvertTo-JSON (Invoke-RestMethod -Method Get -Uri "$BASE_URL/$SCRIPT_NAME"))"
# 
# # Get Script Version List for script and version 
# Write-Host "Host List"
# Write-Host "    $(ConvertTo-JSON (Invoke-RestMethod -Method Get -Uri "$BASE_URL/$SCRIPT_NAME/$SCRIPT_VERSION"))"
# 
# # Get isAlreadyExecuted (execution status) for hostname HOSTNAME for script "script_name_1", version 0.1
# Write-Host "Getting Execution State"
# Write-Host "    $(ConvertTo-JSON (Invoke-RestMethod -Method Get -Uri "$BASE_URL/$SCRIPT_NAME/$SCRIPT_VERSION/$($env:COMPUTERNAME)"))"
# 
# # Save Execution status for this computername
# Write-Host "Saving Execution State"
# Write-Host "    $(ConvertTo-JSON (Invoke-RestMethod -Method PUT -Uri "$BASE_URL/$SCRIPT_NAME/$SCRIPT_VERSION/$($env:COMPUTERNAME)"))"
# 
# # Get isAlreadyExecuted (execution status) for hostname HOSTNAME for script "script_name_1", version 0.1
# Write-Host "Getting Again Execution State"
# Write-Host "    $(ConvertTo-JSON (Invoke-RestMethod -Method Get -Uri "$BASE_URL/$SCRIPT_NAME/$SCRIPT_VERSION/$($env:COMPUTERNAME)"))"

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


Function Save-ExecutionStatus {
    param()
    $state = Invoke-RestMethod -Method Put -Uri "$BASE_URL/$SCRIPT_NAME/$SCRIPT_VERSION/$($env:COMPUTERNAME)" 
    if ($state.status -ne 'success'){ 
        Write-Host "Error calling Save-ExecutionStatus, returned non successfull value"
        # Check wether the Log function is defined :
        if ($(Get-ChildItem function: | where {$_.name -eq 'Log' }) -ne $null) {
            Log "Something went wrong while running Save-ExecutionStatus function. Result is $(ConvertTo-JSON $state)"
        }
        return $false # default is to run if no answer from the server
    }
    Write-Host "Save-ExecutionStatus : done"
    return $state.data
}

isAlreadyExecuted
Save-ExecutionStatus
isAlreadyExecuted